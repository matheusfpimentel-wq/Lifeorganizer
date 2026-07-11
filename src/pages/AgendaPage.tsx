import { useState } from 'react';
import { useActiveHousehold, useHouseholdPeople } from '@/features/households/hooks';
import { BuiltinAvatar } from '@/components/avatars';
import {
  useCancelOccurrence,
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  type EventRow,
} from '@/features/events/hooks';
import { useRoutineBlocks } from '@/features/routine/hooks';
import EventForm from '@/features/events/EventForm';
import { expandEventOccurrences, type EventInput, type EventOccurrence } from '@/core/calendar';
import { monthMatrix, spDateKey, weekDays, WEEKDAY_LABELS, WEEKDAY_FULL } from '@/lib/dates';
import { formatTime } from '@/lib/format';
import { routineCategoryLabels } from '@/shared/labels';
import { useUiStore } from '@/stores/ui';
import { Icon } from '@/components/icons';

type View = 'agenda' | 'week' | 'month';
const WEEK_START = 0 as const; // domingo (padrão do lar)

export default function AgendaPage() {
  const { householdId } = useActiveHousehold();
  const events = useEvents(householdId);
  const routine = useRoutineBlocks(householdId);
  const createEvent = useCreateEvent(householdId);
  const deleteEvent = useDeleteEvent(householdId);
  const cancelOccurrence = useCancelOccurrence(householdId);
  const { people, profileById } = useHouseholdPeople(householdId);

  const memberFilter = useUiStore((s) => s.memberFilter);
  const setMemberFilter = useUiStore((s) => s.setMemberFilter);

  const [view, setView] = useState<View>('agenda');
  const [showForm, setShowForm] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showRoutine, setShowRoutine] = useState(true);

  const now = new Date();
  const memberColor = (id: string) => people.find((p) => p.id === id)?.color ?? '#64748b';
  const memberOptions = people.map((p) => ({ id: p.id, name: p.name }));

  const eventById = new Map((events.data ?? []).map((e) => [e.$id, e]));

  // aplica o filtro por membro (evento do lar inteiro sempre aparece)
  const visibleEvents = (events.data ?? []).filter(
    (e) => !memberFilter || (e.memberIds ?? []).length === 0 || (e.memberIds ?? []).includes(memberFilter),
  );

  const eventColor = (e: EventRow) => {
    const ids: string[] = e.memberIds ?? [];
    return ids.length ? memberColor(ids[0]) : '#0ea5e9';
  };

  function occKey(o: EventOccurrence) {
    return `${o.eventId}|${o.startAt.toISOString()}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Fechar' : '+ Evento'}
        </button>
      </div>

      {showForm && (
        <EventForm
          members={memberOptions}
          submitting={createEvent.isPending}
          onSubmit={(values) => createEvent.mutate(values, { onSuccess: () => setShowForm(false) })}
          onCancel={() => setShowForm(false)}
        />
      )}
      {createEvent.isError && <p className="text-sm text-red-600">{(createEvent.error as Error).message}</p>}

      {/* filtro por membro */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-full px-3 py-1 text-sm ${!memberFilter ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
          onClick={() => setMemberFilter(null)}
        >
          Todos
        </button>
        {people.map((p) => {
          const avatar = profileById.get(p.id)?.avatar as string | undefined;
          return (
            <button
              key={p.id}
              className={`flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-sm transition-transform active:scale-95 ${memberFilter === p.id ? 'text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
              style={memberFilter === p.id ? { backgroundColor: p.color ?? '#64748b' } : undefined}
              onClick={() => setMemberFilter(memberFilter === p.id ? null : p.id)}
            >
              {avatar ? (
                <BuiltinAvatar slug={avatar} className="h-5 w-5 rounded-full" />
              ) : (
                <span className="h-5 w-5 rounded-full text-center text-[11px] font-bold leading-5 text-white" style={{ backgroundColor: p.color ?? '#64748b' }}>
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              {p.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(['agenda', 'week', 'month'] as const).map((v) => (
          <button
            key={v}
            className={`min-h-[40px] rounded-lg text-sm font-medium ${view === v ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500'}`}
            onClick={() => setView(v)}
          >
            {v === 'agenda' ? 'Agenda' : v === 'week' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      {events.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : view === 'agenda' ? (
        <AgendaList
          occurrences={expandEventOccurrences(
            visibleEvents as unknown as EventInput[],
            now,
            new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
          )}
          eventById={eventById}
          eventColor={eventColor}
          occKey={occKey}
          onCancel={(o) => {
            const e = eventById.get(o.eventId);
            if (!e) return;
            if (e.rrule) cancelOccurrence.mutate({ event: e, occurrenceStart: o.startAt.toISOString() });
            else if (confirm(`Excluir "${e.title}"?`)) deleteEvent.mutate(e.$id);
          }}
        />
      ) : view === 'month' ? (
        <MonthView
          now={now}
          monthOffset={monthOffset}
          setMonthOffset={(n) => { setMonthOffset(n); setSelectedDay(null); }}
          visibleEvents={visibleEvents}
          eventById={eventById}
          eventColor={eventColor}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
        />
      ) : (
        <WeekView
          now={now}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          visibleEvents={visibleEvents}
          eventById={eventById}
          eventColor={eventColor}
          routineBlocks={routine.data ?? []}
          showRoutine={showRoutine}
          setShowRoutine={setShowRoutine}
          memberFilter={memberFilter}
          memberColor={memberColor}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function OccurrenceItem({
  o,
  event,
  color,
  onCancel,
}: {
  o: EventOccurrence;
  event: EventRow | undefined;
  color: string;
  onCancel: () => void;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="h-8 w-1 rounded-full" style={{ backgroundColor: color }} />
      <div className="flex-1">
        <p className="font-medium">{event?.title ?? 'Evento'}</p>
        <p className="text-sm text-slate-500">
          {event?.allDay ? 'Dia inteiro' : `${formatTime(o.startAt)}–${formatTime(o.endAt)}`}
          {event?.location ? ` · ${event.location}` : ''}
          {event?.rrule ? ' · repete' : ''}
        </p>
      </div>
      <button className="text-slate-400 hover:text-red-600" aria-label="Excluir" onClick={onCancel}><Icon.X className="h-4 w-4" /></button>
    </li>
  );
}

function AgendaList({
  occurrences,
  eventById,
  eventColor,
  occKey,
  onCancel,
}: {
  occurrences: EventOccurrence[];
  eventById: Map<string, EventRow>;
  eventColor: (e: EventRow) => string;
  occKey: (o: EventOccurrence) => string;
  onCancel: (o: EventOccurrence) => void;
}) {
  if (occurrences.length === 0) {
    return <div className="card text-center text-slate-500">Nenhum evento nos próximos 45 dias.</div>;
  }
  const groups = new Map<string, EventOccurrence[]>();
  for (const o of occurrences) {
    const key = spDateKey(o.startAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(o);
  }
  return (
    <div className="flex flex-col gap-3">
      {[...groups.entries()].map(([day, occs]) => (
        <section key={day} className="card">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: 'long' }).format(occs[0].startAt)}
          </h2>
          <ul className="flex flex-col gap-2">
            {occs.map((o) => {
              const e = eventById.get(o.eventId);
              return (
                <OccurrenceItem key={occKey(o)} o={o} event={e} color={e ? eventColor(e) : '#0ea5e9'} onCancel={() => onCancel(o)} />
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MonthView({
  now,
  monthOffset,
  setMonthOffset,
  visibleEvents,
  eventById,
  eventColor,
  selectedDay,
  setSelectedDay,
}: {
  now: Date;
  monthOffset: number;
  setMonthOffset: (n: number) => void;
  visibleEvents: EventRow[];
  eventById: Map<string, EventRow>;
  eventColor: (e: EventRow) => string;
  selectedDay: string | null;
  setSelectedDay: (k: string | null) => void;
}) {
  const grid = monthMatrix(now, monthOffset, WEEK_START);
  const occurrences = expandEventOccurrences(
            visibleEvents as unknown as EventInput[], grid.startUtc, grid.endUtc);
  const byDay = new Map<string, EventOccurrence[]>();
  for (const o of occurrences) {
    const k = spDateKey(o.startAt);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(o);
  }
  const dayHeaders = Array.from({ length: 7 }, (_, i) => WEEKDAY_LABELS[(WEEK_START + i) % 7]);
  const selectedOccs = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button className="btn-secondary !min-h-[36px] !px-2" aria-label="Mês anterior" onClick={() => setMonthOffset(monthOffset - 1)}><Icon.ChevronLeft className="h-4 w-4" /></button>
        <h2 className="font-semibold capitalize">{grid.label}</h2>
        <button className="btn-secondary !min-h-[36px] !px-2" aria-label="Próximo mês" onClick={() => setMonthOffset(monthOffset + 1)}><Icon.ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="card">
        <div className="grid grid-cols-7 text-center text-xs text-slate-400">
          {dayHeaders.map((d) => <div key={d} className="pb-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.cells.map((cell) => {
            const occs = byDay.get(cell.key) ?? [];
            return (
              <button
                key={cell.key}
                onClick={() => setSelectedDay(cell.key)}
                className={`flex aspect-square flex-col items-center justify-start rounded-lg p-1 text-sm ${
                  cell.inMonth ? '' : 'text-slate-300 dark:text-slate-600'
                } ${cell.isToday ? 'bg-brand-100 dark:bg-brand-900' : ''} ${
                  selectedDay === cell.key ? 'ring-2 ring-brand-500' : ''
                }`}
              >
                <span>{cell.dayOfMonth}</span>
                <span className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                  {occs.slice(0, 3).map((o, i) => {
                    const e = eventById.get(o.eventId);
                    return <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: e ? eventColor(e) : '#0ea5e9' }} />;
                  })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <section className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">
            {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${selectedDay}T12:00:00-03:00`))}
          </h3>
          {selectedOccs.length === 0 ? (
            <p className="text-slate-500">Sem eventos.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedOccs.map((o, i) => {
                const e = eventById.get(o.eventId);
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="h-8 w-1 rounded-full" style={{ backgroundColor: e ? eventColor(e) : '#0ea5e9' }} />
                    <div>
                      <p className="font-medium">{e?.title ?? 'Evento'}</p>
                      <p className="text-sm text-slate-500">{e?.allDay ? 'Dia inteiro' : `${formatTime(o.startAt)}–${formatTime(o.endAt)}`}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function WeekView({
  now,
  weekOffset,
  setWeekOffset,
  visibleEvents,
  eventById,
  eventColor,
  routineBlocks,
  showRoutine,
  setShowRoutine,
  memberFilter,
  memberColor,
}: {
  now: Date;
  weekOffset: number;
  setWeekOffset: (n: number) => void;
  visibleEvents: EventRow[];
  eventById: Map<string, EventRow>;
  eventColor: (e: EventRow) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routineBlocks: (Record<string, any> & { $id: string })[];
  showRoutine: boolean;
  setShowRoutine: (b: boolean) => void;
  memberFilter: string | null;
  memberColor: (id: string) => string;
}) {
  const week = weekDays(now, weekOffset, WEEK_START);
  const occurrences = expandEventOccurrences(
            visibleEvents as unknown as EventInput[], week.startUtc, week.endUtc);
  const byDay = new Map<string, EventOccurrence[]>();
  for (const o of occurrences) {
    const k = spDateKey(o.startAt);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(o);
  }
  const routineForWeekday = (weekday: number) =>
    routineBlocks
      .filter((b) => (b.weekdays ?? []).includes(weekday))
      .filter((b) => !memberFilter || !b.memberId || b.memberId === memberFilter)
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button className="btn-secondary !min-h-[36px] !px-2" aria-label="Semana anterior" onClick={() => setWeekOffset(weekOffset - 1)}><Icon.ChevronLeft className="h-4 w-4" /></button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={showRoutine} onChange={(e) => setShowRoutine(e.target.checked)} />
          Rotina
        </label>
        <button className="btn-secondary !min-h-[36px] !px-2" aria-label="Próxima semana" onClick={() => setWeekOffset(weekOffset + 1)}><Icon.ChevronRight className="h-4 w-4" /></button>
      </div>
      {week.days.map((day) => {
        const occs = byDay.get(day.key) ?? [];
        const blocks = showRoutine ? routineForWeekday(day.weekday) : [];
        return (
          <section key={day.key} className="card">
            <h3 className="mb-2 text-sm font-semibold text-slate-500">
              {WEEKDAY_FULL[day.weekday]} · {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(day.startUtc)}
            </h3>
            {occs.length === 0 && blocks.length === 0 ? (
              <p className="text-sm text-slate-400">—</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {occs.map((o, i) => {
                  const e = eventById.get(o.eventId);
                  return (
                    <li key={`e${i}`} className="flex items-center gap-2 text-sm">
                      <span className="h-4 w-1 rounded-full" style={{ backgroundColor: e ? eventColor(e) : '#0ea5e9' }} />
                      <span className="text-slate-500">{e?.allDay ? '—' : formatTime(o.startAt)}</span>
                      <span>{e?.title ?? 'Evento'}</span>
                    </li>
                  );
                })}
                {blocks.map((b) => (
                  <li key={`r${b.$id}`} className="flex items-center gap-2 text-sm opacity-80">
                    <span className="h-4 w-1 rounded-full" style={{ backgroundColor: b.color ?? (b.memberId ? memberColor(b.memberId) : '#94a3b8') }} />
                    <span className="text-slate-500">{b.startTime}</span>
                    <span>{b.title}</span>
                    <span className="text-xs text-slate-400">· {routineCategoryLabels[b.category] ?? b.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
