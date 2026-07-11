/**
 * Catálogo embutido de exercícios (pt-BR). Disponível na hora, sem depender de
 * seed. Exercícios personalizados do lar ficam na tabela `exercises` e são
 * mesclados a este catálogo. IDs de catálogo têm prefixo `cat:`.
 */
export interface CatalogExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
}

const raw: Omit<CatalogExercise, 'id'>[] = [
  // peito
  { name: 'Supino reto com barra', muscleGroup: 'peito', equipment: 'barra' },
  { name: 'Supino inclinado com halteres', muscleGroup: 'peito', equipment: 'halter' },
  { name: 'Supino declinado', muscleGroup: 'peito', equipment: 'barra' },
  { name: 'Crucifixo', muscleGroup: 'peito', equipment: 'halter' },
  { name: 'Crossover na polia', muscleGroup: 'peito', equipment: 'polia' },
  { name: 'Flexão de braço', muscleGroup: 'peito', equipment: 'pesoCorporal' },
  // costas
  { name: 'Barra fixa', muscleGroup: 'costas', equipment: 'pesoCorporal' },
  { name: 'Puxada frente na polia', muscleGroup: 'costas', equipment: 'polia' },
  { name: 'Remada curvada com barra', muscleGroup: 'costas', equipment: 'barra' },
  { name: 'Remada unilateral com halter', muscleGroup: 'costas', equipment: 'halter' },
  { name: 'Remada baixa na polia', muscleGroup: 'costas', equipment: 'polia' },
  { name: 'Levantamento terra', muscleGroup: 'costas', equipment: 'barra' },
  // ombros
  { name: 'Desenvolvimento militar', muscleGroup: 'ombros', equipment: 'barra' },
  { name: 'Desenvolvimento com halteres', muscleGroup: 'ombros', equipment: 'halter' },
  { name: 'Elevação lateral', muscleGroup: 'ombros', equipment: 'halter' },
  { name: 'Elevação frontal', muscleGroup: 'ombros', equipment: 'halter' },
  { name: 'Crucifixo inverso', muscleGroup: 'ombros', equipment: 'halter' },
  // bíceps
  { name: 'Rosca direta com barra', muscleGroup: 'biceps', equipment: 'barra' },
  { name: 'Rosca alternada com halteres', muscleGroup: 'biceps', equipment: 'halter' },
  { name: 'Rosca martelo', muscleGroup: 'biceps', equipment: 'halter' },
  { name: 'Rosca scott', muscleGroup: 'biceps', equipment: 'maquina' },
  // tríceps
  { name: 'Tríceps na polia', muscleGroup: 'triceps', equipment: 'polia' },
  { name: 'Tríceps testa', muscleGroup: 'triceps', equipment: 'barra' },
  { name: 'Tríceps francês', muscleGroup: 'triceps', equipment: 'halter' },
  { name: 'Mergulho entre bancos', muscleGroup: 'triceps', equipment: 'pesoCorporal' },
  // pernas
  { name: 'Agachamento livre', muscleGroup: 'pernas', equipment: 'barra' },
  { name: 'Leg press', muscleGroup: 'pernas', equipment: 'maquina' },
  { name: 'Cadeira extensora', muscleGroup: 'pernas', equipment: 'maquina' },
  { name: 'Mesa flexora', muscleGroup: 'pernas', equipment: 'maquina' },
  { name: 'Afundo com halteres', muscleGroup: 'pernas', equipment: 'halter' },
  { name: 'Panturrilha em pé', muscleGroup: 'pernas', equipment: 'maquina' },
  // glúteos
  { name: 'Elevação pélvica', muscleGroup: 'gluteos', equipment: 'barra' },
  { name: 'Cadeira abdutora', muscleGroup: 'gluteos', equipment: 'maquina' },
  { name: 'Coice na polia', muscleGroup: 'gluteos', equipment: 'polia' },
  // core
  { name: 'Prancha', muscleGroup: 'core', equipment: 'pesoCorporal' },
  { name: 'Abdominal na polia', muscleGroup: 'core', equipment: 'polia' },
  { name: 'Elevação de pernas', muscleGroup: 'core', equipment: 'pesoCorporal' },
  // cardio
  { name: 'Esteira', muscleGroup: 'cardio', equipment: 'maquina' },
  { name: 'Bicicleta ergométrica', muscleGroup: 'cardio', equipment: 'maquina' },
  { name: 'Corda naval', muscleGroup: 'cardio', equipment: 'outro' },
];

function slug(name: string): string {
  return (
    'cat:' +
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  );
}

export const CATALOG: CatalogExercise[] = raw.map((e) => ({ ...e, id: slug(e.name) }));
export const CATALOG_BY_ID = new Map(CATALOG.map((e) => [e.id, e]));
