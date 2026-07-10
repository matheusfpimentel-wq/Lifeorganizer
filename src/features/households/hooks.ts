/** Lar = Team do Appwrite. Metadados na tabela `households`. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query, type Models } from 'appwrite';
import { DB_ID, TABLES, tablesDB, teams } from '@/lib/appwrite';
import { withHouseholdPermissions, withPersonalPermissions } from '@/lib/permissions';
import { householdSettingsSchema, type Profile } from '@/shared/schemas';
import { useAuth } from '@/features/auth/AuthContext';
import { useUiStore } from '@/stores/ui';

const MEMBER_COLORS = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#14b8a6'];

export function useMyTeams() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['teams', user?.$id],
    enabled: !!user,
    queryFn: async (): Promise<Models.Team<Models.Preferences>[]> => (await teams.list()).teams,
  });
}

export function useActiveHousehold() {
  const { data: myTeams } = useMyTeams();
  const activeHouseholdId = useUiStore((s) => s.activeHouseholdId);
  const active = myTeams?.find((t) => t.$id === activeHouseholdId) ?? myTeams?.[0] ?? null;
  return { household: active, householdId: active?.$id ?? null };
}

export function useHouseholdMeta(teamId: string | null) {
  return useQuery({
    queryKey: ['householdMeta', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const result = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLES.households,
        queries: [Query.equal('teamId', teamId!), Query.limit(1)],
      });
      return result.rows[0] ?? null;
    },
  });
}

export function useHouseholdMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['members', teamId],
    enabled: !!teamId,
    queryFn: async (): Promise<Models.Membership[]> => {
      const result = await teams.listMemberships({ teamId: teamId! });
      return result.memberships.filter((m) => m.confirm || m.invited);
    },
  });
}

export function useProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ['profiles', [...userIds].sort()],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const result = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLES.profiles,
        queries: [Query.equal('userId', userIds), Query.limit(100)],
      });
      const map = new Map<string, Profile & { $id: string }>();
      for (const row of result.rows) {
        map.set(row.userId as string, row as unknown as Profile & { $id: string });
      }
      return map;
    },
  });
}

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['myProfile', user?.$id],
    enabled: !!user,
    queryFn: async () => {
      const result = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLES.profiles,
        queries: [Query.equal('userId', user!.$id), Query.limit(1)],
      });
      return (result.rows[0] as unknown as (Profile & { $id: string })) ?? null;
    },
  });
}

/** Cria lar: team + linha em households + garante profile do criador. */
export function useCreateHousehold() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const setActiveHousehold = useUiStore((s) => s.setActiveHousehold);

  return useMutation({
    mutationFn: async ({ name }: { name: string }): Promise<Models.Team<Models.Preferences>> => {
      if (!user) throw new Error('Não autenticado');
      const team = await teams.create({ teamId: ID.unique(), name });

      await tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.households,
        rowId: ID.unique(),
        data: {
          teamId: team.$id,
          name,
          settings: JSON.stringify(householdSettingsSchema.parse({})),
        },
        permissions: withHouseholdPermissions(team.$id),
      });

      // garante profile do criador com leitura pelo novo lar
      const existing = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLES.profiles,
        queries: [Query.equal('userId', user.$id), Query.limit(1)],
      });
      if (existing.rows.length === 0) {
        await tablesDB.createRow({
          databaseId: DB_ID,
          tableId: TABLES.profiles,
          rowId: ID.unique(),
          data: {
            userId: user.$id,
            displayName: user.name || user.email,
            color: MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)],
          },
          permissions: withPersonalPermissions(user.$id, [team.$id]),
        });
      }
      return team;
    },
    onSuccess: (team) => {
      setActiveHousehold(team.$id);
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

/** Convite nativo do Teams por e-mail; aceite tratado em /convite. */
export function useInviteMember(teamId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      if (!teamId) throw new Error('Nenhum lar ativo');
      return teams.createMembership({
        teamId,
        roles: ['member'],
        email,
        url: `${window.location.origin}/convite`,
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['members', teamId] }),
  });
}
