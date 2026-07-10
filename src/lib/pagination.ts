/**
 * Paginação por cursor — agregações acontecem no cliente (ADR-004).
 * Na escala de um lar isso é barato; ainda assim, sempre paginar.
 */
import { Query } from 'appwrite';
import { tablesDB, DB_ID, type TableId } from './appwrite';

const PAGE_SIZE = 100;

/** Varre todas as linhas que casam com as queries, página a página. */
export async function listAllRows<T extends { $id: string }>(
  tableId: TableId,
  queries: string[] = [],
  maxRows = 5000,
): Promise<T[]> {
  const rows: T[] = [];
  let cursor: string | null = null;

  while (rows.length < maxRows) {
    const pageQueries = [...queries, Query.limit(PAGE_SIZE)];
    if (cursor) pageQueries.push(Query.cursorAfter(cursor));
    const page = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId,
      queries: pageQueries,
    });
    rows.push(...(page.rows as unknown as T[]));
    if (page.rows.length < PAGE_SIZE) break;
    cursor = page.rows[page.rows.length - 1].$id;
  }
  return rows;
}
