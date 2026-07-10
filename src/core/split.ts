/**
 * Rateio de despesas — núcleo puro (sem I/O).
 *
 * Invariante única: a soma dos splits é SEMPRE igual ao total.
 * - equal: base floor(total/n) + centavos restantes distribuídos em ordem
 *   estável por memberId (asc).
 * - percent/shares: método dos maiores restos; empate desempatado por
 *   memberId (asc) para determinismo.
 * - exact: soma validada — erro se diferente do total.
 */

export interface SplitResult {
  memberId: string;
  amountCents: number;
}

export type SplitSpec =
  | { type: 'equal'; memberIds: string[] }
  | { type: 'percent'; parts: { memberId: string; percentBp: number }[] }
  | { type: 'shares'; parts: { memberId: string; shares: number }[] }
  | { type: 'exact'; parts: { memberId: string; amountCents: number }[] };

function assertPositiveIntTotal(totalCents: number): void {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    throw new Error(`Total inválido: ${totalCents} (esperado inteiro > 0)`);
  }
}

function assertUniqueMembers(ids: string[]): void {
  if (ids.length === 0) throw new Error('Rateio requer ao menos 1 membro');
  if (new Set(ids).size !== ids.length) throw new Error('memberId duplicado no rateio');
}

/** Maiores restos: distribui `totalCents` proporcional a `weights` (>= 0, soma > 0). */
function largestRemainder(
  totalCents: number,
  parts: { memberId: string; weight: number }[],
): SplitResult[] {
  const totalWeight = parts.reduce((acc, p) => acc + p.weight, 0);
  if (totalWeight <= 0) throw new Error('Soma dos pesos deve ser > 0');

  const exact = parts.map((p) => ({
    memberId: p.memberId,
    exact: (totalCents * p.weight) / totalWeight,
  }));
  const floored = exact.map((e) => ({
    memberId: e.memberId,
    amountCents: Math.floor(e.exact),
    remainder: e.exact - Math.floor(e.exact),
  }));
  let leftover = totalCents - floored.reduce((acc, f) => acc + f.amountCents, 0);

  // maiores restos primeiro; empate -> memberId asc (determinismo)
  const order = [...floored].sort(
    (a, b) => b.remainder - a.remainder || a.memberId.localeCompare(b.memberId),
  );
  for (const entry of order) {
    if (leftover <= 0) break;
    entry.amountCents += 1;
    leftover -= 1;
  }
  // preserva a ordem de entrada
  const byId = new Map(order.map((e) => [e.memberId, e.amountCents]));
  return parts.map((p) => ({ memberId: p.memberId, amountCents: byId.get(p.memberId)! }));
}

export function computeSplits(totalCents: number, spec: SplitSpec): SplitResult[] {
  assertPositiveIntTotal(totalCents);

  switch (spec.type) {
    case 'equal': {
      assertUniqueMembers(spec.memberIds);
      const sorted = [...spec.memberIds].sort((a, b) => a.localeCompare(b));
      const n = sorted.length;
      const base = Math.floor(totalCents / n);
      const remainder = totalCents - base * n;
      return sorted.map((memberId, i) => ({
        memberId,
        amountCents: base + (i < remainder ? 1 : 0),
      }));
    }
    case 'percent': {
      assertUniqueMembers(spec.parts.map((p) => p.memberId));
      const sumBp = spec.parts.reduce((acc, p) => acc + p.percentBp, 0);
      if (sumBp !== 10_000) {
        throw new Error(`Percentuais devem somar 100% (10000 bp); recebido ${sumBp}`);
      }
      if (spec.parts.some((p) => !Number.isInteger(p.percentBp) || p.percentBp < 0)) {
        throw new Error('percentBp deve ser inteiro >= 0');
      }
      return largestRemainder(
        totalCents,
        spec.parts.map((p) => ({ memberId: p.memberId, weight: p.percentBp })),
      );
    }
    case 'shares': {
      assertUniqueMembers(spec.parts.map((p) => p.memberId));
      if (spec.parts.some((p) => !Number.isInteger(p.shares) || p.shares < 0)) {
        throw new Error('shares deve ser inteiro >= 0');
      }
      return largestRemainder(
        totalCents,
        spec.parts.map((p) => ({ memberId: p.memberId, weight: p.shares })),
      );
    }
    case 'exact': {
      assertUniqueMembers(spec.parts.map((p) => p.memberId));
      if (spec.parts.some((p) => !Number.isInteger(p.amountCents) || p.amountCents < 0)) {
        throw new Error('amountCents deve ser inteiro >= 0');
      }
      const sum = spec.parts.reduce((acc, p) => acc + p.amountCents, 0);
      if (sum !== totalCents) {
        throw new Error(`Soma dos valores (${sum}) difere do total (${totalCents})`);
      }
      return spec.parts.map((p) => ({ memberId: p.memberId, amountCents: p.amountCents }));
    }
  }
}

/** Guarda de integridade reutilizada pelo Zod e pelas functions. */
export function splitsMatchTotal(totalCents: number, splits: SplitResult[]): boolean {
  return splits.reduce((acc, s) => acc + s.amountCents, 0) === totalCents;
}
