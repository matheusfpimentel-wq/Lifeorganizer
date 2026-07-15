import { describe, expect, it } from 'vitest';
import { buildWeeklyAggregate, detectStalled, sumByMuscle } from './weeklyReview';

describe('sumByMuscle', () => {
  it('soma séries e tonelagem por músculo, desc por tonelagem', () => {
    const r = sumByMuscle([
      { muscle: 'peito', reps: 10, loadKg: 40 }, // 400
      { muscle: 'peito', reps: 8, loadKg: 40 }, // 320
      { muscle: 'costas', reps: 10, loadKg: 50 }, // 500
    ]);
    expect(r[0]).toEqual({ muscle: 'peito', sets: 2, tonnage: 720 });
    expect(r[1]).toEqual({ muscle: 'costas', sets: 1, tonnage: 500 });
  });
});

describe('detectStalled', () => {
  it('marca exercício com mesma carga e reps nas 2 últimas sessões', () => {
    const r = detectStalled({
      supino: [{ reps: 8, loadKg: 40 }, { reps: 8, loadKg: 40 }, { reps: 8, loadKg: 40 }],
      remada: [{ reps: 10, loadKg: 50 }, { reps: 9, loadKg: 50 }],
    });
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({ exercise: 'supino', reps: 8, loadKg: 40, sessions: 3 });
  });
  it('não marca com histórico de 1 sessão', () => {
    expect(detectStalled({ x: [{ reps: 8, loadKg: 40 }] })).toEqual([]);
  });
});

describe('buildWeeklyAggregate', () => {
  it('monta o resumo com aderência e variação de peso', () => {
    const agg = buildWeeklyAggregate({
      week: 5,
      phase: 'Construir',
      sets: [{ muscle: 'peito', reps: 8, loadKg: 40 }],
      sessionsDone: 3,
      planned: 4,
      bodyweightStart: 82,
      bodyweightEnd: 81.4,
      recentByExercise: {},
    });
    expect(agg.adherence).toEqual({ done: 3, planned: 4 });
    expect(agg.bodyweight.deltaKg).toBe(-0.6);
    expect(agg.byMuscle[0].muscle).toBe('peito');
  });
  it('lida com peso ausente', () => {
    const agg = buildWeeklyAggregate({
      week: 1, phase: 'Reacender', sets: [], sessionsDone: 0, planned: 4,
      bodyweightStart: null, bodyweightEnd: null, recentByExercise: {},
    });
    expect(agg.bodyweight.deltaKg).toBeNull();
  });
});
