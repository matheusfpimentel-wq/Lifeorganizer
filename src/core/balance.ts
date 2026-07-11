/**
 * Painel de equilíbrio de tarefas — núcleo puro (sem I/O).
 *
 * Apresentação NEUTRA (o app registra e distribui, não pune): contadores
 * factuais de conclusões ponderadas por `points`. Sem ranking humilhante —
 * a ordenação existe só para render estável de barras.
 */

export interface Completion {
  /** Quem concluiu (completedBy). Conclusões sem autor são ignoradas. */
  completedBy: string | null | undefined;
  /** Pontos da tarefa correspondente (>= 1). */
  points: number;
}

export interface BalanceRow {
  memberId: string;
  /** Número de conclusões atribuídas ao membro. */
  count: number;
  /** Soma dos pontos das conclusões. */
  weightedPoints: number;
  /** Fração 0..1 do total ponderado (0 quando não há conclusões). */
  share: number;
}

export interface BalanceResult {
  rows: BalanceRow[];
  totalCount: number;
  totalWeightedPoints: number;
}

/**
 * Agrega conclusões por membro. `memberIds` garante que todos os membros
 * apareçam (mesmo com zero). Ordenação determinística: mais pontos primeiro,
 * empate por memberId asc.
 */
export function computeBalance(
  completions: Completion[],
  memberIds: string[],
): BalanceResult {
  const weighted = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const id of memberIds) {
    weighted.set(id, 0);
    counts.set(id, 0);
  }

  for (const completion of completions) {
    const memberId = completion.completedBy;
    if (!memberId) continue;
    const points = Number.isFinite(completion.points) ? completion.points : 0;
    weighted.set(memberId, (weighted.get(memberId) ?? 0) + points);
    counts.set(memberId, (counts.get(memberId) ?? 0) + 1);
  }

  const totalWeightedPoints = [...weighted.values()].reduce((acc, v) => acc + v, 0);
  const totalCount = [...counts.values()].reduce((acc, v) => acc + v, 0);

  const rows: BalanceRow[] = [...weighted.entries()]
    .map(([memberId, weightedPoints]) => ({
      memberId,
      weightedPoints,
      count: counts.get(memberId) ?? 0,
      share: totalWeightedPoints > 0 ? weightedPoints / totalWeightedPoints : 0,
    }))
    .sort((a, b) => b.weightedPoints - a.weightedPoints || a.memberId.localeCompare(b.memberId));

  return { rows, totalCount, totalWeightedPoints };
}

/** Instante UTC de 30 dias atrás (janela padrão do painel). */
export function balanceWindowStart(now = new Date(), days = 30): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
