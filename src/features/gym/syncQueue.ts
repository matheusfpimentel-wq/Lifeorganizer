/**
 * Fila de sync offline-first para o Treino. Cada operação carrega um rowId
 * gerado no cliente (ID.unique()), então uma criação feita offline mapeia 1:1
 * na linha do Appwrite quando sobe — sem remapear ids. Persistida em
 * localStorage; drena ao voltar a conexão e no próximo carregamento.
 */
import { DB_ID, tablesDB, type TableId } from '@/lib/appwrite';

interface QueueOp {
  key: string; // idempotência local
  table: TableId;
  rowId: string;
  op: 'create' | 'update' | 'delete';
  data?: Record<string, unknown>;
  permissions?: string[];
}

const STORAGE_KEY = 'training:syncQueue';
let flushing = false;

function read(): QueueOp[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}
function write(ops: QueueOp[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
}

export function pendingCount(): number {
  return read().length;
}

/** Enfileira uma operação e tenta drenar já (best-effort). */
export function enqueue(op: QueueOp): void {
  const ops = read();
  if (!ops.some((o) => o.key === op.key)) {
    ops.push(op);
    write(ops);
  }
  void flush();
}

/** Drena a fila em ordem; para no primeiro erro de rede (tenta de novo depois). */
export async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    let ops = read();
    while (ops.length > 0) {
      const op = ops[0];
      try {
        if (op.op === 'create') {
          await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: op.table,
            rowId: op.rowId,
            data: op.data ?? {},
            permissions: op.permissions,
          });
        } else if (op.op === 'update') {
          await tablesDB.updateRow({ databaseId: DB_ID, tableId: op.table, rowId: op.rowId, data: op.data ?? {} });
        } else {
          await tablesDB.deleteRow({ databaseId: DB_ID, tableId: op.table, rowId: op.rowId });
        }
      } catch (err) {
        const code = (err as { code?: number }).code;
        // 409: já existe (criação repetida) — considera sincronizado e segue
        // 4xx de validação: não adianta repetir, descarta pra não travar a fila
        const drop = code === 409 || (typeof code === 'number' && code >= 400 && code < 500);
        if (!drop) break; // provável falta de rede: mantém e tenta depois
      }
      ops = read().filter((o) => o.key !== op.key);
      write(ops);
    }
  } finally {
    flushing = false;
  }
}

/** Liga o auto-drain: ao reconectar e a cada N segundos. Retorna cleanup. */
export function startAutoFlush(): () => void {
  void flush();
  const onOnline = () => void flush();
  window.addEventListener('online', onOnline);
  const timer = window.setInterval(() => {
    if (navigator.onLine) void flush();
  }, 20_000);
  return () => {
    window.removeEventListener('online', onOnline);
    window.clearInterval(timer);
  };
}
