/**
 * Métricas de treino — núcleo puro (sem I/O). O app REGISTRA e acompanha;
 * não prescreve treino nem promete resultado de saúde.
 */

export interface WorkoutSet {
  exerciseId: string;
  reps: number;
  loadKg: number;
}

export interface DatedSet extends WorkoutSet {
  at: string; // ISO
}

/** 1RM estimado (fórmula de Epley). reps=1 devolve a própria carga. */
export function estimate1RM(reps: number, loadKg: number): number {
  if (reps <= 0 || loadKg < 0) throw new Error('reps > 0 e carga >= 0');
  return Math.round(loadKg * (1 + reps / 30) * 100) / 100;
}

export interface BestSet {
  loadKg: number;
  reps: number;
  est1RM: number;
}

/** Melhor série por exercício (maior 1RM estimado; empate → maior carga). */
export function bestSetByExercise(sets: WorkoutSet[]): Map<string, BestSet> {
  const best = new Map<string, BestSet>();
  for (const s of sets) {
    if (s.reps <= 0) continue;
    const est1RM = estimate1RM(s.reps, s.loadKg);
    const current = best.get(s.exerciseId);
    if (!current || est1RM > current.est1RM || (est1RM === current.est1RM && s.loadKg > current.loadKg)) {
      best.set(s.exerciseId, { loadKg: s.loadKg, reps: s.reps, est1RM });
    }
  }
  return best;
}

/** Volume total (Σ reps × carga) de um conjunto de séries. */
export function volumeKg(sets: WorkoutSet[]): number {
  return sets.reduce((acc, s) => acc + s.reps * s.loadKg, 0);
}

/** Início da semana (segunda) local de SP para um ISO, como chave 'YYYY-MM-DD'. */
export function weekKeySaoPaulo(iso: string): string {
  const offsetMs = 3 * 60 * 60 * 1000;
  const wall = new Date(new Date(iso).getTime() - offsetMs);
  const dow = wall.getUTCDay(); // 0=domingo
  const backToMonday = (dow + 6) % 7;
  const monday = new Date(
    Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate()) - backToMonday * 86_400_000,
  );
  return monday.toISOString().slice(0, 10);
}

/** Volume semanal agregado (ordenado por semana asc). */
export function weeklyVolume(sets: DatedSet[]): { week: string; volume: number }[] {
  const byWeek = new Map<string, number>();
  for (const s of sets) {
    const week = weekKeySaoPaulo(s.at);
    byWeek.set(week, (byWeek.get(week) ?? 0) + s.reps * s.loadKg);
  }
  return [...byWeek.entries()]
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

/** Evolução do 1RM estimado (melhor por dia) de UM exercício, asc por data. */
export function prTimeline(sets: DatedSet[]): { date: string; est1RM: number }[] {
  const byDay = new Map<string, number>();
  for (const s of sets) {
    if (s.reps <= 0) continue;
    const day = new Date(new Date(s.at).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const est = estimate1RM(s.reps, s.loadKg);
    byDay.set(day, Math.max(byDay.get(day) ?? 0, est));
  }
  return [...byDay.entries()]
    .map(([date, est1RM]) => ({ date, est1RM }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
