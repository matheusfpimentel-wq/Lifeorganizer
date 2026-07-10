/**
 * Seed de demonstração: 1 lar, 3 membros fake e dados nos 6 módulos.
 * Usa API key (NUNCA no frontend). Rode: npm run seed
 * Requer .env com APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY.
 */
import { Client, ID, Permission, Query, Role, TablesDB, Teams, Users } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID ?? 'morada';

if (!endpoint || !projectId || !apiKey) {
  console.error('Defina APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID e APPWRITE_API_KEY no ambiente.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const users = new Users(client);
const teams = new Teams(client);
const tables = new TablesDB(client);

const teamPerms = (teamId: string) => [
  Permission.read(Role.team(teamId)),
  Permission.update(Role.team(teamId)),
  Permission.delete(Role.team(teamId)),
];
const personalPerms = (userId: string, teamId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
  Permission.read(Role.team(teamId)),
];

async function ensureUser(email: string, name: string): Promise<string> {
  const existing = await users.list({ queries: [Query.equal('email', email)] });
  if (existing.users.length > 0) return existing.users[0].$id;
  const user = await users.create({ userId: ID.unique(), email, password: 'Demo12345!', name });
  return user.$id;
}

async function createRow(tableId: string, data: Record<string, unknown>, permissions: string[]) {
  return tables.createRow({ databaseId: DB_ID, tableId, rowId: ID.unique(), data, permissions });
}

async function main() {
  console.log('Criando usuários demo…');
  const ana = await ensureUser('ana.demo@morada.local', 'Ana Demo');
  const bruno = await ensureUser('bruno.demo@morada.local', 'Bruno Demo');
  const carla = await ensureUser('carla.demo@morada.local', 'Carla Demo');
  const memberIds = [ana, bruno, carla];

  console.log('Criando lar (Team)…');
  const team = await teams.create({ teamId: ID.unique(), name: 'Lar Demo' });
  for (const userId of memberIds) {
    await teams.createMembership({ teamId: team.$id, roles: ['member'], userId });
  }
  const teamId = team.$id;

  await createRow(
    'households',
    { teamId, name: 'Lar Demo', settings: JSON.stringify({ weekStart: 'monday', currency: 'BRL' }) },
    teamPerms(teamId),
  );

  console.log('Perfis…');
  const colors = ['#0ea5e9', '#f97316', '#22c55e'];
  const names = ['Ana Demo', 'Bruno Demo', 'Carla Demo'];
  for (let i = 0; i < memberIds.length; i++) {
    await createRow(
      'profiles',
      { userId: memberIds[i], displayName: names[i], color: colors[i] },
      personalPerms(memberIds[i], teamId),
    );
  }

  console.log('Rotina semanal…');
  await createRow(
    'routineBlocks',
    {
      householdId: teamId, memberId: ana, title: 'Trabalho', category: 'trabalho',
      weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00', active: true,
    },
    teamPerms(teamId),
  );

  console.log('Eventos…');
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await createRow(
    'events',
    {
      householdId: teamId, title: 'Jantar em família', startAt: tomorrow.toISOString(),
      endAt: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      allDay: false, memberIds: [], reminderMinutes: [60], createdBy: ana, exdates: [],
    },
    teamPerms(teamId),
  );

  console.log('Exercícios (seed global mínimo)…');
  const globalExercises = [
    { name: 'Supino reto', muscleGroup: 'peito', equipment: 'barra' },
    { name: 'Agachamento livre', muscleGroup: 'pernas', equipment: 'barra' },
    { name: 'Remada curvada', muscleGroup: 'costas', equipment: 'barra' },
    { name: 'Desenvolvimento militar', muscleGroup: 'ombros', equipment: 'halter' },
    { name: 'Rosca direta', muscleGroup: 'biceps', equipment: 'barra' },
    { name: 'Tríceps polia', muscleGroup: 'triceps', equipment: 'polia' },
    { name: 'Prancha', muscleGroup: 'core', equipment: 'pesoCorporal' },
  ];
  for (const exercise of globalExercises) {
    await createRow('exercises', exercise, [Permission.read(Role.users())]);
  }

  console.log('Lista de compras…');
  const list = await createRow(
    'shoppingLists',
    { householdId: teamId, name: 'Mercado', status: 'active', isDefault: true },
    teamPerms(teamId),
  );
  for (const [name, category] of [
    ['Arroz', 'mercearia'], ['Feijão', 'mercearia'], ['Alface', 'hortifruti'],
    ['Frango', 'acougue'], ['Detergente', 'limpeza'],
  ] as const) {
    await createRow(
      'shoppingItems',
      { householdId: teamId, listId: list.$id, name, qty: 1, category, addedBy: ana, checked: false },
      teamPerms(teamId),
    );
  }
  await createRow(
    'staples',
    { householdId: teamId, name: 'Papel higiênico', defaultQty: 1, category: 'higiene' },
    teamPerms(teamId),
  );

  console.log('Despesas…');
  await createRow(
    'expenses',
    {
      householdId: teamId, description: 'Mercado da semana', amountCents: 10_000,
      category: 'mercado', paidBy: ana, date: new Date().toISOString(), splitType: 'equal',
      splits: JSON.stringify([
        { memberId: [...memberIds].sort()[0], amountCents: 3334 },
        { memberId: [...memberIds].sort()[1], amountCents: 3333 },
        { memberId: [...memberIds].sort()[2], amountCents: 3333 },
      ]),
      status: 'confirmed', createdBy: ana,
    },
    teamPerms(teamId),
  );

  console.log('Tarefas…');
  const task = await createRow(
    'tasks',
    {
      householdId: teamId, title: 'Lavar a louça', type: 'routine', category: 'cozinha',
      rrule: 'FREQ=DAILY', assignmentMode: 'rotation', rotationMemberIds: memberIds,
      rotationIndex: 0, priority: 'media', checklist: '[]', points: 1, active: true,
    },
    teamPerms(teamId),
  );
  await createRow(
    'taskOccurrences',
    {
      householdId: teamId, taskId: task.$id, dueAt: new Date().toISOString(),
      assignedMemberId: ana, status: 'pending',
    },
    teamPerms(teamId),
  );

  console.log(`\nSeed concluído! teamId=${teamId}`);
  console.log('Usuários demo (senha Demo12345!): ana.demo@ / bruno.demo@ / carla.demo@morada.local');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
