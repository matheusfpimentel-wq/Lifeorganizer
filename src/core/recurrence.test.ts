import { describe, expect, it } from 'vitest';
import {
  expandRecurrence,
  saoPauloWallToUtc,
  utcToSaoPauloWall,
} from './recurrence';

describe('conversão de timezone (UTC-3 fixo)', () => {
  it('12:00 UTC == 09:00 em São Paulo', () => {
    const utc = new Date('2026-07-10T12:00:00Z');
    expect(utcToSaoPauloWall(utc).toISOString()).toBe('2026-07-10T09:00:00.000Z');
    expect(saoPauloWallToUtc(utcToSaoPauloWall(utc)).getTime()).toBe(utc.getTime());
  });

  it('virada de dia: 01:00 UTC é 22:00 do dia anterior em SP', () => {
    const utc = new Date('2026-07-10T01:00:00Z');
    expect(utcToSaoPauloWall(utc).toISOString()).toBe('2026-07-09T22:00:00.000Z');
  });
});

describe('expandRecurrence', () => {
  it('diária às 08:00 SP mantém o horário de parede (11:00 UTC)', () => {
    // 08:00 em SP = 11:00 UTC
    const occurrences = expandRecurrence({
      rruleString: 'FREQ=DAILY',
      dtstartUtc: new Date('2026-07-01T11:00:00Z'),
      windowStartUtc: new Date('2026-07-01T00:00:00Z'),
      windowEndUtc: new Date('2026-07-04T23:59:59Z'),
    });
    expect(occurrences.map((d) => d.toISOString())).toEqual([
      '2026-07-01T11:00:00.000Z',
      '2026-07-02T11:00:00.000Z',
      '2026-07-03T11:00:00.000Z',
      '2026-07-04T11:00:00.000Z',
    ]);
  });

  it('semanal por dia da semana usa o dia LOCAL de SP, não o dia UTC', () => {
    // 23:00 de segunda em SP = 02:00 UTC de terça.
    // FREQ=WEEKLY;BYDAY=MO deve casar com a segunda LOCAL.
    const occurrences = expandRecurrence({
      rruleString: 'FREQ=WEEKLY;BYDAY=MO',
      dtstartUtc: new Date('2026-07-07T02:00:00Z'), // seg 06/07 23:00 SP
      windowStartUtc: new Date('2026-07-01T00:00:00Z'),
      windowEndUtc: new Date('2026-07-21T02:00:00Z'),
    });
    expect(occurrences.map((d) => d.toISOString())).toEqual([
      '2026-07-07T02:00:00.000Z', // seg 06/07 23:00 SP
      '2026-07-14T02:00:00.000Z', // seg 13/07 23:00 SP
      '2026-07-21T02:00:00.000Z', // seg 20/07 23:00 SP (borda inclusiva)
    ]);
  });

  it('exdates removem ocorrências específicas', () => {
    const occurrences = expandRecurrence({
      rruleString: 'FREQ=DAILY',
      dtstartUtc: new Date('2026-07-01T11:00:00Z'),
      exdatesUtc: [new Date('2026-07-02T11:00:00Z')],
      windowStartUtc: new Date('2026-07-01T00:00:00Z'),
      windowEndUtc: new Date('2026-07-03T23:59:59Z'),
    });
    expect(occurrences.map((d) => d.toISOString())).toEqual([
      '2026-07-01T11:00:00.000Z',
      '2026-07-03T11:00:00.000Z',
    ]);
  });

  it('janela anterior ao dtstart não gera ocorrências', () => {
    const occurrences = expandRecurrence({
      rruleString: 'FREQ=DAILY',
      dtstartUtc: new Date('2026-07-10T11:00:00Z'),
      windowStartUtc: new Date('2026-07-01T00:00:00Z'),
      windowEndUtc: new Date('2026-07-05T00:00:00Z'),
    });
    expect(occurrences).toEqual([]);
  });

  it('COUNT é respeitado', () => {
    const occurrences = expandRecurrence({
      rruleString: 'FREQ=DAILY;COUNT=2',
      dtstartUtc: new Date('2026-07-01T11:00:00Z'),
      windowStartUtc: new Date('2026-06-01T00:00:00Z'),
      windowEndUtc: new Date('2026-08-01T00:00:00Z'),
    });
    expect(occurrences).toHaveLength(2);
  });

  it('mensal dia 1º às 04:00 SP: dia local correto mesmo cruzando o dia em UTC', () => {
    // 04:00 SP = 07:00 UTC — sem cruzamento; agora 22:00 SP dia 1 = 01:00 UTC dia 2
    const occurrences = expandRecurrence({
      rruleString: 'FREQ=MONTHLY;BYMONTHDAY=1',
      dtstartUtc: new Date('2026-07-02T01:00:00Z'), // 01/07 22:00 SP
      windowStartUtc: new Date('2026-07-01T00:00:00Z'),
      windowEndUtc: new Date('2026-09-30T00:00:00Z'),
    });
    expect(occurrences.map((d) => d.toISOString())).toEqual([
      '2026-07-02T01:00:00.000Z', // 01/07 SP
      '2026-08-02T01:00:00.000Z', // 01/08 SP
      '2026-09-02T01:00:00.000Z', // 01/09 SP
    ]);
  });
});
