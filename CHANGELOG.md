# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/). Datas em DD/MM/AAAA.

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
