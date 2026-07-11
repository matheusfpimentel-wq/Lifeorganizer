import { useBalancePanel } from './hooks';

interface Props {
  householdId: string | null;
  members: { id: string; name: string; color?: string }[];
}

/**
 * Painel de equilíbrio — apresentação NEUTRA: contadores factuais dos últimos
 * 30 dias, sem ranking humilhante. Barras proporcionais aos pontos concluídos.
 */
export default function BalancePanel({ householdId, members }: Props) {
  const memberIds = members.map((m) => m.id);
  const { rows, totalCount, totalWeightedPoints, isLoading } = useBalancePanel(householdId, memberIds);

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? 'Membro';
  const colorOf = (id: string) => members.find((m) => m.id === id)?.color ?? '#64748b';

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />;
  }

  return (
    <section className="card flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">Equilíbrio (últimos 30 dias)</h2>
        <p className="text-sm text-slate-500">
          {totalCount} tarefa{totalCount === 1 ? '' : 's'} concluída{totalCount === 1 ? '' : 's'} ·{' '}
          {totalWeightedPoints} ponto{totalWeightedPoints === 1 ? '' : 's'}
        </p>
      </div>

      {totalCount === 0 ? (
        <p className="text-slate-500">Sem conclusões no período ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.memberId} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{nameOf(row.memberId)}</span>
                <span className="text-slate-500">
                  {row.count} tarefa{row.count === 1 ? '' : 's'} · {row.weightedPoints} pts ·{' '}
                  {Math.round(row.share * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round(row.share * 100)}%`, backgroundColor: colorOf(row.memberId) }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-400">
        Contagem factual para distribuir o trabalho — não é ranking.
      </p>
    </section>
  );
}
