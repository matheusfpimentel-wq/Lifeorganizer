/**
 * Fundo do casal: aportes num pote conjunto (viagem, reserva, sonhos).
 * Não entra nos saldos de despesas — é dinheiro guardado, não dívida.
 */
import { useState, type FormEvent } from 'react';
import {
  useAddFundContribution,
  useDeleteFundContribution,
  useFundContributions,
  useUpdateFundContribution,
  type ExpenseRow,
} from './hooks';
import { formatCentsBRL, formatDate, parseBRLToCents } from '@/lib/format';
import { Icon } from '@/components/icons';

interface Member {
  id: string;
  name: string;
  color?: string | null;
}

function isoToSpDateInput(iso: string): string {
  return new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function FundPanel({
  householdId,
  currentUserId,
  members,
}: {
  householdId: string | null;
  currentUserId: string;
  members: Member[];
}) {
  const contributions = useFundContributions(householdId);
  const addContribution = useAddFundContribution(householdId);
  const updateContribution = useUpdateFundContribution(householdId);
  const deleteContribution = useDeleteFundContribution(householdId);

  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [memberId, setMemberId] = useState(currentUserId);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const rows = contributions.data ?? [];
  const totalCents = rows.reduce((acc, c) => acc + (c.amountCents ?? 0), 0);
  const byMember = new Map<string, number>();
  for (const c of rows) byMember.set(c.memberId, (byMember.get(c.memberId) ?? 0) + c.amountCents);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? 'Membro';

  function resetForm() {
    setEditing(null);
    setMemberId(currentUserId);
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
  }

  function startEdit(c: ExpenseRow) {
    setEditing(c);
    setMemberId(c.memberId);
    setAmount((c.amountCents / 100).toFixed(2).replace('.', ','));
    setDate(isoToSpDateInput(c.date));
    setNote(c.note ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    let amountCents: number;
    try {
      amountCents = parseBRLToCents(amount);
    } catch {
      return setError('Valor inválido.');
    }
    if (amountCents <= 0) return setError('Informe um valor maior que zero.');
    const isoDate = new Date(`${date}T12:00:00-03:00`).toISOString();
    if (editing) {
      updateContribution.mutate(
        { contributionId: editing.$id, data: { memberId, amountCents, date: isoDate, note: note.trim() || null } },
        { onSuccess: resetForm },
      );
    } else {
      addContribution.mutate(
        { memberId, amountCents, date: isoDate, note: note.trim() || null },
        { onSuccess: resetForm },
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* pote do casal */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 text-white shadow-md">
        <p className="text-xs uppercase tracking-wide opacity-70">Fundo do casal</p>
        <p className="text-3xl font-bold">{formatCentsBRL(totalCents)}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {members.map((m) => (
            <span key={m.id} className="opacity-90">
              {m.name.split(' ')[0]}: <strong>{formatCentsBRL(byMember.get(m.id) ?? 0)}</strong>
            </span>
          ))}
        </div>
        <Icon.PiggyBank className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10" />
      </section>

      <form className="card flex flex-col gap-3" onSubmit={handleSubmit}>
        <h2 className="font-semibold">{editing ? 'Editar aporte' : 'Novo aporte'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="fundMember">Quem aportou</label>
            <select id="fundMember" className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="fundAmount">Valor (R$)</label>
            <input id="fundAmount" className="input" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="fundDate">Data</label>
            <input id="fundDate" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="fundNote">Nota (opcional)</label>
            <input id="fundNote" className="input" placeholder="ex.: viagem, reserva" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {(addContribution.isError || updateContribution.isError) && (
          <p className="text-sm text-red-600">
            {((addContribution.error ?? updateContribution.error) as Error).message}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1" disabled={addContribution.isPending || updateContribution.isPending}>
            {editing ? 'Salvar' : 'Aportar'}
          </button>
          {editing && <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>}
        </div>
      </form>

      <section className="card">
        <h2 className="mb-2 font-semibold">Aportes</h2>
        {contributions.isLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : rows.length === 0 ? (
          <p className="text-slate-500">Nenhum aporte ainda. Comecem o pote de vocês!</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((c) => (
              <li key={c.$id} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  aria-label={`Editar aporte de ${memberName(c.memberId)}`}
                  onClick={() => startEdit(c)}
                >
                  <span className="block truncate font-medium">
                    {memberName(c.memberId)}
                    {c.note ? <span className="font-normal text-slate-500"> · {c.note}</span> : null}
                  </span>
                  <span className="block text-sm text-slate-500">{formatDate(c.date)}</span>
                </button>
                <span className="shrink-0 font-semibold text-emerald-600">{formatCentsBRL(c.amountCents)}</span>
                <button
                  className="shrink-0 text-slate-400 hover:text-red-600"
                  aria-label="Excluir aporte"
                  onClick={() => {
                    if (confirm(`Excluir o aporte de ${formatCentsBRL(c.amountCents)} de ${memberName(c.memberId)}?`)) {
                      deleteContribution.mutate(c.$id);
                    }
                  }}
                >
                  <Icon.X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
