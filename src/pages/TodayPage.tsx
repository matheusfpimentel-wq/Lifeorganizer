import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useMyProfile } from '@/features/households/hooks';
import { useOccurrences, useOccurrenceAction, useTasks } from '@/features/tasks/hooks';
import { useActiveList, useListItems } from '@/features/shopping/hooks';
import { useBalances } from '@/features/expenses/hooks';
import { formatCentsBRL, formatTime, greeting, saoPauloDayBoundsUtc } from '@/lib/format';

export default function TodayPage() {
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const { data: profile } = useMyProfile();
  const occurrences = useOccurrences(householdId);
  const tasksQuery = useTasks(householdId);
  const occurrenceAction = useOccurrenceAction(householdId);
  const activeList = useActiveList(householdId);
  const items = useListItems(activeList.data?.$id ?? null);
  const { balances, isLoading: balancesLoading } = useBalances(householdId);

  const { start, end } = saoPauloDayBoundsUtc();
  const todayOccurrences = (occurrences.data ?? []).filter(
    (o) =>
      o.status === 'pending' &&
      new Date(o.dueAt) >= start &&
      new Date(o.dueAt) <= end,
  );
  const overdue = (occurrences.data ?? []).filter(
    (o) => o.status === 'pending' && new Date(o.dueAt) < start,
  );
  const taskTitle = (taskId: string) =>
    tasksQuery.data?.find((t) => t.$id === taskId)?.title ?? 'Tarefa';

  const pendingItems = (items.data ?? []).filter((i) => !i.checked).length;
  const myBalance = user ? (balances.get(user.$id) ?? 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">
        {greeting()}, {profile?.displayName?.split(' ')[0] ?? ''}!
      </h1>

      {overdue.length > 0 && (
        <section className="card border-l-4 border-amber-500">
          <h2 className="mb-2 font-semibold text-amber-600">Atrasadas ({overdue.length})</h2>
          <ul className="flex flex-col gap-2">
            {overdue.slice(0, 5).map((o) => (
              <li key={o.$id} className="flex items-center justify-between gap-2">
                <span>{taskTitle(o.taskId)}</span>
                <span className="flex gap-1">
                  <button
                    className="btn-secondary !min-h-[36px] !px-2 text-sm"
                    onClick={() => occurrenceAction.mutate({ occurrenceId: o.$id, action: 'done' })}
                  >
                    Concluir
                  </button>
                  <button
                    className="btn-secondary !min-h-[36px] !px-2 text-sm"
                    onClick={() => occurrenceAction.mutate({ occurrenceId: o.$id, action: 'skipped' })}
                  >
                    Pular
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="mb-2 font-semibold">Tarefas de hoje</h2>
        {occurrences.isLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : todayOccurrences.length === 0 ? (
          <p className="text-slate-500">
            Nada para hoje. <Link className="text-brand-600" to="/tarefas">Ver tarefas →</Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todayOccurrences.map((o) => (
              <li key={o.$id} className="flex items-center justify-between gap-2">
                <span>
                  {taskTitle(o.taskId)}
                  <span className="ml-2 text-sm text-slate-500">{formatTime(o.dueAt)}</span>
                </span>
                <button
                  className="btn-secondary !min-h-[36px] !px-2 text-sm"
                  onClick={() => occurrenceAction.mutate({ occurrenceId: o.$id, action: 'done' })}
                >
                  Concluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold">Treino de hoje</h2>
        <p className="text-slate-500">Planos de treino chegam na Fase 5.</p>
        <Link to="/academia" className="btn-secondary mt-2">Abrir Academia</Link>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/compras" className="card block">
          <h2 className="font-semibold">Compras</h2>
          <p className="mt-1 text-2xl font-bold text-brand-600">{pendingItems}</p>
          <p className="text-sm text-slate-500">itens na lista</p>
        </Link>
        <Link to="/contas" className="card block">
          <h2 className="font-semibold">Meu saldo</h2>
          <p
            className={`mt-1 text-2xl font-bold ${
              myBalance > 0 ? 'text-green-600' : myBalance < 0 ? 'text-red-600' : ''
            }`}
          >
            {balancesLoading ? '…' : formatCentsBRL(myBalance)}
          </p>
          <p className="text-sm text-slate-500">
            {myBalance < 0 ? 'você deve' : myBalance > 0 ? 'a receber' : 'tudo certo'}
          </p>
        </Link>
      </div>
    </div>
  );
}
