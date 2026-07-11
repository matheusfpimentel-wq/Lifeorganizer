/**
 * Function `api` — HTTP (roteador simples por path).
 *
 * GET  /health        — status.
 * GET  /ical/{token}  — feed iCalendar por token secreto revogável.
 * POST /push/test     — push de teste para o usuário autenticado.
 *
 * Execute permission é `any`: o token do iCal é a autenticação da rota;
 * /push/test confia no header x-appwrite-user-id, que o Appwrite injeta
 * (headers x-appwrite-* externos são descartados pela plataforma).
 *
 * RESTRIÇÃO FREE: este projeto tem exatamente 2 functions (tick e api).
 */
import { Client, Query, TablesDB } from 'node-appwrite';
import webpush from 'web-push';

const DB_ID = process.env.APPWRITE_DATABASE_ID ?? 'morada';

interface AppwriteContext {
  req: {
    path: string;
    method: string;
    headers: Record<string, string>;
    body: unknown;
  };
  res: {
    json: (data: unknown, status?: number) => unknown;
    text: (t: string, status?: number, headers?: Record<string, string>) => unknown;
  };
  log: (msg: string) => void;
  error: (msg: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any> & { $id: string };

function createTables(req: AppwriteContext['req']): TablesDB {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT ?? '')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID ?? '')
    .setKey(req.headers['x-appwrite-key'] ?? '');
  return new TablesDB(client);
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

// ---------------------------------------------------------------------------
// iCalendar
// ---------------------------------------------------------------------------
function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function buildIcs(events: Row[], occurrences: Row[], taskTitles: Map<string, string>): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MinhaCasinha//Gestao do Lar//PT-BR',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:MinhaCasinha',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.$id}@morada`);
    lines.push(`DTSTAMP:${icsDate(event.$updatedAt ?? event.$createdAt)}`);
    lines.push(`DTSTART:${icsDate(event.startAt)}`);
    lines.push(`DTEND:${icsDate(event.endAt)}`);
    lines.push(`SUMMARY:${icsEscape(event.title)}`);
    if (event.location) lines.push(`LOCATION:${icsEscape(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${icsEscape(event.description)}`);
    if (event.rrule) lines.push(`RRULE:${event.rrule.replace(/^RRULE:/, '')}`);
    for (const exdate of event.exdates ?? []) lines.push(`EXDATE:${icsDate(exdate)}`);
    lines.push('END:VEVENT');
  }

  for (const occurrence of occurrences) {
    const title = taskTitles.get(occurrence.taskId) ?? 'Tarefa';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:occ-${occurrence.$id}@morada`);
    lines.push(`DTSTAMP:${icsDate(occurrence.$updatedAt ?? occurrence.$createdAt)}`);
    lines.push(`DTSTART:${icsDate(occurrence.dueAt)}`);
    lines.push(`DTEND:${icsDate(new Date(new Date(occurrence.dueAt).getTime() + 30 * 60_000).toISOString())}`);
    lines.push(`SUMMARY:${icsEscape(`Tarefa: ${title}`)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

async function handleIcal(tables: TablesDB, token: string, res: AppwriteContext['res']) {
  const tokenRows = await tables.listRows({
    databaseId: DB_ID,
    tableId: 'icalTokens',
    queries: [Query.equal('token', token), Query.limit(1)],
  });
  const tokenRow = tokenRows.rows[0] as unknown as Row | undefined;
  if (!tokenRow || tokenRow.revoked) {
    return res.text('Not found', 404);
  }

  const events = await listAll(tables, 'events', [
    Query.equal('householdId', tokenRow.householdId),
  ]);
  const occurrences = await listAll(tables, 'taskOccurrences', [
    Query.equal('householdId', tokenRow.householdId),
    Query.equal('assignedMemberId', tokenRow.userId),
    Query.equal('status', 'pending'),
  ]);
  const taskIds = [...new Set(occurrences.map((o) => o.taskId))];
  const taskTitles = new Map<string, string>();
  for (const taskId of taskIds) {
    try {
      const task = await tables.getRow({ databaseId: DB_ID, tableId: 'tasks', rowId: taskId });
      taskTitles.set(taskId, (task as unknown as Row).title);
    } catch {
      // tarefa apagada — segue com título genérico
    }
  }

  return res.text(buildIcs(events, occurrences, taskTitles), 200, {
    'content-type': 'text/calendar; charset=utf-8',
  });
}

// ---------------------------------------------------------------------------
// Push de teste
// ---------------------------------------------------------------------------
async function handlePushTest(
  tables: TablesDB,
  userId: string,
  res: AppwriteContext['res'],
  log: (m: string) => void,
) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return res.json({ ok: false, error: 'VAPID não configurado' }, 500);
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:morada@example.com', publicKey, privateKey);

  const subscriptions = await listAll(tables, 'pushSubscriptions', [Query.equal('userId', userId)]);
  if (subscriptions.length === 0) {
    return res.json({ ok: false, error: 'Nenhuma assinatura de push encontrada' }, 404);
  }

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: JSON.parse(sub.keys) },
        JSON.stringify({ title: 'MinhaCasinha', body: 'Notificação de teste funcionando!', url: '/' }),
      );
      sent += 1;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await tables.deleteRow({ databaseId: DB_ID, tableId: 'pushSubscriptions', rowId: sub.$id });
        log(`assinatura morta removida: ${sub.$id}`);
      }
    }
  }
  return res.json({ ok: sent > 0, sent });
}

// ---------------------------------------------------------------------------
export default async ({ req, res, log, error }: AppwriteContext) => {
  const tables = createTables(req);
  try {
    if (req.method === 'GET' && req.path === '/health') {
      return res.json({ ok: true, service: 'morada-api', now: new Date().toISOString() });
    }

    const icalMatch = req.path.match(/^\/ical\/([A-Za-z0-9_-]{16,64})$/);
    if (req.method === 'GET' && icalMatch) {
      return handleIcal(tables, icalMatch[1], res);
    }

    if (req.method === 'POST' && req.path === '/push/test') {
      // header confiável: o Appwrite injeta e descarta x-appwrite-* externos
      const userId = req.headers['x-appwrite-user-id'];
      if (!userId) return res.json({ ok: false, error: 'Não autenticado' }, 401);
      return handlePushTest(tables, userId, res, log);
    }

    return res.json({ ok: false, error: 'Rota não encontrada' }, 404);
  } catch (err) {
    error(String(err));
    return res.json({ ok: false, error: 'Erro interno' }, 500);
  }
};
