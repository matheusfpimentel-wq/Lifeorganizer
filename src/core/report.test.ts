import { describe, expect, it } from 'vitest';
import {
  csvField,
  monthOverMonthPercent,
  summarizeMonth,
  toCsv,
  type ExpenseForReport,
} from './report';

const expense = (over: Partial<ExpenseForReport>): ExpenseForReport => ({
  amountCents: 1000,
  category: 'mercado',
  paidBy: 'a',
  date: '2026-07-15T12:00:00Z',
  splits: [
    { memberId: 'a', amountCents: 500 },
    { memberId: 'b', amountCents: 500 },
  ],
  ...over,
});

describe('summarizeMonth', () => {
  const start = '2026-07-01T00:00:00Z';
  const end = '2026-07-31T23:59:59Z';

  it('agrega total, categoria, pagador e consumidor', () => {
    const summary = summarizeMonth(
      [
        expense({ amountCents: 1000, category: 'mercado', paidBy: 'a' }),
        expense({ amountCents: 3000, category: 'moradia', paidBy: 'b', splits: [
          { memberId: 'a', amountCents: 1500 },
          { memberId: 'b', amountCents: 1500 },
        ] }),
      ],
      start,
      end,
    );
    expect(summary.totalCents).toBe(4000);
    expect(summary.count).toBe(2);
    expect(summary.byCategory).toEqual([
      { category: 'moradia', totalCents: 3000 },
      { category: 'mercado', totalCents: 1000 },
    ]);
    expect(summary.byPayer).toEqual([
      { memberId: 'b', totalCents: 3000 },
      { memberId: 'a', totalCents: 1000 },
    ]);
    expect(summary.byConsumer).toEqual([
      { memberId: 'a', totalCents: 2000 },
      { memberId: 'b', totalCents: 2000 },
    ]);
  });

  it('exclui despesas fora do intervalo', () => {
    const summary = summarizeMonth(
      [
        expense({ date: '2026-06-30T23:59:59Z' }),
        expense({ date: '2026-07-15T12:00:00Z' }),
        expense({ date: '2026-08-01T00:00:00Z' }),
      ],
      start,
      end,
    );
    expect(summary.count).toBe(1);
  });

  it('mês vazio resulta em zeros', () => {
    const summary = summarizeMonth([], start, end);
    expect(summary).toEqual({ totalCents: 0, count: 0, byCategory: [], byPayer: [], byConsumer: [] });
  });

  it('empate de valor desempata por nome (determinístico)', () => {
    const summary = summarizeMonth(
      [
        expense({ amountCents: 1000, category: 'pets', splits: [] }),
        expense({ amountCents: 1000, category: 'lazer', splits: [] }),
      ],
      start,
      end,
    );
    expect(summary.byCategory.map((c) => c.category)).toEqual(['lazer', 'pets']);
  });
});

describe('monthOverMonthPercent', () => {
  it('calcula variação percentual', () => {
    expect(monthOverMonthPercent(1500, 1000)).toBe(50);
    expect(monthOverMonthPercent(800, 1000)).toBe(-20);
  });
  it('base zero retorna null', () => {
    expect(monthOverMonthPercent(1000, 0)).toBeNull();
  });
});

describe('csvField / toCsv', () => {
  it('escapa vírgula, aspas e quebra de linha', () => {
    expect(csvField('simples')).toBe('simples');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('diz "oi"')).toBe('"diz ""oi"""');
    expect(csvField('linha1\nlinha2')).toBe('"linha1\nlinha2"');
    expect(csvField(1234)).toBe('1234');
  });

  it('monta CSV com CRLF', () => {
    const csv = toCsv(['Data', 'Descrição', 'Valor'], [
      ['15/07/2026', 'Mercado, feira', 1000],
    ]);
    expect(csv).toBe('Data,Descrição,Valor\r\n15/07/2026,"Mercado, feira",1000');
  });
});
