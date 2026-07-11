import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useActiveHousehold, useHouseholdMembers } from '@/features/households/hooks';
import {
  useActiveList,
  useAddItem,
  useArchiveList,
  useListItems,
  useRemoveItem,
  useRestockStaples,
  useToggleItem,
  useUpdateItem,
  type ItemRow,
} from '@/features/shopping/hooks';
import { useCreateExpense } from '@/features/expenses/hooks';
import { useAuth } from '@/features/auth/AuthContext';
import { shoppingCategoryLabels } from '@/shared/labels';
import { formatCentsBRL, parseBRLToCents } from '@/lib/format';
import { estimatedTotalCents, shoppingTotalCents } from '@/core/shopping';
import { Icon } from '@/components/icons';
import SwipeRow from '@/components/SwipeRow';

function PriceInput({
  item,
  onCommit,
}: {
  item: ItemRow;
  onCommit: (cents: number | null) => void;
}) {
  const [value, setValue] = useState(
    typeof item.priceCents === 'number' ? (item.priceCents / 100).toFixed(2).replace('.', ',') : '',
  );
  function commit() {
    const trimmed = value.trim();
    if (!trimmed) return onCommit(null);
    try {
      onCommit(parseBRLToCents(trimmed));
    } catch {
      /* mantém valor anterior em entrada inválida */
    }
  }
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-slate-400">R$</span>
      <input
        aria-label={`Preço de ${item.name}`}
        className="input !min-h-[36px] w-20 !py-1 text-right text-sm"
        inputMode="decimal"
        placeholder="0,00"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </div>
  );
}

export default function ShoppingPage() {
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const list = useActiveList(householdId);
  const listId = list.data?.$id ?? null;
  const items = useListItems(listId);
  const addItem = useAddItem(householdId, listId);
  const toggle = useToggleItem(listId);
  const updateItem = useUpdateItem(listId);
  const removeItem = useRemoveItem(listId);
  const restock = useRestockStaples(householdId, listId);
  const archive = useArchiveList(householdId);
  const createExpense = useCreateExpense(householdId);
  const { data: members } = useHouseholdMembers(householdId);
  const memberIds = useMemo(
    () => (members ?? []).filter((m) => m.confirm).map((m) => m.userId),
    [members],
  );

  const [name, setName] = useState('');
  const [category, setCategory] = useState('mercearia');

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addItem.mutate({ name: name.trim(), qty: 1, category });
    setName('');
  }

  function handleShare() {
    const pendingText = (items.data ?? [])
      .filter((i) => !i.checked)
      .map((i) => `• ${i.name}${i.qty > 1 ? ` (${i.qty}${i.unit ? ` ${i.unit}` : ''})` : ''}`)
      .join('\n');
    const text = `Lista de compras — ${list.data?.name ?? 'Mercado'}\n${pendingText}`;
    if (navigator.share) void navigator.share({ text });
    else void navigator.clipboard.writeText(text);
  }

  function handleArchive() {
    if (!list.data) return;
    const total = shoppingTotalCents(items.data ?? []);
    const listName = list.data.name;
    const msg =
      total > 0
        ? `Arquivar a lista com total de ${formatCentsBRL(total)}? Uma nova lista vazia será criada.`
        : 'Arquivar a lista e começar uma nova? (sem preços lançados)';
    if (!confirm(msg)) return;
    archive.mutate(list.data, {
      // ponte com Contas: oferecer criar despesa (mercado) do total apurado
      onSuccess: ({ totalCents }) => {
        if (totalCents > 0 && user && householdId && memberIds.length > 0) {
          if (confirm(`Criar despesa de ${formatCentsBRL(totalCents)} (mercado), dividida igualmente?`)) {
            createExpense.mutate({
              description: `Compras — ${listName}`,
              amountCents: totalCents,
              category: 'mercado',
              paidBy: user.$id,
              date: new Date().toISOString(),
              splitSpec: { type: 'equal', memberIds },
            });
          }
        }
      },
    });
  }

  const grouped = new Map<string, ItemRow[]>();
  for (const item of items.data ?? []) {
    const key = item.category ?? 'outro';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  const runningTotal = shoppingTotalCents(items.data ?? []);
  const estimatedTotal = estimatedTotalCents(items.data ?? []);
  const itemCount = (items.data ?? []).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{list.data?.name ?? 'Compras'}</h1>
        <div className="flex gap-2">
          <Link to="/staples" className="btn-secondary !px-3">Recorrentes</Link>
          <button className="btn-secondary !px-3" onClick={handleShare}>Compartilhar</button>
        </div>
      </div>

      <form className="flex gap-2" onSubmit={handleAdd}>
        <input
          aria-label="Novo item"
          className="input flex-1"
          placeholder="Adicionar item…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select aria-label="Categoria" className="input max-w-[130px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.entries(shoppingCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary !px-4" disabled={addItem.isPending}>+</button>
      </form>

      <button className="btn-secondary" onClick={() => restock.mutate()} disabled={restock.isPending}>
        {restock.isPending ? 'Repondo…' : 'Repor recorrentes'}
      </button>

      {items.isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : itemCount === 0 ? (
        <div className="card text-center text-slate-500">Lista vazia. Adicione o primeiro item!</div>
      ) : (
        <>
          {[...grouped.entries()].map(([cat, catItems]) => (
            <section key={cat} className="card">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {shoppingCategoryLabels[cat] ?? cat}
              </h2>
              <ul className="flex flex-col gap-3">
                {catItems.map((item) => (
                  <li key={item.$id} className="flex flex-col gap-2">
                    <SwipeRow
                      label={`Deslize para ${item.checked ? 'desmarcar' : 'marcar'} ${item.name}`}
                      onSwipe={() => toggle.mutate({ item, checked: !item.checked })}
                    >
                    <div className="flex min-h-[44px] items-center gap-3 bg-white dark:bg-slate-900">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded accent-brand-600"
                        checked={item.checked}
                        onChange={(e) => toggle.mutate({ item, checked: e.target.checked })}
                        aria-label={`Marcar ${item.name}`}
                      />
                      <span className={`flex-1 ${item.checked ? 'text-slate-400 line-through' : ''}`}>
                        {item.name}
                      </span>
                      <button
                        className="text-slate-400 hover:text-red-600"
                        aria-label={`Remover ${item.name}`}
                        onClick={() => removeItem.mutate(item.$id)}
                      >
                        <Icon.X className="h-4 w-4" />
                      </button>
                    </div>
                    </SwipeRow>
                    <div className="flex items-center gap-2 pl-8">
                      <div className="flex items-center gap-1">
                        <button
                          className="h-8 w-8 rounded-lg bg-slate-100 text-lg leading-none dark:bg-slate-800"
                          aria-label="Diminuir quantidade"
                          onClick={() => updateItem.mutate({ itemId: item.$id, data: { qty: Math.max(1, (item.qty ?? 1) - 1) } })}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm">{item.qty ?? 1}</span>
                        <button
                          className="h-8 w-8 rounded-lg bg-slate-100 text-lg leading-none dark:bg-slate-800"
                          aria-label="Aumentar quantidade"
                          onClick={() => updateItem.mutate({ itemId: item.$id, data: { qty: (item.qty ?? 1) + 1 } })}
                        >
                          +
                        </button>
                      </div>
                      <div className="flex-1" />
                      <PriceInput
                        item={item}
                        onCommit={(cents) => updateItem.mutate({ itemId: item.$id, data: { priceCents: cents } })}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="card flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-slate-500">Estimado</p>
                <p className="text-xl font-bold">{formatCentsBRL(estimatedTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Comprado</p>
                <p className="text-xl font-bold text-emerald-600">{formatCentsBRL(runningTotal)}</p>
              </div>
            </div>
            <button className="btn-primary" onClick={handleArchive} disabled={archive.isPending}>
              {archive.isPending ? 'Arquivando…' : 'Arquivar lista'}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
