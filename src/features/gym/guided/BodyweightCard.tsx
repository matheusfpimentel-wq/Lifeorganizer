/**
 * Peso corporal: registro rápido + gráfico da tendência (pontos brutos e média
 * móvel de 7 dias, que é o que importa para acompanhar recomposição).
 */
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { movingAverageByDate } from '@/core/workout';
import { useAddBodyweight, useBodyweight, useDeleteBodyweight } from '../trainingHooks';
import { useTrainingStore } from '@/stores/training';
import { formatDate } from '@/lib/format';
import { Icon } from '@/components/icons';

export default function BodyweightCard({ householdId, memberId }: { householdId: string | null; memberId: string | null }) {
  const units = useTrainingStore((s) => s.settings.units);
  const logs = useBodyweight(householdId, memberId);
  const addBodyweight = useAddBodyweight(householdId, memberId);
  const deleteBodyweight = useDeleteBodyweight(householdId, memberId);
  const [value, setValue] = useState('');

  const rows = useMemo(() => logs.data ?? [], [logs.data]);
  const chart = useMemo(() => {
    const points = rows.map((r) => ({ date: String(r.date).slice(0, 10), value: r.weightKg }));
    const ma = movingAverageByDate(points, 7);
    return points.map((p, i) => ({ dia: p.date.slice(5), peso: p.value, media: ma[i]?.avg }));
  }, [rows]);

  const latest = rows[rows.length - 1];
  const first = rows[0];
  const delta = latest && first ? Math.round((latest.weightKg - first.weightKg) * 10) / 10 : 0;

  function add() {
    const w = Number(value.replace(',', '.'));
    if (w > 0) {
      addBodyweight(w);
      setValue('');
    }
  }

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Peso corporal</h2>
        {latest && (
          <span className="text-sm text-slate-500">
            atual <strong>{latest.weightKg}{units}</strong>
            {rows.length > 1 && (
              <span className={delta === 0 ? '' : delta < 0 ? ' text-emerald-600' : ' text-amber-600'}>
                {' '}({delta > 0 ? '+' : ''}{delta}{units})
              </span>
            )}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input inputMode="decimal" className="input flex-1" placeholder={`Registrar peso (${units})`} value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn-secondary" onClick={add} disabled={!value}>Salvar</button>
      </div>

      {rows.length >= 2 ? (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="dia" fontSize={11} />
            <YAxis fontSize={11} width={48} domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(1)} />
            <Tooltip />
            <Line type="monotone" dataKey="peso" stroke="#94a3b8" strokeWidth={1} dot={{ r: 2 }} name="peso" />
            <Line type="monotone" dataKey="media" stroke="#0ea5e9" strokeWidth={2.5} dot={false} name="média 7d" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-slate-500">Registre alguns dias para ver a tendência (média de 7 dias).</p>
      )}

      {rows.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-slate-500">Ver registros</summary>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {[...rows].reverse().slice(0, 12).map((r) => (
              <li key={r.$id} className="flex items-center justify-between">
                <span>{formatDate(r.date)} · {r.weightKg}{units}</span>
                <button className="text-slate-400 hover:text-red-600" aria-label="Excluir" onClick={() => void deleteBodyweight(r.$id)}>
                  <Icon.X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
