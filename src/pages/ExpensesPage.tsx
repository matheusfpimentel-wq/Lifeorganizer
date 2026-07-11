import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useHouseholdPeople } from '@/features/households/hooks';
import {
  useBalances,
  useConfirmExpense,
  useCreateExpense,
  useCreateSettlement,
  useDeleteExpense,
  useExpenses,
  useMonthlyReport,
  usePendingExpenses,
} from '@/features/expenses/hooks';
import ExpenseForm from '@/features/expenses/ExpenseForm';
import MonthlyClosing from '@/features/expenses/MonthlyClosing';
import { expenseCategoryLabels } from '@/shared/labels';
import { formatCentsBRL, formatDate, parseBRLToCents } from '@/lib/format';
import { buildPixPayload } from '@/core/pix';
import { Icon } from '@/components/icons';

type Tab = 'summary' | 'closing';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { householdId, household } = useActiveHousehold();
  const expenses = useExpenses(householdId);
  const pending = usePendingExpenses(householdId);
  const { balances, transfers, isLoading: balancesLoading } = useBalances(householdId);
  const createExpense = useCreateExpense(householdId);
  const createSettlement = useCreateSettlement(householdId);
  const confirmExpense = useConfirmExpense(householdId);
  const deleteExpense = useDeleteExpense(householdId);
  const { people: memberOptions, profileById } = useHouseholdPeople(householdId);

  const [tab, setTab] = useState<Tab>('summary');
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const report = useMonthlyReport(householdId, 0);

  const memberName = (id: string) =>
    memberOptions.find((p) => p.id === id)?.name ?? profileById.get(id)?.displayName ?? 'Membro';
  const myBalance = user ? (balances.get(user.$id) ?? 0) : 0;

  function handlePixCharge(toMember: string, amountCents: number) {
    const creditorProfile = profileById.get(toMember);
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

      {showForm && user && (
        <ExpenseForm
          members={memberOptions}
          currentUserId={user.$id}
          submitting={createExpense.isPending}
          onSubmit={(values) =>
            createExpense.mutate(values, { onSuccess: () => setShowForm(false) })
          }
          onCancel={() => setShowForm(false)}
        />
      )}
      {createExpense.isError && (
        <p className="text-sm text-red-600">{(createExpense.error as Error).message}</p>
      )}

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {([['summary', 'Resumo'], ['closing', 'Fechamento']] as const).map(([id, label]) => (
          <button
            key={id}
            className={`min-h-[40px] rounded-lg text-sm font-medium ${tab === id ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500'}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <>
          {/* visão do mês em um card só */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-70">Gastos de {report.monthLabel}</p>
                <p className="text-2xl font-bold">{formatCentsBRL(report.summary.totalCents)}</p>
                {report.deltaPercent !== null && (
                  <p className="mt-0.5 text-xs opacity-80">
                    {report.deltaPercent > 0 ? '+' : ''}{report.deltaPercent}% vs. mês anterior
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide opacity-70">Meu saldo</p>
                <p className={`text-xl font-bold ${myBalance < 0 ? 'text-red-200' : myBalance > 0 ? 'text-emerald-200' : ''}`}>
                  {balancesLoading ? '—' : formatCentsBRL(myBalance)}
                </p>
                <p className="text-xs opacity-80">{myBalance < 0 ? 'você deve' : myBalance > 0 ? 'a receber' : 'tudo certo'}</p>
              </div>
            </div>
            <Icon.Bank className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10" />
          </section>

          <button className="btn-secondary" onClick={() => setShowPayment((s) => !s)}>
            <Icon.Banknote className="h-4 w-4" />
            {showPayment ? 'Fechar registro de pagamento' : 'Registrar pagamento'}
          </button>
          {showPayment && (
            <PaymentForm
              members={memberOptions}
              currentUserId={user?.$id ?? ''}
              submitting={createSettlement.isPending}
              onSubmit={(values) => createSettlement.mutate(values, { onSuccess: () => setShowPayment(false) })}
            />
          )}
          {createSettlement.isError && (
            <p className="text-sm text-red-600">{(createSettlement.error as Error).message}</p>
          )}

          {(pending.data ?? []).length > 0 && (
            <section className="card border-l-4 border-amber-500">
              <h2 className="mb-2 font-semibold text-amber-600">
                Contas fixas a confirmar ({pending.data!.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {pending.data!.map((e) => (
                  <li key={e.$id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(e.date)} · {formatCentsBRL(e.amountCents)}
                      </p>
                    </div>
                    <span className="flex gap-1">
                      <button className="btn-secondary !min-h-[36px] !px-2 text-sm" onClick={() => confirmExpense.mutate(e.$id)}>
                        Confirmar
                      </button>
                      <button className="btn-secondary !min-h-[36px] !px-2 text-sm text-red-600" onClick={() => deleteExpense.mutate(e.$id)}>
                        Descartar
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
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
                      <button className="btn-secondary !min-h-[36px] !px-2 text-sm" onClick={() => handlePixCharge(t.toMember, t.amountCents)}>
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
            ) : (expenses.data ?? []).filter((e) => e.status !== 'pending').length === 0 ? (
              <p className="text-slate-500">Nenhuma despesa lançada.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {(expenses.data ?? [])
                  .filter((e) => e.status !== 'pending')
                  .slice(0, 20)
                  .map((expense) => (
                    <li key={expense.$id} className="flex justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {expense.description}
                          {expense.rrule && (
                            <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-800 dark:bg-brand-900 dark:text-brand-100">
                              fixa
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
        </>
      )}

      {tab === 'closing' && <MonthlyClosing householdId={householdId} memberName={memberName} />}
    </div>
  );
}

/** Registro manual de pagamento entre membros (acerto por fora dos sugeridos). */
function PaymentForm({
  members,
  currentUserId,
  submitting,
  onSubmit,
}: {
  members: { id: string; name: string }[];
  currentUserId: string;
  submitting: boolean;
  onSubmit: (values: {
    fromMember: string;
    toMember: string;
    amountCents: number;
    method: 'pix' | 'dinheiro' | 'outro';
  }) => void;
}) {
  const [fromMember, setFromMember] = useState(currentUserId);
  const [toMember, setToMember] = useState(members.find((m) => m.id !== currentUserId)?.id ?? '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'pix' | 'dinheiro' | 'outro'>('pix');
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (fromMember === toMember) return setError('Escolha pessoas diferentes.');
        try {
          const amountCents = parseBRLToCents(amount);
          if (amountCents <= 0) return setError('Informe um valor maior que zero.');
          onSubmit({ fromMember, toMember, amountCents, method });
        } catch {
          setError('Valor inválido.');
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="payFrom">Quem pagou</label>
          <select id="payFrom" className="input" value={fromMember} onChange={(e) => setFromMember(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="payTo">Quem recebeu</label>
          <select id="payTo" className="input" value={toMember} onChange={(e) => setToMember(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="payAmount">Valor (R$)</label>
          <input id="payAmount" className="input" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="payMethod">Forma</label>
          <select id="payMethod" className="input" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="pix">Pix</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary" disabled={submitting}>Registrar</button>
      <p className="text-xs text-slate-400">O pagamento abate diretamente os saldos entre as duas pessoas.</p>
    </form>
  );
}
