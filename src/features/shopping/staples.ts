import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdPermissions } from '@/lib/permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StapleRow = Record<string, any> & { $id: string };

export function useStaples(householdId: string | null) {
  return useQuery({
    queryKey: ['staples', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<StapleRow>(TABLES.staples, [
        Query.equal('householdId', householdId!),
        Query.orderAsc('name'),
      ]),
  });
}

export function useAddStaple(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; defaultQty: number; unit?: string; category: string }) => {
      if (!householdId) throw new Error('Nenhum lar ativo');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.staples,
        rowId: ID.unique(),
        data: { ...input, householdId },
        permissions: withHouseholdPermissions(householdId),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['staples', householdId] }),
  });
}

export function useRemoveStaple(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stapleId: string) =>
      tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLES.staples, rowId: stapleId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['staples', householdId] }),
  });
}
