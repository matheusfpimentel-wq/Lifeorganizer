import { useState, type FormEvent } from 'react';
import { useActiveHousehold } from '@/features/households/hooks';
import { useActiveList, useAddItem, useListItems, useRestockStaples, useToggleItem } from '@/features/shopping/hooks';
import { shoppingCategoryLabels } from '@/shared/labels';

export default function ShoppingPage() {
  const { householdId } = useActiveHousehold();
  const list = useActiveList(householdId);
  const listId = list.data?.$id ?? null;
  const items = useListItems(listId);
  const addItem = useAddItem(householdId, listId);
  const toggle = useToggleItem(listId);
  const restock = useRestockStaples(householdId, listId);

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

  const grouped = new Map<string, NonNullable<typeof items.data>>();
  for (const item of items.data ?? []) {
    const key = item.category ?? 'outro';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{list.data?.name ?? 'Compras'}</h1>
        <div className="flex gap-2">
          <button className="btn-secondary !px-3" onClick={handleShare} aria-label="Compartilhar lista">
            Compartilhar
          </button>
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
      ) : (items.data ?? []).length === 0 ? (
        <div className="card text-center text-slate-500">Lista vazia. Adicione o primeiro item!</div>
      ) : (
        [...grouped.entries()].map(([cat, catItems]) => (
          <section key={cat} className="card">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {shoppingCategoryLabels[cat] ?? cat}
            </h2>
            <ul className="flex flex-col gap-1">
              {catItems.map((item) => (
                <li key={item.$id}>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded accent-brand-600"
                      checked={item.checked}
                      onChange={(e) => toggle.mutate({ item, checked: e.target.checked })}
                    />
                    <span className={item.checked ? 'text-slate-400 line-through' : ''}>
                      {item.name}
                      {item.qty > 1 && <span className="ml-1 text-sm text-slate-500">×{item.qty}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
