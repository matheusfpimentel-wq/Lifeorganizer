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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: Record<string, any>) => {
      if (!householdId) throw new Error('Nenhum lar ativo');
      const task = await tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.tasks,
        rowId: ID.unique(),
        data: { ...data, householdId, checklist: data.checklist ?? '[]', createdBy: user?.$id ?? null },
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
    mutationFn: async ({ taskId, data }: { taskId: string; data: Record<string, any> }) => {
      const task = await tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLES.tasks, rowId: taskId, data });
      // tarefa avulsa: mantém a ocorrência pendente em sincronia com a data
      // (inclusive quando uma tarefa sem data ganha data depois)
      if (householdId && data.type === 'specific' && data.dueDate) {
        const pending = await listAllRows<OccurrenceRow>(TABLES.taskOccurrences, [
          Query.equal('taskId', taskId),
          Query.equal('status', 'pending'),
        ]);
        if (pending.length === 0) {
          await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: TABLES.taskOccurrences,
            rowId: ID.unique(),
            data: {
              householdId,
              taskId,
              dueAt: data.dueDate,
              assignedMemberId: data.assignmentMode === 'fixed' ? data.assignedMemberId : null,
              status: 'pending',
            },
            permissions: withHouseholdPermissions(householdId),
          });
        } else if (pending[0].dueAt !== data.dueDate) {
          await tablesDB.updateRow({
            databaseId: DB_ID,
            tableId: TABLES.taskOccurrences,
            rowId: pending[0].$id,
            data: { dueAt: data.dueDate },
          });
        }
      }
      return task;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', householdId] });
      void queryClient.invalidateQueries({ queryKey: ['occurrences', householdId] });
    },
  });
}

/**
 * Conclui uma tarefa avulsa sem data: registra uma ocorrência já concluída
 * (conta pontos no equilíbrio) e desativa o modelo para sair das pendências.
 */
export function useCompleteDatelessTask(householdId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!householdId) throw new Error('Nenhum lar ativo');
      const now = new Date().toISOString();
      await tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.taskOccurrences,
        rowId: ID.unique(),
        data: {
          householdId,
          taskId,
          dueAt: now,
          status: 'done',
          completedBy: user!.$id,
          completedAt: now,
        },
        permissions: withHouseholdPermissions(householdId),
      });
      await tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.tasks,
        rowId: taskId,
        data: { active: false },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', householdId] });
      void queryClient.invalidateQueries({ queryKey: ['occurrences', householdId] });
      void queryClient.invalidateQueries({ queryKey: ['taskBalance', householdId] });
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

/**
 * Carga mental (30 dias): atos de PLANEJAMENTO por pessoa — modelos de tarefa
 * criados, eventos agendados e despesas lançadas. Torna visível o trabalho
 * invisível de organizar a casa (não só executar).
 */
export function usePlanningPanel(householdId: string | null, memberIds: string[]) {
  const query = useQuery({
    queryKey: ['planningPanel', householdId],
    enabled: !!householdId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const since = balanceWindowStart().toISOString();
      const [tasks, events, expenses] = await Promise.all([
        listAllRows<TaskRow>(TABLES.tasks, [
          Query.equal('householdId', householdId!),
          Query.greaterThanEqual('$createdAt', since),
        ]),
        listAllRows<TaskRow>(TABLES.events, [
          Query.equal('householdId', householdId!),
          Query.greaterThanEqual('$createdAt', since),
        ]),
        listAllRows<TaskRow>(TABLES.expenses, [
          Query.equal('householdId', householdId!),
          Query.greaterThanEqual('$createdAt', since),
        ]),
      ]);
      return [...tasks, ...events, ...expenses]
        .map((row) => row.createdBy as string | null)
        .filter(Boolean) as string[];
    },
  });

  const counts = new Map<string, number>(memberIds.map((id) => [id, 0]));
  for (const creator of query.data ?? []) {
    if (counts.has(creator)) counts.set(creator, (counts.get(creator) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const rows = memberIds.map((memberId) => ({
    memberId,
    count: counts.get(memberId) ?? 0,
    share: total > 0 ? (counts.get(memberId) ?? 0) / total : 0,
  }));
  return { rows, total, isLoading: query.isLoading };
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
