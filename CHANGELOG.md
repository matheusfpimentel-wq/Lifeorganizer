# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/). Datas em DD/MM/AAAA.

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
