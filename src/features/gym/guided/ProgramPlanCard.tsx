/**
 * O programa guiado aparecendo como UM plano entre vários na aba "Planos":
 * card no mesmo estilo, expansível, mostrando os treinos e blocos. Não é
 * editável (é o programa fixo) — o botão leva à aba Programa (visão do dia).
 */
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { PROGRAM, PROGRAM_EXERCISES, WORKOUTS } from '../program';
import { useProgramState } from '../trainingHooks';
import { Icon } from '@/components/icons';

export default function ProgramPlanCard({ householdId, onOpen }: { householdId: string | null; onOpen: () => void }) {
  const { user } = useAuth();
  const { week, phase, nextKey } = useProgramState(householdId, user?.$id ?? null);
  const [open, setOpen] = useState(false);
  const [openWorkout, setOpenWorkout] = useState<string | null>(null);

  return (
    <section className="card border-l-4 border-brand-500">
      <div className="flex items-center gap-2">
        <button className="flex min-w-0 flex-1 items-center justify-between" onClick={() => setOpen((o) => !o)}>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <Icon.Sparkles className="h-4 w-4 shrink-0 text-brand-600" />
              <span className="truncate font-semibold">Programa · Retomada 12 semanas</span>
            </span>
            <span className="block text-xs text-slate-500">{phase.name} · semana {week} · próximo: {WORKOUT_NAME(nextKey)}</span>
          </span>
          <span className="text-slate-400">{open ? <Icon.ChevronUp className="h-4 w-4" /> : <Icon.ChevronDown className="h-4 w-4" />}</span>
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
          {WORKOUTS.map((w) => (
            <div key={w.key} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
              <button className="flex w-full items-center justify-between text-sm font-medium" onClick={() => setOpenWorkout(openWorkout === w.key ? null : w.key)}>
                <span>{w.name} <span className="font-normal text-slate-400">· {w.focus}</span></span>
                <span className="text-slate-400">{openWorkout === w.key ? <Icon.ChevronUp className="h-4 w-4" /> : <Icon.ChevronDown className="h-4 w-4" />}</span>
              </button>
              {openWorkout === w.key && (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {w.blocks.flatMap((b) => b.exercises).map((be, i) => {
                    const ex = PROGRAM_EXERCISES.get(be.exercise);
                    if (!ex) return null;
                    return (
                      <li key={`${be.exercise}-${i}`} className="flex justify-between gap-2">
                        <span className="truncate">{ex.name}</span>
                        <span className="shrink-0 text-slate-500">{be.setsMin === be.setsMax ? be.setsMin : `${be.setsMin}–${be.setsMax}`}× {be.repMin}–{be.repMax}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
          <p className="text-xs text-slate-400">
            {PROGRAM.rotation.length} treinos em rodízio · fases Reacender → Construir → Intensificar.
          </p>
          <button className="btn-primary" onClick={onOpen}>
            <Icon.Play className="h-4 w-4" />
            Abrir no Programa (o treino de hoje)
          </button>
        </div>
      )}
    </section>
  );
}

function WORKOUT_NAME(key: string): string {
  return WORKOUTS.find((w) => w.key === key)?.name ?? key;
}
