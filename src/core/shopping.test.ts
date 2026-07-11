import { describe, expect, it } from 'vitest';
import { pricedItemCount, shoppingTotalCents } from './shopping';

describe('shoppingTotalCents', () => {
  it('soma apenas os itens marcados quando há algum marcado', () => {
    const total = shoppingTotalCents([
      { priceCents: 500, checked: true },
      { priceCents: 300, checked: true },
      { priceCents: 999, checked: false },
    ]);
    expect(total).toBe(800);
  });

  it('fallback: sem nenhum marcado, soma todos os itens com preço', () => {
    const total = shoppingTotalCents([
      { priceCents: 500, checked: false },
      { priceCents: 300, checked: false },
    ]);
    expect(total).toBe(800);
  });

  it('ignora itens sem preço', () => {
    const total = shoppingTotalCents([
      { priceCents: 500, checked: true },
      { checked: true },
      { priceCents: null, checked: true },
    ]);
    expect(total).toBe(500);
  });

  it('lista vazia ou sem preços resulta em 0', () => {
    expect(shoppingTotalCents([])).toBe(0);
    expect(shoppingTotalCents([{ checked: true }, { checked: false }])).toBe(0);
  });

  it('preço zero é válido e não quebra o fallback', () => {
    expect(shoppingTotalCents([{ priceCents: 0, checked: true }])).toBe(0);
  });
});

describe('pricedItemCount', () => {
  it('conta itens com preço >= 0', () => {
    expect(
      pricedItemCount([{ priceCents: 100 }, { priceCents: 0 }, { priceCents: null }, {}]),
    ).toBe(2);
  });
});
