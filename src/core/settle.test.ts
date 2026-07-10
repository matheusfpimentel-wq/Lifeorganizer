import { describe, expect, it } from 'vitest';
import { applyTransfers, computeBalances, simplifyDebts } from './settle';

describe('computeBalances', () => {
  it('quem paga fica positivo, quem consome fica negativo, soma zero', () => {
    const balances = computeBalances([
      {
        paidBy: 'a',
        splits: [
          { memberId: 'a', amountCents: 5000 },
          { memberId: 'b', amountCents: 5000 },
        ],
      },
    ]);
    expect(balances.get('a')).toBe(5000);
    expect(balances.get('b')).toBe(-5000);
  });

  it('acertos reduzem dívidas e créditos', () => {
    const balances = computeBalances(
      [
        {
          paidBy: 'a',
          splits: [
            { memberId: 'a', amountCents: 5000 },
            { memberId: 'b', amountCents: 5000 },
          ],
        },
      ],
      [{ fromMember: 'b', toMember: 'a', amountCents: 5000 }],
    );
    expect(balances.get('a')).toBe(0);
    expect(balances.get('b')).toBe(0);
  });
});

describe('simplifyDebts', () => {
  const balancesFrom = (entries: [string, number][]) => new Map(entries);

  it('zera todos os saldos (propriedade fundamental)', () => {
    const balances = balancesFrom([
      ['a', 7000],
      ['b', -3000],
      ['c', -4000],
    ]);
    const transfers = simplifyDebts(balances);
    const after = applyTransfers(balances, transfers);
    for (const value of after.values()) expect(value).toBe(0);
  });

  it('usa no máximo n-1 transferências', () => {
    const cases: [string, number][][] = [
      [
        ['a', 100],
        ['b', -100],
      ],
      [
        ['a', 7000],
        ['b', -3000],
        ['c', -4000],
      ],
      [
        ['a', 10],
        ['b', 20],
        ['c', 30],
        ['d', -25],
        ['e', -35],
      ],
    ];
    for (const entries of cases) {
      const transfers = simplifyDebts(balancesFrom(entries));
      expect(transfers.length).toBeLessThanOrEqual(entries.length - 1);
    }
  });

  it('é determinístico (empates por memberId)', () => {
    const entries: [string, number][] = [
      ['b', 500],
      ['a', 500],
      ['d', -500],
      ['c', -500],
    ];
    const t1 = simplifyDebts(balancesFrom(entries));
    const t2 = simplifyDebts(balancesFrom([...entries].reverse()));
    expect(t1).toEqual(t2);
    // desempate: 'a' antes de 'b' entre credores, 'c' antes de 'd' entre devedores
    expect(t1[0]).toEqual({ fromMember: 'c', toMember: 'a', amountCents: 500 });
  });

  it('saldos zerados não geram transferências', () => {
    expect(simplifyDebts(balancesFrom([['a', 0], ['b', 0]]))).toEqual([]);
  });

  it('rejeita saldos que não somam zero', () => {
    expect(() => simplifyDebts(balancesFrom([['a', 1]]))).toThrow(/zero/);
  });

  it('fluxo integrado: despesas -> saldos -> simplificação', () => {
    const balances = computeBalances([
      {
        paidBy: 'ana',
        splits: [
          { memberId: 'ana', amountCents: 3334 },
          { memberId: 'bia', amountCents: 3333 },
          { memberId: 'caio', amountCents: 3333 },
        ],
      },
      {
        paidBy: 'bia',
        splits: [
          { memberId: 'ana', amountCents: 2000 },
          { memberId: 'bia', amountCents: 2000 },
        ],
      },
    ]);
    const transfers = simplifyDebts(balances);
    expect(transfers.length).toBeLessThanOrEqual(2);
    const after = applyTransfers(balances, transfers);
    for (const value of after.values()) expect(value).toBe(0);
  });
});
