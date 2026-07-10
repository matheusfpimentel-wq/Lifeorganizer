import { describe, expect, it } from 'vitest';
import { computeSplits, splitsMatchTotal } from './split';

const sum = (splits: { amountCents: number }[]) =>
  splits.reduce((acc, s) => acc + s.amountCents, 0);

describe('computeSplits — equal', () => {
  it('caso canônico: R$ 100,00 ÷ 3 = 33,34 + 33,33 + 33,33 (ordem estável por memberId)', () => {
    const result = computeSplits(10_000, { type: 'equal', memberIds: ['c', 'a', 'b'] });
    expect(result).toEqual([
      { memberId: 'a', amountCents: 3334 },
      { memberId: 'b', amountCents: 3333 },
      { memberId: 'c', amountCents: 3333 },
    ]);
  });

  it('n=1 recebe tudo', () => {
    expect(computeSplits(999, { type: 'equal', memberIds: ['x'] })).toEqual([
      { memberId: 'x', amountCents: 999 },
    ]);
  });

  it('1 centavo entre 2: primeiro por ordem de memberId leva o centavo', () => {
    expect(computeSplits(1, { type: 'equal', memberIds: ['b', 'a'] })).toEqual([
      { memberId: 'a', amountCents: 1 },
      { memberId: 'b', amountCents: 0 },
    ]);
  });

  it('valores ímpares sempre fecham o total', () => {
    for (const total of [1, 7, 101, 33_333, 999_999]) {
      for (const n of [1, 2, 3, 4, 7]) {
        const ids = Array.from({ length: n }, (_, i) => `m${i}`);
        const result = computeSplits(total, { type: 'equal', memberIds: ids });
        expect(sum(result)).toBe(total);
        const amounts = result.map((r) => r.amountCents);
        expect(Math.max(...amounts) - Math.min(...amounts)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('rejeita membros duplicados e lista vazia', () => {
    expect(() => computeSplits(100, { type: 'equal', memberIds: [] })).toThrow();
    expect(() => computeSplits(100, { type: 'equal', memberIds: ['a', 'a'] })).toThrow();
  });
});

describe('computeSplits — percent (maiores restos)', () => {
  it('33,33% / 33,33% / 33,34% de R$ 100,00', () => {
    const result = computeSplits(10_000, {
      type: 'percent',
      parts: [
        { memberId: 'a', percentBp: 3333 },
        { memberId: 'b', percentBp: 3333 },
        { memberId: 'c', percentBp: 3334 },
      ],
    });
    expect(sum(result)).toBe(10_000);
    expect(result.find((r) => r.memberId === 'c')!.amountCents).toBe(3334);
  });

  it('restos iguais desempatam por memberId (determinismo)', () => {
    // 50%/50% de 101 -> exatos 50.5/50.5; centavo extra vai para 'a'
    const result = computeSplits(101, {
      type: 'percent',
      parts: [
        { memberId: 'b', percentBp: 5000 },
        { memberId: 'a', percentBp: 5000 },
      ],
    });
    expect(result).toEqual([
      { memberId: 'b', amountCents: 50 },
      { memberId: 'a', amountCents: 51 },
    ]);
  });

  it('rejeita soma != 100%', () => {
    expect(() =>
      computeSplits(100, {
        type: 'percent',
        parts: [
          { memberId: 'a', percentBp: 5000 },
          { memberId: 'b', percentBp: 4999 },
        ],
      }),
    ).toThrow(/100%/);
  });
});

describe('computeSplits — shares', () => {
  it('proporções 2:1 de R$ 100,00', () => {
    const result = computeSplits(10_000, {
      type: 'shares',
      parts: [
        { memberId: 'a', shares: 2 },
        { memberId: 'b', shares: 1 },
      ],
    });
    expect(result).toEqual([
      { memberId: 'a', amountCents: 6667 },
      { memberId: 'b', amountCents: 3333 },
    ]);
  });

  it('sempre fecha o total em casos degenerados', () => {
    const result = computeSplits(1, {
      type: 'shares',
      parts: [
        { memberId: 'a', shares: 3 },
        { memberId: 'b', shares: 7 },
      ],
    });
    expect(sum(result)).toBe(1);
  });

  it('rejeita todas as shares zero', () => {
    expect(() =>
      computeSplits(100, {
        type: 'shares',
        parts: [
          { memberId: 'a', shares: 0 },
          { memberId: 'b', shares: 0 },
        ],
      }),
    ).toThrow();
  });
});

describe('computeSplits — exact', () => {
  it('aceita quando a soma bate', () => {
    const result = computeSplits(500, {
      type: 'exact',
      parts: [
        { memberId: 'a', amountCents: 300 },
        { memberId: 'b', amountCents: 200 },
      ],
    });
    expect(sum(result)).toBe(500);
  });

  it('rejeita quando a soma difere do total', () => {
    expect(() =>
      computeSplits(500, {
        type: 'exact',
        parts: [
          { memberId: 'a', amountCents: 300 },
          { memberId: 'b', amountCents: 199 },
        ],
      }),
    ).toThrow(/difere do total/);
  });
});

describe('splitsMatchTotal', () => {
  it('valida integridade', () => {
    expect(splitsMatchTotal(100, [{ memberId: 'a', amountCents: 100 }])).toBe(true);
    expect(splitsMatchTotal(100, [{ memberId: 'a', amountCents: 99 }])).toBe(false);
  });
});

describe('validações gerais', () => {
  it('rejeita total não inteiro, zero ou negativo', () => {
    expect(() => computeSplits(0, { type: 'equal', memberIds: ['a'] })).toThrow();
    expect(() => computeSplits(-1, { type: 'equal', memberIds: ['a'] })).toThrow();
    expect(() => computeSplits(10.5, { type: 'equal', memberIds: ['a'] })).toThrow();
  });
});
