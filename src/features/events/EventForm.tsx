import { useState, type FormEvent } from 'react';
import { toWall } from '@/lib/dates';
import type { EventInputData } from './hooks';
import type { EventRow } from './hooks';

interface Member {
  id: string;
  name: string;
}

interface Props {
  members: Member[];
  initial?: EventRow;
  submitting?: boolean;
  onSubmit: (values: EventInputData) => void;
  onCancel?: () => void;
}

const RRULE_PRESETS = [
  { label: 'Não repete', value: '' },
  { label: 'Todo dia', value: 'FREQ=DAILY' },
  { label: 'Toda semana', value: 'FREQ=WEEKLY' },
  { label: 'A cada 15 dias', value: 'FREQ=WEEKLY;INTERVAL=2' },
  { label: 'Todo mês', value: 'FREQ=MONTHLY' },
];

const REMINDER_OPTIONS = [
  { label: 'Na hora', value: 0 },
  { label: '10 min antes', value: 10 },
  { label: '30 min antes', value: 30 },
  { label: '1 h antes', value: 60 },
  { label: '1 dia antes', value: 1440 },
];

function isoToLocalInput(iso: string | undefined, fallbackHour: number): string {
  const base = iso ? new Date(iso) : (() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(fallbackHour);
    return d;
  })();
  return toWall(base).toISOString().slice(0, 16);
}
function localInputToIso(value: string): string {
  return new Date(`${value}:00-03:00`).toISOString();
}

export default function EventForm({ members, initial, submitting, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState<string>(initial?.description ?? '');
  const [location, setLocation] = useState<string>(initial?.location ?? '');
  const [startAt, setStartAt] = useState(isoToLocalInput(initial?.startAt, 9));
  const [endAt, setEndAt] = useState(isoToLocalInput(initial?.endAt, 10));
  const [allDay, setAllDay] = useState<boolean>(initial?.allDay ?? false);
  const [memberIds, setMemberIds] = useState<string[]>(initial?.memberIds ?? []);
  const [rrule, setRrule] = useState(initial?.rrule ?? '');
  const [reminders, setReminders] = useState<number[]>(initial?.reminderMinutes ?? [60]);

  function toggleMember(id: string) {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }
  function toggleReminder(v: number) {
    setReminders((prev) => (prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      startAt: localInputToIso(startAt),
      endAt: localInputToIso(endAt < startAt ? startAt : endAt),
      allDay,
      memberIds,
      rrule: rrule || null,
      reminderMinutes: reminders,
    });
  }

  return (
    <form className="card flex flex-col gap-3" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="evTitle">Título</label>
        <input id="evTitle" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="evStart">Início</label>
          <input id="evStart" type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="evEnd">Fim</label>
          <input id="evEnd" type="datetime-local" className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        <span>Dia inteiro</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="evLocation">Local (opcional)</label>
          <input id="evLocation" className="input" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} />
        </div>
        <div>
          <label className="label" htmlFor="evRrule">Repetição</label>
          <select id="evRrule" className="input" value={rrule} onChange={(e) => setRrule(e.target.value)}>
            {RRULE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="evDesc">Descrição (opcional)</label>
        <textarea id="evDesc" className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="label">Participantes (nenhum = lar inteiro)</legend>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={memberIds.includes(m.id)}
              onClick={() => toggleMember(m.id)}
              className={`rounded-full px-3 py-1 text-sm ${
                memberIds.includes(m.id) ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="label">Lembretes (push)</legend>
        <div className="flex flex-wrap gap-2">
          {REMINDER_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={reminders.includes(r.value)}
              onClick={() => toggleReminder(r.value)}
              className={`rounded-full px-3 py-1 text-sm ${
                reminders.includes(r.value) ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={submitting}>
          {initial ? 'Salvar' : 'Criar evento'}
        </button>
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}
