import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdPermissions } from '@/lib/permissions';
import { computeSplits, type SplitSpec } from '@/core/split';
import { computeBalances, simplifyDebts } from '@/core/settle';
import { monthOverMonthPercent, summarizeMonth, type ExpenseForReport } from '@/core/report';
import { expenseSchema } from '@/shared/schemas';
import { useAuth } from '@/features/auth/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExpenseRow = Record<string, any> & { $id: string };

export function useExpenses(householdId: string | null) {
  return useQuery({
    queryKey: ['expenses', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<ExpenseRow>(TABLES.expenses, [
        Query.equal('householdId', householdId!),
        Query.orderDesc('date'),
      ]),
  });
}

export function useSettlements(householdId: string | null) {
  return useQuery({
    queryKey: ['settlements', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<ExpenseRow>(TABLES.settlements, [Query.equal('householdId', householdId!)]),
  });
}

/** Saldos + sugestão de acerto (algoritmo guloso, ADR-007). */
export function useBalances(householdId: string | null) {
  const expenses = useExpenses(householdId);
  const settlements = useSettlements(householdId);

  if (!expenses.data || !settlements.data) {
    return { isLoading: true, balances: new Map<string, number>(), transfers: [] as ReturnType<typeof simplifyDebts> };
  }
  const balances = computeBalances(
    expenses.data
      .filter((e) => e.status !== 'pending')
      .map((e) => ({ paidBy: e.paidBy, splits: JSON.parse(e.splits) })),
    settlements.data.map((s) => ({
      fromMember: s.fromMember,
      toMember: s.toMember,
      amountCents: s.amountCents,
    })),
  );
  return { isLoading: false, balances, transfers: simplifyDebts(balances) };
}

export function useCreateExpense(householdId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      description: string;
      amountCents: number;
      category: string;
      paidBy: string;
      date: string;
      splitSpec: SplitSpec;
      rrule?: string | null;
    }) => {
      if (!householdId || !user) throw new Error('Nenhum lar ativo');
      const splits = computeSplits(input.amountCents, input.splitSpec);
      const data = expenseSchema.parse({
        householdId,
        description: input.description,
        amountCents: input.amountCents,
        category: input.category,
        paidBy: input.paidBy,
        date: input.date,
        splitType: input.splitSpec.type,
        splits,
        rrule: input.rrule ?? null,
        createdBy: user.$id,
      });
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.expenses,
        rowId: ID.unique(),
        data: { ...data, splits: JSON.stringify(splits) },
        permissions: withHouseholdPermissions(householdId),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['expenses', householdId] }),
  });
}

/** Despesas pendentes de confirmação (geradas por `tick` a partir de rrule). */
export function usePendingExpenses(householdId: string | null) {
  const all = useExpenses(householdId);
  return { ...all, data: (all.data ?? []).filter((e) => e.status === 'pending') };
}

export function useConfirmExpense(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expenseId: string) =>
      tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.expenses,
        rowId: expenseId,
        data: { status: 'confirmed' },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['expenses', householdId] }),
  });
}

export function useUpdateExpense(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      expenseId,
      input,
    }: {
      expenseId: string;
      input: {
        description: string;
        amountCents: number;
        category: string;
        paidBy: string;
        date: string;
        splitSpec: SplitSpec;
        rrule?: string | null;
      };
    }) => {
      const splits = computeSplits(input.amountCents, input.splitSpec);
      return tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.expenses,
        rowId: expenseId,
        data: {
          description: input.description,
          amountCents: input.amountCents,
          category: input.category,
          paidBy: input.paidBy,
          date: input.date,
          splitType: input.splitSpec.type,
          splits: JSON.stringify(splits),
          rrule: input.rrule ?? null,
        },
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['expenses', householdId] }),
  });
}

export function useDeleteExpense(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expenseId: string) =>
      tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLES.expenses, rowId: expenseId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['expenses', householdId] }),
  });
}

// --- Fundo do casal ----------------------------------------------------------
export function useFundContributions(householdId: string | null) {
  return useQuery({
    queryKey: ['fundContributions', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<ExpenseRow>(TABLES.fundContributions, [
        Query.equal('householdId', householdId!),
        Query.orderDesc('date'),
      ]),
  });
}

export function useAddFundContribution(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { memberId: string; amountCents: number; date: string; note?: string | null }) => {
      if (!householdId) throw new Error('Nenhum lar ativo');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.fundContributions,
        rowId: ID.unique(),
        data: { ...input, note: input.note ?? null, householdId },
        permissions: withHouseholdPermissions(householdId),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fundContributions', householdId] }),
  });
}

export function useUpdateFundContribution(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contributionId,
      data,
    }: {
      contributionId: string;
      data: { memberId?: string; amountCents?: number; date?: string; note?: string | null };
    }) =>
      tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLES.fundContributions, rowId: contributionId, data }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fundContributions', householdId] }),
  });
}

export function useDeleteFundContribution(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contributionId: string) =>
      tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLES.fundContributions, rowId: contributionId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fundContributions', householdId] }),
  });
}

/**
 * Fechamento mensal: resumo do mês selecionado + comparativo com o anterior.
 * Agrega no cliente as despesas confirmadas (ADR-004). `monthOffset` 0 = mês
 * atual, -1 = anterior, etc. Datas em America/Sao_Paulo (UTC-3 fixo).
 */
export function useMonthlyReport(householdId: string | null, monthOffset = 0) {
  const expenses = useExpenses(householdId);

  const confirmed: ExpenseForReport[] = (expenses.data ?? [])
    .filter((e) => e.status !== 'pending')
    .map((e) => ({
      amountCents: e.amountCents,
      category: e.category,
      paidBy: e.paidBy,
      date: e.date,
      splits: JSON.parse(e.splits),
    }));

  // limites do mês em BRT (UTC-3): 1º dia 00:00 BRT == 03:00 UTC
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1, 3, 0, 0));
  const monthStart = base.toISOString();
  const monthEnd = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1, 3, 0, 0) - 1,
  ).toISOString();
  const prevStart = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1, 3, 0, 0),
  ).toISOString();

  const summary = summarizeMonth(confirmed, monthStart, monthEnd);
  const prevSummary = summarizeMonth(confirmed, prevStart, monthStart);
  const deltaPercent = monthOverMonthPercent(summary.totalCents, prevSummary.totalCents);

  return {
    isLoading: expenses.isLoading,
    summary,
    prevTotalCents: prevSummary.totalCents,
    deltaPercent,
    monthStart,
    monthEnd,
    monthLabel: new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      month: 'long',
      year: 'numeric',
    }).format(base),
  };
}

export function useCreateSettlement(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      fromMember: string;
      toMember: string;
      amountCents: number;
      method: 'pix' | 'dinheiro' | 'outro';
    }) => {
      if (!householdId) throw new Error('Nenhum lar ativo');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.settlements,
        rowId: ID.unique(),
        data: { ...input, householdId, settledAt: new Date().toISOString() },
        permissions: withHouseholdPermissions(householdId),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settlements', householdId] });
    },
  });
}
