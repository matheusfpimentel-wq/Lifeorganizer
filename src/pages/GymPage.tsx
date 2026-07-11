import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold } from '@/features/households/hooks';
import {
  useAddPlanDay,
  useAddPlanExercise,
  useCreatePlan,
  useExerciseLibrary,
  useFinishSession,
  useLogSet,
  usePlanDays,
  usePlanExercises,
  useSessions,
  useSessionSets,
  useStartSession,
  useWorkoutPlans,
  type PlanDayRow,
  type SetRow,
} from '@/features/gym/hooks';
import RestTimer from '@/features/gym/RestTimer';
import { bestSetByExercise, estimate1RM, prTimeline, volumeKg, weeklyVolume } from '@/core/workout';
import { formatDate } from '@/lib/format';

type Tab = 'train' | 'plans' | 'history' | 'progress';

export default function GymPage() {
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const memberId = user?.$id ?? null;

  const { library, byId } = useExerciseLibrary(householdId);
  const plans = useWorkoutPlans(householdId, memberId);
  const sessions = useSessions(householdId, memberId);
  const allSets = useSessionSets(householdId, memberId);

  const [tab, setTab] = useState<Tab>('train');

  const mySessionIds = useMemo(() => new Set((sessions.data ?? []).map((s) => s.$id)), [sessions.data]);
  const mySets = useMemo(
    () => (allSets.data ?? []).filter((s) => mySessionIds.has(s.sessionId)),
    [allSets.data, mySessionIds],
  );
  const exName = (id: string) => byId(id)?.name ?? 'Exercício';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'train', label: 'Treinar' },
    { id: 'plans', label: 'Planos' },
    { id: 'history', label: 'Histórico' },
    { id: 'progress', label: 'Progresso' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Academia</h1>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`min-h-[40px] rounded-lg text-sm font-medium ${tab === t.id ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'train' && (
        <TrainTab
          householdId={householdId}
          memberId={memberId}
          plans={plans.data ?? []}
          mySets={mySets}
          exName={exName}
        />
      )}
      {tab === 'plans' && (
        <PlansTab householdId={householdId} memberId={memberId} plans={plans.data ?? []} library={library} exName={exName} />
      )}
      {tab === 'history' && (
        <HistoryTab sessions={sessions.data ?? []} mySets={mySets} exName={exName} />
      )}
      {tab === 'progress' && <ProgressTab mySets={mySets} exName={exName} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlanRow = Record<string, any> & { $id: string };

function TrainTab({
  householdId,
  memberId,
  plans,
  mySets,
  exName,
}: {
  householdId: string | null;
  memberId: string | null;
  plans: PlanRow[];
  mySets: SetRow[];
  exName: (id: string) => string;
}) {
  const [planId, setPlanId] = useState<string>('');
  const [dayId, setDayId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [restFor, setRestFor] = useState<{ key: string; seconds: number } | null>(null);

  const days = usePlanDays(planId || null);
  const dayExercises = usePlanExercises(dayId || null);
  const startSession = useStartSession(householdId, memberId);
  const logSet = useLogSet(householdId, memberId);
  const finishSession = useFinishSession(householdId);

  const sessionSets = mySets.filter((s) => s.sessionId === sessionId);
  const lastSetFor = (exerciseId: string): SetRow | undefined =>
    mySets
      .filter((s) => s.exerciseId === exerciseId && s.sessionId !== sessionId)
      .slice(-1)[0];

  function start() {
    startSession.mutate(
      { planDayId: dayId || null },
      { onSuccess: (row) => setSessionId(row.$id) },
    );
  }

  if (!sessionId) {
    return (
      <div className="flex flex-col gap-3">
        <section className="card flex flex-col gap-3">
          <h2 className="font-semibold">Iniciar treino</h2>
          <div>
            <label className="label" htmlFor="planSel">Plano</label>
            <select id="planSel" className="input" value={planId} onChange={(e) => { setPlanId(e.target.value); setDayId(''); }}>
              <option value="">Treino livre</option>
              {plans.map((p) => <option key={p.$id} value={p.$id}>{p.name}</option>)}
            </select>
          </div>
          {planId && (
            <div className="flex flex-wrap gap-2">
              {(days.data ?? []).map((d: PlanDayRow) => (
                <button
                  key={d.$id}
                  className={`rounded-full px-3 py-1 text-sm ${dayId === d.$id ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  onClick={() => setDayId(d.$id)}
                >
                  {d.label}
                </button>
              ))}
              {(days.data ?? []).length === 0 && <p className="text-sm text-slate-500">Este plano ainda não tem dias. Crie em Planos.</p>}
            </div>
          )}
          <button className="btn-primary" onClick={start} disabled={startSession.isPending || (!!planId && !dayId)}>
            {planId ? 'Iniciar dia selecionado' : 'Iniciar treino livre'}
          </button>
        </section>
      </div>
    );
  }

  // sessão ativa
  const exerciseIds: string[] = dayId
    ? (dayExercises.data ?? []).map((pe) => pe.exerciseId)
    : [...new Set(sessionSets.map((s) => s.exerciseId))];
  const planByExercise = new Map((dayExercises.data ?? []).map((pe) => [pe.exerciseId, pe]));

  return (
    <div className="flex flex-col gap-3">
      <section className="card flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Treino em andamento</h2>
          <p className="text-sm text-slate-500">{sessionSets.length} série(s) registrada(s)</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => finishSession.mutate(sessionId, { onSuccess: () => { setSessionId(null); setRestFor(null); } })}
        >
          Finalizar
        </button>
      </section>

      {exerciseIds.length === 0 && (
        <div className="card text-sm text-slate-500">
          Treino livre: escolha um exercício abaixo para registrar a primeira série.
        </div>
      )}

      {exerciseIds.map((exerciseId) => {
        const plan = planByExercise.get(exerciseId);
        const logged = sessionSets.filter((s) => s.exerciseId === exerciseId);
        const last = lastSetFor(exerciseId);
        const rest = plan?.restSeconds ?? 90;
        return (
          <ExerciseLogger
            key={exerciseId}
            name={exName(exerciseId)}
            planned={plan ? `${plan.sets}× ${plan.repRange}` : undefined}
            logged={logged}
            defaultReps={last?.reps ?? (plan ? Number(String(plan.repRange).split('-')[0]) || 8 : 8)}
            defaultLoad={last?.loadKg ?? plan?.targetLoadKg ?? 0}
            onLog={(reps, loadKg) => {
              logSet.mutate({ sessionId, exerciseId, setNumber: logged.length + 1, reps, loadKg });
              setRestFor({ key: exerciseId, seconds: rest });
            }}
            resting={restFor?.key === exerciseId ? restFor.seconds : null}
            onDismissRest={() => setRestFor(null)}
          />
        );
      })}

      <AdHocAdder
        onAdd={(exerciseId, reps, loadKg) => {
          const setNumber = sessionSets.filter((s) => s.exerciseId === exerciseId).length + 1;
          logSet.mutate({ sessionId, exerciseId, setNumber, reps, loadKg });
        }}
      />
    </div>
  );
}

function ExerciseLogger({
  name,
  planned,
  logged,
  defaultReps,
  defaultLoad,
  onLog,
  resting,
  onDismissRest,
}: {
  name: string;
  planned?: string;
  logged: SetRow[];
  defaultReps: number;
  defaultLoad: number;
  onLog: (reps: number, loadKg: number) => void;
  resting: number | null;
  onDismissRest: () => void;
}) {
  const [reps, setReps] = useState(defaultReps);
  const [load, setLoad] = useState(defaultLoad);
  return (
    <section className="card flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{name}</h3>
        {planned && <span className="text-sm text-slate-500">{planned}</span>}
      </div>
      {logged.length > 0 && (
        <ol className="flex flex-wrap gap-1 text-sm">
          {logged.map((s, i) => (
            <li key={s.$id} className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
              {i + 1}: {s.reps}×{s.loadKg}kg
            </li>
          ))}
        </ol>
      )}
      {resting !== null && <RestTimer seconds={resting} onDismiss={onDismissRest} />}
      <div className="flex items-end gap-2">
        <label className="flex-1 text-sm">
          Reps
          <input type="number" min={0} className="input !min-h-[40px]" value={reps} onChange={(e) => setReps(Math.max(0, Number(e.target.value)))} />
        </label>
        <label className="flex-1 text-sm">
          Carga (kg)
          <input type="number" min={0} step="0.5" className="input !min-h-[40px]" value={load} onChange={(e) => setLoad(Math.max(0, Number(e.target.value)))} />
        </label>
        <button className="btn-primary !min-h-[40px]" onClick={() => onLog(reps, load)}>Série</button>
      </div>
    </section>
  );
}

function AdHocAdder({ onAdd }: { onAdd: (exerciseId: string, reps: number, loadKg: number) => void }) {
  const { householdId } = useActiveHousehold();
  const { library } = useExerciseLibrary(householdId);
  const [exerciseId, setExerciseId] = useState('');
  const [reps, setReps] = useState(8);
  const [load, setLoad] = useState(0);
  return (
    <section className="card flex flex-col gap-2">
      <h3 className="font-semibold">Adicionar exercício</h3>
      <select className="input" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
        <option value="">Escolha um exercício…</option>
        {library.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <div className="flex items-end gap-2">
        <label className="flex-1 text-sm">Reps<input type="number" min={0} className="input !min-h-[40px]" value={reps} onChange={(e) => setReps(Math.max(0, Number(e.target.value)))} /></label>
        <label className="flex-1 text-sm">Carga<input type="number" min={0} step="0.5" className="input !min-h-[40px]" value={load} onChange={(e) => setLoad(Math.max(0, Number(e.target.value)))} /></label>
        <button className="btn-secondary !min-h-[40px]" disabled={!exerciseId} onClick={() => exerciseId && onAdd(exerciseId, reps, load)}>+ Série</button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function PlansTab({
  householdId,
  memberId,
  plans,
  library,
  exName,
}: {
  householdId: string | null;
  memberId: string | null;
  plans: PlanRow[];
  library: { id: string; name: string }[];
  exName: (id: string) => string;
}) {
  const createPlan = useCreatePlan(householdId, memberId);
  const [name, setName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <form
        className="card flex gap-2"
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) createPlan.mutate({ name: name.trim() }, { onSuccess: () => setName('') }); }}
      >
        <input className="input flex-1" placeholder="Nome do plano (ex.: ABC)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary" disabled={createPlan.isPending}>Criar</button>
      </form>

      {plans.length === 0 ? (
        <div className="card text-center text-slate-500">Nenhum plano ainda.</div>
      ) : (
        plans.map((p) => (
          <section key={p.$id} className="card">
            <button className="flex w-full items-center justify-between" onClick={() => setSelectedPlan(selectedPlan === p.$id ? null : p.$id)}>
              <span className="font-semibold">{p.name}</span>
              <span className="text-slate-400">{selectedPlan === p.$id ? '▲' : '▼'}</span>
            </button>
            {selectedPlan === p.$id && (
              <PlanEditor householdId={householdId} memberId={memberId} planId={p.$id} library={library} exName={exName} />
            )}
          </section>
        ))
      )}
    </div>
  );
}

function PlanEditor({
  householdId,
  memberId,
  planId,
  library,
  exName,
}: {
  householdId: string | null;
  memberId: string | null;
  planId: string;
  library: { id: string; name: string }[];
  exName: (id: string) => string;
}) {
  const days = usePlanDays(planId);
  const addDay = useAddPlanDay(householdId, memberId);
  const [label, setLabel] = useState('');
  const [openDay, setOpenDay] = useState<string | null>(null);

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
      <div className="flex gap-2">
        <input className="input flex-1 !min-h-[40px]" placeholder="Novo dia (ex.: A — Peito/Tríceps)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button className="btn-secondary !min-h-[40px]" disabled={addDay.isPending || !label.trim()} onClick={() => { addDay.mutate({ planId, label: label.trim(), order: (days.data ?? []).length }); setLabel(''); }}>
          + Dia
        </button>
      </div>
      {(days.data ?? []).map((d: PlanDayRow) => (
        <div key={d.$id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
          <button className="flex w-full items-center justify-between text-sm font-medium" onClick={() => setOpenDay(openDay === d.$id ? null : d.$id)}>
            {d.label}<span className="text-slate-400">{openDay === d.$id ? '▲' : '▼'}</span>
          </button>
          {openDay === d.$id && (
            <DayEditor householdId={householdId} memberId={memberId} planDayId={d.$id} library={library} exName={exName} />
          )}
        </div>
      ))}
    </div>
  );
}

function DayEditor({
  householdId,
  memberId,
  planDayId,
  library,
  exName,
}: {
  householdId: string | null;
  memberId: string | null;
  planDayId: string;
  library: { id: string; name: string }[];
  exName: (id: string) => string;
}) {
  const exercises = usePlanExercises(planDayId);
  const addExercise = useAddPlanExercise(householdId, memberId);
  const [exerciseId, setExerciseId] = useState('');
  const [sets, setSets] = useState(3);
  const [repRange, setRepRange] = useState('8-12');
  const [rest, setRest] = useState(90);

  return (
    <div className="mt-2 flex flex-col gap-2">
      <ul className="flex flex-col gap-1 text-sm">
        {(exercises.data ?? []).map((pe) => (
          <li key={pe.$id} className="flex justify-between">
            <span>{exName(pe.exerciseId)}</span>
            <span className="text-slate-500">{pe.sets}× {pe.repRange} · {pe.restSeconds}s</span>
          </li>
        ))}
      </ul>
      <select className="input !min-h-[40px]" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
        <option value="">Adicionar exercício…</option>
        {library.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <div className="flex items-end gap-2">
        <label className="text-sm">Séries<input type="number" min={1} className="input !min-h-[40px] w-16" value={sets} onChange={(e) => setSets(Math.max(1, Number(e.target.value)))} /></label>
        <label className="flex-1 text-sm">Reps<input className="input !min-h-[40px]" value={repRange} onChange={(e) => setRepRange(e.target.value)} /></label>
        <label className="text-sm">Desc.(s)<input type="number" min={0} className="input !min-h-[40px] w-20" value={rest} onChange={(e) => setRest(Math.max(0, Number(e.target.value)))} /></label>
      </div>
      <button className="btn-secondary" disabled={!exerciseId || addExercise.isPending} onClick={() => { if (exerciseId) { addExercise.mutate({ planDayId, exerciseId, sets, repRange, restSeconds: rest, order: (exercises.data ?? []).length }); setExerciseId(''); } }}>
        Adicionar ao dia
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
function HistoryTab({
  sessions,
  mySets,
  exName,
}: {
  sessions: PlanRow[];
  mySets: SetRow[];
  exName: (id: string) => string;
}) {
  if (sessions.length === 0) return <div className="card text-center text-slate-500">Nenhum treino registrado.</div>;
  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => {
        const sets = mySets.filter((x) => x.sessionId === s.$id);
        const durationMin = s.finishedAt ? Math.round((new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 60000) : null;
        const groups = new Map<string, number>();
        for (const set of sets) {
          const k = exName(set.exerciseId);
          groups.set(k, (groups.get(k) ?? 0) + 1);
        }
        return (
          <section key={s.$id} className="card">
            <div className="flex justify-between">
              <h3 className="font-semibold">{formatDate(s.startedAt)}</h3>
              <span className="text-sm text-slate-500">
                {sets.length} séries{durationMin !== null ? ` · ${durationMin} min` : ' · em aberto'} · {Math.round(volumeKg(sets.map((x) => ({ exerciseId: x.exerciseId, reps: x.reps, loadKg: x.loadKg }))))} kg
              </span>
            </div>
            <ul className="mt-1 text-sm text-slate-500">
              {[...groups.entries()].map(([n, c]) => <li key={n}>{n}: {c} série(s)</li>)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
function ProgressTab({ mySets, exName }: { mySets: SetRow[]; exName: (id: string) => string }) {
  const best = bestSetByExercise(mySets.map((s) => ({ exerciseId: s.exerciseId, reps: s.reps, loadKg: s.loadKg })));
  const volumeData = weeklyVolume(
    mySets.map((s) => ({ exerciseId: s.exerciseId, reps: s.reps, loadKg: s.loadKg, at: s.$createdAt })),
  ).map((w) => ({ semana: w.week.slice(5), volume: Math.round(w.volume) }));

  const exerciseIds = [...best.keys()];
  const [selected, setSelected] = useState<string>(exerciseIds[0] ?? '');
  const timeline = prTimeline(
    mySets
      .filter((s) => s.exerciseId === selected)
      .map((s) => ({ exerciseId: s.exerciseId, reps: s.reps, loadKg: s.loadKg, at: s.$createdAt })),
  ).map((p) => ({ data: p.date.slice(5), '1RM': p.est1RM }));

  if (mySets.length === 0) {
    return <div className="card text-center text-slate-500">Registre treinos para ver seu progresso.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="card">
        <h2 className="mb-2 font-semibold">Recordes (1RM estimado)</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {[...best.entries()]
            .sort((a, b) => b[1].est1RM - a[1].est1RM)
            .map(([id, b]) => (
              <li key={id} className="flex justify-between">
                <span>{exName(id)}</span>
                <span className="text-slate-500">{b.reps}×{b.loadKg}kg · ~{estimate1RM(b.reps, b.loadKg)}kg</span>
              </li>
            ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold">Volume semanal (kg)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="semana" fontSize={11} />
            <YAxis fontSize={11} width={40} />
            <Tooltip />
            <Bar dataKey="volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {exerciseIds.length > 0 && (
        <section className="card">
          <h2 className="mb-2 font-semibold">Evolução do 1RM</h2>
          <select className="input mb-2" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {exerciseIds.map((id) => <option key={id} value={id}>{exName(id)}</option>)}
          </select>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="data" fontSize={11} />
              <YAxis fontSize={11} width={40} domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="1RM" stroke="#f97316" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
      <p className="text-xs text-slate-400">
        Registros factuais do seu treino. O app acompanha; não prescreve treino nem resultado de saúde.
      </p>
    </div>
  );
}
