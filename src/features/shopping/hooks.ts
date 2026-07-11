import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { client, DB_ID, TABLES, tableChannel, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withHouseholdPermissions } from '@/lib/permissions';
import { shoppingTotalCents } from '@/core/shopping';
import { useAuth } from '@/features/auth/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListRow = Record<string, any> & { $id: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ItemRow = Record<string, any> & { $id: string };

/** Lista ativa (cria a padrão na primeira utilização). */
export function useActiveList(householdId: string | null) {
  return useQuery({
    queryKey: ['shoppingList', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const lists = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLES.shoppingLists,
        queries: [
          Query.equal('householdId', householdId!),
          Query.equal('status', 'active'),
          Query.limit(1),
        ],
      });
      if (lists.rows.length > 0) return lists.rows[0] as unknown as ListRow;
      return (await tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.shoppingLists,
        rowId: ID.unique(),
        data: { householdId, name: 'Mercado', status: 'active', isDefault: true },
        permissions: withHouseholdPermissions(householdId!),
      })) as unknown as ListRow;
    },
  });
}

/**
 * Itens da lista com REALTIME: assina só o canal de shoppingItems enquanto a
 * tela está montada e desconecta ao sair (limite do plano Free — seção 0).
 * O isolamento por lar vem das permissões de linha.
 */
export function useListItems(listId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!listId) return;
    const unsubscribe = client.subscribe(tableChannel(TABLES.shoppingItems), () => {
      void queryClient.invalidateQueries({ queryKey: ['shoppingItems', listId] });
    });
    return unsubscribe;
  }, [listId, queryClient]);

  return useQuery({
    queryKey: ['shoppingItems', listId],
    enabled: !!listId,
    queryFn: () =>
      listAllRows<ItemRow>(TABLES.shoppingItems, [
        Query.equal('listId', listId!),
        Query.orderAsc('checked'),
      ]),
  });
}

export function useAddItem(householdId: string | null, listId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, qty, category }: { name: string; qty: number; category: string }) => {
      if (!householdId || !listId) throw new Error('Lista indisponível');
      return tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.shoppingItems,
        rowId: ID.unique(),
        data: { householdId, listId, name, qty, category, addedBy: user!.$id, checked: false },
        permissions: withHouseholdPermissions(householdId),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shoppingItems', listId] }),
  });
}

/** Check otimista com rollback. */
export function useToggleItem(listId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ item, checked }: { item: ItemRow; checked: boolean }) =>
      tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.shoppingItems,
        rowId: item.$id,
        data: {
          checked,
          checkedBy: checked ? user!.$id : null,
          checkedAt: checked ? new Date().toISOString() : null,
        },
      }),
    onMutate: async ({ item, checked }) => {
      await queryClient.cancelQueries({ queryKey: ['shoppingItems', listId] });
      const previous = queryClient.getQueryData<ItemRow[]>(['shoppingItems', listId]);
      queryClient.setQueryData<ItemRow[]>(['shoppingItems', listId], (old) =>
        old?.map((row) => (row.$id === item.$id ? { ...row, checked } : row)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['shoppingItems', listId], context.previous);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['shoppingItems', listId] }),
  });
}

/** Editar item (qty, preço, categoria, nome). */
export function useUpdateItem(listId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ itemId, data }: { itemId: string; data: Record<string, any> }) =>
      tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLES.shoppingItems, rowId: itemId, data }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shoppingItems', listId] }),
  });
}

export function useRemoveItem(listId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) =>
      tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLES.shoppingItems, rowId: itemId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shoppingItems', listId] }),
  });
}

/**
 * Arquiva a lista ativa: calcula o total (itens comprados), grava em
 * `totalCents`, marca como archived e cria uma nova lista ativa padrão.
 * Retorna { archivedListId, totalCents } — a ponte "criar despesa" (F3)
 * consome esse total.
 */
export function useArchiveList(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (list: ListRow) => {
      if (!householdId) throw new Error('Nenhum lar ativo');
      const items = await listAllRows<ItemRow>(TABLES.shoppingItems, [
        Query.equal('listId', list.$id),
      ]);
      const totalCents = shoppingTotalCents(items);

      await tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.shoppingLists,
        rowId: list.$id,
        data: { status: 'archived', totalCents },
      });
      const newList = await tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLES.shoppingLists,
        rowId: ID.unique(),
        data: { householdId, name: list.name, status: 'active', isDefault: true },
        permissions: withHouseholdPermissions(householdId),
      });
      return { archivedListId: list.$id, totalCents, newListId: newList.$id };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shoppingList', householdId] });
      void queryClient.invalidateQueries({ queryKey: ['archivedLists', householdId] });
    },
  });
}

export function useArchivedLists(householdId: string | null) {
  return useQuery({
    queryKey: ['archivedLists', householdId],
    enabled: !!householdId,
    queryFn: () =>
      listAllRows<ListRow>(TABLES.shoppingLists, [
        Query.equal('householdId', householdId!),
        Query.equal('status', 'archived'),
        Query.orderDesc('$createdAt'),
      ]),
  });
}

/** Staples ausentes -> lista ativa ("Repor recorrentes"). */
export function useRestockStaples(householdId: string | null, listId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!householdId || !listId) throw new Error('Lista indisponível');
      const [staples, items] = await Promise.all([
        listAllRows<ItemRow>(TABLES.staples, [Query.equal('householdId', householdId)]),
        listAllRows<ItemRow>(TABLES.shoppingItems, [Query.equal('listId', listId)]),
      ]);
      const present = new Set(items.map((i) => i.name.toLowerCase()));
      const missing = staples.filter((s) => !present.has(s.name.toLowerCase()));
      for (const staple of missing) {
        await tablesDB.createRow({
          databaseId: DB_ID,
          tableId: TABLES.shoppingItems,
          rowId: ID.unique(),
          data: {
            householdId,
            listId,
            name: staple.name,
            qty: staple.defaultQty,
            unit: staple.unit,
            category: staple.category,
            addedBy: user!.$id,
            checked: false,
          },
          permissions: withHouseholdPermissions(householdId),
        });
      }
      return missing.length;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shoppingItems', listId] }),
  });
}
