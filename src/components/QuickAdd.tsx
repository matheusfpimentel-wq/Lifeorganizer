import { useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useHouseholdPeople } from '@/features/households/hooks';
import { useCreateExpense, useExpenses } from '@/features/expenses/hooks';
import { useActiveList, useAddItem } from '@/features/shopping/hooks';
import { useCreateTask } from '@/features/tasks/hooks';
import { useCreateEvent } from '@/features/events/hooks';
import { expenseCategoryLabels, shoppingCategoryLabels } from '@/shared/labels';
import { parseBRLToCents } from '@/lib/format';
import { Icon } from '@/components/icons';

type Kind = 'despesa' | 'item' | 'tarefa' | 'evento';

/** Próxima hora cheia no relógio local, no formato do input datetime-local. */
function nextFullHourLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

/**
 * Registro rápido universal: botão "+" flutuante que abre uma folha com as 4
 * ações mais frequentes, cada uma em ≤ 2 toques com defaults inteligentes.
 * A categoria da despesa é sugerida pelo histórico (mesma descrição já usada).
 */
export default function QuickAdd() {
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const { people } = useHouseholdPeople(householdId);
  const expenses = useExpenses(householdId);
  const createExpense = useCreateExpense(householdId);
  const activeList = useActiveList(householdId);
  const addItem = useAddItem(householdId, activeList.data?.$id ?? null);
  const createTask = useCreateTask(householdId);
  const createEvent = useCreateEvent(householdId);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);

  // despesa
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('mercado');
  const [categoryTouched, setCategoryTouched] = useState(false);
  // item
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('mercearia');
  // tarefa
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState('');
  // evento
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState(nextFullHourLocal());

  if (!householdId || !user) return null;

  /** Sugere categoria pela despesa mais recente com descrição parecida. */
  function suggestCategory(desc: string) {
    if (categoryTouched) return;
    const needle = desc.trim().toLowerCase();
    if (needle.length < 3) return;
    const rows = expenses.data ?? [];
    const match =
      rows.find((e) => String(e.description).toLowerCase() === needle) ??
      rows.find((e) => String(e.description).toLowerCase().includes(needle));
    if (match?.category) setCategory(match.category);
  }

  function close() {
    setOpen(false);
    setKind(null);
    setError(null);
  }
  function done() {
    setAmount(''); setDescription(''); setCategoryTouched(false);
    setItemName(''); setTaskTitle(''); setTaskDate(''); setEventTitle('');
    setEventStart(nextFullHourLocal());
    close();
  }
  const fail = (err: unknown) => setError((err as Error).message);

  function submitExpense(e: FormEvent) {
    e.preventDefault();
    setError(null);
    let cents: number;
    try {
      cents = parseBRLToCents(amount);
    } catch {
      setError('Valor inválido.');
      return;
    }
    createExpense.mutate(
      {
        description: description.trim(),
        amountCents: cents,
        category,
        paidBy: user!.$id,
        date: new Date().toISOString(),
        splitSpec: { type: 'equal', memberIds: people.map((p) => p.id) },
      },
      { onSuccess: done, onError: fail },
    );
  }

  function submitItem(e: FormEvent) {
    e.preventDefault();
    setError(null);
    addItem.mutate(
      { name: itemName.trim(), qty: 1, category: itemCategory },
      { onSuccess: done, onError: fail },
    );
  }

  function submitTask(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createTask.mutate(
      {
        title: taskTitle.trim(),
        description: null,
        category: 'outro',
        type: 'specific',
        rrule: null,
        dueDate: taskDate ? new Date(`${taskDate}T12:00:00-03:00`).toISOString() : null,
        assignmentMode: 'volunteer',
        assignedMemberId: null,
        rotationMemberIds: [],
        priority: 'media',
        checklist: '[]',
        points: 1,
        active: true,
      },
      { onSuccess: done, onError: fail },
    );
  }

  function submitEvent(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const startAt = new Date(eventStart);
    createEvent.mutate(
      {
        title: eventTitle.trim(),
        startAt: startAt.toISOString(),
        endAt: new Date(startAt.getTime() + 60 * 60 * 1000).toISOString(),
        allDay: false,
        memberIds: [],
        reminderMinutes: [60],
        rrule: null,
      },
      { onSuccess: done, onError: fail },
    );
  }

  const pending =
    createExpense.isPending || addItem.isPending || createTask.isPending || createEvent.isPending;

  const actions: { kind: Kind; label: string; icon: keyof typeof Icon; tint: string }[] = [
    { kind: 'despesa', label: 'Despesa', icon: 'Banknote', tint: 'text-brand-600' },
    { kind: 'item', label: 'Item no mercado', icon: 'Cart', tint: 'text-emerald-600' },
    { kind: 'tarefa', label: 'Tarefa', icon: 'CheckSquare', tint: 'text-amber-600' },
    { kind: 'evento', label: 'Evento', icon: 'Calendar', tint: 'text-violet-600' },
  ];

  return (
    <>
      <button
        aria-label="Adicionar rapidamente"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform active:scale-95"
        onClick={() => setOpen(true)}
      >
        <Icon.Plus className="h-7 w-7" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Registro rápido">
          <button aria-label="Fechar" className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-2xl dark:bg-slate-900">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />

            {kind === null ? (
              <div className="grid grid-cols-2 gap-2">
                {actions.map((a) => {
                  const ActionIcon = Icon[a.icon];
                  return (
                    <button
                      key={a.kind}
                      className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-50 font-medium dark:bg-slate-800"
                      onClick={() => setKind(a.kind)}
                    >
                      <ActionIcon className={`h-6 w-6 ${a.tint}`} />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{actions.find((a) => a.kind === kind)?.label}</h2>
                  <button className="text-sm text-slate-500" onClick={() => setKind(null)}>Voltar</button>
                </div>

                {kind === 'despesa' && (
                  <form className="flex flex-col gap-2" onSubmit={submitExpense}>
                    <input
                      className="input text-lg"
                      inputMode="decimal"
                      placeholder="Valor (R$)"
                      autoFocus
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    <input
                      className="input"
                      placeholder="Descrição (ex.: Internet)"
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); suggestCategory(e.target.value); }}
                      required
                      maxLength={200}
                    />
                    <select
                      aria-label="Categoria"
                      className="input"
                      value={category}
                      onChange={(e) => { setCategory(e.target.value); setCategoryTouched(true); }}
                    >
                      {Object.entries(expenseCategoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500">
                      Você pagou agora, dividido igualmente entre {people.length} pessoa{people.length > 1 ? 's' : ''}.
                      Ajustes finos ficam na aba Contas.
                    </p>
                    <button className="btn-primary" disabled={pending}>Lançar despesa</button>
                  </form>
                )}

                {kind === 'item' && (
                  <form className="flex flex-col gap-2" onSubmit={submitItem}>
                    <input
                      className="input"
                      placeholder="O que falta? (ex.: Café)"
                      autoFocus
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required
                      maxLength={128}
                    />
                    <select aria-label="Categoria" className="input" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                      {Object.entries(shoppingCategoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button className="btn-primary" disabled={pending || activeList.isLoading}>Adicionar à lista</button>
                  </form>
                )}

                {kind === 'tarefa' && (
                  <form className="flex flex-col gap-2" onSubmit={submitTask}>
                    <input
                      className="input"
                      placeholder="O que precisa ser feito?"
                      autoFocus
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      required
                      maxLength={200}
                    />
                    <label className="text-sm text-slate-500">
                      Data (opcional)
                      <input type="date" className="input mt-1" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
                    </label>
                    <button className="btn-primary" disabled={pending}>Criar tarefa</button>
                  </form>
                )}

                {kind === 'evento' && (
                  <form className="flex flex-col gap-2" onSubmit={submitEvent}>
                    <input
                      className="input"
                      placeholder="Título do evento"
                      autoFocus
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      required
                      maxLength={200}
                    />
                    <label className="text-sm text-slate-500">
                      Quando
                      <input
                        type="datetime-local"
                        className="input mt-1"
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                        required
                      />
                    </label>
                    <p className="text-xs text-slate-500">Duração de 1h e lembrete 1h antes (edite na Agenda).</p>
                    <button className="btn-primary" disabled={pending}>Agendar</button>
                  </form>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
