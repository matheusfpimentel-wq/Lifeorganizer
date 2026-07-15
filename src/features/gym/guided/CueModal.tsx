/** Descrição/execução do exercício sob demanda (cue). Futuro: vídeo. */
import { createPortal } from 'react-dom';
import { PROGRAM_EXERCISES, MUSCLE_LABELS } from '../program';
import { Icon } from '@/components/icons';

export default function CueModal({ exerciseKey, onClose }: { exerciseKey: string; onClose: () => void }) {
  const ex = PROGRAM_EXERCISES.get(exerciseKey);
  if (!ex) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <button aria-label="Fechar" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-2xl dark:bg-slate-900">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold">{ex.name}</h2>
            <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
              {MUSCLE_LABELS[ex.muscle] ?? ex.muscle} · {ex.isCompound ? 'composto' : 'isolador'}
            </p>
          </div>
          <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar" onClick={onClose}>
            <Icon.X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-slate-600 dark:text-slate-300">{ex.cue}</p>
      </div>
    </div>,
    document.body,
  );
}
