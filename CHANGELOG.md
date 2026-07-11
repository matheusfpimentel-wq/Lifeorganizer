# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/). Datas em DD/MM/AAAA.

## [Unreleased] — UX vila

### Added
- **Home como mapa da vila** (`src/components/VillageMap.tsx`): cena SVG
  ilustrada com a casinha no centro e caminhos de pedrinhas para Banco
  (Contas), Mercado (Compras), Academia e Pracinha (Agenda). Cada construção é
  clicável (acessível por teclado) e tem plaquinha com dado ao vivo: saldo,
  itens na lista, tarefas de hoje/atrasadas e próximo evento. No modo escuro a
  vila anoitece: lua, estrelas e janelas acesas.

### Fixed
- **Auto-recuperação após deploy**: se o app estava aberto durante uma
  publicação e tenta carregar um chunk antigo ("Importing a module script
  failed"), o ErrorBoundary agora recarrega a página sozinho (uma vez, com
  trava anti-loop) em vez de mostrar o erro técnico.

### Changed
- Navegação inferior volta a chamar o módulo financeiro de **"Contas"** (o
  nome "Banco" fica só na metáfora do mapa).
- Home: cartões de gradiente e atalho da academia substituídos pelo mapa
  (dia de compras, atrasadas, tarefas e eventos de hoje continuam abaixo).

## [Unreleased] — F6 PWA / Polish

### Added
- **Web Push completo:** service worker com handlers `push`/`notificationclick`
  (`public/push-sw.js` via Workbox `importScripts`); hook `features/push` para
  pedir permissão (após gesto), assinar e persistir em `pushSubscriptions`;
  seção em Configurações com **onboarding iOS** ("Adicionar à Tela de Início"
  quando fora do modo standalone) e **"Testar notificação"** (chama `api`
  `/push/test` via `functions.createExecution`, autenticado pela sessão).
- **Code-splitting por rota** (`React.lazy` + `Suspense` no Layout): bundle
  inicial caiu ~936→424 kB; Academia/Recharts vira chunk sob demanda.
- **Exportar dados** do lar (JSON) e **apagar dados pessoais** (perfil, push,
  tokens iCal) com logout, em Configurações.

### Notes
- Push no iPhone exige PWA instalada (iOS 16.4+) e as chaves VAPID configuradas
  nas variáveis das functions. Lighthouse/ícones finais dependem do deploy.
  Total: 90 testes.

## [Unreleased] — F5 Academia

### Added
- **Métricas de treino** (`src/core/workout.ts`, núcleo puro, 9 testes): 1RM
  estimado (Epley), recordes por exercício, volume total e semanal (semana em
  SP), evolução do 1RM. O app registra e acompanha — não prescreve.
- **Biblioteca de exercícios**: catálogo embutido pt-BR (~40, `catalog.ts`) +
  exercícios personalizados do lar, mesclados.
- **Planos** (`GymPage`): criar plano, dias (A/B/C…) e exercícios do dia
  (séries, faixa de reps, descanso).
- **Logger** com **timer de descanso** (`RestTimer`): iniciar do dia do plano
  (ou treino livre), séries pré-preenchidas pelo último treino, registrar
  reps/carga, cronômetro de descanso, finalizar.
- **Histórico** de sessões (duração, séries, volume) e **Progresso**: tabela de
  recordes + gráficos Recharts (volume semanal, evolução do 1RM por exercício).

### Notes
- Bundle cresceu com Recharts (~262 kB gzip); code-splitting por rota fica para
  a F6. Total: 90 testes.

## [Unreleased] — F4 Agenda + Rotina

### Added
- **Expansão de eventos** (`src/core/calendar.ts`, núcleo puro, 6 testes):
  `expandEventOccurrences` expande recorrentes + avulsos numa janela (reusa
  `expandRecurrence`, herda duração, respeita exdates, ordena).
- **Agenda** (`AgendaPage`): views **Agenda / Semana / Mês**, filtro por membro
  persistente, criar evento (`EventForm`: data/hora, dia inteiro, participantes,
  recorrência, lembretes). Semana com **camada de rotina** (toggle). Cancelar
  ocorrência de recorrente via exdate; excluir avulso.
- **Rotina semanal** (`RoutinePage`): blocos por dia da semana, coloridos por
  membro, criar/excluir, filtro "só os meus (e do lar)".
- **Feed iCal** (`features/ical`): gerar/revogar link privado por token para
  assinar no Google Agenda (consome a rota `/ical/{token}` da function `api`;
  URL da function via `VITE_API_FUNCTION_URL`).
- Helpers de calendário em fuso SP (`src/lib/dates.ts`): matriz do mês, dias da
  semana, chaves de dia local.

### Notes
- Assinar o feed no Google Agenda requer configurar `VITE_API_FUNCTION_URL`
  (domínio público da function `api`). Total: 81 testes.

## [Unreleased] — F3 Contas

### Added
- **Fechamento mensal + CSV** (`src/core/report.ts`, núcleo puro, 8 testes):
  `summarizeMonth` (total, por categoria, por pagador, por consumidor),
  `monthOverMonthPercent` e `toCsv`/`csvField` (RFC 4180). Componente
  `MonthlyClosing` com navegação por mês, comparativo vs. anterior e export CSV
  (com BOM para Excel pt-BR).
- **Todos os tipos de rateio na UI** (`ExpenseForm`): equal/percent/shares/exact
  com seleção de participantes, inputs por membro e **prévia do rateio** validada
  em tempo real (reusa `computeSplits`).
- **Contas fixas:** despesa marcável como "repete todo mês" (rrule mensal). A
  função `tick` gera lançamentos `pending`; nova seção "Contas fixas a confirmar"
  com confirmar/descartar (`useConfirmExpense`/`useDeleteExpense`).
- **Ponte lista arquivada → despesa:** ao arquivar lista de compras com total,
  oferece criar despesa (mercado) dividida igualmente.
- `ExpensesPage` reorganizada em abas **Resumo** (pendentes, saldos, acertos +
  Pix, últimas) e **Fechamento**.

### Notes
- Testes 7.1 (rateio) e 7.5 (Pix) seguem verdes. "Pix lido por app bancário
  real" depende de validação manual sua. Total: 75 testes.

## [Unreleased] — F2 Compras

### Added
- **Preços por item + total ao arquivar** (`src/core/shopping.ts`, núcleo puro,
  6 testes): `shoppingTotalCents` soma os itens comprados (marcados; fallback
  para todos com preço). `ShoppingPage` ganhou input de preço por item, stepper
  de quantidade e remover item.
- **Arquivar lista** (`useArchiveList`): grava `totalCents`, marca `archived` e
  cria uma nova lista ativa. Retorna `{ archivedListId, totalCents }` — ponte
  "lista arquivada → despesa" pronta para ativar na F3. `useArchivedLists` para
  histórico.
- **CRUD de itens recorrentes** (`staples.ts` + `StaplesPage` real, substituindo
  o placeholder): adicionar/remover staples por categoria, alimentando o botão
  "Repor recorrentes".

### Notes
- Realtime dos itens (assinatura só do canal de `shoppingItems`, desconexão ao
  sair, UI otimista com rollback) já vinha da F0 — DoD "realtime com 2 sessões"
  depende do backend no ar. Total: 67 testes.

## [Unreleased] — F1 Tarefas

### Added
- **Painel de equilíbrio** (`src/core/balance.ts`, núcleo puro, 8 testes):
  conclusões dos últimos 30 dias ponderadas por `points`, apresentação neutra
  (barras factuais por membro, sem ranking). Hook `useBalancePanel` + componente
  `BalancePanel`.
- **CRUD completo de tarefas:** editar (`useUpdateTask`), excluir com deleção em
  cascata das ocorrências (`useDeleteTask`), pausar/ativar modelo.
- Formulário unificado (`TaskForm`) para criar e editar, com **checklist**,
  descrição, prioridade, pontos, e seletor de **dias da semana** para recorrência
  semanal (`weekdays.ts`: `buildRrule`/`describeRrule`).
- `TasksPage` reorganizada em 3 abas: **Pendências** (ocorrências acionáveis),
  **Modelos** (gerenciar/editar/pausar/excluir) e **Equilíbrio**.

### Notes
- Materialização de ocorrências (14 dias, idempotente) e push "tarefas de hoje"
  já vieram na função `tick` da F0; testes 7.2–7.4 (settle/recurrence/rotation)
  seguem verdes. Total: 61 testes.

## [Unreleased] — F0 Fundação (aguardando credenciais para o gate)

### Added
- Scaffold completo: Vite + React 18 + TS + Tailwind + PWA (`vite-plugin-pwa`,
  manifest pt-BR, ícones placeholder), ESLint 9, Vitest, CI (GitHub Actions:
  typecheck + lint + testes + builds).
- **Núcleos algorítmicos com TDD (53 testes verdes):**
  - `src/core/split.ts` — rateio equal/percent/shares/exact (maiores restos,
    centavos, caso canônico R$ 100 ÷ 3 = 33,34+33,33+33,33);
  - `src/core/settle.ts` — saldos + simplificação gulosa (≤ n−1, soma zero,
    determinismo);
  - `src/core/recurrence.ts` — expansão RRULE em America/Sao_Paulo (UTC−3 fixo);
  - `src/core/rotation.ts` — revezamento + materialização idempotente;
  - `src/core/pix.ts` — BR Code Pix estático (EMV-MPM + CRC16-CCITT, reproduz
    byte a byte o exemplo do manual do BCB).
- `appwrite.config.json` (gerado por `scripts/generate-appwrite-config.mjs`):
  19 tabelas com colunas/índices, 2 buckets (avatars, receipts), 2 functions.
- Functions (bundle esbuild): `tick` (lembretes de eventos, resumos diários,
  materialização de ocorrências 14 dias, despesas fixas via rrule, limpeza de
  push subscriptions mortas) e `api` (/health, /ical/{token}, /push/test).
- Schemas Zod compartilhados (`src/shared/schemas`) + labels pt-BR.
- Auth (email/senha + Magic URL prontos), lar = Team (criar/convidar/aceitar),
  seletor de lar, perfis com cor e chave Pix.
- Layout base: header + bottom nav (Hoje/Agenda/Tarefas/Compras/Contas), dark
  mode, mobile-first.
- Páginas funcionais: Hoje, Tarefas (CRUD básico + concluir/pegar/pular),
  Compras (realtime + otimista + repor recorrentes + share), Contas (despesa
  igual, saldos, acertos sugeridos, Pix copia e cola). Placeholders: Agenda,
  Academia, Rotina, Staples (fases 2–5).
- Scripts: seeds de demo (1 lar, 3 membros, 6 módulos), teste de isolamento de
  permissões (2 usuários × 2 lares × 3 tabelas), gerador de ícones.
- Docs: CLAUDE.md, docs/decisions.md (ADR-001…012), .env.example.

### Pendente para fechar o gate F0 (dependem de credenciais — seção 9)
- `appwrite push` real (endpoint/projectId/API key), definição do método de
  login, chaves VAPID, execução do teste de isolamento contra o projeto real,
  convite real dos membros.
