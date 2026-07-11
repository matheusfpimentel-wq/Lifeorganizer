import { describe, expect, it } from 'vitest';
import { medianIntervalDays, stapleDue } from './restock';

const d = (iso: string) => new Date(iso);

describe('medianIntervalDays', () => {
  it('mediana com número ímpar de intervalos', () => {
    // gaps: 7, 7, 30 -> mediana 7 (compra atrasada não distorce)
    expect(
      medianIntervalDays([d('2026-01-01'), d('2026-01-08'), d('2026-01-15'), d('2026-02-14')]),
    ).toBe(7);
  });

  it('mediana com número par de intervalos', () => {
    // gaps: 6, 8 -> mediana 7
    expect(medianIntervalDays([d('2026-01-01'), d('2026-01-07'), d('2026-01-15')])).toBe(7);
  });

  it('ordena datas fora de ordem antes de calcular', () => {
    expect(medianIntervalDays([d('2026-01-15'), d('2026-01-01'), d('2026-01-08')])).toBe(7);
  });

  it('menos de 2 compras -> sem inferência', () => {
    expect(medianIntervalDays([d('2026-01-01')])).toBeNull();
    expect(medianIntervalDays([])).toBeNull();
  });

  it('intervalo mínimo de 1 dia', () => {
    expect(medianIntervalDays([d('2026-01-01T08:00Z'), d('2026-01-01T20:00Z')])).toBe(1);
  });
});

describe('stapleDue', () => {
  it('vence exatamente no fim do ciclo', () => {
    expect(stapleDue(d('2026-01-01'), 7, d('2026-01-08'))).toBe(true);
    expect(stapleDue(d('2026-01-01'), 7, d('2026-01-07'))).toBe(false);
  });
});
