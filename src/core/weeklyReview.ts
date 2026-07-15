/**
 * Agregação da semana para a revisão de coach — núcleo puro (sem I/O, sem IA).
 * O LLM (opcional, fora do treino) só recebe este resumo já pronto.
 */

export interface AggSet {
  muscle: string;
  reps: number;
  loadKg: number;
}

/** Séries e tonelagem por músculo (desc por tonelagem). */
export function sumByMuscle(sets: AggSet[]): { muscle: string; sets: number; tonnage: number }[] {
  const m = new Map<string, { sets: number; tonnage: number }>();
  for (const s of sets) {
    const cur = m.get(s.muscle) ?? { sets: 0, tonnage: 0 };
    cur.sets += 1;
    cur.tonnage += s.reps * s.loadKg;
    m.set(s.muscle, cur);
  }
  return [...m.entries()]
    .map(([muscle, v]) => ({ muscle, sets: v.sets, tonnage: Math.round(v.tonnage) }))
    .sort((a, b) => b.tonnage - a.tonnage);
}

export interface TopSet {
  reps: number;
  loadKg: number;
}

/**
 * Exercícios estagnados: mesma carga E reps na melhor série das últimas ≥2
 * sessões. `recentByExercise` = top set por sessão, da mais recente para a mais
 * antiga. Retorna quantas sessões seguidas travaram.
 */
export function detectStalled(
  recentByExercise: Record<string, TopSet[]>,
): { exercise: string; reps: number; loadKg: number; sessions: number }[] {
  const out: { exercise: string; reps: number; loadKg: number; sessions: number }[] = [];
  for (const [exercise, tops] of Object.entries(recentByExercise)) {
    if (tops.length >= 2 && tops[0].loadKg > 0 && tops[0].loadKg === tops[1].loadKg && tops[0].reps === tops[1].reps) {
      let n = 1;
      while (n < tops.length && tops[n].loadKg === tops[0].loadKg && tops[n].reps === tops[0].reps) n++;
      out.push({ exercise, reps: tops[0].reps, loadKg: tops[0].loadKg, sessions: n });
    }
  }
  return out;
}

export interface WeeklyAggregate {
  week: number;
  phase: string;
  byMuscle: { muscle: string; sets: number; tonnage: number }[];
  adherence: { done: number; planned: number };
  bodyweight: { start: number | null; end: number | null; deltaKg: number | null };
  stalled: { exercise: string; reps: number; loadKg: number; sessions: number }[];
}

/** Monta o objeto de entrada da revisão (já resolvido, pronto para o LLM). */
export function buildWeeklyAggregate(input: {
  week: number;
  phase: string;
  sets: AggSet[];
  sessionsDone: number;
  planned: number;
  bodyweightStart: number | null;
  bodyweightEnd: number | null;
  recentByExercise: Record<string, TopSet[]>;
}): WeeklyAggregate {
  const delta =
    input.bodyweightStart !== null && input.bodyweightEnd !== null
      ? Math.round((input.bodyweightEnd - input.bodyweightStart) * 10) / 10
      : null;
  return {
    week: input.week,
    phase: input.phase,
    byMuscle: sumByMuscle(input.sets),
    adherence: { done: input.sessionsDone, planned: input.planned },
    bodyweight: { start: input.bodyweightStart, end: input.bodyweightEnd, deltaKg: delta },
    stalled: detectStalled(input.recentByExercise),
  };
}
