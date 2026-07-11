/**
 * Expansão de eventos (com recorrência) numa janela — núcleo puro (sem I/O).
 * Reusa `expandRecurrence` (timezone America/Sao_Paulo fixo).
 */
import { expandRecurrence } from './recurrence';

export interface EventInput {
  $id: string;
  startAt: string; // ISO/UTC
  endAt: string; // ISO/UTC
  rrule?: string | null;
  exdates?: string[]; // ISO/UTC das ocorrências canceladas
}

export interface EventOccurrence {
  eventId: string;
  startAt: Date;
  endAt: Date;
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart <= bEnd && aEnd >= bStart;

/**
 * Expande eventos (recorrentes e avulsos) que tocam a janela
 * [windowStartUtc, windowEndUtc]. Ocorrências recorrentes herdam a duração do
 * evento base. Resultado ordenado por início.
 */
export function expandEventOccurrences(
  events: EventInput[],
  windowStartUtc: Date,
  windowEndUtc: Date,
): EventOccurrence[] {
  const winStart = windowStartUtc.getTime();
  const winEnd = windowEndUtc.getTime();
  const out: EventOccurrence[] = [];

  for (const event of events) {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    const durationMs = Math.max(0, end.getTime() - start.getTime());

    if (!event.rrule) {
      if (overlaps(start.getTime(), end.getTime(), winStart, winEnd)) {
        out.push({ eventId: event.$id, startAt: start, endAt: end });
      }
      continue;
    }

    // recorrente: expande os inícios e aplica a duração; alarga a janela de
    // busca pela duração para pegar ocorrências que começam antes e cruzam.
    const occurrences = expandRecurrence({
      rruleString: event.rrule,
      dtstartUtc: start,
      exdatesUtc: (event.exdates ?? []).map((d) => new Date(d)),
      windowStartUtc: new Date(winStart - durationMs),
      windowEndUtc: windowEndUtc,
    });
    for (const occStart of occurrences) {
      const occEnd = new Date(occStart.getTime() + durationMs);
      if (overlaps(occStart.getTime(), occEnd.getTime(), winStart, winEnd)) {
        out.push({ eventId: event.$id, startAt: occStart, endAt: occEnd });
      }
    }
  }

  return out.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}
