/**
 * Editor de uma sessão passada do Treino: ajusta carga/reps de cada série,
 * remove séries e pode excluir a sessão inteira. Commit por campo (ao sair do
 * campo), no mesmo espírito das outras telas do app.
 */
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeleteSession, useDeleteSet, useUpdateSet, type SessionRow, type SetRow } from '../hooks';
import { PROGRAM_EXERCISES } from '../program';
import { useTrainingStore } from '@/stores/training';
import { formatDate } from '@/lib/format';
import { Icon } from '@/components/icons';

function CommitInput({ value, onCommit, label, step = '1' }: { value: number; onCommit: (n: number) => void; label: string; step?: string }) {
  const [v, setV] = useState(String(value));
  return (
    <label className="text-xs font-semibold text-slate-500">
      {label}
      <input
        inputMode="decimal"
        step={step}
        className="input mt-0.5 !min-h-[38px] w-20 !py-1 text-base"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = Number(v.replace(',', '.'));
          if (Number.isFinite(n) && n !== value) onCommit(Math.max(0, n));
        }}
      />
    </label>
  );
}

export default function PastSessionEditor({
  householdId,
  session,
  sets,
  onClose,
}: {
  householdId: string | null;
  session: SessionRow;
  sets: SetRow[];
  onClose: () => void;
}) {
  const units = useTrainingStore((s) => s.settings.units);
  const updateSet = useUpdateSet(householdId);
  const deleteSet = useDeleteSet(householdId);
  const deleteSession = useDeleteSession(householdId);

  const nameOf = (s: SetRow) => PROGRAM_EXERCISES.get(s.templateExKey ?? s.exerciseId)?.name ?? 'Exercício';
  const grouped = useMemo(() => {
    const m = new Map<string, SetRow[]>();
    for (const s of [...sets].sort((a, b) => a.setNumber - b.setNumber)) {
      const k = s.templateExKey ?? s.exerciseId;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return [...m.entries()];
  }, [sets]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-white pt-[calc(env(safe-area-inset-top)+8px)] dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4">
        <div className="flex items-center gap-2 py-2">
          <div className="flex-1">
            <h1 className="text-lg font-extrabold">Editar treino</h1>
            <p className="text-sm text-slate-500">{formatDate(session.startedAt)}{session.templateKey ? '' : ' · treino livre'}</p>
          </div>
          <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar" onClick={onClose}>
            <Icon.X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pb-6">
          {grouped.length === 0 && <p className="card text-center text-sm text-slate-500">Nenhuma série neste treino.</p>}
          {grouped.map(([key, list]) => (
            <section key={key} className="card">
              <h2 className="mb-2 font-bold">{PROGRAM_EXERCISES.get(key)?.name ?? nameOf(list[0])}</h2>
              <ul className="flex flex-col gap-2">
                {list.map((s, i) => (
                  <li key={s.$id} className="flex items-end gap-2">
                    <span className="pb-2 text-sm font-semibold text-slate-400">{i + 1}</span>
                    <CommitInput label={`Carga (${units})`} value={s.loadKg} step="0.5" onCommit={(n) => updateSet.mutate({ setId: s.$id, data: { loadKg: n } })} />
                    <CommitInput label="Reps" value={s.reps} onCommit={(n) => updateSet.mutate({ setId: s.$id, data: { reps: Math.round(n) } })} />
                    <CommitInput label="RIR" value={s.rir ?? 0} onCommit={(n) => updateSet.mutate({ setId: s.$id, data: { rir: Math.round(n) } })} />
                    <button
                      className="mb-2 ml-auto text-slate-400 hover:text-red-600"
                      aria-label="Remover série"
                      onClick={() => confirm('Remover esta série?') && deleteSet.mutate(s.$id)}
                    >
                      <Icon.Trash className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <button
            className="btn-secondary w-full !text-red-600"
            onClick={() => {
              if (confirm('Excluir o treino inteiro (com todas as séries)? Não dá pra desfazer.')) {
                deleteSession.mutate(session.$id, { onSuccess: onClose });
              }
            }}
          >
            <Icon.Trash className="h-4 w-4" />
            Excluir este treino
          </button>
          <p className="text-center text-xs text-slate-400">As mudanças salvam sozinhas ao sair de cada campo.</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
