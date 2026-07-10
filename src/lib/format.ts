/** Formatação pt-BR com timezone America/Sao_Paulo (exibição). */

const TZ = 'America/Sao_Paulo';

export { formatCentsBRL, parseBRLToCents } from '@/core/money';

/** DD/MM/AAAA */
export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, dateStyle: 'short' }).format(
    typeof iso === 'string' ? new Date(iso) : iso,
  );
}

/** HH:mm */
export function formatTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** DD/MM/AAAA HH:mm */
export function formatDateTime(iso: string | Date): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

/** Saudação conforme hora local de São Paulo. */
export function greeting(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: 'numeric', hour12: false }).format(now),
  );
  if (hour < 6) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Início e fim do dia local de SP (UTC-3 fixo), em UTC. */
export function saoPauloDayBoundsUtc(now = new Date()): { start: Date; end: Date } {
  const offsetMs = 3 * 60 * 60 * 1000;
  const wall = new Date(now.getTime() - offsetMs);
  const start = new Date(
    Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate()) + offsetMs,
  );
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1) };
}
