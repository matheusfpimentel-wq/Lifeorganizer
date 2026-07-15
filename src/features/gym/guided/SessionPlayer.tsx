/**
 * Player da sessão ao vivo: mostra o passo atual, aceita carga/reps/RIR com
 * pré-preenchimento pela progressão, grava offline e dispara o descanso
 * conforme supersérie/direta. 100% funcional sem rede.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { rirTarget } from '@/core/program';
import { MUSCLE_LABELS, PROGRAM, PROGRAM_EXERCISES } from '../program';
import { useActiveSteps, useLiveSession, useLoadSuggestion, useProgramState } from '../trainingHooks';
import { useTrainingStore } from '@/stores/training';
import { useRestTimer } from './useRestTimer';
import CueModal from './CueModal';
import SessionSummary from './SessionSummary';
import { Icon } from '@/components/icons';

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SessionPlayer({ householdId }: { householdId: string | null }) {
  const { user } = useAuth();
  const active = useTrainingStore((s) => s.active)!;
  const units = useTrainingStore((s) => s.settings.units);
  const { steps, workout } = useActiveSteps();
  const live = useLiveSession(householdId);
  const timer = useRestTimer();
  const { lastSetsFor } = useProgramState(householdId, user?.$id ?? null);
  const suggest = useLoadSuggestion();

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');
  const [cue, setCue] = useState<string | null>(null);
  const lastPrefilled = useRef(-1);

  const index = active.index;
  const done = index >= steps.length;
  const step = done ? null : steps[index];
  const exercise = step ? PROGRAM_EXERCISES.get(step.exerciseKey) : undefined;
  const phaseName = active.phaseName;

  // séries já feitas deste exercício NESTA sessão
  const inSession = useMemo(
    () => (step ? active.logs.filter((l) => l.exerciseKey === step.exerciseKey) : []),
    [active.logs, step],
  );

  // pré-preenche carga/reps ao trocar de passo (progressão + série anterior)
  useEffect(() => {
    if (!step || lastPrefilled.current === index) return;
    lastPrefilled.current = index;
    const prior = inSession[inSession.length - 1];
    if (prior) {
      setWeight(String(prior.weight));
      setReps(String(prior.reps));
    } else {
      const s = suggest(step.exerciseKey, step.repMax, lastSetsFor(step.exerciseKey));
      setWeight(s ? String(s.loadKg) : '');
      setReps(String(step.repMin));
    }
    setRir('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, step]);

  if (done) {
    return <SessionSummary householdId={householdId} onFinish={() => live.finish()} />;
  }
  if (!step || !exercise || !workout) return null;

  const target = rirForStep(exercise.isCompound, phaseName, active.deload);
  const isLast = index >= steps.length - 1;
  const blocksTotal = workout.blocks.length;
  const currentBlock = step.blockOrder;

  function complete() {
    if (!step) return;
    const w = Number(weight.replace(',', '.')) || 0;
    const r = Math.max(0, Math.floor(Number(reps.replace(',', '.')) || 0));
    if (r <= 0) return;
    live.logSet({
      stepIndex: index,
      exerciseKey: step.exerciseKey,
      setNumber: step.setNumber,
      weight: w,
      reps: r,
      rir: rir === '' ? null : Math.max(0, Math.min(10, Number(rir))),
    });
    if (!isLast && step.restSecondsAfter > 0) timer.start(step.restSecondsAfter);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* cabeçalho */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold">{workout.name}</h1>
          <p className="text-sm text-slate-500">{phaseName} · bloco {currentBlock}/{blocksTotal}</p>
        </div>
        <button className="btn-secondary !min-h-[40px]" onClick={() => confirm('Encerrar e sair do treino? O que você registrou fica salvo.') && live.finish()}>
          Sair
        </button>
      </div>

      {/* barra de progresso por passos */}
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(index / steps.length) * 100}%` }} />
      </div>

      {/* passo atual */}
      <section className="card flex flex-col gap-3">
        {step.toSupersetPartner || step.restSecondsAfter === 0 ? (
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">Supersérie — emenda no próximo, sem descanso</p>
        ) : null}
        <button type="button" className="flex items-center gap-2 text-left" onClick={() => setCue(step.exerciseKey)}>
          <h2 className="text-2xl font-extrabold">{exercise.name}</h2>
          <Icon.Info className="h-5 w-5 shrink-0 text-slate-400" />
        </button>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {MUSCLE_LABELS[exercise.muscle] ?? exercise.muscle}
          </span>
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            Série {step.setNumber}/{step.totalSets} · {step.repMin}–{step.repMax} reps
          </span>
          <span className="rounded-full bg-brand-600/10 px-2.5 py-0.5 font-bold text-brand-600 dark:bg-brand-400/15 dark:text-brand-400">
            RIR-alvo {target.low}–{target.high} (mire {target.aim})
          </span>
        </div>

        {inSession.length > 0 && (
          <ol className="flex flex-wrap gap-1 text-sm">
            {inSession.map((l, i) => (
              <li key={i} className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                {i + 1}: {l.reps}×{l.weight}{units}
              </li>
            ))}
          </ol>
        )}

        <div className="flex items-end gap-2">
          <label className="flex-1 text-sm font-semibold">
            Carga ({units})
            <input inputMode="decimal" className="input mt-1 text-lg" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
          </label>
          <label className="flex-1 text-sm font-semibold">
            Reps
            <input inputMode="numeric" className="input mt-1 text-lg" value={reps} onChange={(e) => setReps(e.target.value)} placeholder={String(step.repMin)} />
          </label>
          <label className="w-16 text-sm font-semibold" title="Reps na reserva (opcional)">
            RIR
            <input inputMode="numeric" className="input mt-1 text-lg" value={rir} onChange={(e) => setRir(e.target.value)} placeholder="—" />
          </label>
        </div>

        <button className="btn-primary !min-h-[52px] text-lg" onClick={complete}>
          <Icon.Check className="h-5 w-5" />
          {step.toSupersetPartner ? 'Concluir e emendar' : isLast ? 'Concluir e finalizar' : 'Concluir série'}
        </button>
      </section>

      {/* cronômetro de descanso (overlay) */}
      {timer.active && timer.remaining !== null && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-slate-950/95 p-6 text-white">
          <p className="text-sm uppercase tracking-widest opacity-70">Descanso</p>
          <p className="text-7xl font-extrabold tabular-nums">{fmt(timer.remaining)}</p>
          <div className="flex items-center gap-3">
            <button className="rounded-2xl bg-white/15 px-5 py-3 text-lg font-bold active:bg-white/30" onClick={() => timer.add(-15)}>−15s</button>
            <button className="rounded-2xl bg-white/15 px-5 py-3 text-lg font-bold active:bg-white/30" onClick={() => timer.add(15)}>+15s</button>
          </div>
          <button className="btn-primary !min-h-[52px] px-8 text-lg" onClick={() => timer.stop()}>Pular descanso</button>
          {steps[index] && (
            <p className="text-center text-sm opacity-80">
              A seguir: {PROGRAM_EXERCISES.get(steps[index].exerciseKey)?.name}
            </p>
          )}
        </div>
      )}

      {cue && <CueModal exerciseKey={cue} onClose={() => setCue(null)} />}
    </div>
  );
}

// ————— helper local —————
function rirForStep(isCompound: boolean, phaseName: string, deload: boolean) {
  const phase = PROGRAM.phases.find((p) => p.name === phaseName) ?? PROGRAM.phases[0];
  return rirTarget(phase, isCompound, deload);
}
