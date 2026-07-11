import { describe, expect, it } from 'vitest';
import {
  bestSetByExercise,
  estimate1RM,
  prTimeline,
  volumeKg,
  weekKeySaoPaulo,
  weeklyVolume,
} from './workout';

describe('estimate1RM (Epley)', () => {
  it('reps=1 (Epley, arredondado a 2 casas)', () => {
    expect(estimate1RM(1, 100)).toBe(103.33);
  });
  it('mais reps => 1RM estimado maior', () => {
    expect(estimate1RM(10, 100)).toBeGreaterThan(estimate1RM(5, 100));
  });
  it('rejeita reps <= 0', () => {
    expect(() => estimate1RM(0, 100)).toThrow();
  });
});

describe('bestSetByExercise', () => {
  it('escolhe a série de maior 1RM estimado por exercício', () => {
    const best = bestSetByExercise([
      { exerciseId: 'supino', reps: 10, loadKg: 60 }, // ~80
      { exerciseId: 'supino', reps: 5, loadKg: 70 }, // ~81.7
      { exerciseId: 'agacho', reps: 5, loadKg: 100 },
    ]);
    expect(best.get('supino')!.loadKg).toBe(70);
    expect(best.get('agacho')!.reps).toBe(5);
  });
  it('ignora séries com reps 0', () => {
    const best = bestSetByExercise([{ exerciseId: 'x', reps: 0, loadKg: 50 }]);
    expect(best.has('x')).toBe(false);
  });
});

describe('volumeKg', () => {
  it('soma reps × carga', () => {
    expect(volumeKg([{ exerciseId: 'a', reps: 10, loadKg: 50 }, { exerciseId: 'a', reps: 8, loadKg: 60 }])).toBe(980);
  });
});

describe('weekKeySaoPaulo', () => {
  it('segunda-feira como início da semana (fuso SP)', () => {
    // 2026-07-11 é sábado; a segunda dessa semana é 2026-07-06
    expect(weekKeySaoPaulo('2026-07-11T15:00:00Z')).toBe('2026-07-06');
    // 2026-07-06 é segunda
    expect(weekKeySaoPaulo('2026-07-06T12:00:00Z')).toBe('2026-07-06');
  });
});

describe('weeklyVolume', () => {
  it('agrega por semana e ordena', () => {
    const result = weeklyVolume([
      { exerciseId: 'a', reps: 10, loadKg: 10, at: '2026-07-06T12:00:00Z' }, // semana 06
      { exerciseId: 'a', reps: 10, loadKg: 10, at: '2026-07-08T12:00:00Z' }, // semana 06
      { exerciseId: 'a', reps: 5, loadKg: 20, at: '2026-07-14T12:00:00Z' }, // semana 13
    ]);
    expect(result).toEqual([
      { week: '2026-07-06', volume: 200 },
      { week: '2026-07-13', volume: 100 },
    ]);
  });
});

describe('prTimeline', () => {
  it('melhor 1RM estimado por dia, ordenado', () => {
    const result = prTimeline([
      { exerciseId: 's', reps: 5, loadKg: 60, at: '2026-07-01T12:00:00Z' },
      { exerciseId: 's', reps: 5, loadKg: 65, at: '2026-07-01T12:30:00Z' },
      { exerciseId: 's', reps: 5, loadKg: 70, at: '2026-07-08T12:00:00Z' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-07-01');
    expect(result[0].est1RM).toBe(estimate1RM(5, 65));
    expect(result[1].est1RM).toBe(estimate1RM(5, 70));
  });
});
