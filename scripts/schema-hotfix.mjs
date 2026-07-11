/**
 * Auditoria e reparo de schema (sem `push tables`, nunca apaga nada):
 * 1. Para cada tabela do appwrite.config.json, cria as colunas que faltarem no
 *    remoto (sempre como opcionais — tabelas com linhas não aceitam required).
 * 2. Cria os índices que faltarem.
 * 3. Repara dados: households sem teamId (via permissões/Team) e profiles sem
 *    displayName/color (nome vem do cadastro de login via Users API).
 *
 * Uso (CI): node scripts/schema-hotfix.mjs — requer APPWRITE_ENDPOINT,
 * APPWRITE_PROJECT_ID e APPWRITE_API_KEY no ambiente.
 */
import { readFileSync } from 'node:fs';
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
const tables = new TablesDB(client);
const teams = new Teams(client);
const users = new Users(client);

const config = JSON.parse(readFileSync(new URL('../appwrite.config.json', import.meta.url), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PALETTE = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#14b8a6'];

/** Cria uma coluna a partir da definição do config. Sempre opcional (seguro). */
async function createColumn(tableId, col) {
  const base = { databaseId: DB_ID, tableId, key: col.key, required: false };
  if (col.array) base.array = true;
  if (col.format === 'enum') {
    return tables.createEnumColumn({ ...base, elements: col.elements });
  }
  switch (col.type) {
    case 'string':
      return tables.createStringColumn({ ...base, size: col.size ?? 255 });
    case 'integer': {
      const opts = { ...base };
      if (col.min !== undefined && col.min !== null) opts.min = Number(col.min);
      if (col.max !== undefined && col.max !== null) opts.max = Number(col.max);
      return tables.createIntegerColumn(opts);
    }
    case 'double': {
      const opts = { ...base };
      if (col.min !== undefined && col.min !== null) opts.min = Number(col.min);
      if (col.max !== undefined && col.max !== null) opts.max = Number(col.max);
      return tables.createFloatColumn(opts);
    }
    case 'boolean':
      return tables.createBooleanColumn(base);
    case 'datetime':
      return tables.createDatetimeColumn(base);
    default:
      throw new Error(`Tipo não suportado: ${col.type} (${tableId}.${col.key})`);
  }
}

async function auditTable(tableDef) {
  const tableId = tableDef.$id;
  const remote = await tables.listColumns({ databaseId: DB_ID, tableId });
  const remoteKeys = new Set(remote.columns.map((c) => c.key));
  let created = 0;

  for (const col of tableDef.columns ?? []) {
    if (remoteKeys.has(col.key)) continue;
    try {
      await createColumn(tableId, col);
      console.log(`+ coluna criada: ${tableId}.${col.key}`);
      created++;
    } catch (err) {
      if (err?.code === 409) console.log(`= coluna já existe: ${tableId}.${col.key}`);
      else throw err;
    }
  }

  const remoteIdx = await tables.listIndexes({ databaseId: DB_ID, tableId });
  const remoteIdxKeys = new Set(remoteIdx.indexes.map((i) => i.key));
  for (const idx of tableDef.indexes ?? []) {
    if (remoteIdxKeys.has(idx.key)) continue;
    try {
      // índices dependem das colunas estarem disponíveis
      if (created > 0) await sleep(2000);
      await tables.createIndex({
        databaseId: DB_ID,
        tableId,
        key: idx.key,
        type: idx.type,
        columns: idx.columns,
      });
      console.log(`+ índice criado: ${tableId}.${idx.key}`);
    } catch (err) {
      if (err?.code === 409) console.log(`= índice já existe: ${tableId}.${idx.key}`);
      else console.log(`! índice ${tableId}.${idx.key} falhou: ${err.message}`);
    }
  }
  return created;
}

async function repairHouseholds() {
  const { rows } = await tables.listRows({ databaseId: DB_ID, tableId: 'households', queries: [Query.limit(100)] });
  const teamList = (await teams.list()).teams;
  for (const row of rows) {
    if (row.teamId) continue;
    const permTeam = (row.$permissions ?? [])
      .map((p) => /team:([a-zA-Z0-9_]+)/.exec(p)?.[1])
      .find(Boolean);
    const team = teamList.find((t) => t.$id === permTeam) ?? (teamList.length === 1 ? teamList[0] : null);
    if (!team) continue;
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
    console.log(`+ household ${row.$id} reparado (team=${team.name})`);
  }
}

async function repairProfiles() {
  const { rows } = await tables.listRows({ databaseId: DB_ID, tableId: 'profiles', queries: [Query.limit(100)] });
  let i = 0;
  for (const row of rows) {
    const needsName = !row.displayName;
    const needsColor = !row.color;
    const needsUser = !row.userId;
    if (!needsName && !needsColor && !needsUser) {
      console.log(`= profile ${row.$id} ok (${row.displayName})`);
      continue;
    }
    // userId perdido? tenta recuperar pelas permissões da linha (user:xxx)
    const userId =
      row.userId ??
      (row.$permissions ?? []).map((p) => /user:([a-zA-Z0-9_]+)/.exec(p)?.[1]).find(Boolean);
    if (!userId) {
      console.log(`! profile ${row.$id} sem userId inferível — pulei`);
      continue;
    }
    let name = row.displayName;
    if (!name) {
      try {
        const account = await users.get({ userId });
        name = account.name || account.email || 'Membro';
      } catch {
        name = 'Membro';
      }
    }
    await tables.updateRow({
      databaseId: DB_ID,
      tableId: 'profiles',
      rowId: row.$id,
      data: {
        userId,
        displayName: name,
        color: row.color ?? PALETTE[i % PALETTE.length],
      },
    });
    console.log(`+ profile ${row.$id} reparado (${name})`);
    i++;
  }
}

async function main() {
  let totalCreated = 0;
  for (const tableDef of config.tables) {
    totalCreated += await auditTable(tableDef);
  }
  if (totalCreated > 0) {
    console.log(`Aguardando ${totalCreated} coluna(s) ficarem disponíveis...`);
    await sleep(5000);
  }
  await repairHouseholds();
  await repairProfiles();
  console.log('Auditoria e reparo concluídos.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
