/**
 * Regras de "coach" do programa guiado — núcleo puro (sem I/O, sem rede, sem
 * IA). Tudo o que a sessão ao vivo precisa para decidir fase, RIR-alvo, séries,
 * ordem dos passos (supersérie/direta) e sugestão de carga.
 *
 * O app REGISTRA e acompanha; não prescreve treino nem promete resultado.
 */

export type Muscle =
  | 'peito' | 'costas' | 'ombro' | 'biceps' | 'triceps'
  | 'quadriceps' | 'isquios' | 'gluteo' | 'panturrilha' | 'core';

export interface ProgramExercise {
  key: string;
  name: string;
  muscle: Muscle;
  isCompound: boolean;
  cue: string; // descrição/execução sob demanda
}

export interface BlockExercise {
  exercise: string; // key de ProgramExercise
  position: number; // 0 = A, 1 = B
  setsMin: number;
  setsMax: number;
  repMin: number;
  repMax: number;
}

export interface Block {
  order: number;
  type: 'superset' | 'direct';
  restSeconds: number;
  note: string;
  exercises: BlockExercise[];
}

export interface Workout {
  key: string;
  name: string;
  focus: string;
  order: number;
  blocks: Block[];
}

export interface Phase {
  name: string;
  weekStart: number;
  weekEnd: number;
  rirLow: number;
  rirHigh: number;
  useSetsMax: boolean;
  supersetsEnabled: boolean;
  intensityTechnique: boolean;
}

export interface Program {
  name: string;
  weeks: number;
  rotation: string[]; // keys de Workout, na ordem
  phases: Phase[];
}

/** Descanso entre séries quando um bloco de supersérie é "achatado" em série
 * direta (fase Reacender): ~90 s, conforme o programa. */
export const FLATTENED_REST_SECONDS = 90;

/**
 * Número da semana (1..weeks) desde o início do programa. Antes do início = 1;
 * depois do fim = weeks (fica na última semana, não estoura).
 */
export function weekNumber(startDateIso: string, nowIso: string, weeks: number): number {
  const start = new Date(startDateIso).getTime();
  const now = new Date(nowIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(now)) return 1;
  const days = Math.floor((now - start) / 86_400_000);
  const wk = Math.floor(days / 7) + 1;
  return Math.max(1, Math.min(weeks, wk));
}

/** Fase ativa para a semana dada (fallback: última fase). */
export function phaseForWeek(program: Program, week: number): Phase {
  const found = program.phases.find((p) => week >= p.weekStart && week <= p.weekEnd);
  return found ?? program.phases[program.phases.length - 1];
}

export interface RirTarget {
  low: number;
  high: number;
  /** número a mirar: compostos usam a ponta mais conservadora (RIR maior). */
  aim: number;
}

/**
 * RIR-alvo da fase, com viés por tipo: composto mira a ponta mais
 * conservadora (RIR alto), isolador mira a ponta mais intensa (RIR baixo).
 * Em deload, recua o alvo (1–2 RIR a mais) sem alterar a faixa exibida.
 */
export function rirTarget(phase: Phase, isCompound: boolean, deload = false): RirTarget {
  const low = phase.rirLow;
  const high = phase.rirHigh;
  const base = isCompound ? high : low;
  const aim = deload ? base + 2 : base;
  return { low, high, aim };
}

/** Séries por exercício conforme a fase (e metade, arredondada pra cima, em deload). */
export function setsFor(phase: Phase, ex: BlockExercise, deload = false): number {
  const base = phase.useSetsMax ? ex.setsMax : ex.setsMin;
  return deload ? Math.max(1, Math.ceil(base / 2)) : base;
}

/** Próximo treino da rotação após `lastKey` (ciclo). Sem histórico → o primeiro. */
export function nextWorkoutKey(rotation: string[], lastKey: string | null): string {
  if (rotation.length === 0) return '';
  if (!lastKey) return rotation[0];
  const idx = rotation.indexOf(lastKey);
  if (idx < 0) return rotation[0];
  return rotation[(idx + 1) % rotation.length];
}

export interface WorkoutStep {
  blockOrder: number;
  exerciseKey: string;
  position: number;
  setNumber: number; // 1-based dentro do exercício
  totalSets: number;
  repMin: number;
  repMax: number;
  /** descanso após esta série; 0 = emenda direto no parceiro da supersérie. */
  restSecondsAfter: number;
  /** true quando o próximo passo é o parceiro da supersérie (sem descanso). */
  toSupersetPartner: boolean;
}

/**
 * Expande um bloco na sequência linear de passos que o player executa,
 * resolvendo supersérie/direta conforme a fase:
 * - Supersérie LIGADA + type superset: A → B (sem descanso) → descanso do
 *   bloco → repete por rodada.
 * - Supersérie DESLIGADA (Reacender) ou type direct: séries diretas, um
 *   exercício por vez, com descanso entre séries.
 */
export function expandBlock(phase: Phase, block: Block, deload = false): WorkoutStep[] {
  const byPos = [...block.exercises].sort((a, b) => a.position - b.position);
  const steps: WorkoutStep[] = [];

  const asSuperset = phase.supersetsEnabled && block.type === 'superset' && byPos.length >= 2;

  if (!asSuperset) {
    // séries diretas: um exercício por vez
    const rest = block.type === 'direct' ? block.restSeconds : FLATTENED_REST_SECONDS;
    for (const ex of byPos) {
      const total = setsFor(phase, ex, deload);
      for (let s = 1; s <= total; s++) {
        steps.push({
          blockOrder: block.order,
          exerciseKey: ex.exercise,
          position: ex.position,
          setNumber: s,
          totalSets: total,
          repMin: ex.repMin,
          repMax: ex.repMax,
          restSecondsAfter: rest,
          toSupersetPartner: false,
        });
      }
    }
    return steps;
  }

  // supersérie: rodadas de A → B
  const rounds = Math.max(...byPos.map((ex) => setsFor(phase, ex, deload)));
  for (let r = 1; r <= rounds; r++) {
    const active = byPos.filter((ex) => r <= setsFor(phase, ex, deload));
    active.forEach((ex, i) => {
      const isLastOfRound = i === active.length - 1;
      steps.push({
        blockOrder: block.order,
        exerciseKey: ex.exercise,
        position: ex.position,
        setNumber: r,
        totalSets: setsFor(phase, ex, deload),
        repMin: ex.repMin,
        repMax: ex.repMax,
        restSecondsAfter: isLastOfRound ? block.restSeconds : 0,
        toSupersetPartner: !isLastOfRound,
      });
    });
  }
  return steps;
}

/** Todos os passos de um treino, na ordem dos blocos. */
export function expandWorkout(phase: Phase, workout: Workout, deload = false): WorkoutStep[] {
  return [...workout.blocks]
    .sort((a, b) => a.order - b.order)
    .flatMap((b) => expandBlock(phase, b, deload));
}

export interface PastSet {
  reps: number;
  loadKg: number;
}

export interface LoadSuggestion {
  loadKg: number;
  /** true quando bateu o teto de reps em todas as séries → subir carga. */
  progressed: boolean;
}

/**
 * Dupla progressão: se, na última sessão, TODAS as séries de trabalho bateram
 * `repMax` na mesma carga → sugere +incremento (e o player reinicia em repMin).
 * Caso contrário → mantém a carga (soma reps dentro da faixa). Sem histórico →
 * null (o usuário digita a primeira carga).
 */
export function suggestLoad(
  lastSessionSets: PastSet[],
  repMax: number,
  incrementKg: number,
): LoadSuggestion | null {
  const working = lastSessionSets.filter((s) => s.loadKg > 0 && s.reps > 0);
  if (working.length === 0) return null;
  const load = working[0].loadKg;
  const sameLoad = working.every((s) => s.loadKg === load);
  const allHitTop = working.every((s) => s.reps >= repMax);
  if (sameLoad && allHitTop) {
    return { loadKg: Math.round((load + incrementKg) * 100) / 100, progressed: true };
  }
  // mantém a maior carga registrada na sessão
  const topLoad = Math.max(...working.map((s) => s.loadKg));
  return { loadKg: topLoad, progressed: false };
}
