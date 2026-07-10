/**
 * Teste de isolamento de permissões (obrigatório F0 — substitui teste de RLS):
 * 2 usuários em 2 lares (Teams) diferentes; prova que um NÃO lê nem edita as
 * linhas do outro. (Realtime segue as mesmas permissões de leitura — validação
 * manual com 2 sessões na Fase 2.)
 *
 * Rode: npm run test:isolation
 * Requer .env com APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY.
 */
import {
  Client, ID, Permission, Query, Role, TablesDB, Teams, Users,
} from 'node-appwrite';
import { Client as WebClient, Account, TablesDB as WebTables, Query as WebQuery } from 'appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;
const DB_ID = process.env.APPWRITE_DATABASE_ID ?? 'morada';

if (!endpoint || !projectId || !apiKey) {
  console.error('Defina APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID e APPWRITE_API_KEY.');
  process.exit(1);
}

const admin = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const adminUsers = new Users(admin);
const adminTeams = new Teams(admin);
const adminTables = new TablesDB(admin);

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (!ok) failures += 1;
}

async function createUserSession(email: string) {
  const password = 'Isolation12345!';
  const user = await adminUsers.create({ userId: ID.unique(), email, password, name: email });
  const web = new WebClient().setEndpoint(endpoint).setProject(projectId);
  const account = new Account(web);
  await account.createEmailPasswordSession({ email, password });
  return { userId: user.$id, tables: new WebTables(web) };
}

async function main() {
  const stamp = Date.now();
  console.log('Criando 2 usuários e 2 lares…');
  const alice = await createUserSession(`alice.iso.${stamp}@morada.local`);
  const bob = await createUserSession(`bob.iso.${stamp}@morada.local`);

  const teamA = await adminTeams.create({ teamId: ID.unique(), name: `Lar A ${stamp}` });
  const teamB = await adminTeams.create({ teamId: ID.unique(), name: `Lar B ${stamp}` });
  await adminTeams.createMembership({ teamId: teamA.$id, roles: ['owner'], userId: alice.userId });
  await adminTeams.createMembership({ teamId: teamB.$id, roles: ['owner'], userId: bob.userId });

  const perms = (teamId: string) => [
    Permission.read(Role.team(teamId)),
    Permission.update(Role.team(teamId)),
    Permission.delete(Role.team(teamId)),
  ];

  console.log('Criando linhas em tabelas principais de cada lar…');
  const tablesToTest: { tableId: string; data: (hid: string) => Record<string, unknown> }[] = [
    {
      tableId: 'tasks',
      data: (hid) => ({
        householdId: hid, title: `Tarefa ${hid}`, type: 'specific', category: 'limpeza',
        dueDate: new Date().toISOString(), assignmentMode: 'volunteer',
        rotationIndex: 0, priority: 'media', checklist: '[]', points: 1, active: true,
      }),
    },
    {
      tableId: 'shoppingLists',
      data: (hid) => ({ householdId: hid, name: `Lista ${hid}`, status: 'active', isDefault: true }),
    },
    {
      tableId: 'expenses',
      data: (hid) => ({
        householdId: hid, description: `Despesa ${hid}`, amountCents: 1000, category: 'outro',
        paidBy: 'seed', date: new Date().toISOString(), splitType: 'exact',
        splits: JSON.stringify([{ memberId: 'seed', amountCents: 1000 }]),
        status: 'confirmed', createdBy: 'seed',
      }),
    },
  ];

  for (const { tableId, data } of tablesToTest) {
    const rowA = await adminTables.createRow({
      databaseId: DB_ID, tableId, rowId: ID.unique(), data: data(teamA.$id), permissions: perms(teamA.$id),
    });

    // Alice (dona) lê a própria linha
    let aliceReads = false;
    try {
      await alice.tables.getRow({ databaseId: DB_ID, tableId, rowId: rowA.$id });
      aliceReads = true;
    } catch { /* falha = problema */ }
    check(`${tableId}: membro do lar LÊ a própria linha`, aliceReads);

    // Bob (outro lar) NÃO lê por ID
    let bobReads = false;
    try {
      await bob.tables.getRow({ databaseId: DB_ID, tableId, rowId: rowA.$id });
      bobReads = true;
    } catch { /* esperado */ }
    check(`${tableId}: usuário de OUTRO lar não lê por ID`, !bobReads);

    // Bob não vê na listagem
    const bobList = await bob.tables.listRows({
      databaseId: DB_ID, tableId, queries: [WebQuery.equal('householdId', teamA.$id)],
    });
    check(`${tableId}: usuário de OUTRO lar não vê na listagem`, bobList.rows.length === 0);

    // Bob não edita
    let bobUpdates = false;
    try {
      await bob.tables.updateRow({
        databaseId: DB_ID, tableId, rowId: rowA.$id, data: { householdId: teamA.$id },
      });
      bobUpdates = true;
    } catch { /* esperado */ }
    check(`${tableId}: usuário de OUTRO lar não edita`, !bobUpdates);

    // Bob não apaga
    let bobDeletes = false;
    try {
      await bob.tables.deleteRow({ databaseId: DB_ID, tableId, rowId: rowA.$id });
      bobDeletes = true;
    } catch { /* esperado */ }
    check(`${tableId}: usuário de OUTRO lar não apaga`, !bobDeletes);
  }

  console.log('\nLimpando (deleção em cascata dos lares e usuários de teste)…');
  for (const teamId of [teamA.$id, teamB.$id]) {
    for (const { tableId } of tablesToTest) {
      const rows = await adminTables.listRows({
        databaseId: DB_ID, tableId, queries: [Query.equal('householdId', teamId)],
      });
      for (const row of rows.rows) {
        await adminTables.deleteRow({ databaseId: DB_ID, tableId, rowId: row.$id });
      }
    }
    await adminTeams.delete({ teamId });
  }
  await adminUsers.delete({ userId: alice.userId });
  await adminUsers.delete({ userId: bob.userId });

  if (failures > 0) {
    console.error(`\n${failures} verificação(ões) FALHARAM`);
    process.exit(1);
  }
  console.log('\nIsolamento de permissões: TODAS as verificações passaram ✅');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
