# Plano de UI/UX e melhorias baseadas em evidência — MinhaCasinha

Objetivo do app: reduzir o atrito de coordenar um lar a dois — tarefas, contas,
compras, agenda e treinos — sem virar mais uma fonte de cobrança. Cada item
abaixo referencia o princípio científico ou de design que o motiva.

## Princípios norteadores

1. **Fricção mínima para registrar** — o valor do app depende de dados
   completos; cada toque a mais reduz adesão (lei de Hick; custo de
   oportunidade de registro). Meta: qualquer registro em ≤ 2 toques a partir
   da home.
2. **Cooperação, não competição** — pesquisa sobre gamificação em casais
   mostra que placares individuais geram ressentimento; metas COOPERATIVAS
   (o "lar" prospera junto) sustentam motivação. O Equilíbrio já é neutro;
   a vila é o veículo perfeito para meta coletiva.
3. **Percepção de justiça > igualdade exata** — na literatura sobre divisão
   de trabalho doméstico, o conflito vem menos da divisão real e mais da
   *invisibilidade* do trabalho (carga mental: planejar, lembrar, decidir).
   Tornar o invisível visível é a feature.
4. **Intenções de implementação** (Gollwitzer, 1999) — "quando X, farei Y"
   dobra a taxa de execução vs. metas vagas. Tarefas e treinos devem sempre
   ter gatilho concreto (dia/hora/âncora de rotina), e o app deve sugerir.
5. **Efeito recomeço** (fresh start effect, Milkman) — pessoas aderem mais a
   mudanças em marcos temporais (segunda-feira, dia 1º). Usar esses marcos
   para propor revisões e retomadas, nunca culpa retroativa.
6. **Notificação certa > muitas notificações** — intervenções just-in-time
   (JITAI) funcionam quando chegam no contexto de ação. Um resumo diário
   único + lembretes acionáveis pontuais; nunca spam.

---

## Onda 1 — Fricção zero e vila viva (maior impacto/esforço)

### 1.1 Registro rápido universal
- Botão "+" central flutuante na navegação: abre folha com 4 ações
  (despesa, item de compra, tarefa, evento) — formulários curtos com
  defaults inteligentes (data=hoje, pagador=eu, divisão=igual).
- Despesa em 2 toques: valor + descrição; categoria sugerida por histórico
  de descrições (sem IA, só frequência).
- *Base*: cada segundo de latência de registro aumenta abandono; recall de
  gastos degrada em horas (viés de memória).

### 1.2 Vila viva (meta cooperativa)
- O mapa da home reflete o estado real do lar:
  - Flores/jardim crescem com tarefas em dia; murcham suavemente com
    atrasos (nunca punição dramática — cf. efeito Tamagotchi bem dosado).
  - Fumaça na chaminé quando alguém concluiu algo hoje.
  - Céu segue o horário real de São Paulo (amanhecer/dia/entardecer/noite),
    não só o tema.
- *Base*: metas coletivas visíveis sustentam cooperação; feedback ambiental
  é processado sem custo cognitivo.

### 1.3 Swipe e toque direto nas listas
- Deslizar item de tarefa → concluir; item de compra → marcar; despesa →
  detalhes. Alvos de toque ≥ 44 px, ações principais na zona do polegar.
- *Base*: lei de Fitts; padrões consolidados de mobile reduzem carga de
  aprendizado.

### 1.4 Timer de descanso na academia
- Ao registrar uma série, cronômetro de descanso opcional (60/90/120/180 s)
  com aviso vibratório/notificação.
- *Base*: descanso de 1–3 min entre séries melhora ganhos de força e
  hipertrofia vs. descanso ad hoc (revisões de Schoenfeld/Grgic).

### 1.5 Resumo diário único (push)
- Uma notificação por dia (horário configurável, padrão 07h30): tarefas de
  hoje, eventos, e se é dia de compras/treino. Silêncio nos demais horários,
  exceto lembretes de evento que o usuário pediu.
- *Base*: JITAI; notificações em lote preservam atenção e reduzem opt-out.

## Onda 2 — Justiça percebida e finanças saudáveis

### 2.1 Carga mental visível
- Toda tarefa ganha, além do executor, um campo opcional "quem planejou".
  O painel Equilíbrio mostra dois anéis: execução e planejamento.
- Check-in semanal leve (domingo à noite, alinhado ao fresh start): "Como
  foi a semana no lar?" com 3 emojis-ícone e campo opcional — vira histórico
  de bem-estar do casal com o lar.
- *Base*: literatura de mental load — visibilizar planejamento reduz o
  conflito "eu faço tudo aqui".

### 2.2 Divisão proporcional opcional
- Além de igual/valor fixo/percentual, opção "proporcional à renda" com
  rendas privadas (cada um informa a sua; o app só usa a razão).
- *Base*: estudos de finanças de casal mostram maior percepção de justiça
  com contribuição proporcional quando há assimetria de renda.

### 2.3 Ritual de fechamento mensal
- No dia 1º (fresh start), push: "Fechar {mês}?" → tela única com saldo,
  botão Pix pré-preenchido, e comparativo neutro com o mês anterior
  (sem juízo de valor, só dados).
- Confete discreto ao zerar o saldo (recompensa imediata à cooperação).

### 2.4 Preços e histórico no mercado
- Item de compra guarda último preço pago; a lista mostra estimativa de
  total antes de sair de casa.
- *Base*: estimativa prévia reduz gasto por impulso (partitioning/orçamento
  mental de Thaler).

## Onda 3 — Hábitos e inteligência leve

### 3.1 Staples preditivos
- Itens recorrentes aprendem o intervalo real de recompra (mediana dos
  últimos N) e entram sozinhos na lista quando o ciclo vence, marcados
  "sugerido" (1 toque para remover).
- *Base*: automação de decisões repetitivas libera carga cognitiva; defaults
  corretos têm adesão altíssima (economia comportamental de defaults).

### 3.2 Âncoras de rotina para tarefas
- Ao criar tarefa rotineira, sugerir âncora: "depois do café", "antes de
  dormir" — texto que aparece no lembrete ("Depois do café: regar as
  plantas").
- *Base*: habit stacking/implementation intentions; hábitos ancorados em
  rotina existente consolidam mais rápido (Lally et al., 2010: mediana ~66
  dias, contexto estável é o preditor).

### 3.3 Progressão inteligente na academia
- Progressão dupla: quando o usuário atinge o teto de reps na carga atual em
  2 sessões, sugerir +2,5 kg. Mostrar volume semanal por grupo muscular vs.
  faixa de referência (10–20 séries/semana, Schoenfeld 2017) e alertar
  quedas bruscas (possível overreaching) sem prescrever.
- Lembrete de treino só nos dias do plano, com o treino do dia no corpo da
  notificação.

### 3.4 Modo pausa/férias
- Pausar rotinas do lar por período (viagem) sem acumular "atrasadas" — o
  retorno usa o efeito recomeço ("Bem-vindos de volta! Recomeçar rotina?").
- *Base*: streaks quebradas por força maior derrubam motivação (evitar o
  "efeito que se dane" — abstinence violation effect).

## Transversal — qualidade de UI

- **Acessibilidade**: contraste AA nos dois temas, `prefers-reduced-motion`
  respeitado nas animações da vila, rótulos ARIA (mapa já tem), fonte
  respeitando Dynamic Type/zoom do sistema.
- **Consistência**: escala tipográfica única, espaçamento em múltiplos de 4,
  bottom sheets para formulários (em vez de formulários inline que empurram
  a página), estados vazios com ilustração + primeira ação.
- **Percepção de velocidade**: skeletons já existem; adicionar optimistic
  updates nas mutações frequentes (concluir tarefa, marcar item) — a UI
  responde antes do servidor.
- **Confiabilidade offline**: fila de mutações offline (TanStack Query
  persister já ajuda na leitura; escrever quando voltar a conexão).

## Sequência sugerida

| Onda | Itens | Custo estimado |
|---|---|---|
| 1 | 1.1–1.5 | 2–3 sessões de trabalho |
| 2 | 2.1–2.4 | 2–3 sessões |
| 3 | 3.1–3.4 + transversais restantes | 3–4 sessões |

Critério de sucesso (medível dentro do app, sem analytics externo): % de
dias com pelo menos 1 registro; tempo entre gasto e registro; tarefas
concluídas no prazo; saldo zerado até o dia 5 de cada mês.
