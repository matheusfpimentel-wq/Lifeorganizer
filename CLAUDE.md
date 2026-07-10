# Morada — App de Gestão do Lar

App mobile-first (PWA) para organizar a vida compartilhada de um lar com 2+
pessoas: rotina semanal, calendário, treinos, lista de compras, divisão de
contas e tarefas domésticas — em tempo real entre os membros.

## Stack

- **Frontend:** React 18 + TypeScript + Vite (SPA), Tailwind CSS (dark mode via
  `class`), TanStack Query (server state) + Zustand (UI), react-hook-form + Zod,
  `date-fns`/`rrule`, Recharts, `vite-plugin-pwa`.
- **Backend:** Appwrite Cloud (plano **Free**): Auth, TablesDB, Realtime,
  Storage, Functions. SDKs: `appwrite` (web) no front, `node-appwrite` nas
  functions.
- **Infra as code:** `appwrite.config.json` versionado = fonte de verdade.
  Autoria em `scripts/generate-appwrite-config.mjs` (edite o gerador, rode
  `npm run aw:config`, commite ambos). **Nunca edite o JSON à mão.**
- **Deploy:** Vercel (SPA) + Appwrite Cloud.

## Restrições rígidas do plano Free (NUNCA violar)

- **Máximo de 2 functions:** `tick` (agendada, `*/5 * * * *` UTC) e `api`
  (HTTP). Proibido criar uma terceira — todo server-side novo entra numa delas.
- Realtime: assinar somente canais específicos, desconectar ao sair da tela.
- Sem transações multi-linha e sem relationships nativas (ver ADRs 002/003).

## Convenções

- UI 100% **pt-BR**; código, identificadores e commits em **inglês**
  (conventional commits, pequenos). Colunas camelCase.
- Moeda **BRL em centavos (integer)**. Datas armazenadas ISO/UTC; exibição
  DD/MM/AAAA em `America/Sao_Paulo` (UTC−3 **fixo**, sem horário de verão).
  **Cron do Appwrite roda em UTC** (04:00 BRT = `0 7 * * *`).
- Valores de enum são slugs ASCII (`contasFixas`, `acougue`); labels pt-BR em
  `src/shared/labels.ts` (ADR-008).
- Permissões de linha SEMPRE via helpers de `src/lib/permissions.ts`
  (`withHouseholdPermissions(teamId)` etc.) — nunca inline.
- Zod valida no client E re-valida nas functions (schemas em
  `src/shared/schemas`, compartilhados).
- Agregações no cliente com paginação por cursor (`src/lib/pagination.ts`).
- TDD nos núcleos puros (`src/core/*`): rateio, simplificação de dívidas,
  recorrência, revezamento, payload Pix. Sem I/O nesses módulos.
- Segredos: API key só em CLI/functions/CI. `.env` nunca commitado;
  `.env.example` sempre atualizado.

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | Vite dev server |
| `npm test` | Vitest (núcleos algorítmicos) |
| `npm run typecheck` / `lint` | tsc / eslint |
| `npm run aw:config` | regenera `appwrite.config.json` a partir do gerador |
| `npm run aw:push` | build das functions + `appwrite push` |
| `npm run aw:pull` | `appwrite pull` |
| `npm run functions:build` | bundle esbuild das functions (`dist/main.js`) |
| `npm run seed` | dados demo (1 lar, 3 membros, 6 módulos) — requer API key |
| `npm run test:isolation` | teste de isolamento de permissões (2 usuários/2 lares) |

## Estrutura

```
src/core/       núcleos puros testados (split, settle, recurrence, rotation, pix, money)
src/shared/     schemas Zod + labels pt-BR (compartilhados com as functions)
src/lib/        appwrite client, permissões, paginação, formatação
src/features/   auth, households, tasks, shopping, expenses (hooks + telas)
src/pages/      páginas das abas e do menu
functions/tick  function agendada (lembretes, resumos, materialização, contas fixas)
functions/api   function HTTP (/health, /ical/{token}, /push/test)
scripts/        gerador de config, build de functions, seeds, isolamento, ícones
docs/decisions.md  ADRs
```

## Fases

Trabalho em fases (F0–F6) com gate de revisão ao final de cada uma: plano →
implementação → testes → CHANGELOG → **parar para revisão**. Ver seção 8 do
prompt original e o CHANGELOG.md para o estado atual.
