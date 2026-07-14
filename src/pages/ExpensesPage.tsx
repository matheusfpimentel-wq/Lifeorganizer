import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useHouseholdMeta, useHouseholdPeople } from '@/features/households/hooks';
import {
  useBalances,
  useConfirmExpense,
  useCreateExpense,
  useCreateSettlement,
  useDeleteExpense,
  useExpenses,
  useMonthlyReport,
  usePendingExpenses,
  useUpdateExpense,
  type ExpenseRow,
} from '@/features/expenses/hooks';
import ExpenseForm from '@/features/expenses/ExpenseForm';
import FundPanel from '@/features/expenses/FundPanel';
import ReceiptScanner from '@/features/expenses/ReceiptScanner';
import MonthlyClosing from '@/features/expenses/MonthlyClosing';
import { categoryIcon } from '@/features/expenses/categoryIcons';
import { expenseCategoryLabels } from '@/shared/labels';
import { formatCentsBRL, formatDate, parseBRLToCents } from '@/lib/format';
import { Icon } from '@/components/icons';
import { BankScene, ModuleHero } from '@/components/scenes';

type Tab = 'summary' | 'fund' | 'closing';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const expenses = useExpenses(householdId);
  const pending = usePendingExpenses(householdId);
  const { balances, transfers, isLoading: balancesLoading } = useBalances(householdId);
  const createExpense = useCreateExpense(householdId);
  const updateExpense = useUpdateExpense(householdId);
  const createSettlement = useCreateSettlement(householdId);
  const confirmExpense = useConfirmExpense(householdId);
  const deleteExpense = useDeleteExpense(householdId);
  const { people: memberOptions, profileById } = useHouseholdPeople(householdId);
  const meta = useHouseholdMeta(householdId);

  const [tab, setTab] = useState<Tab>('summary');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  function openEditor(expense: ExpenseRow) {
    setEditing(expense);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const report = useMonthlyReport(householdId, 0);

  const memberName = (id: string) =>
    memberOptions.find((p) => p.id === id)?.name ?? profileById.get(id)?.displayName ?? 'Membro';

  // proporção combinada do lar (Configurações), ex.: { userId: 60 }
  const proportional = (() => {
    try {
      const settings = meta.data?.settings ? JSON.parse(meta.data.settings as string) : {};
      const ratio: Record<string, number> = settings.splitRatio ?? {};
      const parts = memberOptions
        .filter((p) => typeof ratio[p.id] === 'number' && ratio[p.id] > 0)
        .map((p) => ({ memberId: p.id, percentBp: Math.round(ratio[p.id] * 100) }));
      return parts.length >= 2 ? parts : null;
    } catch {
      return null;
    }
  })();

  // ritual de fechamento: dias 1–5 com acertos pendentes
  const spDay = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCDate();
  const showClosingRitual = spDay <= 5 && transfers.length > 0;
  const allSettled = !balancesLoading && transfers.length === 0 && (expenses.data ?? []).some((e) => e.status !== 'pending');
  const myBalance = user ? (balances.get(user.$id) ?? 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      <ModuleHero
        scene={<BankScene className="h-24 w-full" />}
        title="Contas"
        action={
          <button
            className="btn-primary !min-h-[40px]"
            onClick={() => {
              setEditing(null);
              setShowForm((s) => !s);
            }}
          >
            {showForm && !editing ? 'Fechar' : '+ Despesa'}
          </button>
        }
      />

      {(showForm || editing) && user && (
        <ExpenseForm
          key={editing?.$id ?? 'new'}
          members={memberOptions}
          currentUserId={user.$id}
          proportional={proportional}
          initial={editing ?? undefined}
          submitting={createExpense.isPending || updateExpense.isPending}
          onSubmit={(values) => {
            if (editing) {
              updateExpense.mutate(
                { expenseId: editing.$id, input: values },
                { onSuccess: () => { setEditing(null); setShowForm(false); } },
              );
            } else {
              createExpense.mutate(values, { onSuccess: () => setShowForm(false) });
            }
          }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
      {(createExpense.isError || updateExpense.isError) && (
        <p className="text-sm text-red-600">{((createExpense.error ?? updateExpense.error) as Error).message}</p>
      )}

      {!showScanner && !showForm && !editing && (
        <button className="btn-secondary" onClick={() => setShowScanner(true)}>
          <Icon.Receipt className="h-4 w-4" />
          Escanear nota fiscal (QR) e dividir por item
        </button>
      )}
      {showScanner && user && (
        <ReceiptScanner
          householdId={householdId}
          currentUserId={user.$id}
          members={memberOptions}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {([['summary', 'Resumo'], ['fund', 'Fundo do casal'], ['closing', 'Fechamento']] as const).map(([id, label]) => (
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
          {showClosingRitual && (
            <section className="card flex items-center justify-between gap-3 border-l-4 border-amber-500">
              <div>
                <h2 className="font-semibold text-amber-600">Virada de mês!</h2>
                <p className="text-sm text-slate-500">
                  Bom momento para acertar o saldo e começar {report.monthLabel} no zero.
                </p>
              </div>
              <button className="btn-primary shrink-0 !min-h-[40px]" onClick={() => setShowPayment(true)}>
                Acertar
              </button>
            </section>
          )}
          {allSettled && (
            <section className="card flex items-center gap-3 border-l-4 border-emerald-500">
              <Icon.Check className="h-6 w-6 shrink-0 text-emerald-500 motion-safe:animate-pop" />
              <div>
                <h2 className="font-semibold text-emerald-600">Contas zeradas!</h2>
                <p className="text-sm text-slate-500">Ninguém deve nada a ninguém. Bom trabalho, casinha.</p>
              </div>
            </section>
          )}
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
                  .map((expense) => {
                    const CatIcon = categoryIcon(expense.category);
                    return (
                    <li key={expense.$id} className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        aria-label={`Editar ${expense.description}`}
                        onClick={() => openEditor(expense)}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-400"
                          title={expenseCategoryLabels[expense.category] ?? expense.category}
                        >
                          <CatIcon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {expense.description}
                            {expense.rrule && (
                              <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-800 dark:bg-brand-900 dark:text-brand-100">
                                fixa
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-sm text-slate-500">
                            {formatDate(expense.date)} · pagou: {memberName(expense.paidBy)}
                          </span>
                        </span>
                      </button>
                      <span className="shrink-0 font-semibold">{formatCentsBRL(expense.amountCents)}</span>
                      <button
                        className="shrink-0 text-slate-400 hover:text-red-600"
                        aria-label={`Excluir ${expense.description}`}
                        onClick={() => {
                          if (confirm(`Excluir "${expense.description}" (${formatCentsBRL(expense.amountCents)})?`)) {
                            deleteExpense.mutate(expense.$id);
                          }
                        }}
                      >
                        <Icon.X className="h-4 w-4" />
                      </button>
                    </li>
                    );
                  })}
              </ul>
            )}
          </section>
        </>
      )}

      {tab === 'fund' && user && (
        <FundPanel householdId={householdId} currentUserId={user.$id} members={memberOptions} />
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
