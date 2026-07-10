# Morada 🏠

App mobile-first (PWA) para organizar a vida compartilhada do lar: rotina
semanal, calendário, treinos, lista de compras, divisão de contas e tarefas —
em tempo real entre os membros. UI em pt-BR.

**Stack:** React 18 + TypeScript + Vite + Tailwind · Appwrite Cloud (Free) ·
TanStack Query + Zustand · Vitest. Detalhes em [CLAUDE.md](CLAUDE.md) e ADRs em
[docs/decisions.md](docs/decisions.md).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha endpoint/projectId do Appwrite
npm run dev
```

Qualidade: `npm test` · `npm run typecheck` · `npm run lint`.

## Backend (Appwrite Cloud)

1. Preencha `.env` (ver `.env.example`). A API key **nunca** entra no bundle.
2. `npx appwrite login` e `npm run aw:push` — cria tabelas, índices, buckets e
   as 2 functions a partir do `appwrite.config.json`.
   - Para alterar o schema: edite `scripts/generate-appwrite-config.mjs` e rode
     `npm run aw:config`.
3. Configure nas functions as variáveis `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
   e `VAPID_SUBJECT` (Console → Functions → Settings → Variables).
4. Seeds de demonstração: `npm run seed`. Teste de isolamento de permissões:
   `npm run test:isolation`.

### Plano Free — notas

- **Exatamente 2 functions** (`tick` e `api`) — nunca criar uma terceira.
- O projeto **pausa após ~1 semana sem atividade**: para despausar, acesse o
  [Console do Appwrite](https://cloud.appwrite.io), abra o projeto e clique em
  "Unpause"/"Resume". Uso normal do app conta como atividade.
- Realtime Free: 2M mensagens/mês; o app assina apenas canais específicos e
  desconecta ao sair da tela.

## Fora do escopo v1 (futuro)

OAuth bidirecional Google Calendar · OCR de nota fiscal · open banking · sync
Todoist/Notion · apps nativos/lojas · multi-idioma · gamificação com ranking ·
Appwrite Messaging (push é via `web-push` próprio).
