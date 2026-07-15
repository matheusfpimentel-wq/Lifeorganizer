# Módulo Treino (evolução da Academia) — plano de fases

Decisão do usuário: **evoluir a Academia** num player guiado, reaproveitando
exercícios/sessões/séries e adicionando por cima o programa de 12 semanas.

## Arquitetura (offline-first, plano Free)

- **Definição do programa é ESTÁTICA e vive no código** (`src/features/gym/program.ts`):
  exercícios+cues, treinos, blocos, superséries, fases e rotação. Zero rede/sync
  na sessão ao vivo, disponível instantaneamente, e não gasta coleções do Free.
- **Regras de coach são núcleo puro testado** (`src/core/program.ts`): fase por
  semana, RIR-alvo com viés composto/isolador, séries por fase, expansão de
  blocos em passos (supersérie ↔ direta), dupla progressão, deload. Sem IA.
- **Dados do usuário reaproveitam o schema existente**: `workoutSessions`
  (+`templateKey`, `weekNumber`, `phaseName`, `deload`, `totalTonnageKg`) e
  `workoutSessionSets` (+`rir`, `templateExKey`). Nova tabela `bodyweightLogs`.
- **Preferências (unidade, som/vibração, incrementos, meta de proteína)** ficam
  locais (Zustand/localStorage) — sem coleção nova.
- **Sessão ao vivo grava offline** (fila local) e sincroniza com o Appwrite
  quando houver rede (last-write-wins).

## Fases

- **F1 — Fundação (feito):** programa estático + `src/core/program.ts` com
  testes (15) + extensões de schema (`workoutSessions`, `workoutSessionSets`,
  `bodyweightLogs`).
- **F2 — Player ao vivo:** home do módulo (próximo treino, fase, semana,
  "Iniciar"), navegação de blocos/passos, log de série com carga pré-preenchida
  (dupla progressão), descrição sob demanda, fila offline de gravação.
- **F3 — Cronômetro de descanso:** contagem grande, pular/±15s, som+vibração,
  Screen Wake Lock; em supersérie leva ao exercício B em vez de descansar.
- **F4 — Resumo + histórico:** resumo da sessão (séries, tonelagem, tempo, PRs),
  histórico por exercício/sessão, gráficos de carga e de peso (média móvel),
  registro de peso corporal (máx. 1×/sem), deload nas semanas 6 e 12.
- **F5 — Lembretes passivos:** proteína ~180 g/dia, cardio Zona 2 2–4×/sem.
- **F6 (feito) — Revisão semanal com LLM:** fora do treino, agrega a semana
  (`src/core/weeklyReview.ts`, testado) e pede a nota de coach via a rota
  `/coach-review` da function `api` (Anthropic), tolerante a falha.

## Configuração da revisão semanal (F6)

Para ativar a revisão por IA, configure na **function `api`** do Appwrite a
variável de ambiente **`ANTHROPIC_API_KEY`** (chave da API da Anthropic).
Opcional: `COACH_MODEL` (padrão `claude-haiku-4-5-20251001`). Sem a chave, o
card mostra um aviso e o resto do app segue normal — nada quebra.
