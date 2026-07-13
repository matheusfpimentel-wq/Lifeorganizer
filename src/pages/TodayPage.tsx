import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useHouseholdMeta, useHouseholdPeople, useMyProfile } from '@/features/households/hooks';
import { useOccurrences, useOccurrenceAction, useTasks } from '@/features/tasks/hooks';
import { useActiveList, useListItems } from '@/features/shopping/hooks';
import { useBalances } from '@/features/expenses/hooks';
import { useCreateEvent, useEvents } from '@/features/events/hooks';
import { expandEventOccurrences, type EventInput } from '@/core/calendar';
import { formatTime, greeting, saoPauloDayBoundsUtc } from '@/lib/format';
import { formatDate } from '@/lib/format';
import { Icon } from '@/components/icons';
import VillageMap from '@/components/VillageMap';
import { useVillageProgress } from '@/features/village/hooks';
import { useWeather } from '@/features/weather/hooks';

export default function TodayPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { householdId } = useActiveHousehold();
  const { data: profile } = useMyProfile();
  const occurrences = useOccurrences(householdId);
  const tasksQuery = useTasks(householdId);
  const occurrenceAction = useOccurrenceAction(householdId);
  const activeList = useActiveList(householdId);
  const items = useListItems(activeList.data?.$id ?? null);
  const { balances, isLoading: balancesLoading } = useBalances(householdId);
  const events = useEvents(householdId);
  const createEvent = useCreateEvent(householdId);
  const villageProgress = useVillageProgress(householdId);
  const meta = useHouseholdMeta(householdId);
  const weather = useWeather();
  const { people, profileById } = useHouseholdPeople(householdId);
  const villagePeople = people.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    avatar: (profileById.get(p.id)?.avatar as string | undefined) ?? null,
  }));
  const pausedUntil = (() => {
    try {
      const settings = meta.data?.settings ? JSON.parse(meta.data.settings as string) : {};
      return typeof settings.pausedUntil === 'string' && new Date(settings.pausedUntil) > new Date()
        ? settings.pausedUntil
        : null;
    } catch {
      return null;
    }
  })();

  const [pickingDay, setPickingDay] = useState(false);
  const [shoppingDay, setShoppingDay] = useState('');

  const { start, end } = saoPauloDayBoundsUtc();
  const todayOccurrences = (occurrences.data ?? []).filter(
    (o) => o.status === 'pending' && new Date(o.dueAt) >= start && new Date(o.dueAt) <= end,
  );
  const overdue = (occurrences.data ?? []).filter(
    (o) => o.status === 'pending' && new Date(o.dueAt) < start,
  );
  const taskTitle = (taskId: string) =>
    tasksQuery.data?.find((t) => t.$id === taskId)?.title ?? 'Tarefa';

  const todayEvents = expandEventOccurrences(
    (events.data ?? []) as unknown as EventInput[],
    start,
    end,
  );
  const eventTitle = (id: string) => events.data?.find((e) => e.$id === id)?.title ?? 'Evento';

  const pendingItems = (items.data ?? []).filter((i) => !i.checked).length;
  const myBalance = user ? (balances.get(user.$id) ?? 0) : 0;

  // fumaça na chaminé: alguém concluiu tarefa hoje
  const completedToday = (occurrences.data ?? []).some(
    (o) =>
      o.status === 'done' &&
      o.completedAt &&
      new Date(o.completedAt) >= start &&
      new Date(o.completedAt) <= end,
  );

  // próximo evento de hoje ainda por vir (para a plaquinha da pracinha)
  const now = new Date();
  const upcomingEvent = todayEvents.find((o) => new Date(o.startAt) >= now);
  const nextEventLabel = upcomingEvent
    ? `${formatTime(upcomingEvent.startAt)} ${eventTitle(upcomingEvent.eventId)}`
    : null;

  // próximo "dia de compras" já agendado (evento futuro cujo título começa com "Compras")
  const nextShoppingEvent = (events.data ?? [])
    .filter((e) => (e.title as string).toLowerCase().startsWith('compras') && new Date(e.startAt) >= start)
    .sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)))[0];

  function scheduleShoppingDay() {
    if (!shoppingDay) return;
    const startAt = new Date(`${shoppingDay}T10:00:00-03:00`);
    createEvent.mutate(
      {
        title: 'Compras do mercado',
        startAt: startAt.toISOString(),
        endAt: new Date(startAt.getTime() + 90 * 60 * 1000).toISOString(),
        allDay: false,
        memberIds: [],
        reminderMinutes: [60],
        rrule: null,
      },
      { onSuccess: () => { setPickingDay(false); setShoppingDay(''); } },
    );
  }

  const WeatherIcon =
    weather.data?.kind === 'rain' || weather.data?.kind === 'storm'
      ? Icon.CloudRain
      : weather.data?.kind === 'clear'
        ? Icon.Sun
        : Icon.Cloud;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {new Intl.DateTimeFormat('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            }).format(new Date())}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {greeting()}, <span className="text-brand-600 dark:text-brand-400">{profile?.displayName?.split(' ')[0] ?? ''}</span>
          </h1>
        </div>
        {weather.data && (
          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <WeatherIcon
                className={`h-5 w-5 ${
                  weather.data.kind === 'clear'
                    ? 'text-amber-500'
                    : weather.data.kind === 'rain' || weather.data.kind === 'storm'
                      ? 'text-sky-600'
                      : 'text-slate-400'
                }`}
              />
              <span className="text-xl font-bold">{Math.round(weather.data.tempC)}°</span>
            </div>
            <p className="text-xs text-slate-500">
              {weather.data.tminC !== null && weather.data.tmaxC !== null
                ? `${Math.round(weather.data.tminC)}° / ${Math.round(weather.data.tmaxC)}°`
                : ''}
              {weather.data.rainProb !== null && weather.data.rainProb >= 30
                ? ` · chuva ${weather.data.rainProb}%`
                : ''}
            </p>
          </div>
        )}
      </div>

      {pausedUntil && (
        <section className="card border-l-4 border-sky-500">
          <h2 className="font-semibold text-sky-600">Modo férias</h2>
          <p className="text-sm text-slate-500">
            Rotinas pausadas até {new Date(pausedUntil).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.
            Aproveitem — nada vai acumular por aqui.
          </p>
        </section>
      )}

      {/* mapa da vila: casinha no centro, caminhos para cada módulo */}
      <VillageMap
        balanceCents={balancesLoading ? null : myBalance}
        marketCount={pendingItems}
        todayTasks={todayOccurrences.length}
        overdueTasks={overdue.length}
        nextEventLabel={nextEventLabel}
        completedToday={completedToday}
        progress={villageProgress.data}
        weather={weather.data?.kind ?? null}
        people={villagePeople}
      />

      {/* cards da home em 2 colunas */}
      <div className="grid grid-cols-2 items-start gap-3">

      {/* dia de compras -> agenda */}
      <section className="card col-span-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon.Calendar className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold">Dia de compras</h2>
          </div>
          {!pickingDay && (
            <button className="btn-secondary !min-h-[36px] !px-3 text-sm" onClick={() => setPickingDay(true)}>
              {nextShoppingEvent ? 'Remarcar' : 'Marcar'}
            </button>
          )}
        </div>
        {pickingDay ? (
          <div className="flex gap-2">
            <input
              type="date"
              aria-label="Dia das compras"
              className="input flex-1"
              value={shoppingDay}
              onChange={(e) => setShoppingDay(e.target.value)}
            />
            <button className="btn-primary" onClick={scheduleShoppingDay} disabled={!shoppingDay || createEvent.isPending}>
              Agendar
            </button>
            <button className="btn-secondary" onClick={() => setPickingDay(false)} aria-label="Cancelar">
              <Icon.X className="h-4 w-4" />
            </button>
          </div>
        ) : nextShoppingEvent ? (
          <p className="text-sm text-slate-500">
            Próximo: {formatDate(nextShoppingEvent.startAt)} às {formatTime(nextShoppingEvent.startAt)} — já na Agenda, com lembrete.
          </p>
        ) : (
          <p className="text-sm text-slate-500">Escolha o dia da feira e ele entra na Agenda do lar com lembrete.</p>
        )}
      </section>

      {overdue.length > 0 && (
        <section className="card border-l-4 border-amber-500">
          <div className="mb-2 flex items-center gap-2">
            <Icon.Alert className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-amber-600">Atrasadas ({overdue.length})</h2>
          </div>
          <ul className="flex flex-col gap-2">
            {overdue.slice(0, 5).map((o) => (
              <li key={o.$id} className="flex flex-col gap-1">
                <button
                  type="button"
                  className="min-w-0 truncate text-left"
                  aria-label={`Editar ${taskTitle(o.taskId)}`}
                  onClick={() => navigate('/tarefas', { state: { editTaskId: o.taskId } })}
                >
                  {taskTitle(o.taskId)}
                </button>
                <span className="flex gap-1">
                  <button
                    className="btn-secondary !min-h-[32px] !px-2 text-sm"
                    aria-label="Concluir"
                    onClick={() => occurrenceAction.mutate({ occurrenceId: o.$id, action: 'done' })}
                  >
                    <Icon.Check className="h-4 w-4" />
                  </button>
                  <button
                    className="btn-secondary !min-h-[32px] !px-2 text-sm"
                    onClick={() => occurrenceAction.mutate({ occurrenceId: o.$id, action: 'skipped' })}
                  >
                    Pular
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="mb-2 flex items-center gap-2">
          <Icon.CheckSquare className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold">Tarefas de hoje</h2>
        </div>
        {occurrences.isLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : todayOccurrences.length === 0 ? (
          <p className="text-slate-500">
            Nada para hoje.{' '}
            <Link className="text-brand-600" to="/tarefas">
              Ver tarefas
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todayOccurrences.map((o) => (
              <li key={o.$id} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left"
                  aria-label={`Editar ${taskTitle(o.taskId)}`}
                  onClick={() => navigate('/tarefas', { state: { editTaskId: o.taskId } })}
                >
                  <span className="block truncate">{taskTitle(o.taskId)}</span>
                  <span className="block text-sm text-slate-500">{formatTime(o.dueAt)}</span>
                </button>
                <button
                  className="btn-secondary !min-h-[32px] shrink-0 !px-2 text-sm"
                  aria-label="Concluir"
                  onClick={() => occurrenceAction.mutate({ occurrenceId: o.$id, action: 'done' })}
                >
                  <Icon.Check className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="mb-2 flex items-center gap-2">
          <Icon.Calendar className="h-5 w-5 text-violet-600" />
          <h2 className="font-semibold">Eventos de hoje</h2>
        </div>
        {todayEvents.length === 0 ? (
          <p className="text-slate-500">Agenda livre hoje.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {todayEvents.map((o, i) => (
              <li key={i} className="flex flex-col text-sm">
                <span className="text-slate-500">{formatTime(o.startAt)}</span>
                <span className="truncate">{eventTitle(o.eventId)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      </div>
    </div>
  );
}
