/**
 * Hooks do Treino guiado: estado do programa (semana/fase/próximo treino/
 * progressão a partir do histórico) e orquestração da sessão ao vivo, que grava
 * offline-first (store local + fila de sync) e reaproveita as tabelas da Academia.
 */
import { useMemo } from 'react';
import { ID, Query } from 'appwrite';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdReadOwnerWrite } from '@/lib/permissions';
import {
  expandWorkout,
  nextWorkoutKey,
  phaseForWeek,
  suggestLoad,
  weekNumber,
  type PastSet,
  type Phase,
  type Workout,
  type WorkoutStep,
} from '@/core/program';
import { PROGRAM, PROGRAM_EXERCISES, WORKOUTS_BY_KEY } from './program';
import { useSessions, useSessionSets, type SessionRow, type SetRow } from './hooks';
import { useTrainingStore, type LoggedSet } from '@/stores/training';
import { enqueue } from './syncQueue';

/** Sessões guiadas do membro (templateKey preenchido), mais recentes primeiro. */
export function useGuidedSessions(householdId: string | null, memberId: string | null) {
  const sessions = useSessions(householdId, memberId);
  const guided = useMemo(
    () => (sessions.data ?? []).filter((s) => s.templateKey),
    [sessions.data],
  );
  return { ...sessions, guided };
}

export interface ProgramState {
  week: number;
  phase: Phase;
  nextKey: string;
  nextWorkout: Workout | undefined;
  isLoading: boolean;
  /** séries do exercício na sessão guiada mais recente que o contém. */
  lastSetsFor: (exerciseKey: string) => PastSet[];
}

export function useProgramState(householdId: string | null, memberId: string | null): ProgramState {
  const { guided, isLoading } = useGuidedSessions(householdId, memberId);
  const allSets = useSessionSets(householdId, memberId);

  return useMemo(() => {
    // âncora do programa = primeira sessão guiada (sincronizada entre dispositivos)
    const sorted = [...guided].sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
    const anchor = sorted[0]?.startedAt ?? new Date().toISOString();
    const week = weekNumber(anchor, new Date().toISOString(), PROGRAM.weeks);
    const phase = phaseForWeek(PROGRAM, week);
    const lastDone = [...guided].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))[0];
    const nextKey = nextWorkoutKey(PROGRAM.rotation, lastDone?.templateKey ?? null);

    const setsBySession = new Map<string, SetRow[]>();
    for (const s of allSets.data ?? []) {
      if (!setsBySession.has(s.sessionId)) setsBySession.set(s.sessionId, []);
      setsBySession.get(s.sessionId)!.push(s);
    }
    const sessionsNewestFirst = [...guided].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));

    const lastSetsFor = (exerciseKey: string): PastSet[] => {
      for (const session of sessionsNewestFirst) {
        const sets = (setsBySession.get(session.$id) ?? []).filter((s) => s.templateExKey === exerciseKey);
        if (sets.length > 0) {
          return sets
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((s) => ({ reps: s.reps, loadKg: s.loadKg }));
        }
      }
      return [];
    };

    return {
      week,
      phase,
      nextKey,
      nextWorkout: WORKOUTS_BY_KEY.get(nextKey),
      isLoading: isLoading || allSets.isLoading,
      lastSetsFor,
    };
  }, [guided, allSets.data, allSets.isLoading, isLoading]);
}

/** Carga sugerida (dupla progressão) para um exercício do programa. */
export function useLoadSuggestion() {
  const settings = useTrainingStore((s) => s.settings);
  return (exerciseKey: string, repMax: number, lastSets: PastSet[]) => {
    const ex = PROGRAM_EXERCISES.get(exerciseKey);
    const inc = ex?.isCompound ? settings.incrementCompound : settings.incrementIsolation;
    return suggestLoad(lastSets, repMax, inc);
  };
}

/** Passos do treino ativo (recalculados do programa estático — nada sincronizado). */
export function useActiveSteps(): { steps: WorkoutStep[]; workout: Workout | undefined } {
  const active = useTrainingStore((s) => s.active);
  return useMemo(() => {
    if (!active) return { steps: [], workout: undefined };
    const workout = WORKOUTS_BY_KEY.get(active.templateKey);
    if (!workout) return { steps: [], workout: undefined };
    const phase = phaseForWeek(PROGRAM, active.week);
    return { steps: expandWorkout(phase, workout, active.deload), workout };
  }, [active]);
}

/** Ações da sessão ao vivo: iniciar, registrar série, finalizar — com sync offline. */
export function useLiveSession(householdId: string | null) {
  const store = useTrainingStore();
  const queryClient = useQueryClient();

  function start(memberId: string, templateKey: string, week: number, phaseName: string, deload: boolean) {
    if (!householdId) return;
    const sessionId = ID.unique();
    const startedAt = new Date().toISOString();
    store.start({ sessionId, memberId, templateKey, week, phaseName, deload, startedAt });
    enqueue({
      key: `session-create-${sessionId}`,
      table: TABLES.workoutSessions,
      rowId: sessionId,
      op: 'create',
      data: { householdId, memberId, startedAt, templateKey, weekNumber: week, phaseName, deload, planDayId: null },
      permissions: withHouseholdReadOwnerWrite(householdId, memberId),
    });
  }

  function logSet(input: Omit<LoggedSet, 'at'>) {
    const active = store.active;
    if (!active || !householdId) return;
    const at = new Date().toISOString();
    store.logSet({ ...input, at });
    const setId = ID.unique();
    enqueue({
      key: `set-create-${setId}`,
      table: TABLES.workoutSessionSets,
      rowId: setId,
      op: 'create',
      data: {
        householdId,
        sessionId: active.sessionId,
        exerciseId: input.exerciseKey,
        templateExKey: input.exerciseKey,
        setNumber: input.setNumber,
        reps: input.reps,
        loadKg: input.weight,
        rir: input.rir ?? undefined,
      },
      permissions: withHouseholdReadOwnerWrite(householdId, active.memberId),
    });
  }

  function finish() {
    const active = store.active;
    if (active && householdId) {
      const tonnage = active.logs.reduce((acc, l) => acc + l.reps * l.weight, 0);
      enqueue({
        key: `session-finish-${active.sessionId}`,
        table: TABLES.workoutSessions,
        rowId: active.sessionId,
        op: 'update',
        data: { finishedAt: new Date().toISOString(), totalTonnageKg: Math.round(tonnage * 100) / 100 },
      });
      void queryClient.invalidateQueries({ queryKey: ['sessions', householdId] });
      void queryClient.invalidateQueries({ queryKey: ['sessionSets', householdId] });
    }
    store.finish();
  }

  return { start, logSet, finish, goTo: store.goTo, cancel: store.cancel };
}

export function guidedSessionSets(session: SessionRow, allSets: SetRow[]): SetRow[] {
  return allSets.filter((s) => s.sessionId === session.$id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BodyweightRow = Record<string, any> & { $id: string };

/** Registros de peso corporal do membro, mais antigos primeiro. */
export function useBodyweight(householdId: string | null, memberId: string | null) {
  return useQuery({
    queryKey: ['bodyweight', householdId, memberId],
    enabled: !!householdId && !!memberId,
    queryFn: async () => {
      const rows = await listAllRows<BodyweightRow>(TABLES.bodyweightLogs, [
        Query.equal('householdId', householdId!),
        Query.equal('memberId', memberId!),
      ]);
      return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    },
  });
}

export function useDeleteBodyweight(householdId: string | null, memberId: string | null) {
  const queryClient = useQueryClient();
  return async (id: string) => {
    await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLES.bodyweightLogs, rowId: id });
    void queryClient.invalidateQueries({ queryKey: ['bodyweight', householdId, memberId] });
  };
}

/** Registra peso corporal (offline-first via fila). */
export function useAddBodyweight(householdId: string | null, memberId: string | null) {
  const queryClient = useQueryClient();
  return (weightKg: number) => {
    if (!householdId || !memberId) return;
    const id = ID.unique();
    enqueue({
      key: `bw-${id}`,
      table: TABLES.bodyweightLogs,
      rowId: id,
      op: 'create',
      data: { householdId, memberId, date: new Date().toISOString(), weightKg },
      permissions: withHouseholdReadOwnerWrite(householdId, memberId),
    });
    void queryClient.invalidateQueries({ queryKey: ['bodyweight', householdId, memberId] });
  };
}
