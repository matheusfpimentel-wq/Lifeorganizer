import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdPermissions } from '@/lib/permissions';
import { useAuth } from '@/features/auth/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OccurrenceRow = Record<string, any> & { $id: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskRow = Record<string, any> & { $id: string };

export function useTasks(householdId: string | null) {
  return useQuery({
    queryKey: ['tasks', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<TaskRow>(TABLES.tasks, [
        Query.equal('householdId', householdId!),
        Query.equal('active', true),
      ]),
  });
}

/** Ocorrências pendentes (atrasadas + próximos 14 dias) + tarefas específicas. */
export function useOccurrences(householdId: string | null) {
  return useQuery({
    queryKey: ['occurrences', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const horizon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      return listAllRows<OccurrenceRow>(TABLES.taskOccurrences, [
        Query.equal('householdId', householdId!),
        Query.lessThanEqual('dueAt', horizon),
        Query.orderAsc('dueAt'),
      ]);
    },
  });
}

export function useCreateTask(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: Record<string, any>) => {
      if (!householdId) throw new Error('Nenhum lar ativo');
      const task = await tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.tasks,
        rowId: ID.unique(),
        data: { ...data, householdId, checklist: data.checklist ?? '[]' },
        permissions: withHouseholdPermissions(householdId),
      });
      // tarefa específica gera a ocorrência imediatamente (rotineiras: via tick)
      if (data.type === 'specific' && data.dueDate) {
        await tablesDB.createRow({
          databaseId: DB_ID,
          tableId: TABLES.taskOccurrences,
          rowId: ID.unique(),
          data: {
            householdId,
            taskId: task.$id,
            dueAt: data.dueDate,
            assignedMemberId: data.assignmentMode === 'fixed' ? data.assignedMemberId : null,
            status: 'pending',
          },
          permissions: withHouseholdPermissions(householdId),
        });
      }
      return task;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', householdId] });
      void queryClient.invalidateQueries({ queryKey: ['occurrences', householdId] });
    },
  });
}

export function useOccurrenceAction(householdId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      occurrenceId,
      action,
    }: {
      occurrenceId: string;
      action: 'done' | 'skipped' | 'claim';
    }) => {
      const data =
        action === 'claim'
          ? { assignedMemberId: user!.$id }
          : {
              status: action,
              completedBy: action === 'done' ? user!.$id : null,
              completedAt: action === 'done' ? new Date().toISOString() : null,
            };
      return tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.taskOccurrences,
        rowId: occurrenceId,
        data,
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['occurrences', householdId] }),
  });
}
