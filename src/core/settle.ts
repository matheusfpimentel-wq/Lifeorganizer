/**
 * Saldos e simplificação de dívidas — núcleo puro.
 *
 * Algoritmo guloso: maior devedor paga o maior credor até zerar um dos dois.
 * Garante <= n-1 transferências e determinismo (empates por memberId asc).
 * Não busca o mínimo teórico global de transferências (ver ADR-007).
 */

export interface ExpenseForBalance {
  paidBy: string;
  splits: { memberId: string; amountCents: number }[];
}

export interface SettlementForBalance {
  fromMember: string;
  toMember: string;
  amountCents: number;
}

export interface Transfer {
  fromMember: string;
  toMember: string;
  amountCents: number;
}

/**
 * Saldo líquido por membro em centavos.
 * Positivo = tem a receber (credor); negativo = deve (devedor). Soma sempre 0.
 */
export function computeBalances(
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[] = [],
): Map<string, number> {
  const balances = new Map<string, number>();
  const add = (memberId: string, delta: number) => {
    balances.set(memberId, (balances.get(memberId) ?? 0) + delta);
  };

  for (const expense of expenses) {
    for (const split of expense.splits) {
      add(split.memberId, -split.amountCents);
      add(expense.paidBy, split.amountCents);
    }
  }
  for (const s of settlements) {
    // quem pagou um acerto reduz sua dívida; quem recebeu reduz seu crédito
    add(s.fromMember, s.amountCents);
    add(s.toMember, -s.amountCents);
  }
  return balances;
}

/** Simplificação gulosa: retorna transferências que zeram todos os saldos. */
export function simplifyDebts(balances: Map<string, number>): Transfer[] {
  const total = [...balances.values()].reduce((acc, v) => acc + v, 0);
  if (total !== 0) throw new Error(`Saldos não somam zero (soma=${total})`);

  const creditors = [...balances.entries()]
    .filter(([, v]) => v > 0)
    .map(([memberId, amount]) => ({ memberId, amount }));
  const debtors = [...balances.entries()]
    .filter(([, v]) => v < 0)
    .map(([memberId, amount]) => ({ memberId, amount: -amount }));

  const byAmountDesc = (a: { memberId: string; amount: number }, b: typeof a) =>
    b.amount - a.amount || a.memberId.localeCompare(b.memberId);

  const transfers: Transfer[] = [];
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort(byAmountDesc);
    debtors.sort(byAmountDesc);
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.amount, debtor.amount);
    transfers.push({
      fromMember: debtor.memberId,
      toMember: creditor.memberId,
      amountCents: amount,
    });
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }
  return transfers;
}

/** Aplica transferências a um mapa de saldos (para testes de propriedade). */
export function applyTransfers(
  balances: Map<string, number>,
  transfers: Transfer[],
): Map<string, number> {
  const result = new Map(balances);
  for (const t of transfers) {
    result.set(t.fromMember, (result.get(t.fromMember) ?? 0) + t.amountCents);
    result.set(t.toMember, (result.get(t.toMember) ?? 0) - t.amountCents);
  }
  return result;
}
