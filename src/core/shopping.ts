/**
 * Total de uma lista de compras — núcleo puro (sem I/O).
 *
 * Ao arquivar, o total reflete o que foi efetivamente comprado: soma de
 * `priceCents` dos itens marcados (checked). Se nenhum item foi marcado mas
 * há preços lançados, soma todos os itens com preço (fallback para listas
 * conferidas sem check).
 */

export interface PricedItem {
  priceCents?: number | null;
  qty?: number | null;
  checked?: boolean;
  // permite passar linhas do Appwrite (com colunas extras) sem cast
  [key: string]: unknown;
}

/** Soma em centavos dos itens comprados. Determinístico, sem I/O. */
export function shoppingTotalCents(items: PricedItem[]): number {
  const priced = items.filter((i) => typeof i.priceCents === 'number' && i.priceCents! >= 0);
  const anyChecked = priced.some((i) => i.checked);
  const relevant = anyChecked ? priced.filter((i) => i.checked) : priced;
  return relevant.reduce((acc, i) => acc + (i.priceCents ?? 0), 0);
}

/** Quantos itens têm preço lançado (para decidir se vale criar despesa). */
export function pricedItemCount(items: PricedItem[]): number {
  return items.filter((i) => typeof i.priceCents === 'number' && i.priceCents! >= 0).length;
}
