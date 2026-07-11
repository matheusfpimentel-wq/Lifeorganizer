import { useQuery } from '@tanstack/react-query';
import { Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';

/**
 * Progresso da vila: quanto mais o lar usa o app (tarefas concluídas,
 * treinos, contas movimentadas, eventos), mais as construções evoluem.
 * Meta COOPERATIVA: os níveis são do lar, nunca de uma pessoa só.
 */
export interface VillageProgress {
  house: number; // tarefas concluídas
  gym: number; // sessões de treino
  bank: number; // despesas lançadas + acertos pagos
  park: number; // eventos criados
  nature: number; // soma dos outros: floresta e bichinhos
}

export const EMPTY_PROGRESS: VillageProgress = { house: 0, gym: 0, bank: 0, park: 0, nature: 0 };

function level(n: number, thresholds: [number, number, number]): number {
  if (n >= thresholds[2]) return 3;
  if (n >= thresholds[1]) return 2;
  if (n >= thresholds[0]) return 1;
  return 0;
}

export function useVillageProgress(householdId: string | null) {
  return useQuery({
    queryKey: ['villageProgress', householdId],
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<VillageProgress> => {
      // só o `total` importa: uma linha por consulta
      const count = async (tableId: string, queries: string[]) =>
        (await tablesDB.listRows({ databaseId: DB_ID, tableId, queries: [...queries, Query.limit(1)] })).total;

      const [tasksDone, workouts, settlements, expenses, events] = await Promise.all([
        count(TABLES.taskOccurrences, [Query.equal('householdId', householdId!), Query.equal('status', 'done')]),
        count(TABLES.workoutSessions, [Query.equal('householdId', householdId!)]),
        count(TABLES.settlements, [Query.equal('householdId', householdId!)]),
        count(TABLES.expenses, [Query.equal('householdId', householdId!)]),
        count(TABLES.events, [Query.equal('householdId', householdId!)]),
      ]);

      const house = level(tasksDone, [10, 30, 75]);
      const gym = level(workouts, [3, 10, 30]);
      const bank = level(settlements + expenses, [5, 15, 40]);
      const park = level(events, [3, 10, 25]);
      const nature = level(house + gym + bank + park, [2, 6, 10]);
      return { house, gym, bank, park, nature };
    },
  });
}
