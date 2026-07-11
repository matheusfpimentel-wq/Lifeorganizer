import { useState } from 'react';
import { useExpenses, useMonthlyReport } from './hooks';
import { toCsv } from '@/core/report';
import { expenseCategoryLabels } from '@/shared/labels';
import { formatCentsBRL, formatDate } from '@/lib/format';
import { Icon } from '@/components/icons';

interface Props {
  householdId: string | null;
  memberName: (id: string) => string;
}

/** Baixa um CSV com BOM (Excel pt-BR lê acentos corretamente). */
function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MonthlyClosing({ householdId, memberName }: Props) {
  const [offset, setOffset] = useState(0);
  const report = useMonthlyReport(householdId, offset);
  const expenses = useExpenses(householdId);

  function handleExport() {
    const start = new Date(report.monthStart).getTime();
    const end = new Date(report.monthEnd).getTime();
    const rows = (expenses.data ?? [])
      .filter((e) => e.status !== 'pending')
      .filter((e) => {
        const t = new Date(e.date).getTime();
        return t >= start && t <= end;
      })
      .map((e) => [
        formatDate(e.date),
        e.description,
        expenseCategoryLabels[e.category] ?? e.category,
        memberName(e.paidBy),
        (e.amountCents / 100).toFixed(2).replace('.', ','),
      ]);
    const csv = toCsv(['Data', 'Descrição', 'Categoria', 'Pagou', 'Valor (R$)'], rows);
    downloadCsv(`morada-${report.monthLabel.replace(/\s/g, '-')}.csv`, csv);
  }

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button className="btn-secondary !min-h-[36px] !px-2" aria-label="Mês anterior" onClick={() => setOffset((o) => o - 1)}><Icon.ChevronLeft className="h-4 w-4" /></button>
        <h2 className="font-semibold capitalize">{report.monthLabel}</h2>
        <button className="btn-secondary !min-h-[36px] !px-2" aria-label="Próximo mês" disabled={offset >= 0} onClick={() => setOffset((o) => Math.min(0, o + 1))}><Icon.ChevronRight className="h-4 w-4" /></button>
      </div>

      {report.isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-500">Total do mês</p>
              <p className="text-2xl font-bold">{formatCentsBRL(report.summary.totalCents)}</p>
            </div>
            {report.deltaPercent !== null && (
              <span className={`text-sm ${report.deltaPercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {report.deltaPercent > 0 ? '+' : '−'}{Math.abs(report.deltaPercent)}% vs. mês anterior
              </span>
            )}
          </div>

          {report.summary.count === 0 ? (
            <p className="text-slate-500">Sem despesas neste mês.</p>
          ) : (
            <>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-500">Por categoria</h3>
                <ul className="flex flex-col gap-1">
                  {report.summary.byCategory.map((c) => (
                    <li key={c.category} className="flex justify-between">
                      <span>{expenseCategoryLabels[c.category] ?? c.category}</span>
                      <span>{formatCentsBRL(c.totalCents)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-500">Quem pagou</h3>
                <ul className="flex flex-col gap-1">
                  {report.summary.byPayer.map((p) => (
                    <li key={p.memberId} className="flex justify-between">
                      <span>{memberName(p.memberId)}</span>
                      <span>{formatCentsBRL(p.totalCents)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button className="btn-secondary" onClick={handleExport}>Exportar CSV</button>
            </>
          )}
        </>
      )}
    </section>
  );
}
