import { useMemo, useState } from 'react';
import { useActiveHousehold, useHouseholdMembers, useProfiles } from '@/features/households/hooks';
import {
  useCreateTask,
  useDeleteTask,
  useOccurrences,
  useOccurrenceAction,
  useTasks,
  useUpdateTask,
  type TaskRow,
} from '@/features/tasks/hooks';
import TaskForm, { type TaskFormValues } from '@/features/tasks/TaskForm';
import BalancePanel from '@/features/tasks/BalancePanel';
import { describeRrule } from '@/features/tasks/weekdays';
import { taskCategoryLabels } from '@/shared/labels';
import { formatDate } from '@/lib/format';

type Tab = 'pending' | 'models' | 'balance';

export default function TasksPage() {
  const { householdId } = useActiveHousehold();
  const tasks = useTasks(householdId, true);
  const occurrences = useOccurrences(householdId);
  const action = useOccurrenceAction(householdId);
  const createTask = useCreateTask(householdId);
  const updateTask = useUpdateTask(householdId);
  const deleteTask = useDeleteTask(householdId);
  const { data: members } = useHouseholdMembers(householdId);
  const memberIds = useMemo(() => (members ?? []).map((m) => m.userId), [members]);
  const { data: profiles } = useProfiles(memberIds);

  const [tab, setTab] = useState<Tab>('pending');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);

  const memberName = (id?: string | null) =>
    id ? (profiles?.get(id)?.displayName ?? 'Membro') : 'Sem dono';
  const memberOptions = memberIds.map((id) => ({
    id,
    name: memberName(id),
    color: profiles?.get(id)?.color,
  }));

  const pending = (occurrences.data ?? []).filter((o) => o.status === 'pending');
  const taskById = new Map((tasks.data ?? []).map((t) => [t.$id, t]));

  function handleSubmit(values: TaskFormValues) {
    if (editing) {
      updateTask.mutate(
        { taskId: editing.$id, data: values },
        { onSuccess: () => { setEditing(null); setShowForm(false); } },
      );
    } else {
      createTask.mutate(values, { onSuccess: () => setShowForm(false) });
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pending', label: 'Pendências' },
    { id: 'models', label: 'Modelos' },
    { id: 'balance', label: 'Equilíbrio' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
        >
          {showForm && !editing ? 'Fechar' : '+ Nova'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`min-h-[40px] rounded-lg text-sm font-medium ${
              tab === t.id ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(showForm || editing) && (
        <TaskForm
          members={memberOptions}
          initial={editing ?? undefined}
          submitting={createTask.isPending || updateTask.isPending}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {(createTask.isError || updateTask.isError) && (
        <p className="text-sm text-red-600">
          {((createTask.error ?? updateTask.error) as Error).message}
        </p>
      )}

      {tab === 'pending' &&
        (occurrences.isLoading ? (
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
                <li
                  key={o.$id}
                  className={`card flex items-center justify-between gap-2 ${overdue ? 'border-l-4 border-amber-500' : ''}`}
                >
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
                    <button className="btn-secondary !min-h-[36px] !px-2 text-sm" aria-label="Concluir" onClick={() => action.mutate({ occurrenceId: o.$id, action: 'done' })}>
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
        ))}

      {tab === 'models' &&
        (tasks.isLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ) : (tasks.data ?? []).length === 0 ? (
          <div className="card text-center text-slate-500">Nenhum modelo de tarefa.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {(tasks.data ?? []).map((task) => (
              <li key={task.$id} className={`card flex items-center justify-between gap-2 ${task.active ? '' : 'opacity-60'}`}>
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-slate-500">
                    {task.type === 'routine' && task.rrule ? describeRrule(task.rrule) : 'Data única'}
                    {' · '}
                    {taskCategoryLabels[task.category] ?? task.category}
                    {task.assignmentMode === 'rotation' && ' · revezamento'}
                    {!task.active && ' · pausada'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    className="btn-secondary !min-h-[36px] !px-2 text-sm"
                    onClick={() => updateTask.mutate({ taskId: task.$id, data: { active: !task.active } })}
                  >
                    {task.active ? 'Pausar' : 'Ativar'}
                  </button>
                  <button
                    className="btn-secondary !min-h-[36px] !px-2 text-sm"
                    onClick={() => { setEditing(task); setShowForm(false); }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-secondary !min-h-[36px] !px-2 text-sm text-red-600"
                    aria-label="Excluir"
                    onClick={() => {
                      if (confirm(`Excluir "${task.title}" e suas ocorrências?`)) deleteTask.mutate(task.$id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === 'balance' && <BalancePanel householdId={householdId} members={memberOptions} />}
    </div>
  );
}
