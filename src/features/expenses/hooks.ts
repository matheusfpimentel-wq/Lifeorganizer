import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdPermissions } from '@/lib/permissions';
import { computeSplits, type SplitSpec } from '@/core/split';
import { computeBalances, simplifyDebts } from '@/core/settle';
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
