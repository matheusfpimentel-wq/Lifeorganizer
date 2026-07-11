/**
 * Consolida os lares duplicados em UM time canônico:
 * 1. Conta as linhas por householdId em todas as tabelas com essa coluna.
 * 2. Escolhe o time canônico (mais dados; override via CANONICAL_TEAM_ID).
 * 3. Garante os usuários com profile como membros confirmados do canônico.
 * 4. Migra linhas dos outros householdIds (data + permissões do time).
 * 5. Ajusta permissões dos profiles (dono + leitura pelo time canônico).
 * 6. Remove teams não-canônicos esvaziados e linhas órfãs de households.
 *
 * Sem APPLY=1 roda em modo simulação (só imprime o plano, não altera nada).
 */
import { readFileSync } from 'node:fs';
import { Client, ID, Permission, Query, Role, TablesDB, Teams, Users } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID ?? 'morada';
const APPLY = process.env.APPLY === '1';
const OVERRIDE = process.env.CANONICAL_TEAM_ID || null;

if (!endpoint || !projectId || !apiKey) {
  console.error('Defina APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID e APPWRITE_API_KEY.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tables = new TablesDB(client);
const teams = new Teams(client);
const users = new Users(client);

const config = JSON.parse(readFileSync(new URL('../appwrite.config.json', import.meta.url), 'utf8'));
const mask = (s) => (s ? `${String(s).slice(0, 4)}…${String(s).slice(-4)}` : '(vazio)');
console.log(APPLY ? '== MODO APLICAR ==' : '== MODO SIMULAÇÃO (defina APPLY=1 para executar) ==');

const teamPermissions = (teamId) => [
  Permission.read(Role.team(teamId)),
  Permission.update(Role.team(teamId)),
  Permission.delete(Role.team(teamId)),
];

/** Lista todas as linhas de uma tabela paginando por cursor. */
async function allRows(tableId, queries = []) {
  const rows = [];
  let cursor = null;
  for (;;) {
    const q = [...queries, Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])];
    const page = await tables.listRows({ databaseId: DB_ID, tableId, queries: q });
    rows.push(...page.rows);
    if (page.rows.length < 100) return rows;
    cursor = page.rows[page.rows.length - 1].$id;
  }
}

// ---- 1. levantamento -------------------------------------------------------
const teamList = (await teams.list()).teams;
const householdTables = config.tables
  .filter((t) => (t.columns ?? []).some((c) => c.key === 'householdId'))
  .map((t) => t.$id);

const countsByTeam = new Map(teamList.map((t) => [t.$id, 0]));
const rowsByTable = new Map();
for (const tableId of householdTables) {
  const rows = await allRows(tableId);
  rowsByTable.set(tableId, rows);
  for (const row of rows) {
    if (row.householdId && countsByTeam.has(row.householdId)) {
      countsByTeam.set(row.householdId, countsByTeam.get(row.householdId) + 1);
    }
  }
}

console.log('\nLinhas de dados por time:');
for (const team of teamList) {
  console.log(`  ${team.name} (${mask(team.$id)}): ${countsByTeam.get(team.$id)} linha(s)`);
}

// ---- 2. escolha do canônico -------------------------------------------------
const canonicalId =
  OVERRIDE ?? [...countsByTeam.entries()].sort((a, b) => b[1] - a[1])[0][0];
const canonical = teamList.find((t) => t.$id === canonicalId);
if (!canonical) {
  console.error(`Time canônico ${canonicalId} não encontrado.`);
  process.exit(1);
}
console.log(`\nTime canônico: "${canonical.name}" (${mask(canonicalId)})`);

// ---- 3. membros -------------------------------------------------------------
const profiles = await allRows('profiles');
const wantedUserIds = profiles.map((p) => p.userId).filter(Boolean);
const currentMembers = (await teams.listMemberships({ teamId: canonicalId })).memberships;
const currentUserIds = new Set(currentMembers.map((m) => m.userId));

for (const userId of wantedUserIds) {
  if (currentUserIds.has(userId)) {
    console.log(`= já é membro: ${mask(userId)}`);
    continue;
  }
  const account = await users.get({ userId });
  console.log(`+ adicionar membro: ${account.name || account.email} (${mask(userId)})`);
  if (APPLY) {
    await teams.createMembership({ teamId: canonicalId, userId, roles: ['owner'] });
  }
}

// ---- 4. migração de dados ----------------------------------------------------
for (const tableId of householdTables) {
  const rows = rowsByTable.get(tableId) ?? [];
  for (const row of rows) {
    if (!row.householdId || row.householdId === canonicalId) continue;
    console.log(`~ migrar ${tableId}/${mask(row.$id)} (${mask(row.householdId)} -> canônico)`);
    if (APPLY) {
      await tables.updateRow({
        databaseId: DB_ID,
        tableId,
        rowId: row.$id,
        data: { householdId: canonicalId },
        permissions: teamPermissions(canonicalId),
      });
    }
  }
}

// ---- 5. households + profiles -------------------------------------------------
const households = await allRows('households');
const canonicalRow = households.find((h) => h.teamId === canonicalId);
if (!canonicalRow) {
  console.log(`+ criar linha households para o canônico`);
  if (APPLY) {
    await tables.createRow({
      databaseId: DB_ID,
      tableId: 'households',
      rowId: ID.unique(),
      data: {
        teamId: canonicalId,
        name: canonical.name,
        settings: JSON.stringify({ weekStart: 'sunday', currency: 'BRL' }),
      },
      permissions: teamPermissions(canonicalId),
    });
  }
}
for (const h of households) {
  if (h.teamId === canonicalId) continue;
  console.log(`- remover households órfã ${mask(h.$id)} (team ${mask(h.teamId)})`);
  if (APPLY) {
    await tables.deleteRow({ databaseId: DB_ID, tableId: 'households', rowId: h.$id });
  }
}

for (const p of profiles) {
  if (!p.userId) continue;
  console.log(`~ permissões do profile ${p.displayName || mask(p.$id)}: dono + leitura do time canônico`);
  if (APPLY) {
    await tables.updateRow({
      databaseId: DB_ID,
      tableId: 'profiles',
      rowId: p.$id,
      permissions: [
        Permission.read(Role.user(p.userId)),
        Permission.update(Role.user(p.userId)),
        Permission.delete(Role.user(p.userId)),
        Permission.read(Role.team(canonicalId)),
      ],
    });
  }
}

// ---- 6. remoção dos times duplicados ------------------------------------------
for (const team of teamList) {
  if (team.$id === canonicalId) continue;
  console.log(`- excluir time duplicado "${team.name}" (${mask(team.$id)})`);
  if (APPLY) {
    await teams.delete({ teamId: team.$id });
  }
}

console.log(APPLY ? '\nConsolidação aplicada.' : '\nSimulação concluída — nada foi alterado.');
