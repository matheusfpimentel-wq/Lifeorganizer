import { useBalancePanel, usePlanningPanel } from './hooks';

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
  const planning = usePlanningPanel(householdId, memberIds);

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? 'Membro';
  const colorOf = (id: string) => members.find((m) => m.id === id)?.color ?? '#64748b';

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="card flex flex-col gap-1 border-l-4 border-brand-500">
        <h2 className="font-semibold">Como funciona</h2>
        <p className="text-sm text-slate-500">
          Cada tarefa vale <strong>pontos</strong> conforme o esforço (você define ao criar — lavar a
          louça pode valer 1, faxina geral 5). Este painel soma os pontos das tarefas que cada pessoa
          <strong> concluiu nos últimos 30 dias</strong>, para vocês enxergarem como o trabalho da casa
          está dividido e combinarem ajustes. Não é competição: é um retrato para conversar.
        </p>
      </section>

      <section className="card flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">Divisão dos últimos 30 dias</h2>
          <p className="text-sm text-slate-500">
            {totalCount} tarefa{totalCount === 1 ? '' : 's'} concluída{totalCount === 1 ? '' : 's'} ·{' '}
            {totalWeightedPoints} ponto{totalWeightedPoints === 1 ? '' : 's'} no total
          </p>
        </div>

        {totalCount === 0 ? (
          <p className="text-slate-500">
            Nenhuma tarefa concluída no período ainda. Conforme vocês forem concluindo, as barras
            aparecem aqui.
          </p>
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
      </section>

      <section className="card flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">Carga mental (30 dias)</h2>
          <p className="text-sm text-slate-500">
            Planejar também é trabalho: aqui contam os <strong>modelos de tarefa criados</strong>, os{' '}
            <strong>eventos agendados</strong> e as <strong>despesas lançadas</strong> por cada pessoa —
            o lado invisível de organizar a casa.
          </p>
        </div>
        {planning.isLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : planning.total === 0 ? (
          <p className="text-slate-500">Nada planejado no período ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {planning.rows.map((row) => (
              <li key={row.memberId} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{nameOf(row.memberId)}</span>
                  <span className="text-slate-500">
                    {row.count} ato{row.count === 1 ? '' : 's'} de organização · {Math.round(row.share * 100)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full opacity-70 transition-all"
                    style={{ width: `${Math.round(row.share * 100)}%`, backgroundColor: colorOf(row.memberId) }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
