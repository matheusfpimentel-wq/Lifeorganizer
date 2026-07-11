import { useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useHouseholdMembers, useProfiles } from '@/features/households/hooks';
import {
  useCreateRoutineBlock,
  useDeleteRoutineBlock,
  useRoutineBlocks,
  type RoutineRow,
} from '@/features/routine/hooks';
import { routineCategoryLabels } from '@/shared/labels';
import { WEEKDAY_FULL, WEEKDAY_LABELS } from '@/lib/dates';
import { Icon } from '@/components/icons';

const CATEGORIES = Object.keys(routineCategoryLabels);
const WEEK_ORDER = [0, 1, 2, 3, 4, 5, 6]; // domingo..sábado (padrão do lar)

export default function RoutinePage() {
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const blocks = useRoutineBlocks(householdId);
  const createBlock = useCreateRoutineBlock(householdId);
  const deleteBlock = useDeleteRoutineBlock(householdId);
  const { data: members } = useHouseholdMembers(householdId);
  const memberIds = useMemo(() => (members ?? []).map((m) => m.userId), [members]);
  const { data: profiles } = useProfiles(memberIds);

  const [showForm, setShowForm] = useState(false);
  const [onlyMe, setOnlyMe] = useState(false);

  // form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('trabalho');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [target, setTarget] = useState<'me' | 'household' | string>('me');

  const memberName = (id?: string | null) => (id ? profiles?.get(id)?.displayName ?? 'Membro' : 'Todos');
  const memberColor = (id?: string | null) => (id ? profiles?.get(id)?.color ?? '#94a3b8' : '#94a3b8');

  const visible = (blocks.data ?? []).filter(
    (b) => !onlyMe || b.memberId === user?.$id || !b.memberId,
  );

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (weekdays.length === 0 || startTime >= endTime) return;
    const memberId = target === 'me' ? user?.$id : target === 'household' ? null : target;
    createBlock.mutate(
      { title: title.trim(), category, weekdays, startTime, endTime, memberId, color: memberColor(memberId) },
      { onSuccess: () => { setShowForm(false); setTitle(''); } },
    );
  }

  const blocksForDay = (d: number) =>
    visible
      .filter((b) => (b.weekdays ?? []).includes(d))
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rotina semanal</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Fechar' : '+ Bloco'}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={onlyMe} onChange={(e) => setOnlyMe(e.target.checked)} />
        Mostrar só os meus (e do lar)
      </label>

      {showForm && (
        <form className="card flex flex-col gap-3" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="rbTitle">Título</label>
            <input id="rbTitle" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={128} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="rbCategory">Categoria</label>
              <select id="rbCategory" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{routineCategoryLabels[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="rbTarget">De quem</label>
              <select id="rbTarget" className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="me">Eu</option>
                <option value="household">Lar inteiro</option>
                {memberIds.filter((id) => id !== user?.$id).map((id) => (
                  <option key={id} value={id}>{memberName(id)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="rbStart">Início</label>
              <input id="rbStart" type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="rbEnd">Fim</label>
              <input id="rbEnd" type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div>
            <span className="label">Dias</span>
            <div className="flex gap-1">
              {WEEK_ORDER.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={weekdays.includes(d)}
                  aria-label={WEEKDAY_FULL[d]}
                  onClick={() => toggleWeekday(d)}
                  className={`h-10 flex-1 rounded-lg text-sm font-medium ${weekdays.includes(d) ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  {WEEKDAY_LABELS[d][0]}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={createBlock.isPending}>Criar bloco</button>
          {createBlock.isError && <p className="text-sm text-red-600">{(createBlock.error as Error).message}</p>}
        </form>
      )}

      {blocks.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        WEEK_ORDER.map((d) => {
          const dayBlocks = blocksForDay(d);
          return (
            <section key={d} className="card">
              <h2 className="mb-2 text-sm font-semibold text-slate-500">{WEEKDAY_FULL[d]}</h2>
              {dayBlocks.length === 0 ? (
                <p className="text-sm text-slate-400">—</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {dayBlocks.map((b: RoutineRow) => (
                    <li key={`${d}-${b.$id}`} className="flex items-center gap-2 text-sm">
                      <span className="h-6 w-1 rounded-full" style={{ backgroundColor: b.color ?? memberColor(b.memberId) }} />
                      <span className="w-24 text-slate-500">{b.startTime}–{b.endTime}</span>
                      <span className="flex-1">{b.title}</span>
                      <span className="text-xs text-slate-400">{memberName(b.memberId).split(' ')[0]}</span>
                      <button className="text-slate-400 hover:text-red-600" aria-label="Excluir" onClick={() => deleteBlock.mutate(b.$id)}><Icon.X className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
