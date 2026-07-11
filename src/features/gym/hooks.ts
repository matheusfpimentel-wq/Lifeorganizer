import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdReadOwnerWrite } from '@/lib/permissions';
import { CATALOG, CATALOG_BY_ID, type CatalogExercise } from './catalog';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any> & { $id: string };
export type PlanRow = Row;
export type PlanDayRow = Row;
export type PlanExerciseRow = Row;
export type SessionRow = Row;
export type SetRow = Row;

/** Biblioteca = catálogo embutido + exercícios personalizados do lar. */
export function useExerciseLibrary(householdId: string | null) {
  const custom = useQuery({
    queryKey: ['exercises', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<Row>(TABLES.exercises, [Query.equal('householdId', householdId!)]),
  });
  const library: CatalogExercise[] = [
    ...CATALOG,
    ...(custom.data ?? []).map((e) => ({
      id: e.$id,
      name: e.name,
      muscleGroup: e.muscleGroup,
      equipment: e.equipment,
    })),
  ];
  const byId = (id: string): CatalogExercise | undefined =>
    CATALOG_BY_ID.get(id) ?? library.find((e) => e.id === id);
  return { library, byId, isLoading: custom.isLoading };
}

// --- Planos -----------------------------------------------------------------
export function useWorkoutPlans(householdId: string | null, memberId: string | null) {
  return useQuery({
    queryKey: ['workoutPlans', householdId, memberId],
    enabled: !!householdId && !!memberId,
    queryFn: () =>
      listAllRows<PlanRow>(TABLES.workoutPlans, [
        Query.equal('householdId', householdId!),
        Query.equal('memberId', memberId!),
      ]),
  });
}

export function usePlanDays(planId: string | null) {
  return useQuery({
    queryKey: ['planDays', planId],
    enabled: !!planId,
    queryFn: () =>
      listAllRows<PlanDayRow>(TABLES.workoutPlanDays, [
        Query.equal('planId', planId!),
        Query.orderAsc('order'),
      ]),
  });
}

export function usePlanExercises(planDayId: string | null) {
  return useQuery({
    queryKey: ['planExercises', planDayId],
    enabled: !!planDayId,
    queryFn: () =>
      listAllRows<PlanExerciseRow>(TABLES.workoutPlanExercises, [
        Query.equal('planDayId', planDayId!),
        Query.orderAsc('order'),
      ]),
  });
}

export function useCreatePlan(householdId: string | null, memberId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; goal?: string | null }) => {
      if (!householdId || !memberId) throw new Error('Sem lar/membro');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.workoutPlans,
        rowId: ID.unique(),
        data: { householdId, memberId, name: input.name, goal: input.goal ?? null, active: true },
        permissions: withHouseholdReadOwnerWrite(householdId, memberId),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['workoutPlans', householdId] }),
  });
}

export function useAddPlanDay(householdId: string | null, memberId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { planId: string; label: string; order: number }) => {
      if (!householdId || !memberId) throw new Error('Sem lar/membro');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.workoutPlanDays,
        rowId: ID.unique(),
        data: { householdId, planId: input.planId, label: input.label, order: input.order },
        permissions: withHouseholdReadOwnerWrite(householdId, memberId),
      });
    },
    onSuccess: (_r, v) => void queryClient.invalidateQueries({ queryKey: ['planDays', v.planId] }),
  });
}

export function useAddPlanExercise(householdId: string | null, memberId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      planDayId: string;
      exerciseId: string;
      sets: number;
      repRange: string;
      restSeconds: number;
      order: number;
    }) => {
      if (!householdId || !memberId) throw new Error('Sem lar/membro');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.workoutPlanExercises,
        rowId: ID.unique(),
        data: { householdId, ...input },
        permissions: withHouseholdReadOwnerWrite(householdId, memberId),
      });
    },
    onSuccess: (_r, v) => void queryClient.invalidateQueries({ queryKey: ['planExercises', v.planDayId] }),
  });
}

// --- Sessões ----------------------------------------------------------------
export function useSessions(householdId: string | null, memberId: string | null) {
  return useQuery({
    queryKey: ['sessions', householdId, memberId],
    enabled: !!householdId && !!memberId,
    queryFn: () =>
      listAllRows<SessionRow>(TABLES.workoutSessions, [
        Query.equal('householdId', householdId!),
        Query.equal('memberId', memberId!),
        Query.orderDesc('startedAt'),
      ]),
  });
}

export function useSessionSets(householdId: string | null, memberId: string | null) {
  return useQuery({
    queryKey: ['sessionSets', householdId, memberId],
    enabled: !!householdId && !!memberId,
    queryFn: () =>
      listAllRows<SetRow>(TABLES.workoutSessionSets, [Query.equal('householdId', householdId!)]),
  });
}

export function useStartSession(householdId: string | null, memberId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { planDayId?: string | null }) => {
      if (!householdId || !memberId) throw new Error('Sem lar/membro');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.workoutSessions,
        rowId: ID.unique(),
        data: {
          householdId,
          memberId,
          planDayId: input.planDayId ?? null,
          startedAt: new Date().toISOString(),
        },
        permissions: withHouseholdReadOwnerWrite(householdId, memberId),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sessions', householdId] }),
  });
}

export function useLogSet(householdId: string | null, memberId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sessionId: string;
      exerciseId: string;
      setNumber: number;
      reps: number;
      loadKg: number;
      rpe?: number | null;
    }) => {
      if (!householdId || !memberId) throw new Error('Sem lar/membro');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.workoutSessionSets,
        rowId: ID.unique(),
        data: { householdId, ...input },
        permissions: withHouseholdReadOwnerWrite(householdId, memberId),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sessionSets', householdId] }),
  });
}

export function useFinishSession(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) =>
      tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.workoutSessions,
        rowId: sessionId,
        data: { finishedAt: new Date().toISOString() },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sessions', householdId] }),
  });
}
