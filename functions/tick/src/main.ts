/**
 * Function `tick` — agendada a cada 5 min (CRON em UTC).
 *
 * 1. Lembretes de eventos (janela determinística dos últimos 5 min).
 * 2. Resumos diários por usuário (horário de notificationPrefs, BRT).
 * 3. Bloco diário às 07:00 UTC (04:00 BRT): materializar taskOccurrences
 *    (14 dias, idempotente), gerar despesas fixas pendentes, limpar
 *    pushSubscriptions mortas.
 *
 * RESTRIÇÃO FREE: este projeto tem exatamente 2 functions (tick e api).
 */
import { Client, Permission, Query, Role, TablesDB, Teams } from 'node-appwrite';
import webpush from 'web-push';
import { expandRecurrence, SAO_PAULO_OFFSET_MS } from '../../../src/core/recurrence';
import { occurrenceKey, planOccurrences } from '../../../src/core/rotation';

const DB_ID = process.env.APPWRITE_DATABASE_ID ?? 'morada';
const TICK_MINUTES = 5;
const MATERIALIZE_DAYS = 14;

interface AppwriteContext {
  req: { headers: Record<string, string>; body: unknown };
  res: { json: (data: unknown, status?: number) => unknown; text: (t: string) => unknown };
  log: (msg: string) => void;
  error: (msg: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any> & { $id: string };

function createServices(req: AppwriteContext['req']) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT ?? '')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID ?? '')
    .setKey(req.headers['x-appwrite-key'] ?? ''); // API key dinâmica por execução
  return { tables: new TablesDB(client), teams: new Teams(client) };
}

async function listAll(tables: TablesDB, tableId: string, queries: string[] = []): Promise<Row[]> {
  const rows: Row[] = [];
  let cursor: string | null = null;
  for (;;) {
    const pageQueries = [...queries, Query.limit(100)];
    if (cursor) pageQueries.push(Query.cursorAfter(cursor));
    const page = await tables.listRows({ databaseId: DB_ID, tableId, queries: pageQueries });
    rows.push(...(page.rows as unknown as Row[]));
    if (page.rows.length < 100) break;
    cursor = rows[rows.length - 1].$id;
  }
  return rows;
}

function householdPermissions(teamId: string): string[] {
  return [
    Permission.read(Role.team(teamId)),
    Permission.update(Role.team(teamId)),
    Permission.delete(Role.team(teamId)),
  ];
}

// ---------------------------------------------------------------------------
// Push
// ---------------------------------------------------------------------------
function configureWebPush(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:morada@example.com',
    publicKey,
    privateKey,
  );
  return true;
}

/** Envia push para todas as assinaturas do usuário; remove as mortas (404/410). */
async function pushToUser(
  tables: TablesDB,
  userId: string,
  payload: { title: string; body: string; url?: string },
  log: (m: string) => void,
): Promise<void> {
  const subscriptions = await listAll(tables, 'pushSubscriptions', [Query.equal('userId', userId)]);
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: JSON.parse(sub.keys) },
        JSON.stringify(payload),
      );
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await tables.deleteRow({ databaseId: DB_ID, tableId: 'pushSubscriptions', rowId: sub.$id });
        log(`assinatura morta removida: ${sub.$id}`);
      } else {
        log(`falha de push para ${userId}: ${String(err)}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 1. Lembretes de eventos
// ---------------------------------------------------------------------------
async function sendEventReminders(
  tables: TablesDB,
  teams: Teams,
  windowStart: Date,
  windowEnd: Date,
  log: (m: string) => void,
): Promise<void> {
  // lembretes disparam ANTES do evento: eventos que começam até 7 dias à frente
  const horizon = new Date(windowEnd.getTime() + 7 * 24 * 60 * 60 * 1000);
  const events = await listAll(tables, 'events', [
    Query.greaterThanEqual('startAt', windowStart.toISOString()),
    Query.lessThanEqual('startAt', horizon.toISOString()),
  ]);

  for (const event of events) {
    const reminders: number[] = event.reminderMinutes ?? [];
    if (reminders.length === 0) continue;

    const startsAt = new Date(event.startAt).getTime();
    const due = reminders.some((minutes) => {
      const reminderAt = startsAt - minutes * 60_000;
      // janela determinística [início, fim): cada lembrete cai em exatamente um tick
      return reminderAt >= windowStart.getTime() && reminderAt < windowEnd.getTime();
    });
    if (!due) continue;

    let recipients: string[] = event.memberIds ?? [];
    if (recipients.length === 0) {
      const memberships = await teams.listMemberships({ teamId: event.householdId });
      recipients = memberships.memberships.map((m) => m.userId);
    }
    const when = new Date(startsAt - SAO_PAULO_OFFSET_MS);
    const time = `${String(when.getUTCHours()).padStart(2, '0')}:${String(when.getUTCMinutes()).padStart(2, '0')}`;
    for (const userId of recipients) {
      await pushToUser(
        tables,
        userId,
        { title: 'Lembrete de evento', body: `${event.title} às ${time}`, url: '/agenda' },
        log,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Resumos diários
// ---------------------------------------------------------------------------
async function sendDailySummaries(
  tables: TablesDB,
  teams: Teams,
  windowStart: Date,
  windowEnd: Date,
  log: (m: string) => void,
): Promise<void> {
  const profiles = await listAll(tables, 'profiles');
  const wall = new Date(windowStart.getTime() - SAO_PAULO_OFFSET_MS);

  // perfis cujo horário configurado (BRT) cai nesta janela de tick
  const due = profiles.filter((profile) => {
    if (!profile.notificationPrefs) return false;
    let prefs: { dailySummaryTime?: string | null };
    try {
      prefs = JSON.parse(profile.notificationPrefs);
    } catch {
      return false;
    }
    if (!prefs.dailySummaryTime) return false;
    const [hour, minute] = prefs.dailySummaryTime.split(':').map(Number);
    const scheduledUtc =
      Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate(), hour, minute) +
      SAO_PAULO_OFFSET_MS;
    return scheduledUtc >= windowStart.getTime() && scheduledUtc < windowEnd.getTime();
  });
  if (due.length === 0) return;

  const dayStart = new Date(
    Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate()) + SAO_PAULO_OFFSET_MS,
  );
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  // dados compartilhados do dia (uma consulta, todos os perfis)
  const todaysEvents = await listAll(tables, 'events', [
    Query.greaterThanEqual('startAt', dayStart.toISOString()),
    Query.lessThanEqual('startAt', dayEnd.toISOString()),
  ]);
  const teamIdsByUser = new Map<string, Set<string>>();
  for (const team of (await teams.list()).teams) {
    const memberships = await teams.listMemberships({ teamId: team.$id });
    for (const m of memberships.memberships) {
      if (!m.confirm || !m.userId) continue;
      if (!teamIdsByUser.has(m.userId)) teamIdsByUser.set(m.userId, new Set());
      teamIdsByUser.get(m.userId)!.add(team.$id);
    }
  }

  for (const profile of due) {
    const occurrences = await listAll(tables, 'taskOccurrences', [
      Query.equal('assignedMemberId', profile.userId),
      Query.equal('status', 'pending'),
      Query.greaterThanEqual('dueAt', dayStart.toISOString()),
      Query.lessThanEqual('dueAt', dayEnd.toISOString()),
    ]);
    const myTeams = teamIdsByUser.get(profile.userId) ?? new Set();
    const myEvents = todaysEvents.filter(
      (e) =>
        myTeams.has(e.householdId) &&
        ((e.memberIds ?? []).length === 0 || (e.memberIds ?? []).includes(profile.userId)),
    );
    const shoppingDay = myEvents.some((e) => String(e.title).toLowerCase().startsWith('compras'));

    const parts: string[] = [];
    if (occurrences.length > 0) {
      parts.push(`${occurrences.length} tarefa${occurrences.length > 1 ? 's' : ''}`);
    }
    if (myEvents.length > 0) {
      parts.push(`${myEvents.length} evento${myEvents.length > 1 ? 's' : ''}`);
    }
    if (shoppingDay) parts.push('dia de compras');

    const body =
      parts.length === 0 ? 'Dia livre no lar. Aproveitem!' : `Hoje: ${parts.join(' · ')}.`;
    await pushToUser(tables, profile.userId, { title: 'Resumo do dia', body, url: '/' }, log);
  }
}

// ---------------------------------------------------------------------------
// 3a. Materialização de ocorrências de tarefas (idempotente)
// ---------------------------------------------------------------------------
async function materializeTaskOccurrences(
  tables: TablesDB,
  teams: Teams,
  now: Date,
  log: (m: string) => void,
): Promise<void> {
  const windowEnd = new Date(now.getTime() + MATERIALIZE_DAYS * 24 * 60 * 60 * 1000);
  const tasks = await listAll(tables, 'tasks', [
    Query.equal('active', true),
    Query.equal('type', 'routine'),
  ]);

  const activeByHousehold = new Map<string, Set<string>>();

  for (const task of tasks) {
    if (!task.rrule) continue;

    if (!activeByHousehold.has(task.householdId)) {
      const memberships = await teams.listMemberships({ teamId: task.householdId });
      activeByHousehold.set(
        task.householdId,
        new Set(memberships.memberships.filter((m) => m.confirm).map((m) => m.userId)),
      );
    }
    const activeMembers = activeByHousehold.get(task.householdId)!;

    const dueDates = expandRecurrence({
      rruleString: task.rrule,
      dtstartUtc: new Date(task.dueDate ?? task.$createdAt),
      windowStartUtc: now,
      windowEndUtc: windowEnd,
    });
    if (dueDates.length === 0) continue;

    const existing = await listAll(tables, 'taskOccurrences', [
      Query.equal('taskId', task.$id),
      Query.greaterThanEqual('dueAt', now.toISOString()),
    ]);
    const existingKeys = new Set(existing.map((o) => occurrenceKey(task.$id, new Date(o.dueAt))));

    const { occurrences, nextRotationIndex } = planOccurrences(
      {
        taskId: task.$id,
        assignmentMode: task.assignmentMode,
        assignedMemberId: task.assignedMemberId,
        rotationMemberIds: task.rotationMemberIds ?? [],
        rotationIndex: task.rotationIndex ?? 0,
      },
      dueDates,
      existingKeys,
      activeMembers,
    );

    for (const occurrence of occurrences) {
      await tables.createRow({
        databaseId: DB_ID,
        tableId: 'taskOccurrences',
        rowId: 'unique()',
        data: {
          householdId: task.householdId,
          taskId: task.$id,
          dueAt: occurrence.dueAt.toISOString(),
          assignedMemberId: occurrence.assignedMemberId,
          status: 'pending',
        },
        permissions: householdPermissions(task.householdId),
      });
    }
    if (nextRotationIndex !== task.rotationIndex && occurrences.length > 0) {
      await tables.updateRow({
        databaseId: DB_ID,
        tableId: 'tasks',
        rowId: task.$id,
        data: { rotationIndex: nextRotationIndex },
      });
    }
    if (occurrences.length > 0) {
      log(`tarefa ${task.$id}: ${occurrences.length} ocorrência(s) materializada(s)`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3b. Despesas fixas (rrule) -> lançamentos pendentes de confirmação
// ---------------------------------------------------------------------------
async function generateRecurringExpenses(
  tables: TablesDB,
  now: Date,
  log: (m: string) => void,
): Promise<void> {
  const templates = await listAll(tables, 'expenses', [Query.isNotNull('rrule')]);
  const windowEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  for (const template of templates) {
    if (!template.rrule || template.recurrenceKey) continue; // gerados não geram de novo

    const dueDates = expandRecurrence({
      rruleString: template.rrule,
      dtstartUtc: new Date(template.date),
      windowStartUtc: now,
      windowEndUtc: windowEnd,
    });

    for (const dueAt of dueDates) {
      const recurrenceKey = `${template.$id}|${dueAt.toISOString()}`;
      const existing = await tables.listRows({
        databaseId: DB_ID,
        tableId: 'expenses',
        queries: [Query.equal('recurrenceKey', recurrenceKey), Query.limit(1)],
      });
      if (existing.rows.length > 0) continue;

      await tables.createRow({
        databaseId: DB_ID,
        tableId: 'expenses',
        rowId: 'unique()',
        data: {
          householdId: template.householdId,
          description: template.description,
          amountCents: template.amountCents,
          category: template.category,
          paidBy: template.paidBy,
          date: dueAt.toISOString(),
          splitType: template.splitType,
          splits: template.splits,
          status: 'pending', // aguarda confirmação no app
          recurrenceKey,
          createdBy: template.createdBy,
        },
        permissions: householdPermissions(template.householdId),
      });
      log(`despesa fixa gerada: ${template.description} (${recurrenceKey})`);
    }
  }
}

// ---------------------------------------------------------------------------
export default async ({ req, res, log, error }: AppwriteContext) => {
  const { tables, teams } = createServices(req);
  const hasVapid = configureWebPush();
  if (!hasVapid) log('VAPID não configurado — pushes serão pulados');

  const now = new Date();
  // janela determinística alinhada ao cron de 5 min: [tick anterior, tick atual)
  const tickMs = TICK_MINUTES * 60_000;
  const windowEnd = new Date(Math.floor(now.getTime() / tickMs) * tickMs);
  const windowStart = new Date(windowEnd.getTime() - tickMs);

  const results: Record<string, string> = {};

  if (hasVapid) {
    try {
      await sendEventReminders(tables, teams, windowStart, windowEnd, log);
      results.reminders = 'ok';
    } catch (err) {
      error(`lembretes: ${String(err)}`);
      results.reminders = 'error';
    }
    try {
      await sendDailySummaries(tables, teams, windowStart, windowEnd, log);
      results.summaries = 'ok';
    } catch (err) {
      error(`resumos: ${String(err)}`);
      results.summaries = 'error';
    }
  }

  // bloco diário: 07:00 UTC == 04:00 BRT
  const isDailyBlock = windowEnd.getUTCHours() === 7 && windowEnd.getUTCMinutes() === 0;
  if (isDailyBlock) {
    // ritual de fechamento: dia 1º (BRT) — um push convidando a acertar o mês
    const wallNow = new Date(now.getTime() - SAO_PAULO_OFFSET_MS);
    if (hasVapid && wallNow.getUTCDate() === 1) {
      try {
        const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const prevMonth = MONTHS[(wallNow.getUTCMonth() + 11) % 12];
        const profiles = await listAll(tables, 'profiles');
        for (const profile of profiles) {
          await pushToUser(
            tables,
            profile.userId,
            { title: 'Virada de mês!', body: `Que tal fechar ${prevMonth} e acertar o saldo? Começar o mês no zero é uma delícia.`, url: '/contas' },
            log,
          );
        }
        results.closingRitual = 'ok';
      } catch (err) {
        error(`ritual de fechamento: ${String(err)}`);
        results.closingRitual = 'error';
      }
    }
    try {
      await materializeTaskOccurrences(tables, teams, now, log);
      results.materialize = 'ok';
    } catch (err) {
      error(`materialização: ${String(err)}`);
      results.materialize = 'error';
    }
    try {
      await generateRecurringExpenses(tables, now, log);
      results.recurringExpenses = 'ok';
    } catch (err) {
      error(`despesas fixas: ${String(err)}`);
      results.recurringExpenses = 'error';
    }
  }

  return res.json({ ok: true, window: [windowStart, windowEnd], results });
};
