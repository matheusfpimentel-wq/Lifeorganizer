import { describe, expect, it } from 'vitest';
import { balanceWindowStart, computeBalance } from './balance';

describe('computeBalance', () => {
  it('agrega conclusões ponderadas por pontos', () => {
    const result = computeBalance(
      [
        { completedBy: 'a', points: 1 },
        { completedBy: 'a', points: 3 },
        { completedBy: 'b', points: 2 },
      ],
      ['a', 'b'],
    );
    expect(result.totalCount).toBe(3);
    expect(result.totalWeightedPoints).toBe(6);
    expect(result.rows).toEqual([
      { memberId: 'a', count: 2, weightedPoints: 4, share: 4 / 6 },
      { memberId: 'b', count: 1, weightedPoints: 2, share: 2 / 6 },
    ]);
  });

  it('inclui membros sem conclusões (share 0)', () => {
    const result = computeBalance([{ completedBy: 'a', points: 1 }], ['a', 'b', 'c']);
    expect(result.rows.map((r) => r.memberId)).toEqual(['a', 'b', 'c']);
    expect(result.rows.find((r) => r.memberId === 'c')).toEqual({
      memberId: 'c',
      count: 0,
      weightedPoints: 0,
      share: 0,
    });
  });

  it('ignora conclusões sem autor (volunteer não concluído por ninguém)', () => {
    const result = computeBalance(
      [
        { completedBy: null, points: 5 },
        { completedBy: undefined, points: 5 },
        { completedBy: 'a', points: 1 },
      ],
      ['a'],
    );
    expect(result.totalCount).toBe(1);
    expect(result.totalWeightedPoints).toBe(1);
  });

  it('sem conclusões: todos zerados, share 0, sem divisão por zero', () => {
    const result = computeBalance([], ['a', 'b']);
    expect(result.totalWeightedPoints).toBe(0);
    expect(result.rows.every((r) => r.share === 0)).toBe(true);
  });

  it('ordena por pontos desc e desempata por memberId asc (determinístico)', () => {
    const result = computeBalance(
      [
        { completedBy: 'z', points: 2 },
        { completedBy: 'a', points: 2 },
        { completedBy: 'm', points: 5 },
      ],
      ['z', 'a', 'm'],
    );
    expect(result.rows.map((r) => r.memberId)).toEqual(['m', 'a', 'z']);
  });

  it('conta autor fora da lista de membros informada (ex.: ex-membro)', () => {
    const result = computeBalance(
      [{ completedBy: 'ghost', points: 4 }, { completedBy: 'a', points: 1 }],
      ['a'],
    );
    expect(result.totalWeightedPoints).toBe(5);
    expect(result.rows.find((r) => r.memberId === 'ghost')?.weightedPoints).toBe(4);
  });
});

describe('balanceWindowStart', () => {
  it('retorna 30 dias antes por padrão', () => {
    const now = new Date('2026-07-31T12:00:00Z');
    expect(balanceWindowStart(now).toISOString()).toBe('2026-07-01T12:00:00.000Z');
  });

  it('aceita janela customizada', () => {
    const now = new Date('2026-07-31T12:00:00Z');
    expect(balanceWindowStart(now, 7).toISOString()).toBe('2026-07-24T12:00:00.000Z');
  });
});
