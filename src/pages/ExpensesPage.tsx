import { useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useHouseholdMembers, useProfiles } from '@/features/households/hooks';
import { useBalances, useCreateExpense, useCreateSettlement, useExpenses } from '@/features/expenses/hooks';
import { expenseCategoryLabels } from '@/shared/labels';
import { formatCentsBRL, formatDate, parseBRLToCents } from '@/lib/format';
import { buildPixPayload } from '@/core/pix';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { householdId, household } = useActiveHousehold();
  const expenses = useExpenses(householdId);
  const { balances, transfers, isLoading: balancesLoading } = useBalances(householdId);
  const createExpense = useCreateExpense(householdId);
  const createSettlement = useCreateSettlement(householdId);
  const { data: members } = useHouseholdMembers(householdId);
  const memberIds = useMemo(
    () => (members ?? []).filter((m) => m.confirm).map((m) => m.userId),
    [members],
  );
  const { data: profiles } = useProfiles(memberIds);

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('mercado');
  const [error, setError] = useState<string | null>(null);

  const memberName = (id: string) => profiles?.get(id)?.displayName ?? 'Membro';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      createExpense.mutate(
        {
          description,
          amountCents: parseBRLToCents(amount),
          category,
          paidBy: user!.$id,
          date: new Date().toISOString(),
          splitSpec: { type: 'equal', memberIds },
        },
        { onSuccess: () => { setShowForm(false); setDescription(''); setAmount(''); } },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  /** "Cobrar via Pix": copia e cola + Web Share (client-side, BR Code estático). */
  function handlePixCharge(toMember: string, amountCents: number) {
    const creditorProfile = profiles?.get(toMember);
    if (!creditorProfile?.pixKey) {
      alert(`${memberName(toMember)} ainda não cadastrou a chave Pix no perfil.`);
      return;
    }
    const payload = buildPixPayload({
      pixKey: creditorProfile.pixKey,
      merchantName: creditorProfile.displayName,
      merchantCity: 'SAO PAULO',
      amountCents,
    });
    const text = `Pix de ${formatCentsBRL(amountCents)} para ${creditorProfile.displayName} (${household?.name}):\n${payload}`;
    if (navigator.share) void navigator.share({ text });
    else {
      void navigator.clipboard.writeText(payload);
      alert('Pix copia e cola copiado!');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contas</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Fechar' : '+ Despesa'}
        </button>
      </div>

      {showForm && (
        <form className="card flex flex-col gap-3" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="expDesc">Descrição</label>
            <input id="expDesc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="expAmount">Valor (R$)</label>
              <input id="expAmount" className="input" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="expCategory">Categoria</label>
              <select id="expCategory" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(expenseCategoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Dividida igualmente entre {memberIds.length} membro(s). Outros tipos de rateio na tela
            de detalhes (Fase 3).
          </p>
          <button type="submit" className="btn-primary" disabled={createExpense.isPending}>Lançar</button>
          {(error || createExpense.isError) && (
            <p className="text-sm text-red-600">{error ?? (createExpense.error as Error).message}</p>
          )}
        </form>
      )}

      <section className="card">
        <h2 className="mb-2 font-semibold">Saldos</h2>
        {balancesLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : balances.size === 0 ? (
          <p className="text-slate-500">Nenhuma despesa ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {[...balances.entries()].map(([memberId, cents]) => (
              <li key={memberId} className="flex justify-between">
                <span>{memberName(memberId)}</span>
                <span className={cents > 0 ? 'text-green-600' : cents < 0 ? 'text-red-600' : ''}>
                  {formatCentsBRL(cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {transfers.length > 0 && (
        <section className="card">
          <h2 className="mb-2 font-semibold">Acertos sugeridos</h2>
          <ul className="flex flex-col gap-2">
            {transfers.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span>
                  {memberName(t.fromMember)} → {memberName(t.toMember)}:{' '}
                  <strong>{formatCentsBRL(t.amountCents)}</strong>
                </span>
                <span className="flex gap-1">
                  <button
                    className="btn-secondary !min-h-[36px] !px-2 text-sm"
                    onClick={() => handlePixCharge(t.toMember, t.amountCents)}
                  >
                    Pix
                  </button>
                  <button
                    className="btn-secondary !min-h-[36px] !px-2 text-sm"
                    onClick={() =>
                      createSettlement.mutate({
                        fromMember: t.fromMember,
                        toMember: t.toMember,
                        amountCents: t.amountCents,
                        method: 'pix',
                      })
                    }
                  >
                    Marcar pago
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="mb-2 font-semibold">Últimas despesas</h2>
        {expenses.isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : (expenses.data ?? []).length === 0 ? (
          <p className="text-slate-500">Nenhuma despesa lançada.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(expenses.data ?? []).slice(0, 20).map((expense) => (
              <li key={expense.$id} className="flex justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {expense.description}
                    {expense.status === 'pending' && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                        pendente
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(expense.date)} · {expenseCategoryLabels[expense.category] ?? expense.category} · pagou: {memberName(expense.paidBy)}
                  </p>
                </div>
                <span className="font-semibold">{formatCentsBRL(expense.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
