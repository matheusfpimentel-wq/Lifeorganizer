/**
 * Keepalive do Appwrite (plano Free).
 *
 * Desde 27/02/2026 o plano Free pausa projetos com 7 dias sem atividade. Este
 * script faz UMA requisição autenticada ao projeto — rodado pelo GitHub Actions
 * a cada poucos dias (ver .github/workflows/keepalive.yml), de forma
 * independente de o casal abrir o app ou de a function `tick` estar de pé.
 *
 * A API key vive só como secret de CI (nunca no bundle), como manda o CLAUDE.md.
 *
 * Modo padrão: LEITURA (listRows) — não cria schema nem escreve nada.
 * Modo escrita (opcional): defina KEEPALIVE_TABLE para gravar/atualizar uma
 * única linha idempotente (útil caso a Appwrite passe a exigir escrita).
 */
import { Client, TablesDB, Query } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID ?? 'morada';
const writeTable = process.env.KEEPALIVE_TABLE?.trim();
const readTable = process.env.KEEPALIVE_READ_TABLE?.trim() || 'households';

if (!endpoint || !projectId || !apiKey) {
  console.error('[keepalive] faltam APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID e/ou APPWRITE_API_KEY.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tables = new TablesDB(client);
const now = new Date().toISOString();

try {
  if (writeTable) {
    const rowId = process.env.KEEPALIVE_ROW_ID?.trim() || 'keepalive';
    try {
      await tables.updateRow({ databaseId: DB_ID, tableId: writeTable, rowId, data: { beatAt: now } });
    } catch {
      await tables.createRow({ databaseId: DB_ID, tableId: writeTable, rowId, data: { beatAt: now } });
    }
    console.log(`[keepalive] escrita OK em ${writeTable}/${rowId} @ ${now}`);
  } else {
    const res = await tables.listRows({ databaseId: DB_ID, tableId: readTable, queries: [Query.limit(1)] });
    console.log(`[keepalive] leitura OK em ${readTable} (total=${res.total}) @ ${now}`);
  }
  console.log('[keepalive] atividade registrada no Appwrite.');
} catch (err) {
  console.error('[keepalive] falhou:', err?.message ?? err);
  process.exit(1);
}
