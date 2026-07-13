# Plano: Modo Viagem no MinhaCasinha

Objetivo: quando o casal viaja, o app vira o "quartel-general" da viagem —
gastos em moeda estrangeira com conversão, orçamento, resumo da viagem e
checklist — sem violar o plano Free do Appwrite (2 functions, sem tabela nova
além das necessárias).

## Conceito

Uma **viagem** é um período com destino, moeda local e orçamento. Enquanto uma
viagem está ativa:

- O Modo férias é ativado automaticamente (rotinas pausadas — já existe).
- O lançamento rápido de despesas passa a aceitar **moeda local** (ex.: USD,
  EUR, ARS) e converte para BRL em centavos na hora, guardando a taxa usada.
- A Home mostra um banner da viagem com total gasto vs. orçamento.
- Ao encerrar, um **resumo da viagem** fecha a conta: total, por categoria,
  por dia, por pessoa, e o acerto final em BRL (reaproveita o rateio e a
  simplificação de dívidas existentes).

## Modelo de dados (creates-only, sem quebrar nada)

1. Tabela nova `trips`:
   - `householdId`, `name`, `destination`, `startDate`, `endDate`,
     `currency` (ISO-4217, ex. `USD`), `budgetCents` (em BRL),
     `status` (`planejando` | `ativa` | `encerrada`).
2. Colunas novas (opcionais) em `expenses`:
   - `tripId` (null = despesa normal do lar);
   - `originalAmount` (inteiro, na menor unidade da moeda local);
   - `originalCurrency` (ISO);
   - `fxRate1e6` (taxa BRL/moeda × 1.000.000, inteiro — sem float).
   - `amountCents` continua sendo o valor canônico em BRL: rateio, saldos e
     fechamento mensal não mudam NADA.

## Conversão de moedas

- Fonte keyless e gratuita (mesmo espírito do Open-Meteo): **Frankfurter**
  (`api.frankfurter.dev`, dados do BCE) ou `open.er-api.com` como fallback.
- Client-side com cache de 12 h em localStorage; a taxa efetivamente usada é
  congelada na despesa (`fxRate1e6`) — o resumo nunca "muda de valor" depois.
- Campo de taxa manual como fallback offline (viagem sem internet acontece).
- Núcleo puro testado `src/core/fx.ts`: `toBRLCents(original, rate1e6)`,
  agregações multi-moeda e arredondamento (TDD, sem I/O).

## UX

- **Contas › nova aba "Viagem"** quando existe viagem ativa (ou seção em
  Configurações para criar/encerrar).
- Formulário de despesa: quando há viagem ativa, um toggle "moeda da viagem"
  troca o campo Valor para a moeda local com o convertido em BRL ao lado.
- **Resumo da viagem**: cartão hero com bandeira/destino, gasto total vs.
  orçamento (barra), gráfico por dia (Recharts), top categorias, quem pagou
  quanto e o acerto sugerido no encerramento.
- **Checklist de mala**: reaproveita o motor da lista de compras (nova lista
  `shoppingLists` com `kind: 'mala'`) — sem tabela nova.
- **Agenda**: voos/reservas são eventos normais; o resumo diário da `tick` já
  os inclui no push.

## Fases

| Fase | Entrega |
|---|---|
| V1 | `trips` + colunas em expenses, CRUD de viagem, despesa em moeda local com conversão congelada |
| V2 | Resumo da viagem (gráficos, orçamento, acerto no encerramento) + banner na Home |
| V3 | Checklist de mala, conversor de bolso (calculadora rápida), resumo diário da viagem no push |

Custo de infra: zero (API de câmbio keyless, tudo no client; nenhuma function
nova). Risco principal: limites de linhas do plano Free — irrelevante para o
volume de um casal.
