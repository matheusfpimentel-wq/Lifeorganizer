import { describe, expect, it } from 'vitest';
import {
  expandBlock,
  nextWorkoutKey,
  phaseForWeek,
  rirTarget,
  setsFor,
  suggestLoad,
  weekNumber,
  type Block,
  type Program,
} from './program';

const PHASES = [
  { name: 'Reacender', weekStart: 1, weekEnd: 3, rirLow: 2, rirHigh: 3, useSetsMax: false, supersetsEnabled: false, intensityTechnique: false },
  { name: 'Construir', weekStart: 4, weekEnd: 8, rirLow: 1, rirHigh: 2, useSetsMax: true, supersetsEnabled: true, intensityTechnique: false },
  { name: 'Intensificar', weekStart: 9, weekEnd: 12, rirLow: 0, rirHigh: 2, useSetsMax: true, supersetsEnabled: true, intensityTechnique: true },
];

const program: Program = {
  name: 'teste', weeks: 12, rotation: ['upper_a', 'lower_a', 'upper_b', 'lower_b'], phases: PHASES,
};

const supersetBlock: Block = {
  order: 1, type: 'superset', restSeconds: 150, note: '',
  exercises: [
    { exercise: 'supino_reto', position: 0, setsMin: 3, setsMax: 4, repMin: 5, repMax: 8 },
    { exercise: 'remada_curvada', position: 1, setsMin: 3, setsMax: 4, repMin: 6, repMax: 10 },
  ],
};

describe('weekNumber', () => {
  it('conta as semanas desde o início (1-based)', () => {
    expect(weekNumber('2026-01-01T00:00:00Z', '2026-01-01T10:00:00Z', 12)).toBe(1);
    expect(weekNumber('2026-01-01T00:00:00Z', '2026-01-08T00:00:00Z', 12)).toBe(2);
    expect(weekNumber('2026-01-01T00:00:00Z', '2026-01-29T00:00:00Z', 12)).toBe(5);
  });
  it('não estoura o total de semanas nem cai abaixo de 1', () => {
    expect(weekNumber('2026-01-01', '2027-01-01', 12)).toBe(12);
    expect(weekNumber('2026-01-01', '2025-01-01', 12)).toBe(1);
  });
});

describe('phaseForWeek', () => {
  it('mapeia a semana para a fase certa', () => {
    expect(phaseForWeek(program, 2).name).toBe('Reacender');
    expect(phaseForWeek(program, 4).name).toBe('Construir');
    expect(phaseForWeek(program, 12).name).toBe('Intensificar');
  });
});

describe('rirTarget (viés por tipo)', () => {
  it('composto mira a ponta conservadora; isolador a intensa', () => {
    const build = PHASES[1];
    expect(rirTarget(build, true).aim).toBe(2); // composto = RIR alto
    expect(rirTarget(build, false).aim).toBe(1); // isolador = RIR baixo
    expect(rirTarget(build, true).low).toBe(1);
    expect(rirTarget(build, true).high).toBe(2);
  });
  it('deload recua o alvo em 2', () => {
    expect(rirTarget(PHASES[1], false, true).aim).toBe(3);
  });
});

describe('setsFor', () => {
  const ex = { exercise: 'x', position: 0, setsMin: 3, setsMax: 4, repMin: 5, repMax: 8 };
  it('usa sets_min ou sets_max conforme a fase', () => {
    expect(setsFor(PHASES[0], ex)).toBe(3); // Reacender = min
    expect(setsFor(PHASES[1], ex)).toBe(4); // Construir = max
  });
  it('deload reduz à metade (arredonda pra cima)', () => {
    expect(setsFor(PHASES[1], ex, true)).toBe(2);
  });
});

describe('nextWorkoutKey', () => {
  it('cicla a rotação', () => {
    expect(nextWorkoutKey(program.rotation, null)).toBe('upper_a');
    expect(nextWorkoutKey(program.rotation, 'upper_a')).toBe('lower_a');
    expect(nextWorkoutKey(program.rotation, 'lower_b')).toBe('upper_a');
    expect(nextWorkoutKey(program.rotation, 'inexistente')).toBe('upper_a');
  });
});

describe('expandBlock', () => {
  it('Reacender: supersérie vira série direta com descanso de 90s', () => {
    const steps = expandBlock(PHASES[0], supersetBlock);
    // 3 séries de A + 3 de B (sets_min), todas diretas
    expect(steps).toHaveLength(6);
    expect(steps.every((s) => !s.toSupersetPartner)).toBe(true);
    expect(steps.every((s) => s.restSecondsAfter === 90)).toBe(true);
    // primeiro A todas, depois B todas
    expect(steps.slice(0, 3).every((s) => s.exerciseKey === 'supino_reto')).toBe(true);
    expect(steps.slice(3).every((s) => s.exerciseKey === 'remada_curvada')).toBe(true);
  });

  it('Construir: A→B sem descanso, descanso do bloco após B, sets_max rodadas', () => {
    const steps = expandBlock(PHASES[1], supersetBlock);
    expect(steps).toHaveLength(8); // 4 rodadas × 2
    // padrão A(rest 0, parceiro), B(rest 150)
    expect(steps[0].exerciseKey).toBe('supino_reto');
    expect(steps[0].restSecondsAfter).toBe(0);
    expect(steps[0].toSupersetPartner).toBe(true);
    expect(steps[1].exerciseKey).toBe('remada_curvada');
    expect(steps[1].restSecondsAfter).toBe(150);
    expect(steps[1].toSupersetPartner).toBe(false);
    expect(steps[0].setNumber).toBe(1);
    expect(steps[6].setNumber).toBe(4);
  });

  it('bloco direto usa o próprio descanso', () => {
    const direct: Block = {
      order: 4, type: 'direct', restSeconds: 60, note: '',
      exercises: [{ exercise: 'elevacao_lateral', position: 0, setsMin: 3, setsMax: 3, repMin: 12, repMax: 20 }],
    };
    const steps = expandBlock(PHASES[1], direct);
    expect(steps).toHaveLength(3);
    expect(steps.every((s) => s.restSecondsAfter === 60 && !s.toSupersetPartner)).toBe(true);
  });
});

describe('suggestLoad (dupla progressão)', () => {
  it('bateu o teto em todas as séries na mesma carga → sobe o incremento', () => {
    const s = suggestLoad([{ reps: 8, loadKg: 40 }, { reps: 8, loadKg: 40 }, { reps: 8, loadKg: 40 }], 8, 2.5);
    expect(s).toEqual({ loadKg: 42.5, progressed: true });
  });
  it('não bateu o teto → mantém a maior carga', () => {
    const s = suggestLoad([{ reps: 6, loadKg: 40 }, { reps: 5, loadKg: 40 }], 8, 2.5);
    expect(s).toEqual({ loadKg: 40, progressed: false });
  });
  it('cargas diferentes não progridem', () => {
    const s = suggestLoad([{ reps: 8, loadKg: 40 }, { reps: 8, loadKg: 37.5 }], 8, 2.5);
    expect(s?.progressed).toBe(false);
    expect(s?.loadKg).toBe(40);
  });
  it('sem histórico → null', () => {
    expect(suggestLoad([], 8, 2.5)).toBeNull();
  });
});
