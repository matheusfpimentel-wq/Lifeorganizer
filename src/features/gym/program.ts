/**
 * Definição ESTÁTICA do programa guiado de 12 semanas (offline-first: viaja no
 * bundle, disponível na hora, sem rede nem sync). Só os dados do usuário
 * (sessões, séries, peso) vão ao Appwrite. Fonte: seed do prompt do módulo.
 */
import type { Program, ProgramExercise, Workout } from '@/core/program';

export const PROGRAM: Program = {
  name: 'Retomada 12 Semanas — Hipertrofia/Recomposição',
  weeks: 12,
  rotation: ['upper_a', 'lower_a', 'upper_b', 'lower_b'],
  phases: [
    { name: 'Reacender', weekStart: 1, weekEnd: 3, rirLow: 2, rirHigh: 3, useSetsMax: false, supersetsEnabled: false, intensityTechnique: false },
    { name: 'Construir', weekStart: 4, weekEnd: 8, rirLow: 1, rirHigh: 2, useSetsMax: true, supersetsEnabled: true, intensityTechnique: false },
    { name: 'Intensificar', weekStart: 9, weekEnd: 12, rirLow: 0, rirHigh: 2, useSetsMax: true, supersetsEnabled: true, intensityTechnique: true },
  ],
};

const EXERCISE_LIST: ProgramExercise[] = [
  { key: 'supino_reto', name: 'Supino reto (barra ou halter)', muscle: 'peito', isCompound: true, cue: 'Deitado, desce a barra/halteres ao peito com cotovelos ~45°; empurra até quase estender.' },
  { key: 'remada_curvada', name: 'Remada curvada (barra) ou serrote', muscle: 'costas', isCompound: true, cue: 'Tronco inclinado, puxa o peso ao abdômen apertando as escápulas.' },
  { key: 'desenvolvimento', name: 'Desenvolvimento (halter ou máquina)', muscle: 'ombro', isCompound: true, cue: 'Sentado, empurra o peso da altura dos ombros até o alto sem travar o cotovelo.' },
  { key: 'puxada_frente', name: 'Puxada frente (pulldown) ou barra fixa', muscle: 'costas', isCompound: true, cue: 'Puxa a barra até o alto do peito (nunca atrás da nuca).' },
  { key: 'rosca_direta', name: 'Rosca direta', muscle: 'biceps', isCompound: false, cue: 'Cotovelos fixos ao lado do corpo, flexiona subindo o peso.' },
  { key: 'triceps_corda', name: 'Tríceps na corda ou pushdown', muscle: 'triceps', isCompound: false, cue: 'Cotovelos colados ao corpo, estende os antebraços empurrando para baixo.' },
  { key: 'elevacao_lateral', name: 'Elevação lateral', muscle: 'ombro', isCompound: false, cue: 'Sobe os halteres para o lado até a linha dos ombros, cotovelo levemente flexionado.' },
  { key: 'agachamento', name: 'Agachamento (livre ou Smith)', muscle: 'quadriceps', isCompound: true, cue: 'Desce dobrando quadril e joelho até coxa ~paralela, peito erguido; sobe empurrando o chão.' },
  { key: 'panturrilha_pe', name: 'Panturrilha em pé', muscle: 'panturrilha', isCompound: false, cue: 'Sobe na ponta dos pés com amplitude total, pausa em cima, desce alongando.' },
  { key: 'leg_press', name: 'Leg press 45°', muscle: 'quadriceps', isCompound: true, cue: 'Empurra a plataforma estendendo as pernas sem travar o joelho.' },
  { key: 'cadeira_flexora', name: 'Cadeira flexora', muscle: 'isquios', isCompound: false, cue: 'Flexiona o joelho contra a almofada, controlando a volta.' },
  { key: 'prancha', name: 'Prancha ou abdominal no cabo', muscle: 'core', isCompound: false, cue: 'Apoio em antebraços e pés, corpo reto e abdômen contraído, sem cair o quadril.' },
  { key: 'supino_inclinado', name: 'Supino inclinado (halter)', muscle: 'peito', isCompound: true, cue: 'Banco a ~30°; mesma mecânica do reto, foca a porção superior do peito.' },
  { key: 'barra_fixa', name: 'Barra fixa ou puxada aberta', muscle: 'costas', isCompound: true, cue: 'Puxa o corpo/a barra até o queixo passar/peito, controlando a descida.' },
  { key: 'crucifixo', name: 'Crucifixo / cross-over ou peck deck', muscle: 'peito', isCompound: false, cue: 'Braços quase retos abrindo e fechando em arco; sente o peito alongar embaixo.' },
  { key: 'remada_baixa', name: 'Remada baixa (cabo)', muscle: 'costas', isCompound: true, cue: 'Sentado, puxa o cabo ao abdômen sem jogar o tronco pra trás.' },
  { key: 'desenvolvimento_maquina', name: 'Desenvolvimento máquina', muscle: 'ombro', isCompound: true, cue: 'Empurra da altura dos ombros ao alto pela trajetória guiada da máquina.' },
  { key: 'crucifixo_inverso', name: 'Crucifixo inverso ou face pull', muscle: 'ombro', isCompound: false, cue: 'Abre os braços/puxa o cabo à altura do rosto, apertando atrás. Ombro posterior + postura.' },
  { key: 'rosca_alternada', name: 'Rosca alternada ou Scott', muscle: 'biceps', isCompound: false, cue: 'Alternada: um braço por vez; Scott: apoio no banco isola o bíceps sem roubar.' },
  { key: 'triceps_testa', name: 'Tríceps testa/francês ou pushdown', muscle: 'triceps', isCompound: false, cue: 'Flexiona só o cotovelo levando o peso à testa/atrás da cabeça e estende.' },
  { key: 'terra_romeno', name: 'Terra romeno (RDL) ou terra na trap-bar', muscle: 'isquios', isCompound: true, cue: 'Joelho quase reto, empurra o quadril pra trás descendo o peso rente às pernas até alongar o posterior.' },
  { key: 'panturrilha_sentado', name: 'Panturrilha sentado', muscle: 'panturrilha', isCompound: false, cue: 'Sentado, sobe na ponta dos pés com amplitude total e pausa em cima.' },
  { key: 'cadeira_extensora', name: 'Cadeira extensora', muscle: 'quadriceps', isCompound: false, cue: 'Sentado, estende o joelho contra a almofada. Isolador de quadríceps.' },
  { key: 'mesa_flexora', name: 'Mesa flexora ou stiff', muscle: 'isquios', isCompound: false, cue: 'Flexiona o joelho contra a resistência, ou repete o RDL com joelho reto (stiff).' },
  { key: 'afundo', name: 'Afundo/passada ou leg press unilateral', muscle: 'quadriceps', isCompound: true, cue: 'Passo à frente descendo o joelho de trás quase ao chão. Unilateral.' },
  { key: 'abdominal_cabo', name: 'Abdominal (rolinho ou cabo)', muscle: 'core', isCompound: false, cue: 'Enrola a coluna aproximando as costelas da bacia contra a carga.' },
];

export const PROGRAM_EXERCISES: Map<string, ProgramExercise> = new Map(EXERCISE_LIST.map((e) => [e.key, e]));

export const WORKOUTS: Workout[] = [
  {
    key: 'upper_a', name: 'Upper A', focus: 'Empurrar / Puxar · carga', order: 1,
    blocks: [
      { order: 1, type: 'superset', restSeconds: 150, note: 'peito ⟷ costas', exercises: [
        { exercise: 'supino_reto', position: 0, setsMin: 3, setsMax: 4, repMin: 5, repMax: 8 },
        { exercise: 'remada_curvada', position: 1, setsMin: 3, setsMax: 4, repMin: 6, repMax: 10 },
      ] },
      { order: 2, type: 'superset', restSeconds: 90, note: 'ombro ⟷ costas', exercises: [
        { exercise: 'desenvolvimento', position: 0, setsMin: 3, setsMax: 3, repMin: 8, repMax: 12 },
        { exercise: 'puxada_frente', position: 1, setsMin: 3, setsMax: 3, repMin: 8, repMax: 12 },
      ] },
      { order: 3, type: 'superset', restSeconds: 75, note: 'bíceps ⟷ tríceps', exercises: [
        { exercise: 'rosca_direta', position: 0, setsMin: 2, setsMax: 3, repMin: 8, repMax: 12 },
        { exercise: 'triceps_corda', position: 1, setsMin: 2, setsMax: 3, repMin: 10, repMax: 15 },
      ] },
      { order: 4, type: 'direct', restSeconds: 60, note: '', exercises: [
        { exercise: 'elevacao_lateral', position: 0, setsMin: 3, setsMax: 3, repMin: 12, repMax: 20 },
      ] },
    ],
  },
  {
    key: 'lower_a', name: 'Lower A', focus: 'Agachamento', order: 2,
    blocks: [
      { order: 1, type: 'superset', restSeconds: 165, note: 'panturrilha recheia o descanso do agacho', exercises: [
        { exercise: 'agachamento', position: 0, setsMin: 3, setsMax: 4, repMin: 5, repMax: 8 },
        { exercise: 'panturrilha_pe', position: 1, setsMin: 3, setsMax: 4, repMin: 8, repMax: 15 },
      ] },
      { order: 2, type: 'superset', restSeconds: 90, note: 'quadríceps ⟷ posterior', exercises: [
        { exercise: 'leg_press', position: 0, setsMin: 3, setsMax: 3, repMin: 10, repMax: 15 },
        { exercise: 'cadeira_flexora', position: 1, setsMin: 3, setsMax: 3, repMin: 10, repMax: 15 },
      ] },
      { order: 3, type: 'direct', restSeconds: 60, note: 'core', exercises: [
        { exercise: 'prancha', position: 0, setsMin: 3, setsMax: 3, repMin: 30, repMax: 60 },
      ] },
    ],
  },
  {
    key: 'upper_b', name: 'Upper B', focus: 'Empurrar / Puxar · volume', order: 3,
    blocks: [
      { order: 1, type: 'superset', restSeconds: 120, note: 'peito ⟷ costas', exercises: [
        { exercise: 'supino_inclinado', position: 0, setsMin: 3, setsMax: 4, repMin: 8, repMax: 12 },
        { exercise: 'barra_fixa', position: 1, setsMin: 3, setsMax: 4, repMin: 8, repMax: 12 },
      ] },
      { order: 2, type: 'superset', restSeconds: 90, note: 'peito ⟷ costas', exercises: [
        { exercise: 'crucifixo', position: 0, setsMin: 2, setsMax: 3, repMin: 12, repMax: 15 },
        { exercise: 'remada_baixa', position: 1, setsMin: 3, setsMax: 3, repMin: 10, repMax: 15 },
      ] },
      { order: 3, type: 'superset', restSeconds: 90, note: 'ombro à frente ⟷ ombro atrás', exercises: [
        { exercise: 'desenvolvimento_maquina', position: 0, setsMin: 3, setsMax: 3, repMin: 10, repMax: 15 },
        { exercise: 'crucifixo_inverso', position: 1, setsMin: 3, setsMax: 3, repMin: 12, repMax: 20 },
      ] },
      { order: 4, type: 'superset', restSeconds: 75, note: 'bíceps ⟷ tríceps', exercises: [
        { exercise: 'rosca_alternada', position: 0, setsMin: 2, setsMax: 3, repMin: 10, repMax: 15 },
        { exercise: 'triceps_testa', position: 1, setsMin: 2, setsMax: 3, repMin: 10, repMax: 15 },
      ] },
    ],
  },
  {
    key: 'lower_b', name: 'Lower B', focus: 'Posterior / dobradiça de quadril', order: 4,
    blocks: [
      { order: 1, type: 'superset', restSeconds: 165, note: 'panturrilha recheia o descanso do terra', exercises: [
        { exercise: 'terra_romeno', position: 0, setsMin: 3, setsMax: 4, repMin: 6, repMax: 10 },
        { exercise: 'panturrilha_sentado', position: 1, setsMin: 3, setsMax: 4, repMin: 12, repMax: 20 },
      ] },
      { order: 2, type: 'superset', restSeconds: 90, note: 'quadríceps ⟷ posterior', exercises: [
        { exercise: 'cadeira_extensora', position: 0, setsMin: 3, setsMax: 3, repMin: 12, repMax: 15 },
        { exercise: 'mesa_flexora', position: 1, setsMin: 3, setsMax: 3, repMin: 8, repMax: 12 },
      ] },
      { order: 3, type: 'superset', restSeconds: 90, note: 'perna unilateral ⟷ core', exercises: [
        { exercise: 'afundo', position: 0, setsMin: 2, setsMax: 3, repMin: 10, repMax: 12 },
        { exercise: 'abdominal_cabo', position: 1, setsMin: 3, setsMax: 3, repMin: 12, repMax: 20 },
      ] },
    ],
  },
];

export const WORKOUTS_BY_KEY: Map<string, Workout> = new Map(WORKOUTS.map((w) => [w.key, w]));

export const MUSCLE_LABELS: Record<string, string> = {
  peito: 'Peito', costas: 'Costas', ombro: 'Ombro', biceps: 'Bíceps', triceps: 'Tríceps',
  quadriceps: 'Quadríceps', isquios: 'Ísquios', gluteo: 'Glúteo', panturrilha: 'Panturrilha', core: 'Core',
};
