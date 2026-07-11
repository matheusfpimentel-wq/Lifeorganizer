/**
 * Diagnóstico somente-leitura de membros: lista teams, memberships e profiles
 * como o servidor os vê (API key). Não altera nada. Ajuda a distinguir
 * "membership não existe" de "client recebe campos ocultados por privacidade".
 */
import { Client, Query, TablesDB, Teams, Users } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID ?? 'morada';

if (!endpoint || !projectId || !apiKey) {
  console.error('Defina APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID e APPWRITE_API_KEY.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const teams = new Teams(client);
const tables = new TablesDB(client);
const users = new Users(client);

const mask = (s) => (s ? `${String(s).slice(0, 4)}…${String(s).slice(-4)}` : '(vazio)');

const teamList = (await teams.list()).teams;
console.log(`Teams: ${teamList.length}`);
for (const team of teamList) {
  console.log(`\n== Team "${team.name}" (${mask(team.$id)}) total=${team.total}`);
  const { memberships } = await teams.listMemberships({ teamId: team.$id });
  for (const m of memberships) {
    console.log(
      `  membership ${mask(m.$id)} userId=${mask(m.userId)} name="${m.userName}" email="${m.userEmail}" ` +
        `confirm=${m.confirm} invited=${!!m.invited} joined=${m.joined || '(nunca)'} roles=${m.roles.join(',')}`,
    );
  }
}

const { rows } = await tables.listRows({ databaseId: DB_ID, tableId: 'profiles', queries: [Query.limit(100)] });
console.log(`\nProfiles: ${rows.length}`);
for (const p of rows) {
  console.log(`  profile ${mask(p.$id)} userId=${mask(p.userId)} displayName="${p.displayName}" color=${p.color}`);
}

const userList = (await users.list()).users;
console.log(`\nUsers: ${userList.length}`);
for (const u of userList) {
  console.log(`  user ${mask(u.$id)} name="${u.name}" email="${u.email}" status=${u.status}`);
}
