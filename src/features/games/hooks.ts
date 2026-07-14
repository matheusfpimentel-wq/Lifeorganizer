/**
 * Mini-games da vila: recordes do casal (tabela gameScores).
 * Agregação no cliente, como o resto do app (volume minúsculo).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdPermissions } from '@/lib/permissions';
import { useAuth } from '@/features/auth/AuthContext';

export type GameSlug = 'passaros' | 'pescaria';

export const GAME_LABELS: Record<GameSlug, string> = {
  passaros: 'Acerta o pássaro',
  pescaria: 'Pescaria',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScoreRow = Record<string, any> & { $id: string };

export function useHighScores(householdId: string | null, game: GameSlug) {
  return useQuery({
    queryKey: ['gameScores', householdId, game],
    enabled: !!householdId,
    queryFn: async () => {
      const rows = await listAllRows<ScoreRow>(TABLES.gameScores, [
        Query.equal('householdId', householdId!),
        Query.equal('game', game),
      ]);
      return rows.sort((a, b) => b.score - a.score);
    },
  });
}

/** Melhor pontuação de cada membro (para o placar do casal). */
export function bestByMember(rows: ScoreRow[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const row of rows) {
    if ((best.get(row.memberId) ?? -1) < row.score) best.set(row.memberId, row.score);
  }
  return best;
}

export function useSubmitScore(householdId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ game, score }: { game: GameSlug; score: number }) => {
      if (!householdId || !user) throw new Error('Nenhum lar ativo');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.gameScores,
        rowId: ID.unique(),
        data: { householdId, memberId: user.$id, game, score, playedAt: new Date().toISOString() },
        permissions: withHouseholdPermissions(householdId),
      });
    },
    onSuccess: (_r, v) =>
      void queryClient.invalidateQueries({ queryKey: ['gameScores', householdId, v.game] }),
  });
}
