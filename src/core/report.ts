/**
 * Fechamento mensal e serialização CSV — núcleo puro (sem I/O).
 *
 * Agregações no cliente (ADR-004). Trabalha em centavos; a filtragem por
 * intervalo também é feita aqui por segurança (mesmo que a query já filtre).
 */

export interface ExpenseForReport {
  amountCents: number;
  category: string;
  paidBy: string;
  date: string; // ISO
  splits: { memberId: string; amountCents: number }[];
}

export interface CategoryTotal {
  category: string;
  totalCents: number;
}
export interface MemberTotal {
  memberId: string;
  totalCents: number;
}

export interface MonthlySummary {
  totalCents: number;
  count: number;
  /** Total por categoria (desc por valor, empate por nome). */
  byCategory: CategoryTotal[];
  /** Quanto cada membro pagou (desc). */
  byPayer: MemberTotal[];
  /** Quanto cada membro consumiu (soma dos splits atribuídos, desc). */
  byConsumer: MemberTotal[];
}

function inRange(iso: string, startMs: number, endMs: number): boolean {
  const t = new Date(iso).getTime();
  return t >= startMs && t <= endMs;
}

function sortedTotals<T extends { totalCents: number }>(
  map: Map<string, number>,
  key: 'category' | 'memberId',
): T[] {
  return [...map.entries()]
    .map(([id, totalCents]) => ({ [key]: id, totalCents }) as unknown as T)
    .sort((a, b) => b.totalCents - a.totalCents || String((a as never)[key]).localeCompare(String((b as never)[key])));
}

/** Resumo de despesas dentro de [startIso, endIso] (inclusivo). */
export function summarizeMonth(
  expenses: ExpenseForReport[],
  startIso: string,
  endIso: string,
): MonthlySummary {
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  const inMonth = expenses.filter((e) => inRange(e.date, startMs, endMs));

  const byCategory = new Map<string, number>();
  const byPayer = new Map<string, number>();
  const byConsumer = new Map<string, number>();
  let totalCents = 0;

  for (const expense of inMonth) {
    totalCents += expense.amountCents;
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amountCents);
    byPayer.set(expense.paidBy, (byPayer.get(expense.paidBy) ?? 0) + expense.amountCents);
    for (const split of expense.splits) {
      byConsumer.set(split.memberId, (byConsumer.get(split.memberId) ?? 0) + split.amountCents);
    }
  }

  return {
    totalCents,
    count: inMonth.length,
    byCategory: sortedTotals<CategoryTotal>(byCategory, 'category'),
    byPayer: sortedTotals<MemberTotal>(byPayer, 'memberId'),
    byConsumer: sortedTotals<MemberTotal>(byConsumer, 'memberId'),
  };
}

/** Variação percentual (inteiro) do mês vs. anterior; null se base 0. */
export function monthOverMonthPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Escapa um campo CSV (RFC 4180): aspas se contiver vírgula/aspas/quebra. */
export function csvField(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serializa linhas em CSV (CRLF, RFC 4180). */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvField).join(','));
  return lines.join('\r\n');
}
