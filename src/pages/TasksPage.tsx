import { useMemo, useState, type FormEvent } from 'react';
import { useActiveHousehold, useHouseholdMembers, useProfiles } from '@/features/households/hooks';
import { useCreateTask, useOccurrences, useOccurrenceAction, useTasks } from '@/features/tasks/hooks';
import { taskCategoryLabels } from '@/shared/labels';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/features/auth/AuthContext';

const RRULE_PRESETS = [
  { label: 'Todo dia', value: 'FREQ=DAILY' },
  { label: 'Dias úteis', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { label: 'Toda semana', value: 'FREQ=WEEKLY' },
  { label: 'Quinzenal', value: 'FREQ=WEEKLY;INTERVAL=2' },
  { label: 'Todo mês', value: 'FREQ=MONTHLY' },
];

export default function TasksPage() {
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const tasks = useTasks(householdId);
  const occurrences = useOccurrences(householdId);
  const action = useOccurrenceAction(householdId);
  const createTask = useCreateTask(householdId);
  const { data: members } = useHouseholdMembers(householdId);
  const memberIds = useMemo(() => (members ?? []).map((m) => m.userId), [members]);
  const { data: profiles } = useProfiles(memberIds);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('limpeza');
  const [type, setType] = useState<'routine' | 'specific'>('specific');
  const [rrule, setRrule] = useState(RRULE_PRESETS[0].value);
  const [dueDate, setDueDate] = useState('');
  const [mode, setMode] = useState<'volunteer' | 'fixed' | 'rotation'>('volunteer');
  const [assignee, setAssignee] = useState('');

  const memberName = (id?: string | null) =>
    id ? (profiles?.get(id)?.displayName ?? 'Membro') : 'Sem dono';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createTask.mutate(
      {
        title,
        category,
        type,
        rrule: type === 'routine' ? rrule : null,
        dueDate: type === 'specific' ? new Date(`${dueDate}T12:00:00-03:00`).toISOString() : null,
        assignmentMode: mode,
        assignedMemberId: mode === 'fixed' ? assignee || user?.$id : null,
        rotationMemberIds: mode === 'rotation' ? memberIds : [],
        rotationIndex: 0,
        priority: 'media',
        points: 1,
        active: true,
      },
      { onSuccess: () => { setShowForm(false); setTitle(''); } },
    );
  }

  const pending = (occurrences.data ?? []).filter((o) => o.status === 'pending');
  const taskById = new Map((tasks.data ?? []).map((t) => [t.$id, t]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Fechar' : '+ Nova'}
        </button>
      </div>

      {showForm && (
        <form className="card flex flex-col gap-3" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="taskTitle">Título</label>
            <input id="taskTitle" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
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
                <option value="specific">Específica</option>
                <option value="routine">Rotineira</option>
              </select>
            </div>
          </div>
          {type === 'routine' ? (
            <div>
              <label className="label" htmlFor="taskRrule">Repetição</label>
              <select id="taskRrule" className="input" value={rrule} onChange={(e) => setRrule(e.target.value)}>
                {RRULE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="taskDue">Data</label>
              <input id="taskDue" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          )}
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
                {memberIds.map((id) => (
                  <option key={id} value={id}>{memberName(id)}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={createTask.isPending}>Criar tarefa</button>
          {createTask.isError && <p className="text-sm text-red-600">{(createTask.error as Error).message}</p>}
        </form>
      )}

      {occurrences.isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : pending.length === 0 ? (
        <div className="card text-center text-slate-500">
          Nenhuma tarefa pendente. Crie a primeira! 🎉
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {pending.map((o) => {
            const task = taskById.get(o.taskId);
            const overdue = new Date(o.dueAt) < new Date();
            return (
              <li key={o.$id} className={`card flex items-center justify-between gap-2 ${overdue ? 'border-l-4 border-amber-500' : ''}`}>
                <div>
                  <p className="font-medium">{task?.title ?? 'Tarefa'}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(o.dueAt)} · {memberName(o.assignedMemberId)}
                    {task && ` · ${taskCategoryLabels[task.category] ?? task.category}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!o.assignedMemberId && (
                    <button className="btn-secondary !min-h-[36px] !px-2 text-sm" onClick={() => action.mutate({ occurrenceId: o.$id, action: 'claim' })}>
                      Pegar
                    </button>
                  )}
                  <button className="btn-secondary !min-h-[36px] !px-2 text-sm" onClick={() => action.mutate({ occurrenceId: o.$id, action: 'done' })}>
                    ✓
                  </button>
                  <button className="btn-secondary !min-h-[36px] !px-2 text-sm" onClick={() => action.mutate({ occurrenceId: o.$id, action: 'skipped' })}>
                    Pular
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
