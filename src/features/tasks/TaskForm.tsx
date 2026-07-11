import { useState, type FormEvent } from 'react';
import { taskCategoryLabels, taskPriorityLabels } from '@/shared/labels';
import { buildRrule, describeRrule, WEEKDAYS, type Frequency } from './weekdays';
import type { TaskRow } from './hooks';

export interface TaskFormValues {
  title: string;
  description: string | null;
  category: string;
  type: 'routine' | 'specific';
  rrule: string | null;
  dueDate: string | null;
  assignmentMode: 'volunteer' | 'fixed' | 'rotation';
  assignedMemberId: string | null;
  rotationMemberIds: string[];
  priority: 'baixa' | 'media' | 'alta';
  checklist: string;
  points: number;
  active: boolean;
}

interface Props {
  members: { id: string; name: string }[];
  initial?: TaskRow;
  submitting?: boolean;
  onSubmit: (values: TaskFormValues) => void;
  onCancel?: () => void;
}

function parseChecklist(raw: unknown): { label: string; done: boolean }[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** localdate <-> ISO helpers para o input date (meio-dia BRT evita drift de fuso). */
function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const wall = new Date(d.getTime() - 3 * 60 * 60 * 1000); // BRT
  return wall.toISOString().slice(0, 10);
}
function dateInputToIso(value: string): string {
  return new Date(`${value}T12:00:00-03:00`).toISOString();
}

export default function TaskForm({ members, initial, submitting, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState<string>(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'limpeza');
  const [type, setType] = useState<'routine' | 'specific'>(initial?.type ?? 'specific');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>(initial?.priority ?? 'media');
  const [points, setPoints] = useState<number>(initial?.points ?? 1);

  const initialFreq: Frequency =
    (initial?.rrule?.match(/FREQ=(\w+)/)?.[1] as Frequency) ?? 'WEEKLY';
  const [freq, setFreq] = useState<Frequency>(initialFreq);
  const [byday, setByday] = useState<string[]>(
    initial?.rrule?.match(/BYDAY=([^;]+)/)?.[1]?.split(',') ?? ['MO'],
  );
  const [dueDate, setDueDate] = useState<string>(isoToDateInput(initial?.dueDate));

  const [mode, setMode] = useState<'volunteer' | 'fixed' | 'rotation'>(
    initial?.assignmentMode ?? 'volunteer',
  );
  const [assignee, setAssignee] = useState(initial?.assignedMemberId ?? members[0]?.id ?? '');
  const [rotationIds, setRotationIds] = useState<string[]>(
    initial?.rotationMemberIds ?? members.map((m) => m.id),
  );
  const [checklist, setChecklist] = useState<{ label: string; done: boolean }[]>(
    parseChecklist(initial?.checklist),
  );

  function toggleByday(code: string) {
    setByday((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }
  function toggleRotation(id: string) {
    setRotationIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      category,
      type,
      rrule: type === 'routine' ? buildRrule(freq, byday) : null,
      dueDate: type === 'specific' && dueDate ? dateInputToIso(dueDate) : null,
      assignmentMode: mode,
      assignedMemberId: mode === 'fixed' ? assignee : null,
      rotationMemberIds: mode === 'rotation' ? rotationIds : [],
      priority,
      checklist: JSON.stringify(checklist.filter((c) => c.label.trim())),
      points,
      active: initial?.active ?? true,
    });
  }

  return (
    <form className="card flex flex-col gap-3" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="taskTitle">Título</label>
        <input id="taskTitle" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </div>

      <div>
        <label className="label" htmlFor="taskDescription">Descrição (opcional)</label>
        <textarea id="taskDescription" className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="taskCategory">Categoria</label>
          <select id="taskCategory" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(taskCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="taskType">Tipo</label>
          <select id="taskType" className="input" value={type} onChange={(e) => setType(e.target.value as 'routine' | 'specific')}>
            <option value="specific">Específica (uma data)</option>
            <option value="routine">Rotineira (repete)</option>
          </select>
        </div>
      </div>

      {type === 'routine' ? (
        <div className="flex flex-col gap-2">
          <div>
            <label className="label" htmlFor="taskFreq">Repetição</label>
            <select id="taskFreq" className="input" value={freq} onChange={(e) => setFreq(e.target.value as Frequency)}>
              <option value="DAILY">Diária</option>
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensal</option>
            </select>
          </div>
          {freq === 'WEEKLY' && (
            <div className="flex gap-1" role="group" aria-label="Dias da semana">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.code}
                  type="button"
                  aria-pressed={byday.includes(day.code)}
                  aria-label={day.label}
                  onClick={() => toggleByday(day.code)}
                  className={`h-10 flex-1 rounded-lg text-sm font-medium ${
                    byday.includes(day.code)
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {day.short}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="taskDue">Data (opcional)</label>
          <input id="taskDue" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">Sem data, a tarefa fica em "Sem data" nas pendências até alguém concluir.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="taskPriority">Prioridade</label>
          <select id="taskPriority" className="input" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
            {Object.entries(taskPriorityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="taskPoints">Pontos (esforço)</label>
          <input id="taskPoints" type="number" min={1} max={100} className="input" value={points} onChange={(e) => setPoints(Math.max(1, Number(e.target.value)))} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="taskMode">Atribuição</label>
        <select id="taskMode" className="input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="volunteer">Voluntário (quem pegar)</option>
          <option value="fixed">Responsável fixo</option>
          <option value="rotation">Revezamento</option>
        </select>
      </div>

      {mode === 'fixed' && (
        <div>
          <label className="label" htmlFor="taskAssignee">Responsável</label>
          <select id="taskAssignee" className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {mode === 'rotation' && (
        <fieldset className="flex flex-col gap-1">
          <legend className="label">Ordem do revezamento</legend>
          {members.map((m) => (
            <label key={m.id} className="flex min-h-[40px] items-center gap-2">
              <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={rotationIds.includes(m.id)} onChange={() => toggleRotation(m.id)} />
              {m.name}
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="label">Checklist (opcional)</legend>
        {checklist.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="input flex-1"
              value={item.label}
              placeholder={`Passo ${i + 1}`}
              onChange={(e) =>
                setChecklist((prev) => prev.map((c, idx) => (idx === i ? { ...c, label: e.target.value } : c)))
              }
            />
            <button type="button" className="btn-secondary !px-3" aria-label="Remover passo" onClick={() => setChecklist((prev) => prev.filter((_, idx) => idx !== i))}>
              <span aria-hidden>×</span>
            </button>
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={() => setChecklist((prev) => [...prev, { label: '', done: false }])}>
          + Passo
        </button>
      </fieldset>

      {type === 'routine' && (
        <p className="text-sm text-slate-500">
          {describeRrule(buildRrule(freq, byday))}. Ocorrências geradas automaticamente (14 dias).
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={submitting}>
          {initial ? 'Salvar' : 'Criar tarefa'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        )}
      </div>
    </form>
  );
}
