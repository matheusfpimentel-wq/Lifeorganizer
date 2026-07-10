/** Labels pt-BR para os slugs de enum (ADR-008). */

export const routineCategoryLabels: Record<string, string> = {
  trabalho: 'Trabalho', estudo: 'Estudo', treino: 'Treino', casa: 'Casa',
  lazer: 'Lazer', sono: 'Sono', outro: 'Outro',
};

export const shoppingCategoryLabels: Record<string, string> = {
  hortifruti: 'Hortifruti', acougue: 'Açougue', limpeza: 'Limpeza', higiene: 'Higiene',
  mercearia: 'Mercearia', bebidas: 'Bebidas', outro: 'Outro',
};

export const expenseCategoryLabels: Record<string, string> = {
  moradia: 'Moradia', mercado: 'Mercado', contasFixas: 'Contas fixas', transporte: 'Transporte',
  lazer: 'Lazer', saude: 'Saúde', pets: 'Pets', outro: 'Outro',
};

export const taskCategoryLabels: Record<string, string> = {
  limpeza: 'Limpeza', cozinha: 'Cozinha', roupas: 'Roupas', pets: 'Pets',
  manutencao: 'Manutenção', admin: 'Administração', outro: 'Outro',
};

export const taskPriorityLabels: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta',
};

export const assignmentModeLabels: Record<string, string> = {
  fixed: 'Responsável fixo', rotation: 'Revezamento', volunteer: 'Voluntário',
};

export const splitTypeLabels: Record<string, string> = {
  equal: 'Igual', percent: 'Percentual', shares: 'Proporções', exact: 'Valores exatos',
};

export const muscleGroupLabels: Record<string, string> = {
  peito: 'Peito', costas: 'Costas', ombros: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps',
  pernas: 'Pernas', gluteos: 'Glúteos', core: 'Core', cardio: 'Cardio', outro: 'Outro',
};

export const equipmentLabels: Record<string, string> = {
  barra: 'Barra', halter: 'Halter', maquina: 'Máquina', polia: 'Polia',
  pesoCorporal: 'Peso corporal', kettlebell: 'Kettlebell', elastico: 'Elástico', outro: 'Outro',
};
