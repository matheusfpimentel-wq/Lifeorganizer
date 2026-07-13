/**
 * Gera o appwrite.config.json (fonte de verdade consumida por `appwrite push`).
 *
 * Autoria: edite ESTE arquivo e rode `npm run aw:config`.
 * O JSON gerado é commitado junto — nunca edite o JSON à mão.
 *
 * Convenções:
 * - Toda tabela de domínio tem `householdId` + rowSecurity (permissões por linha
 *   gravadas na criação via withHouseholdPermissions).
 * - Valores de enum são slugs ASCII (labels pt-BR ficam na UI — ver ADR-008).
 * - Índice para toda coluna usada em Query.equal/orderBy.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DB_ID = 'morada';

// ---------------------------------------------------------------------------
// Helpers de coluna
// ---------------------------------------------------------------------------
const str = (key, size, opts = {}) => ({ key, type: 'string', size, ...opts });
const id = (key, opts = {}) => str(key, 36, opts); // IDs do Appwrite (<= 36 chars)
const json = (key, size, opts = {}) => str(key, size, opts); // JSON validado por Zod
const int = (key, opts = {}) => ({ key, type: 'integer', ...opts });
const dbl = (key, opts = {}) => ({ key, type: 'double', ...opts });
const bool = (key, opts = {}) => ({ key, type: 'boolean', ...opts });
const dt = (key, opts = {}) => ({ key, type: 'datetime', ...opts });
const enm = (key, elements, opts = {}) => ({
  key,
  type: 'string',
  format: 'enum',
  elements,
  size: 255,
  ...opts,
});

const req = { required: true };
const arr = { array: true };

const idx = (key, columns, type = 'key') => ({ key, type, columns });

/**
 * Normaliza uma coluna para o schema do Appwrite. A API exige o campo
 * `required` presente em TODA coluna; e a CLI rejeita `required && default!=null`.
 * - required → `default: null` explícito (ausente/undefined falha na CLI);
 * - opcional → `required: false` explícito (a API falha se ausente);
 * - array → não aceita default e sempre `required: false` (Zod valida no client;
 *   required+sem-default seria inválido).
 */
function normalizeColumn(col) {
  const out = { ...col };
  // campos SEMPRE explícitos — o differ do push compara com o remoto e trata
  // `undefined` como mudança (chegou a recriar colunas por `array` ausente).
  out.array = out.array === true;
  if (out.array) {
    out.required = false;
    out.default = null;
  } else if (out.required === true) {
    out.default = null;
  } else {
    out.required = false;
    if (out.default === undefined) out.default = null;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tabelas
// ---------------------------------------------------------------------------
const table = ($id, name, columns, indexes = []) => ({
  $id,
  databaseId: DB_ID,
  name,
  enabled: true,
  rowSecurity: true,
  // criação liberada para usuários logados; leitura/escrita controladas por
  // permissões de LINHA (Role.team) gravadas pelo helper withHouseholdPermissions
  $permissions: ['create("users")'],
  columns: columns.map(normalizeColumn),
  indexes,
});

const CATEGORY_SHOPPING = ['hortifruti', 'acougue', 'limpeza', 'higiene', 'mercearia', 'bebidas', 'outro'];

const tables = [
  table(
    'households',
    'Households',
    [
      // opcionais: colunas required não podem ser criadas em tabela com linhas
      // (recuperação pós-incidente do push #13); Zod garante no client.
      id('teamId'),
      str('name', 128),
      json('settings', 2000), // { weekStart: 'monday'|'sunday', currency: 'BRL' }
    ],
    [idx('idx_teamId', ['teamId'], 'unique')],
  ),

  table(
    'profiles',
    'Profiles',
    [
      id('userId', req),
      str('displayName', 64, req),
      id('avatarFileId'),
      str('avatar', 32), // slug de avatar embutido (ex.: 'mago')
      str('color', 7, req), // hex #rrggbb
      str('pixKey', 77),
      json('notificationPrefs', 2000), // { dailySummaryTime: 'HH:mm', enabled: {...} }
    ],
    [idx('idx_userId', ['userId'], 'unique')],
  ),

  table(
    'pushSubscriptions',
    'Push Subscriptions',
    [
      id('userId', req),
      str('endpoint', 1024, req),
      json('keys', 512, req), // { p256dh, auth }
      dt('lastSeenAt'),
    ],
    [idx('idx_userId', ['userId'])],
  ),

  table(
    'icalTokens',
    'iCal Tokens',
    [
      id('userId', req),
      id('householdId', req),
      str('token', 64, req),
      bool('revoked', { default: false }),
    ],
    [idx('idx_token', ['token'], 'unique'), idx('idx_userId', ['userId'])],
  ),

  table(
    'routineBlocks',
    'Routine Blocks',
    [
      id('householdId', req),
      id('memberId'), // null = lar inteiro
      str('title', 128, req),
      enm('category', ['trabalho', 'estudo', 'treino', 'casa', 'lazer', 'sono', 'outro'], req),
      int('weekdays', { ...req, ...arr, min: 0, max: 6 }), // 0=domingo ... 6=sábado
      str('startTime', 5, req), // "HH:mm" local (America/Sao_Paulo)
      str('endTime', 5, req),
      str('color', 7),
      str('notes', 500),
      bool('active', { default: true }),
    ],
    [idx('idx_householdId', ['householdId'])],
  ),

  table(
    'events',
    'Events',
    [
      id('householdId', req),
      str('title', 200, req),
      str('description', 2000),
      str('location', 200),
      dt('startAt', req),
      dt('endAt', req),
      bool('allDay', { default: false }),
      id('memberIds', arr), // vazio = lar inteiro
      str('rrule', 500),
      str('exdates', 36, arr), // ISO UTC das ocorrências canceladas
      int('reminderMinutes', arr),
      id('createdBy', req),
    ],
    [
      idx('idx_householdId', ['householdId']),
      idx('idx_startAt', ['startAt']),
      idx('idx_household_start', ['householdId', 'startAt']),
    ],
  ),

  table(
    'exercises',
    'Exercises',
    [
      id('householdId'), // null = seed global (leitura para todos os usuários)
      str('name', 128, req),
      enm(
        'muscleGroup',
        ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'pernas', 'gluteos', 'core', 'cardio', 'outro'],
        req,
      ),
      enm(
        'equipment',
        ['barra', 'halter', 'maquina', 'polia', 'pesoCorporal', 'kettlebell', 'elastico', 'outro'],
        req,
      ),
      str('instructions', 2000),
      str('videoUrl', 500),
    ],
    [idx('idx_muscleGroup', ['muscleGroup']), idx('idx_householdId', ['householdId'])],
  ),

  table(
    'workoutPlans',
    'Workout Plans',
    [
      id('householdId', req),
      id('memberId', req),
      str('name', 128, req),
      str('goal', 200),
      bool('active', { default: true }), // 1 ativo por membro (regra no app)
    ],
    [idx('idx_householdId', ['householdId']), idx('idx_memberId', ['memberId'])],
  ),

  table(
    'workoutPlanDays',
    'Workout Plan Days',
    [
      id('householdId', req),
      id('planId', req),
      str('label', 64, req), // ex.: "A — Peito/Tríceps"
      int('weekday', { min: 0, max: 6 }),
      int('order', req),
    ],
    [idx('idx_planId', ['planId'])],
  ),

  table(
    'workoutPlanExercises',
    'Workout Plan Exercises',
    [
      id('householdId', req),
      id('planDayId', req),
      id('exerciseId', req),
      int('sets', { ...req, min: 1, max: 20 }),
      str('repRange', 20, req), // ex.: "8-12"
      dbl('targetLoadKg'),
      int('restSeconds', { default: 90 }),
      int('order', req),
      str('notes', 200),
    ],
    [idx('idx_planDayId', ['planDayId'])],
  ),

  table(
    'workoutSessions',
    'Workout Sessions',
    [
      id('householdId', req),
      id('memberId', req),
      id('planDayId'),
      dt('startedAt', req),
      dt('finishedAt'),
      str('notes', 500),
    ],
    [
      idx('idx_memberId', ['memberId']),
      idx('idx_householdId', ['householdId']),
      idx('idx_startedAt', ['startedAt']),
    ],
  ),

  table(
    'workoutSessionSets',
    'Workout Session Sets',
    [
      id('householdId', req),
      id('sessionId', req),
      id('exerciseId', req),
      int('setNumber', { ...req, min: 1 }),
      int('reps', { ...req, min: 0 }), // 0 quando a série é por tempo
      dbl('loadKg', { ...req, min: 0 }),
      dbl('rpe', { min: 0, max: 10 }),
      int('durationSeconds', { min: 0 }), // séries por tempo (prancha, isometria, cardio)
      // técnica de intensidade aplicada à série
      enm('technique', ['normal', 'aquecimento', 'dropset', 'restPause', 'falha', 'superset', 'isometria']),
    ],
    [
      idx('idx_sessionId', ['sessionId']),
      idx('idx_exercise_load', ['exerciseId', 'loadKg']), // PR por exercício
    ],
  ),

  table(
    'shoppingLists',
    'Shopping Lists',
    [
      id('householdId', req),
      str('name', 128, req),
      enm('status', ['active', 'archived'], { default: 'active' }),
      bool('isDefault', { default: false }),
      int('totalCents', { min: 0 }), // preenchido ao arquivar
    ],
    [idx('idx_householdId', ['householdId']), idx('idx_status', ['status'])],
  ),

  table(
    'shoppingItems',
    'Shopping Items',
    [
      id('householdId', req),
      id('listId', req),
      str('name', 128, req),
      dbl('qty', { default: 1 }),
      str('unit', 20),
      enm('category', CATEGORY_SHOPPING, { default: 'outro' }),
      str('note', 200),
      id('addedBy', req),
      bool('checked', { default: false }),
      id('checkedBy'),
      dt('checkedAt'),
      int('priceCents', { min: 0 }),
    ],
    [idx('idx_listId', ['listId']), idx('idx_householdId', ['householdId']), idx('idx_name', ['name'])],
  ),

  table(
    'staples',
    'Staples',
    [
      id('householdId', req),
      str('name', 128, req),
      dbl('defaultQty', { default: 1 }),
      str('unit', 20),
      enm('category', CATEGORY_SHOPPING, { default: 'outro' }),
    ],
    [idx('idx_householdId', ['householdId'])],
  ),

  table(
    'expenses',
    'Expenses',
    [
      id('householdId', req),
      str('description', 200, req),
      int('amountCents', { ...req, min: 1 }),
      enm(
        'category',
        ['moradia', 'mercado', 'contasFixas', 'transporte', 'lazer', 'saude', 'pets', 'outro'],
        req,
      ),
      id('paidBy', req),
      dt('date', req),
      enm('splitType', ['equal', 'percent', 'shares', 'exact'], req),
      json('splits', 4000, req), // [{memberId, amountCents}] — resolvidos; mesma linha por atomicidade
      enm('status', ['confirmed', 'pending'], { default: 'confirmed' }), // pending = gerada por rrule, aguarda confirmação
      str('rrule', 500), // contas fixas
      str('recurrenceKey', 100), // idempotência da geração via tick: expenseId|dueDate
      id('receiptFileId'),
      id('createdBy', req),
    ],
    [
      idx('idx_householdId', ['householdId']),
      idx('idx_date', ['date']),
      idx('idx_paidBy', ['paidBy']),
      idx('idx_recurrenceKey', ['recurrenceKey']),
    ],
  ),

  table(
    'settlements',
    'Settlements',
    [
      id('householdId', req),
      id('fromMember', req),
      id('toMember', req),
      int('amountCents', { ...req, min: 1 }),
      enm('method', ['pix', 'dinheiro', 'outro'], req),
      dt('settledAt', req),
      str('note', 200),
    ],
    [idx('idx_householdId', ['householdId']), idx('idx_settledAt', ['settledAt'])],
  ),

  table(
    'fundContributions',
    'Fund Contributions',
    [
      id('householdId', req),
      id('memberId', req), // quem aportou
      int('amountCents', { ...req, min: 1 }),
      dt('date', req),
      str('note', 200),
    ],
    [idx('idx_householdId', ['householdId']), idx('idx_date', ['date'])],
  ),

  table(
    'tasks',
    'Tasks',
    [
      id('householdId', req),
      str('title', 200, req),
      str('description', 2000),
      enm('type', ['routine', 'specific'], req),
      enm('category', ['limpeza', 'cozinha', 'roupas', 'pets', 'manutencao', 'admin', 'outro'], req),
      str('rrule', 500), // obrigatório se routine (validado no Zod)
      dt('dueDate'), // obrigatório se specific (validado no Zod)
      enm('assignmentMode', ['fixed', 'rotation', 'volunteer'], req),
      id('assignedMemberId'),
      id('rotationMemberIds', arr),
      int('rotationIndex', { default: 0 }),
      enm('priority', ['baixa', 'media', 'alta'], { default: 'media' }),
      json('checklist', 4000), // [{label, done}]
      int('points', { default: 1, min: 1, max: 100 }),
      bool('active', { default: true }),
      id('createdBy'), // carga mental: quem planejou/criou o modelo
      str('anchor', 40), // âncora de rotina (ex.: 'cafe' = depois do café)
    ],
    [idx('idx_householdId', ['householdId']), idx('idx_active', ['active'])],
  ),

  table(
    'taskOccurrences',
    'Task Occurrences',
    [
      id('householdId', req),
      id('taskId', req),
      dt('dueAt', req),
      id('assignedMemberId'),
      enm('status', ['pending', 'done', 'skipped'], { default: 'pending' }),
      id('completedBy'),
      dt('completedAt'),
    ],
    [
      idx('idx_taskId', ['taskId']),
      idx('idx_householdId', ['householdId']),
      idx('idx_dueAt', ['dueAt']),
      idx('idx_task_due', ['taskId', 'dueAt'], 'unique'), // chave lógica de idempotência
      idx('idx_assignedMemberId', ['assignedMemberId']),
    ],
  ),
];

// ---------------------------------------------------------------------------
// Functions (RESTRIÇÃO DO PLANO FREE: exatamente 2 — nunca criar uma terceira)
// ---------------------------------------------------------------------------
const functions = [
  {
    $id: 'tick',
    name: 'tick',
    runtime: 'node-22',
    path: 'functions/tick',
    entrypoint: 'dist/main.js',
    commands: '', // bundle gerado localmente por `npm run functions:build`
    schedule: '*/5 * * * *', // CRON em UTC (04:00 BRT == 07:00 UTC)
    timeout: 120,
    enabled: true,
    logging: true,
    execute: [], // apenas agendada — sem execução por usuários
    scopes: [
      'users.read',
      'teams.read',
      'databases.read',
      'tables.read',
      'rows.read',
      'rows.write',
    ],
    ignore: 'node_modules,src',
  },
  {
    $id: 'api',
    name: 'api',
    runtime: 'node-22',
    path: 'functions/api',
    entrypoint: 'dist/main.js',
    commands: '',
    timeout: 30,
    enabled: true,
    logging: true,
    execute: ['any'], // /ical/{token} autentica pelo token; /push/test valida JWT
    scopes: [
      'users.read',
      'teams.read',
      'databases.read',
      'tables.read',
      'rows.read',
      'rows.write',
    ],
    ignore: 'node_modules,src',
  },
];

// ---------------------------------------------------------------------------
// Buckets
// ---------------------------------------------------------------------------
const buckets = [
  {
    $id: 'avatars',
    name: 'Avatars',
    enabled: true,
    fileSecurity: true,
    $permissions: ['create("users")'],
    maximumFileSize: 5 * 1024 * 1024,
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    compression: 'gzip',
    encryption: true,
    antivirus: true,
  },
  {
    $id: 'receipts',
    name: 'Receipts',
    enabled: true,
    fileSecurity: true,
    $permissions: ['create("users")'],
    maximumFileSize: 10 * 1024 * 1024,
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    compression: 'gzip',
    encryption: true,
    antivirus: true,
  },
];

// ---------------------------------------------------------------------------
const config = {
  projectId: process.env.APPWRITE_PROJECT_ID ?? 'REPLACE_WITH_PROJECT_ID',
  projectName: 'MinhaCasinha',
  // TablesDB usa a chave `tablesDB` (não `databases`, que é a API legada de
  // Collections). `push tables` lê os databases daqui; se ausente, ele apaga o
  // database remoto por achá-lo "deleted locally".
  tablesDB: [{ $id: DB_ID, name: 'MinhaCasinha', enabled: true }],
  tables,
  buckets,
  functions,
};

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../appwrite.config.json');
writeFileSync(out, JSON.stringify(config, null, 2) + '\n');
console.log(`appwrite.config.json gerado: ${tables.length} tabelas, ${functions.length} functions, ${buckets.length} buckets`);
