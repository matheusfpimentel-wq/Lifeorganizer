import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdPermissions } from '@/lib/permissions';
import { useAuth } from '@/features/auth/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventRow = Record<string, any> & { $id: string };

export function useEvents(householdId: string | null) {
  return useQuery({
    queryKey: ['events', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<EventRow>(TABLES.events, [
        Query.equal('householdId', householdId!),
        Query.orderAsc('startAt'),
      ]),
  });
}

export interface EventInputData {
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  memberIds: string[];
  rrule?: string | null;
  reminderMinutes: number[];
}

export function useCreateEvent(householdId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInputData) => {
      if (!householdId || !user) throw new Error('Nenhum lar ativo');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.events,
        rowId: ID.unique(),
        data: { ...input, householdId, exdates: [], createdBy: user.$id },
        permissions: withHouseholdPermissions(householdId),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['events', householdId] }),
  });
}

export function useUpdateEvent(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ eventId, data }: { eventId: string; data: Record<string, any> }) =>
      tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLES.events, rowId: eventId, data }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['events', householdId] }),
  });
}

export function useDeleteEvent(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) =>
      tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLES.events, rowId: eventId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['events', householdId] }),
  });
}

/** Cancela uma ocorrência de evento recorrente adicionando um exdate. */
export function useCancelOccurrence(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ event, occurrenceStart }: { event: EventRow; occurrenceStart: string }) => {
      const exdates: string[] = [...(event.exdates ?? []), occurrenceStart];
      return tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.events,
        rowId: event.$id,
        data: { exdates },
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['events', householdId] }),
  });
}
