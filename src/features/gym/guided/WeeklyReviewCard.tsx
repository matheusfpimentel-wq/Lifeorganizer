/**
 * Revisão da semana (opcional, fora do treino): agrega a semana no cliente e
 * pede uma nota de coach ao LLM via a function `api`. Tolerante a falha — se
 * não houver rede/chave, o card explica e o app segue normal.
 */
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useWeeklyReview } from '../trainingHooks';
import { useTrainingStore } from '@/stores/training';
import { Icon } from '@/components/icons';

export default function WeeklyReviewCard({ householdId }: { householdId: string | null }) {
  const { user } = useAuth();
  const { generate, hasData, aggregate } = useWeeklyReview(householdId, user?.$id ?? null);
  const stored = useTrainingStore((s) => s.lastReview);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const review = stored?.review ?? null;
  const staleWeek = stored && stored.week !== aggregate.week;

  async function run() {
    setLoading(true);
    setError(null);
    const r = await generate();
    setLoading(false);
    if (!r.ok) setError(r.error ?? 'Não consegui gerar agora.');
  }

  if (!hasData && !review) return null;

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon.Sparkles className="h-5 w-5 text-brand-600" />
        <h2 className="font-bold">Revisão da semana</h2>
      </div>

      {review && (
        <div className="flex flex-col gap-2 text-sm">
          {staleWeek && <p className="text-xs text-amber-600">Referente à semana {stored!.week}. Gere de novo para a semana atual.</p>}
          <p className="font-medium">{review.resumo}</p>
          {review.progredir?.length > 0 && (
            <div>
              <p className="font-semibold text-emerald-600">Progredir</p>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">{review.progredir.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          {review.estagnou?.length > 0 && (
            <div>
              <p className="font-semibold text-amber-600">Estagnou</p>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">{review.estagnou.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          {review.deload && <p className="rounded-lg bg-sky-100 px-2 py-1 font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">Sugestão: semana de deload.</p>}
          {review.nudge && <p className="text-slate-500">💡 {review.nudge}</p>}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button className="btn-secondary" onClick={run} disabled={loading}>
        {loading ? 'Analisando a semana…' : review ? 'Gerar de novo' : 'Gerar revisão da semana'}
      </button>
      <p className="text-xs text-slate-400">
        Resumo por IA, fora do treino. Semana {aggregate.week} · {aggregate.adherence.done}/{aggregate.adherence.planned} treinos.
      </p>
    </section>
  );
}
