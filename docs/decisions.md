# ADRs — MinhaCasinha

Registros curtos de decisões de arquitetura. Formato: contexto → decisão → consequências.

## ADR-001 — PWA em vez de app nativo
Distribuição sem loja, um codebase, realtime nativo via Appwrite. Limitação
aceita: push no iOS exige PWA instalada na tela de início (iOS 16.4+) e
assinaturas podem expirar — o onboarding trata a reinstalação/re-assinatura.

## ADR-002 — Sem transações multi-linha no Appwrite
Dados que precisam de atomicidade ficam **na mesma linha**: `splits` como JSON
dentro de `expenses`; `checklist` dentro de `tasks`. Nenhum fluxo pode exigir
gravar 2+ linhas atomicamente.

## ADR-003 — Sem relationships nativas do Appwrite
Referências por ID + "joins" no app. Arrays (`string[]`, `int[]`) substituem
tabelas de junção onde couber (ex.: `memberIds` em events, `rotationMemberIds`
em tasks).

## ADR-004 — Agregações no cliente/function
Não há SQL SUM. Helpers de paginação por cursor (`Query.limit(100)` +
`cursorAfter`) varrem conjuntos; na escala de um lar isso é barato.

## ADR-005 — Offline: leitura apenas (v1)
Cache Workbox + persist do TanStack Query (localStorage). Escrita exige
conexão. Sem CRDT/sync.

## ADR-006 — Timezone com offset fixo −03:00
O Brasil aboliu o horário de verão (2019); `America/Sao_Paulo` é UTC−3 fixo.
A expansão de recorrência (`src/core/recurrence.ts`) converte UTC ⇄ horário de
parede com offset constante e expande com a lib `rrule` — determinístico em
qualquer máquina, sem depender do TZ do ambiente. Exibição usa `Intl` com
`America/Sao_Paulo`.

## ADR-007 — Simplificação de dívidas gulosa
Maior devedor paga o maior credor; garante ≤ n−1 transferências e soma zero.
**Não** busca o mínimo teórico global de transferências (NP-difícil e
irrelevante nesta escala). Determinismo por desempate em memberId.

## ADR-008 — Enums como slugs ASCII
Valores de enum no banco são slugs ASCII em camelCase (`contasFixas`,
`acougue`, `pesoCorporal`); labels pt-BR com acento vivem em
`src/shared/labels.ts`. Evita risco de encoding em índices/queries e prepara
i18n futura.

## ADR-009 — appwrite.config.json gerado por script
O JSON (19 tabelas) é gerado por `scripts/generate-appwrite-config.mjs`
(`npm run aw:config`) e commitado. O gerador é a superfície de autoria; o JSON
é o que a CLI consome. Formato validado contra o schema Zod da CLI v22
(TablesDB: `tables` + `columns` + `rowSecurity` + índices com `columns`).

## ADR-010 — Functions bundladas com esbuild
As 2 functions são TypeScript em `functions/*/src/main.ts`, importam os núcleos
puros de `src/core` e são bundladas (CJS, autocontidas, `node-appwrite` e
`web-push` inclusos) para `dist/main.js` antes do push (`commands` vazio no
Appwrite — sem npm install no build remoto). Reuso real de código entre front
e server sem monorepo.

## ADR-011 — Rotas rotineiras materializadas só pela `tick`
Tarefas `routine` geram `taskOccurrences` exclusivamente na function agendada
(idempotente via índice único `taskId+dueAt`); tarefas `specific` criam a
ocorrência no client na hora. Evita corrida entre membros e mantém o
revezamento consistente (rotationIndex avança em um único lugar).

## ADR-012 — SDKs Appwrite v26 (API TablesDB, parâmetros por objeto)
`appwrite@26` (web) e `node-appwrite@26` usam a superfície atual
(`TablesDB.listRows({databaseId, tableId, ...})`). Divergência vs. o prompt
original (que citava `node-appwrite` nas versões antigas com `Databases`):
registrada conforme regra de "plataforma evolui rápido".
