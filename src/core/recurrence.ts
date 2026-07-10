/**
 * Expansão de recorrência (RRULE) com timezone America/Sao_Paulo.
 *
 * O Brasil aboliu o horário de verão (2019): America/Sao_Paulo é UTC-3 fixo.
 * Estratégia (ADR-006): converter instantes UTC para "fake-UTC" no horário de
 * parede de São Paulo (offset fixo de -3h), expandir com a lib `rrule` (que
 * opera em UTC), e converter de volta. Determinístico em qualquer máquina,
 * independente do TZ do ambiente.
 */
import { rrulestr } from 'rrule';

export const SAO_PAULO_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3 fixo

/** Instante UTC -> Date cujo horário UTC representa o horário de parede em SP. */
export function utcToSaoPauloWall(utc: Date): Date {
  return new Date(utc.getTime() - SAO_PAULO_OFFSET_MS);
}

/** Inverso de utcToSaoPauloWall. */
export function saoPauloWallToUtc(wall: Date): Date {
  return new Date(wall.getTime() + SAO_PAULO_OFFSET_MS);
}

export interface ExpandOptions {
  /** RRULE (só a regra, ex.: "FREQ=WEEKLY;BYDAY=MO") ou string com DTSTART embutido. */
  rruleString: string;
  /** Primeiro início do evento/tarefa, em UTC. */
  dtstartUtc: Date;
  /** Exceções (instantes UTC exatos de ocorrências canceladas). */
  exdatesUtc?: Date[];
  windowStartUtc: Date;
  windowEndUtc: Date;
  /** Limite de segurança de ocorrências por expansão. */
  limit?: number;
}

/**
 * Expande a recorrência dentro da janela [windowStartUtc, windowEndUtc],
 * inclusiva nas bordas, retornando instantes UTC ordenados.
 */
export function expandRecurrence(options: ExpandOptions): Date[] {
  const {
    rruleString,
    dtstartUtc,
    exdatesUtc = [],
    windowStartUtc,
    windowEndUtc,
    limit = 500,
  } = options;

  const rule = rrulestr(rruleString, { dtstart: utcToSaoPauloWall(dtstartUtc) });
  const wallOccurrences = rule.between(
    utcToSaoPauloWall(windowStartUtc),
    utcToSaoPauloWall(windowEndUtc),
    true,
  );

  const excluded = new Set(exdatesUtc.map((d) => d.getTime()));
  return wallOccurrences
    .slice(0, limit)
    .map(saoPauloWallToUtc)
    .filter((occurrence) => !excluded.has(occurrence.getTime()));
}
