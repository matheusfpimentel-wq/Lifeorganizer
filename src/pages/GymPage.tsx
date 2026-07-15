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
  useDeletePlan,
  useDeletePlanDay,
  useDeletePlanExercise,
  useDeleteSession,
  useDeleteSet,
  useExerciseLibrary,
  useFinishSession,
  useLogSet,
  usePlanDays,
  usePlanExercises,
  useSessions,
  useSessionSets,
  useStartSession,
  useUpdatePlan,
  useUpdatePlanDay,
  useUpdatePlanExercise,
  useWorkoutPlans,
  type PlanDayRow,
  type PlanExerciseRow,
  type SetRow,
} from '@/features/gym/hooks';
import RestTimer from '@/features/gym/RestTimer';
import GuidedHome from '@/features/gym/guided/GuidedHome';
import SessionPlayer from '@/features/gym/guided/SessionPlayer';
import BodyweightCard from '@/features/gym/guided/BodyweightCard';
import { PROGRAM_EXERCISES } from '@/features/gym/program';
import { useTrainingStore } from '@/stores/training';
import { GymScene, ModuleHero } from '@/components/scenes';
import { bestSetByExercise, estimate1RM, prTimeline, suggestNextLoad, volumeKg, weeklyVolume } from '@/core/workout';
import { techniqueLabels } from '@/shared/labels';
import { formatDate } from '@/lib/format';
import { Icon } from '@/components/icons';

type Tab = 'programa' | 'train' | 'plans' | 'history' | 'progress';

export default function GymPage() {
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const memberId = user?.$id ?? null;

  const { library, byId } = useExerciseLibrary(householdId);
  const plans = useWorkoutPlans(householdId, memberId);
  const sessions = useSessions(householdId, memberId);
  const allSets = useSessionSets(householdId, memberId);
  const activeSession = useTrainingStore((s) => s.active);

  const [tab, setTab] = useState<Tab>('programa');

  const mySessionIds = useMemo(() => new Set((sessions.data ?? []).map((s) => s.$id)), [sessions.data]);
  const mySets = useMemo(
    () => (allSets.data ?? []).filter((s) => mySessionIds.has(s.sessionId)),
    [allSets.data, mySessionIds],
  );
  const exName = (id: string) => byId(id)?.name ?? PROGRAM_EXERCISES.get(id)?.name ?? 'Exercício';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'programa', label: 'Programa' },
    { id: 'train', label: 'Livre' },
    { id: 'plans', label: 'Planos' },
    { id: 'history', label: 'Histórico' },
    { id: 'progress', label: 'Progresso' },
  ];

  // sessão guiada ao vivo toma a tela inteira do módulo
  if (activeSession) {
    return (
      <div className="flex flex-col gap-4">
        <SessionPlayer householdId={householdId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ModuleHero scene={<GymScene className="h-24 w-full" />} title="Academia" />
      <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
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

      {tab === 'programa' && <GuidedHome householdId={householdId} />}

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
        <HistoryTab householdId={householdId} sessions={sessions.data ?? []} mySets={mySets} exName={exName} />
      )}
      {tab === 'progress' && (
        <div className="flex flex-col gap-4">
          <BodyweightCard householdId={householdId} memberId={memberId} />
          <ProgressTab mySets={mySets} exName={exName} />
        </div>
      )}
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
  const deleteSet = useDeleteSet(householdId);
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
        // progressão dupla: melhor série por sessão passada, mais recente primeiro
        const repTop = plan ? Number(String(plan.repRange).split('-').pop()) || 0 : 0;
        const suggestedLoad = (() => {
          if (!repTop) return null;
          const past = mySets.filter(
            (s) => s.exerciseId === exerciseId && s.sessionId !== sessionId && !s.durationSeconds,
          );
          const topBySession = new Map<string, { reps: number; loadKg: number; at: string }>();
          for (const s of past) {
            const cur = topBySession.get(s.sessionId);
            const at = String(s.$createdAt ?? '');
            if (!cur || s.loadKg > cur.loadKg || (s.loadKg === cur.loadKg && s.reps > cur.reps)) {
              topBySession.set(s.sessionId, { reps: s.reps, loadKg: s.loadKg, at });
            }
          }
          const tops = [...topBySession.values()]
            .sort((a, b) => b.at.localeCompare(a.at))
            .map(({ reps, loadKg }) => ({ reps, loadKg }));
          return suggestNextLoad(tops, repTop);
        })();
        return (
          <ExerciseLogger
            key={exerciseId}
            name={exName(exerciseId)}
            planned={plan ? `${plan.sets}× ${plan.repRange}` : undefined}
            logged={logged}
            suggestedLoad={suggestedLoad}
            defaultReps={last?.reps ?? (plan ? Number(String(plan.repRange).split('-')[0]) || 8 : 8)}
            defaultLoad={last?.loadKg ?? plan?.targetLoadKg ?? 0}
            onLog={(values) => {
              logSet.mutate({ sessionId, exerciseId, setNumber: logged.length + 1, ...values });
              setRestFor({ key: exerciseId, seconds: rest });
            }}
            onDeleteSet={(setId) => deleteSet.mutate(setId)}
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

export interface SetLogValues {
  reps: number;
  loadKg: number;
  durationSeconds: number | null;
  technique: string | null;
  rpe: number | null;
}

function ExerciseLogger({
  name,
  planned,
  logged,
  defaultReps,
  defaultLoad,
  suggestedLoad,
  onLog,
  onDeleteSet,
  resting,
  onDismissRest,
}: {
  name: string;
  planned?: string;
  logged: SetRow[];
  defaultReps: number;
  defaultLoad: number;
  suggestedLoad?: number | null;
  onLog: (values: SetLogValues) => void;
  onDeleteSet: (setId: string) => void;
  resting: number | null;
  onDismissRest: () => void;
}) {
  const [mode, setMode] = useState<'reps' | 'tempo'>('reps');
  const [reps, setReps] = useState(defaultReps);
  const [seconds, setSeconds] = useState(30);
  const [load, setLoad] = useState(defaultLoad);
  const [technique, setTechnique] = useState('normal');
  const [rpe, setRpe] = useState('');

  function describeSet(s: SetRow): string {
    const base = s.durationSeconds ? `${s.durationSeconds}s` : `${s.reps}×`;
    const withLoad = s.durationSeconds
      ? s.loadKg > 0 ? `${base} · ${s.loadKg}kg` : base
      : `${base}${s.loadKg}kg`;
    const tech = s.technique && s.technique !== 'normal' ? ` · ${techniqueLabels[s.technique] ?? s.technique}` : '';
    const rpeTag = s.rpe ? ` · RPE ${s.rpe}` : '';
    return withLoad + tech + rpeTag;
  }

  function submit() {
    onLog({
      reps: mode === 'reps' ? reps : 0,
      loadKg: load,
      durationSeconds: mode === 'tempo' ? seconds : null,
      technique: technique === 'normal' ? null : technique,
      rpe: rpe ? Math.min(10, Math.max(0, Number(rpe.replace(',', '.')))) : null,
    });
  }

  return (
    <section className="card flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{name}</h3>
        {planned && <span className="text-sm text-slate-500">{planned}</span>}
      </div>

      {logged.length > 0 && (
        <ol className="flex flex-wrap gap-1 text-sm">
          {logged.map((s, i) => (
            <li key={s.$id} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
              {i + 1}: {describeSet(s)}
              <button
                type="button"
                className="text-slate-400 hover:text-red-600"
                aria-label={`Excluir série ${i + 1}`}
                onClick={() => onDeleteSet(s.$id)}
              >
                <Icon.X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ol>
      )}
      {suggestedLoad != null && (
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-left text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          onClick={() => setLoad(suggestedLoad)}
        >
          <Icon.ChevronUp className="h-4 w-4 shrink-0" />
          Progressão dupla: você bateu o teto de reps nas 2 últimas sessões — toque para tentar {suggestedLoad} kg.
        </button>
      )}
      {resting !== null && <RestTimer seconds={resting} onDismiss={onDismissRest} />}

      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-2 gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
          <button
            type="button"
            className={`min-h-[32px] rounded-md text-xs font-medium ${mode === 'reps' ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500'}`}
            onClick={() => setMode('reps')}
          >
            Repetições
          </button>
          <button
            type="button"
            className={`min-h-[32px] rounded-md text-xs font-medium ${mode === 'tempo' ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500'}`}
            onClick={() => setMode('tempo')}
          >
            Tempo
          </button>
        </div>
        <select
          aria-label="Técnica"
          className="input !min-h-[36px] max-w-[140px] !py-1 text-sm"
          value={technique}
          onChange={(e) => setTechnique(e.target.value)}
        >
          {Object.entries(techniqueLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2">
        {mode === 'reps' ? (
          <label className="flex-1 text-sm">
            Reps
            <input type="number" min={0} className="input !min-h-[40px]" value={reps} onChange={(e) => setReps(Math.max(0, Number(e.target.value)))} />
          </label>
        ) : (
          <label className="flex-1 text-sm">
            Segundos
            <input type="number" min={0} step="5" className="input !min-h-[40px]" value={seconds} onChange={(e) => setSeconds(Math.max(0, Number(e.target.value)))} />
          </label>
        )}
        <label className="flex-1 text-sm">
          Carga (kg)
          <input type="number" min={0} step="0.5" className="input !min-h-[40px]" value={load} onChange={(e) => setLoad(Math.max(0, Number(e.target.value)))} />
        </label>
        <label className="w-16 text-sm" title="Esforço percebido de 1 (muito leve) a 10 (falha)">
          RPE
          <input inputMode="decimal" placeholder="—" className="input !min-h-[40px]" value={rpe} onChange={(e) => setRpe(e.target.value)} />
        </label>
        <button className="btn-primary !min-h-[40px]" onClick={submit}>Série</button>
      </div>
      <p className="text-xs text-slate-400">
        RPE: esforço percebido (1–10). Use Tempo para pranchas, isometrias e cardio.
      </p>
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
  const updatePlan = useUpdatePlan(householdId);
  const deletePlan = useDeletePlan(householdId);
  const [name, setName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  function renamePlan(p: PlanRow) {
    const next = prompt('Novo nome do plano:', p.name);
    if (next?.trim() && next.trim() !== p.name) updatePlan.mutate({ planId: p.$id, data: { name: next.trim() } });
  }

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
            <div className="flex items-center gap-2">
              <button className="flex min-w-0 flex-1 items-center justify-between" onClick={() => setSelectedPlan(selectedPlan === p.$id ? null : p.$id)}>
                <span className="truncate font-semibold">{p.name}</span>
                <span className="text-slate-400">{selectedPlan === p.$id ? <Icon.ChevronUp className="h-4 w-4" /> : <Icon.ChevronDown className="h-4 w-4" />}</span>
              </button>
              <button className="btn-secondary !min-h-[32px] shrink-0 !px-2 text-xs" onClick={() => renamePlan(p)}>
                Renomear
              </button>
              <button
                className="shrink-0 text-slate-400 hover:text-red-600"
                aria-label={`Excluir plano ${p.name}`}
                onClick={() => {
                  if (confirm(`Excluir o plano "${p.name}" com seus dias e exercícios?`)) deletePlan.mutate(p.$id);
                }}
              >
                <Icon.Trash className="h-4 w-4" />
              </button>
            </div>
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
  const updateDay = useUpdatePlanDay();
  const deleteDay = useDeletePlanDay();
  const [label, setLabel] = useState('');
  const [openDay, setOpenDay] = useState<string | null>(null);

  function renameDay(d: PlanDayRow) {
    const next = prompt('Novo nome do dia:', d.label);
    if (next?.trim() && next.trim() !== d.label) updateDay.mutate({ dayId: d.$id, planId, data: { label: next.trim() } });
  }

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
          <div className="flex items-center gap-2">
            <button className="flex min-w-0 flex-1 items-center justify-between text-sm font-medium" onClick={() => setOpenDay(openDay === d.$id ? null : d.$id)}>
              <span className="truncate">{d.label}</span>
              <span className="text-slate-400">{openDay === d.$id ? <Icon.ChevronUp className="h-4 w-4" /> : <Icon.ChevronDown className="h-4 w-4" />}</span>
            </button>
            <button className="btn-secondary !min-h-[28px] shrink-0 !px-2 text-xs" onClick={() => renameDay(d)}>
              Renomear
            </button>
            <button
              className="shrink-0 text-slate-400 hover:text-red-600"
              aria-label={`Excluir dia ${d.label}`}
              onClick={() => {
                if (confirm(`Excluir o dia "${d.label}" e seus exercícios?`)) deleteDay.mutate({ dayId: d.$id, planId });
              }}
            >
              <Icon.Trash className="h-4 w-4" />
            </button>
          </div>
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
  const updateExercise = useUpdatePlanExercise();
  const deleteExercise = useDeletePlanExercise();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState('');
  const [sets, setSets] = useState(3);
  const [repRange, setRepRange] = useState('8-12');
  const [rest, setRest] = useState(90);

  function startEdit(pe: PlanExerciseRow) {
    setEditingRowId(pe.$id);
    setExerciseId(pe.exerciseId);
    setSets(pe.sets ?? 3);
    setRepRange(pe.repRange ?? '8-12');
    setRest(pe.restSeconds ?? 90);
  }

  function resetForm() {
    setEditingRowId(null);
    setExerciseId('');
    setSets(3);
    setRepRange('8-12');
    setRest(90);
  }

  function submit() {
    if (!exerciseId) return;
    if (editingRowId) {
      updateExercise.mutate(
        { exerciseRowId: editingRowId, planDayId, data: { exerciseId, sets, repRange, restSeconds: rest } },
        { onSuccess: resetForm },
      );
    } else {
      addExercise.mutate({ planDayId, exerciseId, sets, repRange, restSeconds: rest, order: (exercises.data ?? []).length });
      setExerciseId('');
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <ul className="flex flex-col gap-1 text-sm">
        {(exercises.data ?? []).map((pe) => (
          <li key={pe.$id} className="flex items-center gap-2">
            <button
              type="button"
              className={`flex min-w-0 flex-1 justify-between gap-2 text-left ${editingRowId === pe.$id ? 'text-brand-600 dark:text-brand-400' : ''}`}
              aria-label={`Editar ${exName(pe.exerciseId)}`}
              onClick={() => startEdit(pe)}
            >
              <span className="truncate">{exName(pe.exerciseId)}</span>
              <span className="shrink-0 text-slate-500">{pe.sets}× {pe.repRange} · {pe.restSeconds}s</span>
            </button>
            <button
              className="shrink-0 text-slate-400 hover:text-red-600"
              aria-label={`Remover ${exName(pe.exerciseId)}`}
              onClick={() => {
                if (editingRowId === pe.$id) resetForm();
                deleteExercise.mutate({ exerciseRowId: pe.$id, planDayId });
              }}
            >
              <Icon.X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <select className="input !min-h-[40px]" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
        <option value="">{editingRowId ? 'Trocar exercício…' : 'Adicionar exercício…'}</option>
        {library.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <div className="flex items-end gap-2">
        <label className="text-sm">Séries<input type="number" min={1} className="input !min-h-[40px] w-16" value={sets} onChange={(e) => setSets(Math.max(1, Number(e.target.value)))} /></label>
        <label className="flex-1 text-sm">Reps<input className="input !min-h-[40px]" value={repRange} onChange={(e) => setRepRange(e.target.value)} /></label>
        <label className="text-sm">Desc.(s)<input type="number" min={0} className="input !min-h-[40px] w-20" value={rest} onChange={(e) => setRest(Math.max(0, Number(e.target.value)))} /></label>
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary flex-1" disabled={!exerciseId || addExercise.isPending || updateExercise.isPending} onClick={submit}>
          {editingRowId ? 'Salvar exercício' : 'Adicionar ao dia'}
        </button>
        {editingRowId && (
          <button className="btn-secondary" onClick={resetForm}>Cancelar</button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function HistoryTab({
  householdId,
  sessions,
  mySets,
  exName,
}: {
  householdId: string | null;
  sessions: PlanRow[];
  mySets: SetRow[];
  exName: (id: string) => string;
}) {
  const deleteSession = useDeleteSession(householdId);
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
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{formatDate(s.startedAt)}</h3>
              <span className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {sets.length} séries{durationMin !== null ? ` · ${durationMin} min` : ' · em aberto'} · {Math.round(volumeKg(sets.map((x) => ({ exerciseId: x.exerciseId, reps: x.reps, loadKg: x.loadKg }))))} kg
                </span>
                <button
                  className="shrink-0 text-slate-400 hover:text-red-600"
                  aria-label={`Excluir treino de ${formatDate(s.startedAt)}`}
                  onClick={() => {
                    if (confirm(`Excluir o treino de ${formatDate(s.startedAt)} com ${sets.length} série(s)?`)) {
                      deleteSession.mutate(s.$id);
                    }
                  }}
                >
                  <Icon.Trash className="h-4 w-4" />
                </button>
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
