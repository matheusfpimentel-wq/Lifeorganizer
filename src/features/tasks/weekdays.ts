/** Helpers de recorrência para a UI de tarefas (BYDAY do RRULE). */

export const WEEKDAYS: { code: string; short: string; label: string }[] = [
  { code: 'SU', short: 'D', label: 'Domingo' },
  { code: 'MO', short: 'S', label: 'Segunda' },
  { code: 'TU', short: 'T', label: 'Terça' },
  { code: 'WE', short: 'Q', label: 'Quarta' },
  { code: 'TH', short: 'Q', label: 'Quinta' },
  { code: 'FR', short: 'S', label: 'Sexta' },
  { code: 'SA', short: 'S', label: 'Sábado' },
];

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

/** Monta um RRULE a partir da UI (frequência + dias da semana + intervalo). */
export function buildRrule(freq: Frequency, byday: string[], interval = 1): string {
  const parts = [`FREQ=${freq}`];
  if (interval > 1) parts.push(`INTERVAL=${interval}`);
  if (freq === 'WEEKLY' && byday.length > 0) parts.push(`BYDAY=${byday.join(',')}`);
  return parts.join(';');
}

/** Descrição pt-BR curta de um RRULE para exibição. */
export function describeRrule(rrule: string): string {
  const map = new Map(rrule.split(';').map((p) => p.split('=') as [string, string]));
  const freq = map.get('FREQ');
  const interval = Number(map.get('INTERVAL') ?? '1');
  if (freq === 'DAILY') return interval > 1 ? `A cada ${interval} dias` : 'Todo dia';
  if (freq === 'MONTHLY') return interval > 1 ? `A cada ${interval} meses` : 'Todo mês';
  if (freq === 'WEEKLY') {
    const days = (map.get('BYDAY') ?? '')
      .split(',')
      .filter(Boolean)
      .map((code) => WEEKDAYS.find((w) => w.code === code)?.label ?? code)
      .join(', ');
    const base = interval > 1 ? `A cada ${interval} semanas` : 'Toda semana';
    return days ? `${base} (${days})` : base;
  }
  return rrule;
}
