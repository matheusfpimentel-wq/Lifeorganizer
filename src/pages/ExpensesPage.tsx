import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useHouseholdMembers, useProfiles } from '@/features/households/hooks';
import {
  useBalances,
  useConfirmExpense,
  useCreateExpense,
  useCreateSettlement,
  useDeleteExpense,
  useExpenses,
  usePendingExpenses,
} from '@/features/expenses/hooks';
import ExpenseForm from '@/features/expenses/ExpenseForm';
import MonthlyClosing from '@/features/expenses/MonthlyClosing';
import { expenseCategoryLabels } from '@/shared/labels';
import { formatCentsBRL, formatDate } from '@/lib/format';
import { buildPixPayload } from '@/core/pix';

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
  const { data: members } = useHouseholdMembers(householdId);
  const memberIds = useMemo(
    () => (members ?? []).filter((m) => m.confirm).map((m) => m.userId),
    [members],
  );
  const { data: profiles } = useProfiles(memberIds);

  const [tab, setTab] = useState<Tab>('summary');
  const [showForm, setShowForm] = useState(false);

  const memberName = (id: string) => profiles?.get(id)?.displayName ?? 'Membro';
  const memberOptions = memberIds.map((id) => ({ id, name: memberName(id) }));

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
