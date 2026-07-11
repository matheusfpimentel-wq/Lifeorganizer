import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdPermissions } from '@/lib/permissions';
import { computeBalance, balanceWindowStart } from '@/core/balance';
import { useAuth } from '@/features/auth/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OccurrenceRow = Record<string, any> & { $id: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskRow = Record<string, any> & { $id: string };

/** Modelos de tarefa. `includeInactive` para a tela de gerenciamento. */
export function useTasks(householdId: string | null, includeInactive = false) {
  return useQuery({
    queryKey: ['tasks', householdId, includeInactive],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<TaskRow>(TABLES.tasks, [
        Query.equal('householdId', householdId!),
        ...(includeInactive ? [] : [Query.equal('active', true)]),
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

export function useUpdateTask(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ taskId, data }: { taskId: string; data: Record<string, any> }) =>
      tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLES.tasks, rowId: taskId, data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', householdId] });
      void queryClient.invalidateQueries({ queryKey: ['occurrences', householdId] });
    },
  });
}

/** Excluir tarefa: remove também suas ocorrências (deleção em cascata). */
export function useDeleteTask(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const occurrences = await listAllRows<OccurrenceRow>(TABLES.taskOccurrences, [
        Query.equal('taskId', taskId),
      ]);
      for (const occurrence of occurrences) {
        await tablesDB.deleteRow({
          databaseId: DB_ID,
          tableId: TABLES.taskOccurrences,
          rowId: occurrence.$id,
        });
      }
      await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLES.tasks, rowId: taskId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', householdId] });
      void queryClient.invalidateQueries({ queryKey: ['occurrences', householdId] });
    },
  });
}

/**
 * Painel de equilíbrio: conclusões (status=done) dos últimos 30 dias,
 * ponderadas pelos `points` da tarefa. Apresentação neutra (ver core/balance).
 */
export function useBalancePanel(householdId: string | null, memberIds: string[]) {
  const tasks = useTasks(householdId, true);
  const query = useQuery({
    queryKey: ['taskBalance', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<OccurrenceRow>(TABLES.taskOccurrences, [
        Query.equal('householdId', householdId!),
        Query.equal('status', 'done'),
        Query.greaterThanEqual('completedAt', balanceWindowStart().toISOString()),
      ]),
  });

  const pointsByTask = new Map((tasks.data ?? []).map((t) => [t.$id, t.points ?? 1]));
  const balance = computeBalance(
    (query.data ?? []).map((o) => ({
      completedBy: o.completedBy,
      points: pointsByTask.get(o.taskId) ?? 1,
    })),
    memberIds,
  );
  return { ...balance, isLoading: query.isLoading || tasks.isLoading };
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['occurrences', householdId] });
      void queryClient.invalidateQueries({ queryKey: ['taskBalance', householdId] });
    },
  });
}
