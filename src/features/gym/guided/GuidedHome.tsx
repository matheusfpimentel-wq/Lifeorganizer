/**
 * Home do Treino guiado: próximo treino da rotação, fase e semana atuais,
 * botão grande "Iniciar", pré-visualização dos blocos e toggle de deload
 * (sugerido nas semanas 6 e 12).
 */
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { rirTarget } from '@/core/program';
import { MUSCLE_LABELS, PROGRAM, PROGRAM_EXERCISES, WORKOUTS_BY_KEY } from '../program';
import { useProgramState, useLiveSession, useGuidedSessions } from '../trainingHooks';
import { useSessionSets } from '../hooks';
import { formatDate } from '@/lib/format';
import CueModal from './CueModal';
import WeeklyReviewCard from './WeeklyReviewCard';
import ExerciseListModal from './ExerciseListModal';
import TrainingSettingsCard from './TrainingSettingsCard';
import { Icon } from '@/components/icons';

const PHASE_TINT: Record<string, string> = {
  Reacender: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Construir: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Intensificar: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

export default function GuidedHome({ householdId }: { householdId: string | null }) {
  const { user } = useAuth();
  const memberId = user?.$id ?? null;
  const { week, phase, nextWorkout, isLoading } = useProgramState(householdId, memberId);
  const live = useLiveSession(householdId);
  const { guided } = useGuidedSessions(householdId, memberId);
  const allSets = useSessionSets(householdId, memberId);
  const [deload, setDeload] = useState(false);
  const [cue, setCue] = useState<string | null>(null);
  const [showExercises, setShowExercises] = useState(false);

  const recent = [...guided]
    .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))
    .slice(0, 4)
    .map((s) => {
      const sets = (allSets.data ?? []).filter((x) => x.sessionId === s.$id);
      const tonnage = Math.round(sets.reduce((acc, x) => acc + x.reps * x.loadKg, 0));
      return { id: s.$id, name: WORKOUTS_BY_KEY.get(s.templateKey)?.name ?? s.templateKey, date: s.startedAt, sets: sets.length, tonnage, done: !!s.finishedAt };
    });

  const deloadSuggested = week === 6 || week === 12;

  if (isLoading) return <div className="h-40 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />;
  if (!nextWorkout) return <div className="card text-center text-slate-500">Programa indisponível.</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* cartão do programa */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-md">
        <p className="text-xs uppercase tracking-wide opacity-80">{PROGRAM.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PHASE_TINT[phase.name] ?? 'bg-white/20'}`}>
            {phase.name}
          </span>
          <span className="text-sm opacity-90">Semana {week} de {PROGRAM.weeks}</span>
        </div>
        <p className="mt-3 text-2xl font-extrabold">Próximo: {nextWorkout.name}</p>
        <p className="text-sm opacity-90">{nextWorkout.focus}</p>
        <Icon.Dumbbell className="absolute -bottom-4 -right-3 h-24 w-24 opacity-10" />
      </section>

      {/* deload */}
      <label className={`card flex items-center justify-between gap-3 ${deloadSuggested ? 'border-l-4 border-amber-500' : ''}`}>
        <div>
          <p className="font-bold">Semana de deload</p>
          <p className="text-sm text-slate-500">
            {deloadSuggested
              ? 'Fim de bloco: uma semana leve ajuda a recuperar. Reduz séries e recua o RIR.'
              : 'Semana leve opcional (metade das séries, RIR mais folgado).'}
          </p>
        </div>
        <input type="checkbox" className="h-6 w-6 accent-brand-600" checked={deload} onChange={(e) => setDeload(e.target.checked)} />
      </label>

      <button
        className="btn-primary !min-h-[56px] text-lg"
        onClick={() => memberId && live.start(memberId, nextWorkout.key, week, phase.name, deload)}
      >
        <Icon.Play className="h-5 w-5" />
        Iniciar treino
      </button>

      <button className="btn-secondary" onClick={() => setShowExercises(true)}>
        <Icon.List className="h-4 w-4" />
        Ver exercícios do programa
      </button>

      {/* prévia dos blocos */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">O treino de hoje</h2>
        {nextWorkout.blocks.map((block) => (
          <div key={block.order} className="card">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              {block.type === 'superset' && phase.supersetsEnabled ? 'Supersérie' : 'Séries diretas'}
              {block.note ? ` · ${block.note}` : ''}
            </p>
            <ul className="flex flex-col gap-1.5">
              {block.exercises.map((be) => {
                const ex = PROGRAM_EXERCISES.get(be.exercise);
                if (!ex) return null;
                const sets = phase.useSetsMax ? be.setsMax : be.setsMin;
                const rir = rirTarget(phase, ex.isCompound, deload);
                return (
                  <li key={be.exercise} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                      onClick={() => setCue(be.exercise)}
                    >
                      <span className="truncate font-medium">{ex.name}</span>
                      <Icon.Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </button>
                    <span className="shrink-0 text-sm text-slate-500">
                      {deload ? Math.ceil(sets / 2) : sets}×{be.repMin}–{be.repMax} · RIR {rir.low}–{rir.high}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1 text-xs text-slate-400">
              {MUSCLE_LABELS[PROGRAM_EXERCISES.get(block.exercises[0].exercise)?.muscle ?? ''] ?? ''}
              {' · descanso '}{block.restSeconds}s
            </p>
          </div>
        ))}
      </section>

      <WeeklyReviewCard householdId={householdId} />

      {recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Histórico recente</h2>
          {recent.map((r) => (
            <div key={r.id} className="card flex items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{r.name}{!r.done && <span className="ml-2 text-xs text-amber-600">em aberto</span>}</p>
                <p className="text-sm text-slate-500">{formatDate(r.date)}</p>
              </div>
              <p className="shrink-0 text-sm text-slate-500">{r.sets} série{r.sets === 1 ? '' : 's'} · {r.tonnage} kg</p>
            </div>
          ))}
        </section>
      )}

      <TrainingSettingsCard />

      {cue && <CueModal exerciseKey={cue} onClose={() => setCue(null)} />}
      {showExercises && <ExerciseListModal onClose={() => setShowExercises(false)} />}
    </div>
  );
}
