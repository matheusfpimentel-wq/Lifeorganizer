import { describe, expect, it } from 'vitest';
import { expandEventOccurrences, type EventInput } from './calendar';

const ev = (over: Partial<EventInput> & { $id: string }): EventInput => ({
  startAt: '2026-07-10T14:00:00Z',
  endAt: '2026-07-10T15:00:00Z',
  ...over,
});

describe('expandEventOccurrences', () => {
  it('inclui evento avulso dentro da janela', () => {
    const result = expandEventOccurrences(
      [ev({ $id: 'a' })],
      new Date('2026-07-01T00:00:00Z'),
      new Date('2026-07-31T00:00:00Z'),
    );
    expect(result).toHaveLength(1);
    expect(result[0].eventId).toBe('a');
    expect(result[0].startAt.toISOString()).toBe('2026-07-10T14:00:00.000Z');
  });

  it('exclui evento avulso fora da janela', () => {
    const result = expandEventOccurrences(
      [ev({ $id: 'a', startAt: '2026-06-01T14:00:00Z', endAt: '2026-06-01T15:00:00Z' })],
      new Date('2026-07-01T00:00:00Z'),
      new Date('2026-07-31T00:00:00Z'),
    );
    expect(result).toHaveLength(0);
  });

  it('expande recorrente diário herdando a duração', () => {
    const result = expandEventOccurrences(
      [ev({ $id: 'r', rrule: 'FREQ=DAILY' })],
      new Date('2026-07-10T00:00:00Z'),
      new Date('2026-07-12T23:59:59Z'),
    );
    expect(result).toHaveLength(3);
    // duração de 1h preservada
    expect(result[0].endAt.getTime() - result[0].startAt.getTime()).toBe(60 * 60 * 1000);
    expect(result.map((o) => o.startAt.toISOString())).toEqual([
      '2026-07-10T14:00:00.000Z',
      '2026-07-11T14:00:00.000Z',
      '2026-07-12T14:00:00.000Z',
    ]);
  });

  it('respeita exdates em recorrentes', () => {
    const result = expandEventOccurrences(
      [ev({ $id: 'r', rrule: 'FREQ=DAILY', exdates: ['2026-07-11T14:00:00Z'] })],
      new Date('2026-07-10T00:00:00Z'),
      new Date('2026-07-12T23:59:59Z'),
    );
    expect(result.map((o) => o.startAt.toISOString())).toEqual([
      '2026-07-10T14:00:00.000Z',
      '2026-07-12T14:00:00.000Z',
    ]);
  });

  it('inclui ocorrência que começa antes da janela mas cruza para dentro', () => {
    // evento de 3h começando 23:00, janela começa no dia seguinte 00:00
    const result = expandEventOccurrences(
      [ev({ $id: 'x', startAt: '2026-07-10T23:00:00Z', endAt: '2026-07-11T02:00:00Z' })],
      new Date('2026-07-11T00:00:00Z'),
      new Date('2026-07-11T23:59:59Z'),
    );
    expect(result).toHaveLength(1);
  });

  it('ordena por início', () => {
    const result = expandEventOccurrences(
      [
        ev({ $id: 'late', startAt: '2026-07-20T10:00:00Z', endAt: '2026-07-20T11:00:00Z' }),
        ev({ $id: 'early', startAt: '2026-07-05T10:00:00Z', endAt: '2026-07-05T11:00:00Z' }),
      ],
      new Date('2026-07-01T00:00:00Z'),
      new Date('2026-07-31T00:00:00Z'),
    );
    expect(result.map((o) => o.eventId)).toEqual(['early', 'late']);
  });
});
