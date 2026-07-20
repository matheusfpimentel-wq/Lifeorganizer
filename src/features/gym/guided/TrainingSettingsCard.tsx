/** Preferências do Treino (locais): unidade, som/vibração, incrementos, proteína. */
import { useState } from 'react';
import { useTrainingStore } from '@/stores/training';
import { Icon } from '@/components/icons';

export default function TrainingSettingsCard() {
  const settings = useTrainingStore((s) => s.settings);
  const setSettings = useTrainingStore((s) => s.setSettings);
  const [open, setOpen] = useState(false);

  return (
    <section className="card">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen((o) => !o)}>
        <span className="flex items-center gap-2 font-bold">
          <Icon.Settings className="h-4 w-4 text-slate-400" />
          Preferências do treino
        </span>
        <span className="text-slate-400">{open ? <Icon.ChevronUp className="h-4 w-4" /> : <Icon.ChevronDown className="h-4 w-4" />}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          <div>
            <label className="label" htmlFor="unitSel">Unidade de carga</label>
            <select id="unitSel" className="input" value={settings.units} onChange={(e) => setSettings({ units: e.target.value as 'kg' | 'lb' })}>
              <option value="kg">Quilos (kg)</option>
              <option value="lb">Libras (lb)</option>
            </select>
          </div>

          <label className="flex items-center justify-between gap-2">
            <span>Som ao fim do descanso</span>
            <input type="checkbox" className="h-6 w-6 accent-brand-600" checked={settings.sound} onChange={(e) => setSettings({ sound: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span>Vibração ao fim do descanso</span>
            <input type="checkbox" className="h-6 w-6 accent-brand-600" checked={settings.vibration} onChange={(e) => setSettings({ vibration: e.target.checked })} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold">
              Incremento composto ({settings.units})
              <input type="number" min={0} step="0.5" className="input mt-1" value={settings.incrementCompound}
                onChange={(e) => setSettings({ incrementCompound: Math.max(0, Number(e.target.value)) })} />
            </label>
            <label className="text-sm font-semibold">
              Incremento isolador ({settings.units})
              <input type="number" min={0} step="0.5" className="input mt-1" value={settings.incrementIsolation}
                onChange={(e) => setSettings({ incrementIsolation: Math.max(0, Number(e.target.value)) })} />
            </label>
          </div>

          <label className="text-sm font-semibold">
            Meta de proteína (g/dia)
            <input type="number" min={0} className="input mt-1" value={settings.proteinTargetG}
              onChange={(e) => setSettings({ proteinTargetG: Math.max(0, Math.round(Number(e.target.value))) })} />
          </label>
          <p className="text-xs text-slate-400">Usadas na sugestão de carga (progressão) e nos lembretes. Ficam salvas neste aparelho.</p>
        </div>
      )}
    </section>
  );
}
