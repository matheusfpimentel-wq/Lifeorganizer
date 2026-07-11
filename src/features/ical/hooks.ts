import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { withPersonalPermissions } from '@/lib/permissions';
import { useAuth } from '@/features/auth/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IcalTokenRow = Record<string, any> & { $id: string };

/** URL pública da function `api` (ex.: https://<id>.<region>.appwrite.run). */
export const API_FUNCTION_URL = import.meta.env.VITE_API_FUNCTION_URL as string | undefined;

function randomToken(): string {
  // 32 hex chars — casa com a regex [A-Za-z0-9_-]{16,64} da rota /ical
  const uuid = crypto.randomUUID().replace(/-/g, '');
  return uuid + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

export function useIcalToken(householdId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['icalToken', householdId, user?.$id],
    enabled: !!householdId && !!user,
    queryFn: async (): Promise<IcalTokenRow | null> => {
      const result = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLES.icalTokens,
        queries: [
          Query.equal('userId', user!.$id),
          Query.equal('householdId', householdId!),
          Query.equal('revoked', false),
          Query.limit(1),
        ],
      });
      return (result.rows[0] as unknown as IcalTokenRow) ?? null;
    },
  });
}

export function useCreateIcalToken(householdId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!householdId || !user) throw new Error('Nenhum lar ativo');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.icalTokens,
        rowId: ID.unique(),
        data: { userId: user.$id, householdId, token: randomToken(), revoked: false },
        permissions: withPersonalPermissions(user.$id),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['icalToken', householdId] }),
  });
}

/** Revoga o token atual (o link antigo para de funcionar). */
export function useRevokeIcalToken(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) =>
      tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLES.icalTokens, rowId: tokenId, data: { revoked: true } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['icalToken', householdId] }),
  });
}
