/**
 * Reposição preditiva de itens recorrentes — núcleo puro (sem I/O).
 *
 * O intervalo real de recompra é a MEDIANA dos intervalos entre compras
 * (robusta a uma compra atrasada/adiantada). Com menos de 2 compras não há
 * como inferir ciclo: não sugerimos (defaults errados são piores que nada).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Mediana dos intervalos (em dias) entre datas de compra. null se < 2 datas. */
export function medianIntervalDays(purchaseDatesUtc: Date[]): number | null {
  if (purchaseDatesUtc.length < 2) return null;
  const sorted = [...purchaseDatesUtc].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / DAY_MS);
  }
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  const median = gaps.length % 2 === 1 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
  return Math.max(1, Math.round(median));
}

/** O ciclo venceu? (última compra + intervalo <= agora) */
export function stapleDue(lastPurchaseUtc: Date, intervalDays: number, nowUtc: Date): boolean {
  return nowUtc.getTime() - lastPurchaseUtc.getTime() >= intervalDays * DAY_MS;
}
