/**
 * Hotfix cirúrgico de schema (sem `push tables`, sem risco de recriação):
 * 1. workoutSessionSets: cria durationSeconds (int) e technique (enum) se faltarem.
 * 2. households: recria teamId/name/settings (opcionais) se faltarem — colunas
 *    apagadas pelo push #13 que detectou diff falso e recriou colunas.
 * 3. repara a linha de households com teamId nulo usando o Team existente.
 *
 * Uso (CI): node scripts/schema-hotfix.mjs  — requer APPWRITE_ENDPOINT,
 * APPWRITE_PROJECT_ID e APPWRITE_API_KEY no ambiente.
 */
import { Client, Query, TablesDB, Teams } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID ?? 'morada';

if (!endpoint || !projectId || !apiKey) {
  console.error('Defina APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID e APPWRITE_API_KEY.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tables = new TablesDB(client);
const teams = new Teams(client);

async function ensure(label, fn) {
  try {
    await fn();
    console.log(`+ criado: ${label}`);
  } catch (err) {
    if (err?.code === 409) console.log(`= já existe: ${label}`);
    else throw err;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // 1. colunas novas da academia -------------------------------------------
  await ensure('workoutSessionSets.durationSeconds', () =>
    tables.createIntegerColumn({
      databaseId: DB_ID,
      tableId: 'workoutSessionSets',
      key: 'durationSeconds',
      required: false,
      min: 0,
    }),
  );
  await ensure('workoutSessionSets.technique', () =>
    tables.createEnumColumn({
      databaseId: DB_ID,
      tableId: 'workoutSessionSets',
      key: 'technique',
      elements: ['normal', 'aquecimento', 'dropset', 'restPause', 'falha', 'superset', 'isometria'],
      required: false,
    }),
  );

  // 2. households: garante colunas (opcionais — a tabela tem linhas) --------
  await ensure('households.teamId', () =>
    tables.createStringColumn({
      databaseId: DB_ID,
      tableId: 'households',
      key: 'teamId',
      size: 36,
      required: false,
    }),
  );
  await ensure('households.name', () =>
    tables.createStringColumn({
      databaseId: DB_ID,
      tableId: 'households',
      key: 'name',
      size: 128,
      required: false,
    }),
  );
  await ensure('households.settings', () =>
    tables.createStringColumn({
      databaseId: DB_ID,
      tableId: 'households',
      key: 'settings',
      size: 2000,
      required: false,
    }),
  );

  // aguarda as colunas ficarem disponíveis antes de gravar
  await sleep(3000);

  // 3. repara linhas de households sem teamId -------------------------------
  const { rows } = await tables.listRows({
    databaseId: DB_ID,
    tableId: 'households',
    queries: [Query.limit(100)],
  });
  const teamList = (await teams.list()).teams;
  console.log(`households: ${rows.length} linha(s); teams: ${teamList.length}`);

  for (const row of rows) {
    if (row.teamId) {
      console.log(`= linha ${row.$id} ok (teamId=${row.teamId})`);
      continue;
    }
    // associa pelo Team cujas permissões da linha o referenciam; fallback: único team
    const permTeam = (row.$permissions ?? [])
      .map((p) => /team:([a-zA-Z0-9_]+)/.exec(p)?.[1])
      .find(Boolean);
    const team =
      teamList.find((t) => t.$id === permTeam) ?? (teamList.length === 1 ? teamList[0] : null);
    if (!team) {
      console.log(`! linha ${row.$id} sem teamId e sem team inferível — pulei`);
      continue;
    }
    await tables.updateRow({
      databaseId: DB_ID,
      tableId: 'households',
      rowId: row.$id,
      data: {
        teamId: team.$id,
        name: row.name ?? team.name,
        settings: row.settings ?? JSON.stringify({ weekStart: 'sunday', currency: 'BRL' }),
      },
    });
    console.log(`+ linha ${row.$id} reparada (teamId=${team.$id}, name=${team.name})`);
  }

  console.log('Hotfix concluído.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
