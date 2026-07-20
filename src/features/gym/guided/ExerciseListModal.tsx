/** Lista pesquisável dos exercícios do programa, com a descrição (cue). */
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MUSCLE_LABELS, PROGRAM_EXERCISES } from '../program';
import { Icon } from '@/components/icons';

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function ExerciseListModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const all = useMemo(() => [...PROGRAM_EXERCISES.values()], []);
  const list = useMemo(() => {
    const needle = norm(q.trim());
    if (!needle) return all;
    return all.filter((e) => norm(e.name).includes(needle) || norm(MUSCLE_LABELS[e.muscle] ?? e.muscle).includes(needle));
  }, [q, all]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-white pt-[calc(env(safe-area-inset-top)+8px)] dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4">
        <div className="flex items-center gap-2 py-2">
          <h1 className="flex-1 text-lg font-extrabold">Exercícios do programa</h1>
          <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar" onClick={onClose}>
            <Icon.X className="h-5 w-5" />
          </button>
        </div>
        <input
          className="input mb-3"
          placeholder="Buscar por nome ou músculo…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <ul className="flex-1 space-y-2 overflow-y-auto pb-6">
          {list.map((ex) => (
            <li key={ex.key} className="card">
              <button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen(open === ex.key ? null : ex.key)}>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{ex.name}</span>
                  <span className="text-xs text-slate-500">{MUSCLE_LABELS[ex.muscle] ?? ex.muscle} · {ex.isCompound ? 'composto' : 'isolador'}</span>
                </span>
                <Icon.ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open === ex.key ? 'rotate-180' : ''}`} />
              </button>
              {open === ex.key && <p className="mt-2 border-t border-slate-100 pt-2 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">{ex.cue}</p>}
            </li>
          ))}
          {list.length === 0 && <li className="card text-center text-sm text-slate-500">Nenhum exercício encontrado.</li>}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
