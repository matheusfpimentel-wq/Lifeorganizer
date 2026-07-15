/**
 * Resumo da sessão concluída: séries, tonelagem, tempo, melhores séries e
 * sugestão (passiva) de registrar peso corporal — no máximo 1×/semana.
 */
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { estimate1RM } from '@/core/workout';
import { PROGRAM_EXERCISES } from '../program';
import { useAddBodyweight } from '../trainingHooks';
import { useTrainingStore } from '@/stores/training';
import { Icon } from '@/components/icons';

export default function SessionSummary({ householdId, onFinish }: { householdId: string | null; onFinish: () => void }) {
  const { user } = useAuth();
  const active = useTrainingStore((s) => s.active)!;
  const units = useTrainingStore((s) => s.settings.units);
  const lastPrompt = useTrainingStore((s) => s.lastBodyweightPromptAt);
  const markPrompt = useTrainingStore((s) => s.markBodyweightPrompt);
  const addBodyweight = useAddBodyweight(householdId, user?.$id ?? null);
  const [bw, setBw] = useState('');
  const [bwDone, setBwDone] = useState(false);

  const stats = useMemo(() => {
    const logs = active.logs;
    const tonnage = logs.reduce((acc, l) => acc + l.reps * l.weight, 0);
    const durationMin = Math.max(1, Math.round((Date.now() - new Date(active.startedAt).getTime()) / 60000));
    const best = new Map<string, { reps: number; weight: number; e1rm: number }>();
    for (const l of logs) {
      if (l.reps <= 0) continue;
      const e1rm = estimate1RM(l.reps, l.weight);
      const cur = best.get(l.exerciseKey);
      if (!cur || e1rm > cur.e1rm) best.set(l.exerciseKey, { reps: l.reps, weight: l.weight, e1rm });
    }
    return { sets: logs.length, tonnage: Math.round(tonnage), durationMin, best };
  }, [active]);

  // sugere peso corporal no máx. 1×/semana
  const promptBw = (() => {
    if (!lastPrompt) return true;
    return Date.now() - new Date(lastPrompt).getTime() > 6.5 * 24 * 60 * 60 * 1000;
  })();

  function saveBw() {
    const w = Number(bw.replace(',', '.'));
    if (w > 0) {
      addBodyweight(w);
      markPrompt(new Date().toISOString());
      setBwDone(true);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-md">
        <p className="text-sm uppercase tracking-wide opacity-80">Treino concluído 💪</p>
        <div className="mt-2 flex gap-6">
          <div><p className="text-3xl font-extrabold">{stats.sets}</p><p className="text-xs opacity-80">séries</p></div>
          <div><p className="text-3xl font-extrabold">{stats.tonnage}</p><p className="text-xs opacity-80">{units} totais</p></div>
          <div><p className="text-3xl font-extrabold">{stats.durationMin}</p><p className="text-xs opacity-80">minutos</p></div>
        </div>
        <Icon.Flame className="absolute -bottom-4 -right-3 h-24 w-24 opacity-10" />
      </section>

      {stats.best.size > 0 && (
        <section className="card">
          <h2 className="mb-2 font-bold">Melhores séries</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {[...stats.best.entries()].map(([key, b]) => (
              <li key={key} className="flex justify-between">
                <span className="truncate">{PROGRAM_EXERCISES.get(key)?.name ?? key}</span>
                <span className="shrink-0 text-slate-500">{b.reps}×{b.weight}{units} · ~{estimate1RM(b.reps, b.weight)}{units}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {promptBw && !bwDone && (
        <section className="card border-l-4 border-sky-500">
          <p className="font-bold">Registrar peso corporal?</p>
          <p className="mb-2 text-sm text-slate-500">Ajuda a acompanhar a tendência (média de 7 dias). Uma vez por semana basta.</p>
          <div className="flex gap-2">
            <input inputMode="decimal" className="input flex-1" placeholder={`Peso (${units})`} value={bw} onChange={(e) => setBw(e.target.value)} />
            <button className="btn-secondary" onClick={saveBw} disabled={!bw}>Salvar</button>
          </div>
        </section>
      )}
      {bwDone && <p className="text-sm text-emerald-600">Peso registrado!</p>}

      <section className="card flex items-center gap-3 text-sm text-slate-500">
        <Icon.Info className="h-5 w-5 shrink-0 text-slate-400" />
        <p>Meta ~180 g de proteína/dia e cardio leve (Zona 2) 2–4×/semana ajudam a recomposição.</p>
      </section>

      <button className="btn-primary !min-h-[52px] text-lg" onClick={onFinish}>Voltar ao início</button>
    </div>
  );
}
