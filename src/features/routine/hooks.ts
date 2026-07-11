import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdPermissions } from '@/lib/permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RoutineRow = Record<string, any> & { $id: string };

export function useRoutineBlocks(householdId: string | null) {
  return useQuery({
    queryKey: ['routineBlocks', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<RoutineRow>(TABLES.routineBlocks, [
        Query.equal('householdId', householdId!),
        Query.equal('active', true),
      ]),
  });
}

export interface RoutineInputData {
  memberId?: string | null;
  title: string;
  category: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  color?: string | null;
  notes?: string | null;
}

export function useCreateRoutineBlock(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RoutineInputData) => {
      if (!householdId) throw new Error('Nenhum lar ativo');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.routineBlocks,
        rowId: ID.unique(),
        data: { ...input, householdId, active: true },
        permissions: withHouseholdPermissions(householdId),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['routineBlocks', householdId] }),
  });
}

export function useDeleteRoutineBlock(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) =>
      tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLES.routineBlocks, rowId: blockId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['routineBlocks', householdId] }),
  });
}
