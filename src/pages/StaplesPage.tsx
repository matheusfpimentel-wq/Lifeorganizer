import { useState, type FormEvent } from 'react';
import { useActiveHousehold } from '@/features/households/hooks';
import { useAddStaple, useRemoveStaple, useStaples } from '@/features/shopping/staples';
import { shoppingCategoryLabels } from '@/shared/labels';

/** Itens recorrentes (staples): base do botão "Repor recorrentes" na lista. */
export default function StaplesPage() {
  const { householdId } = useActiveHousehold();
  const staples = useStaples(householdId);
  const addStaple = useAddStaple(householdId);
  const removeStaple = useRemoveStaple(householdId);

  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [category, setCategory] = useState('mercearia');

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addStaple.mutate(
      { name: name.trim(), defaultQty: qty, category },
      { onSuccess: () => { setName(''); setQty(1); } },
    );
  }

  const grouped = new Map<string, NonNullable<typeof staples.data>>();
  for (const staple of staples.data ?? []) {
    const key = staple.category ?? 'outro';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(staple);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Itens recorrentes</h1>
      <p className="text-sm text-slate-500">
        Itens que você sempre repõe. Use "Repor recorrentes" na lista de compras para adicionar os
        que estiverem faltando.
      </p>

      <form className="card flex flex-col gap-3" onSubmit={handleAdd}>
        <div>
          <label className="label" htmlFor="stapleName">Nome</label>
          <input id="stapleName" className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={128} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="stapleQty">Quantidade padrão</label>
            <input id="stapleQty" type="number" min={1} className="input" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
          </div>
          <div>
            <label className="label" htmlFor="stapleCategory">Categoria</label>
            <select id="stapleCategory" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.entries(shoppingCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={addStaple.isPending}>Adicionar recorrente</button>
      </form>

      {staples.isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (staples.data ?? []).length === 0 ? (
        <div className="card text-center text-slate-500">Nenhum item recorrente ainda.</div>
      ) : (
        [...grouped.entries()].map(([cat, catStaples]) => (
          <section key={cat} className="card">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {shoppingCategoryLabels[cat] ?? cat}
            </h2>
            <ul className="flex flex-col gap-1">
              {catStaples.map((staple) => (
                <li key={staple.$id} className="flex min-h-[44px] items-center justify-between gap-2">
                  <span>
                    {staple.name}
                    {staple.defaultQty > 1 && <span className="ml-1 text-sm text-slate-500">×{staple.defaultQty}</span>}
                  </span>
                  <button
                    className="text-slate-400 hover:text-red-600"
                    aria-label={`Remover ${staple.name}`}
                    onClick={() => removeStaple.mutate(staple.$id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
