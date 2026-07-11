import { useMemo, useState, type FormEvent } from 'react';
import type { SplitSpec } from '@/core/split';
import { computeSplits } from '@/core/split';
import { expenseCategoryLabels, splitTypeLabels } from '@/shared/labels';
import { formatCentsBRL, parseBRLToCents } from '@/lib/format';

interface Member {
  id: string;
  name: string;
}

interface Props {
  members: Member[];
  currentUserId: string;
  /** Proporção combinada do lar (percentBp por membro); habilita "Proporcional". */
  proportional?: { memberId: string; percentBp: number }[] | null;
  submitting?: boolean;
  onSubmit: (values: {
    description: string;
    amountCents: number;
    category: string;
    paidBy: string;
    date: string;
    splitSpec: SplitSpec;
    rrule: string | null;
  }) => void;
  onCancel?: () => void;
}

type SplitType = 'equal' | 'percent' | 'shares' | 'exact' | 'proportional';

export default function ExpenseForm({ members, currentUserId, proportional, submitting, onSubmit, onCancel }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('mercado');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [included, setIncluded] = useState<string[]>(members.map((m) => m.id));
  const [recurring, setRecurring] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const amountCents = useMemo(() => {
    try {
      return amount.trim() ? parseBRLToCents(amount) : 0;
    } catch {
      return 0;
    }
  }, [amount]);

  function toggleIncluded(id: string) {
    setIncluded((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function buildSpec(): SplitSpec {
    const ids = included;
    if (splitType === 'equal') return { type: 'equal', memberIds: ids };
    if (splitType === 'proportional') {
      // usa a proporção combinada do lar, renormalizada aos participantes
      const parts = (proportional ?? []).filter((p) => ids.includes(p.memberId));
      const sum = parts.reduce((acc, p) => acc + p.percentBp, 0);
      const scaled = parts.map((p) => ({ memberId: p.memberId, percentBp: sum > 0 ? Math.floor((p.percentBp * 10000) / sum) : 0 }));
      let remainder = 10000 - scaled.reduce((acc, p) => acc + p.percentBp, 0);
      for (let i = 0; remainder > 0 && scaled.length > 0; i = (i + 1) % scaled.length, remainder--) {
        scaled[i].percentBp++;
      }
      return { type: 'percent', parts: scaled };
    }
    if (splitType === 'percent') {
      return {
        type: 'percent',
        parts: ids.map((id) => ({ memberId: id, percentBp: Math.round(Number(values[id] ?? 0) * 100) })),
      };
    }
    if (splitType === 'shares') {
      return {
        type: 'shares',
        parts: ids.map((id) => ({ memberId: id, shares: Math.round(Number(values[id] ?? 0)) })),
      };
    }
    return {
      type: 'exact',
      parts: ids.map((id) => ({ memberId: id, amountCents: safeCents(values[id]) })),
    };
  }

  function safeCents(raw: string | undefined): number {
    if (!raw?.trim()) return 0;
    try {
      return parseBRLToCents(raw);
    } catch {
      return 0;
    }
  }

  // pré-visualização do rateio (valida antes de enviar)
  const preview = useMemo(() => {
    if (amountCents <= 0 || included.length === 0) return null;
    try {
      return computeSplits(amountCents, buildSpec());
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'inválido' } as const;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountCents, included, splitType, values]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (amountCents <= 0) return setError('Informe um valor válido.');
    if (included.length === 0) return setError('Selecione ao menos um membro.');
    try {
      computeSplits(amountCents, buildSpec()); // valida
    } catch (err) {
      return setError(err instanceof Error ? err.message : 'Rateio inválido');
    }
    onSubmit({
      description: description.trim(),
      amountCents,
      category,
      paidBy,
      date: new Date(`${date}T12:00:00-03:00`).toISOString(),
      splitSpec: buildSpec(),
      rrule: recurring ? 'FREQ=MONTHLY' : null,
    });
  }

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? 'Membro';

  return (
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="expPaidBy">Quem pagou</label>
          <select id="expPaidBy" className="input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="expDate">Data</label>
          <input id="expDate" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="expSplitType">Tipo de divisão</label>
        <select id="expSplitType" className="input" value={splitType} onChange={(e) => setSplitType(e.target.value as SplitType)}>
          {Object.entries(splitTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
          {(proportional ?? []).length >= 2 && <option value="proportional">Proporcional (combinado do lar)</option>}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="label">Participantes</legend>
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand-600"
              checked={included.includes(m.id)}
              onChange={() => toggleIncluded(m.id)}
              aria-label={`Incluir ${m.name}`}
            />
            <span className="flex-1">{m.name}</span>
            {included.includes(m.id) && splitType !== 'equal' && splitType !== 'proportional' && (
              <input
                aria-label={`${splitType === 'percent' ? 'Percentual' : splitType === 'shares' ? 'Proporção' : 'Valor'} de ${m.name}`}
                className="input !min-h-[36px] w-24 !py-1 text-right text-sm"
                inputMode="decimal"
                placeholder={splitType === 'percent' ? '%' : splitType === 'shares' ? 'partes' : 'R$'}
                value={values[m.id] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [m.id]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </fieldset>

      <label className="flex items-center gap-2">
        <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
        <span>Conta fixa (repete todo mês)</span>
      </label>

      {preview && 'error' in preview ? (
        <p className="text-sm text-amber-600">Prévia: {preview.error}</p>
      ) : preview ? (
        <div className="rounded-xl bg-slate-50 p-2 text-sm dark:bg-slate-800">
          {preview.map((s) => (
            <div key={s.memberId} className="flex justify-between">
              <span>{memberName(s.memberId)}</span>
              <span>{formatCentsBRL(s.amountCents)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={submitting}>Lançar</button>
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}
