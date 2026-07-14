# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/). Datas em DD/MM/AAAA.

## [Unreleased] — Mini-games da vila (fase G1)

### Added
- **Acerta o pássaro**: toque nos pássaros do céu da vila para abrir o jogo —
  pássaros cruzam a tela cada vez mais rápido, 3 escapadas encerram, e a cada
  3 acertos seguidos o ponto vale em dobro.
- **Pescaria**: toque no pescador da doca (ou no barquinho, à noite) —
  espere a bóia afundar e puxe na hora certa; puxar cedo arrebenta a linha,
  a janela encurta a cada captura e há peixes raros (dourado, tesouro… e a
  bota velha).
- **Recordes do casal**: tabela nova `gameScores`; a tela de fim de jogo
  mostra o placar dos dois com coroa pra quem lidera, e a moldura dos jogos
  (tela cheia, vidas, placar, sair) é compartilhada para os próximos da fila.

## [Unreleased] — Personas de corpo inteiro, NFC-e por item, aeroporto e visual cartunesco

### Added
- **Nota fiscal pelo QR (NFC-e)**: em Contas, "Escanear nota fiscal (QR)"
  abre a câmera (ou aceita o link colado), a function `api` busca os itens na
  SEFAZ (rota nova `/nfce`, só portais .gov.br, autenticada) e cada item pode
  ser marcado como do Casal ou de uma pessoa — vira uma despesa única com
  divisão exata por item.
- **Aeroporto na vila**: pista, torre, biruta e aviãozinho — leva para a
  página nova **Modo Viagem** (portão de embarque com o que vem por aí e
  atalho para o Modo férias).
- `docs/minigames-plan.md`: plano completo de mini-games — um jogo por
  personagem do mapa (acerta o pássaro, pescaria, esconde-esconde do demônio,
  série perfeita do maromba, corrida de patos…), com recordes do casal e
  recompensas estéticas na vila.

### Changed
- **Moradores agora são personagens de corpo inteiro** no tema do avatar
  (mago de túnica e cajado, astronauta de traje, panda, sereia, fantasminha…)
  em vez de rosto redondo sobre um corpo genérico — no mapa e no banner de
  Tarefas.
- **Alvos de toque bem maiores** em tudo que é clicável na vila (círculos
  invisíveis de ~2,5× o personagem).
- **Quem anda/corre agora tem pernas de verdade**: pernas alternam da coxa e
  o tronco quica a cada passo (pedestres, crianças, ladrão e polícia,
  vizinhos) — acabou a flutuação.
- **Visual mais amistoso/cartunesco**: fonte arredondada Nunito no app todo,
  cards com cantos maiores e sombra macia, botões "fofos" com relevo e
  apertar físico.

## [Unreleased] — Fundo do casal, vila viva e interativa, agenda completa

### Added
- **Contas › Fundo do casal**: aba nova para registrar aportes num pote
  conjunto (tabela `fundContributions`) — total, quanto cada um já pôs,
  editar/excluir aportes.
- **Ícone por conta**: o formulário de despesa troca o seletor de categoria
  por uma fileira de ícones antes da descrição; a marcação de "conta fixa"
  ficou ao lado do valor; a lista mostra o ícone de cada despesa.
- **Agenda**: hora de fim é opcional (evento sem fim mostra só o início) e a
  visão Agenda lista todos os eventos futuros (1 ano+, não mais 45 dias).
- **Vila interativa**: tocar nos moradores gera reação — o cervo sai em
  disparada, o pato mergulha, o esquilo some árvore acima, o maromba fica
  nervoso, o pescador perde a vara; o demônio agora está quase sempre
  escondido à noite, cada visita atrás de uma moita diferente, e foge ao ser
  descoberto. Baú misterioso aparece de vez em quando na beira do rio (e
  abre!). Vizinhos passeiam de mãos dadas.
- **Vila mais viva**: cervo perambula pelo cenário; pescador fisga peixe de
  tempos em tempos e à noite pesca de barquinho; barcos cruzam o rio; lago
  cresce com o nível da vila até ganhar fonte; flores com pétalas de verdade;
  trilhas ramificadas até o lago, a doca e o rio; moinho girando de verdade
  (a pá rodava errado).
- **Moradores no mapa e no banner**: os avatares escolhidos aparecem como
  personas passeando pela vila (coração ao tocar) e na frente da casinha no
  banner de Tarefas.
- **Banners vivos**: Contas ganhou cofre, dono do banco conferindo o cofre,
  clientes na fila e um ladrão fugindo com a polícia atrás; Mercado tem
  feirante e clientes com sacolas; Agenda tem crianças correndo e velhinhos
  namorando no banco; Tarefas tem gato no telhado; Academia tem corredor.
- **6 avatares novos**: Ninja, Pirata, Fada, Vampirinho, Panda e Sereia.
- **6 cores de tema novas** (Tomate, Pitaya, Lavanda, Lima, Mel, Grafite) e o
  seletor agora mostra a cor crua, sem degradê.
- **Membros**: convites pendentes separados dos ativos, com e-mail, data do
  convite e aviso de que cancelar convite antigo não afeta quem já está no
  lar.
- `docs/travel-mode-plan.md` (plano do Modo Viagem) e
  `docs/feature-ideas.md` (recibos por QR da NFC-e, import OFX/CSV de cartão
  e backlog de funções úteis).

### Changed
- Texto explicativo da divisão proporcional recolhido atrás de um "?".
- `schema-hotfix` agora cria tabelas ausentes (continua nunca apagando nada).

### Removed
- Seção "Acertos sugeridos" de Contas (o registro de pagamento continua).

## [Unreleased] — Editar/excluir em tudo + Home em 2 colunas

### Added
- **Agenda**: tocar num evento (lista, mês ou semana) abre o formulário de
  edição; o "×" continua excluindo (ou cancelando só a ocorrência, quando
  o evento repete).
- **Contas**: tocar numa despesa em "Últimas despesas" abre a edição
  (valor, categoria, quem pagou, data, divisão, conta fixa); cada linha
  ganhou "×" para excluir com confirmação. Divisões não-iguais voltam
  pré-preenchidas como "exato" com os valores gravados.
- **Academia**: séries registradas podem ser excluídas durante o treino;
  treinos do Histórico podem ser excluídos (com as séries); planos e dias
  podem ser renomeados e excluídos (em cascata); exercícios do dia podem
  ser editados (toque carrega séries/reps/descanso) e removidos.
- **Rotina semanal**: tocar num bloco abre a edição; salvar atualiza o
  bloco existente.

### Changed
- **Home**: círculos de estatísticas removidos (o mapa já conta a
  história); os cards (Dia de compras, Atrasadas, Tarefas de hoje,
  Eventos de hoje) agora ficam em **2 colunas**.

### Removed
- Aba **Equilíbrio** das Tarefas (não era usada pelo lar).

## [Unreleased] — Tocar na tarefa abre a edição

### Added
- **Tocar em qualquer tarefa abre o formulário de edição**: nas Pendências
  (com ou sem data), nos Modelos e nas listas da tela Hoje (Atrasadas e
  Tarefas de hoje — estas navegam para Tarefas já com a edição aberta).
  A página rola para o topo, onde o formulário aparece; os botões de ação
  (Pegar, Concluir, Pular) e o deslizar para concluir seguem funcionando.

### Fixed
- Trocar de tarefa com o formulário já aberto agora recarrega os valores
  corretamente (o formulário é remontado por tarefa).

## [Unreleased] — Visual moderno (modelo Vistage) + cor de tema

### Added
- **Cor do tema configurável**: 6 paletas (Céu, Uva, Rosa, Mata, Pôr do sol,
  Oceano) em Configurações > Aparência; a paleta `brand` inteira virou
  variáveis CSS trocadas em tempo real e persistidas.
- **Layout modernizado no estilo do modelo**: brilho radial de fundo no tom
  do tema, header com avatar + nome do lar à esquerda e botão "+" redondo em
  gradiente à direita (registro rápido saiu do canto flutuante), navegação
  inferior **flutuante em cartão arredondado** com item ativo em pílula
  colorida, saudação grande com data em caixa alta e **fileira de círculos
  coloridos de estatísticas** (tarefas, mercado, saldo, eventos, treino).
- **Mapa maior e mais complexo** (viewBox 400×330): **rio na margem de baixo
  com correnteza animada**, doca de madeira com **pescador** (bóia
  balançando) e **moinho de vento com pás girando** na colina.
- **Identidade dos personagens**: todos ganharam o mesmo estilo de rosto
  (olhinhos + sorriso) — bancário, atendente, maromba, caixa e vendedora.

## [Unreleased] — A vila é o tema do app inteiro

### Added
- **Cenários ilustrados nos módulos** (`src/components/scenes.tsx` +
  `ModuleHero`): cada tela principal abre com seu canto da vila —
  **Contas**: bancário no balcão com pilhas de moedas e a fachada de colunas;
  **Mercado**: toldo listrado, caixotes de frutas e a atendente de avental;
  **Academia**: maromba levantando barra, rack de halteres e kettlebell;
  **Agenda**: coreto, bandeirinhas e balões; **Tarefas**: casinha com varal
  de roupas balançando ao vento e vassoura. Título e botão de ação sobrepostos
  com véu de legibilidade.

### Fixed
- **Animação CSS engolia o transform de posição** em grupos SVG (pato,
  filhote, esquilo, borboleta, alien, passarinho, atendente e balões
  renderizavam no canto do mapa com animações ativas): grupos animados agora
  são aninhados dentro do grupo de posição.

## [Unreleased] — Clima real, vagalumes e decoração de época

### Added
- **Mais moradores**: peixinho que salta do lago em arco a cada ~9s, esquilo
  de rabo enrolado na copa da árvore do mercado, abelhinha rondando as
  flores, caracol atravessando a vila em ~40s (a cada 2,5 min) e um
  **cachorrinho na coleira** acompanhando a pessoa que passa (rabinho
  abanando).
- **Previsão do tempo na Home** (Open-Meteo, sem chave): temperatura atual,
  mínima/máxima e probabilidade de chuva ao lado da saudação. Usa a
  localização do aparelho apenas se a permissão já foi dada; senão assume
  São Paulo.
- **A vila obedece à previsão**: chuva de verdade caindo (16 gotas em ritmos
  diferentes), céu acinzentado e nuvens carregadas em dia de chuva,
  relâmpago ocasional na tempestade, sol encoberto no nublado; pássaros se
  recolhem na chuva.
- **Vagalumes**: 6 pontinhos âmbar piscando e vagando pela grama nas noites
  sem chuva.
- **Decoração sazonal automática**: bandeirinhas juninas (junho/julho),
  estrela dourada + luzes piscantes no pinheiro e guirlanda na porta
  (dezembro), abóbora na frente da casinha (outubro).

## [Unreleased] — Vila viva de verdade

### Added
- **Moradores fixos desde o nível zero**: borboleta, patinho no lago e um
  **cervo que abaixa a cabeça para beber água** (animação de 6s); no parque
  nível 2 chega um patinho filhote.
- **Água viva**: círculos de ondulação se expandindo e sumindo no lago.
- **Gente trabalhando**: caixa atendendo no balcão entre as colunas do banco,
  atendente de avental na janela do mercado e um **maromba levantando barra**
  (sobe e desce a cada 2s) ao lado da porta da academia.
- **Vento**: árvores, pinheiros e tufos de grama balançam em ritmos
  dessincronizados; nuvens vagam pelo céu.
- **Vida passando**: passarinhos cruzam o céu de tempos em tempos (somem à
  noite).
- **Easter eggs sorteados a cada visita** (~55% de chance de alguém aparecer):
  disco voador com luzinhas piscando cruzando o céu, monstrinho roxo espiando
  atrás do pinheiro, alienzinho verde de visita e uma pessoa atravessando a
  vila a pé. Tudo respeita prefers-reduced-motion.

## [Unreleased] — Onda 3 (hábitos + inteligência leve)

### Added
- **Staples preditivos**: card "Ciclo venceu — hora de repor" no Mercado —
  aprende o intervalo REAL de recompra (mediana entre compras marcadas; núcleo
  `restock.ts` testado) e sugere quando vence; 1 toque adiciona à lista. Sem
  histórico suficiente, não chuta.
- **Âncoras de rotina**: tarefas podem ser ligadas a um hábito existente
  ("Depois do café", "Antes de dormir"...); a âncora aparece nas pendências.
  Nova coluna `tasks.anchor` (implementation intentions).
- **Progressão dupla na academia**: bateu o teto de reps na mesma carga nas 2
  últimas sessões → aviso verde sugere +2,5 kg (1 toque aplica). Núcleo
  `suggestNextLoad` testado (102 testes no total).
- **Modo férias**: em Configurações, pause as rotinas até uma data — a `tick`
  não gera ocorrências e arquiva pendências vencidas do lar pausado (nada de
  "atrasadas" acumulando); banner na home avisa o período.

## [Unreleased] — Onda 2 (justiça percebida + finanças saudáveis)

### Added
- **Carga mental visível**: seção nova no Equilíbrio conta os atos de
  PLANEJAMENTO dos últimos 30 dias por pessoa (modelos de tarefa criados,
  eventos agendados, despesas lançadas) — o trabalho invisível de organizar.
  Nova coluna `tasks.createdBy` preenchida nas criações daqui em diante.
- **Divisão proporcional**: Configurações ganhou "Divisão proporcional das
  contas" (ex.: 60/40, salva em `households.settings.splitRatio`); vira a
  opção "Proporcional (combinado do lar)" ao lançar despesa, renormalizada
  aos participantes incluídos.
- **Ritual de fechamento**: nos dias 1–5, banner "Virada de mês!" em Contas
  quando há acertos pendentes (efeito recomeço); push no dia 1º às 04h BRT
  convidando a fechar o mês anterior; card verde "Contas zeradas!" quando
  ninguém deve nada.
- **Estimativa do mercado**: itens novos herdam o último preço pago
  (índice `idx_name` em shoppingItems) e o rodapé da lista mostra
  **Estimado** (tudo com preço) ao lado de **Comprado** — orçamento mental
  antes de sair de casa. Núcleo `estimatedTotalCents` com testes (92 total).

## [Unreleased] — Vila ousada + Agenda com nomes

### Added
- **Nível máximo transformador**: a casinha vira **palácio** (torres com
  cones em gradiente, bandeiras, sacadas e porta em arco) e a pracinha vira
  **grande parque** (carrossel dourado, escorregador e roda-gigante que gira
  devagar). Rótulos mudam para "Nosso palácio" e "Grande parque".
- **Profundidade pseudo-3D**: faces laterais sombreadas e sombras de telhado
  em todas as construções; gradientes (telhado, ouro, parede) via defs SVG.

### Fixed
- **Agenda mostrava "Membro Membro"**: filtro de pessoas agora usa a fonte
  robusta (`useHouseholdPeople`) — aparecem os nomes reais e o avatar de cada
  um nos chips de filtro.

## [Unreleased] — Avatares + vila que evolui

### Added
- **Avatares embutidos** (12 desenhos SVG originais inspirados em universos de
  fantasia/jogos/corrida — sem personagens protegidos): seletor em Perfil e
  Pix, avatar no header e na lista de Membros. Novo campo `profiles.avatar`
  (slug) no schema.
- **Vila que cresce com o uso** (`useVillageProgress`): níveis 0–3 por
  construção calculados dos totais do lar — casinha (tarefas concluídas: caixa
  de correio → sótão → anexo), academia (treinos: bandeirola → anexo → segundo
  andar), banco (contas + acertos: alas laterais → moeda dourada e topiarias →
  fonte), pracinha (eventos: bandeirinhas e balanço → patinho no lago →
  escorregador) e natureza (soma: mais árvores + borboleta esvoaçante,
  passarinho no telhado, gatinho e coelhinho). Plaquinha "vila nível N".
- **Header e rodapé animados**: avatar com anel e escala no toque; item ativo
  da navegação ganha pílula colorida e ícone com "pop" (respeita
  prefers-reduced-motion).

## [Unreleased] — Onda 1 do plano de UX (fricção zero + vila viva)

### Added
- **Registro rápido universal** (`QuickAdd`): botão "+" flutuante em todas as
  telas abre folha com 4 ações — despesa (categoria sugerida pelo histórico,
  divisão igual, pagador=eu), item de mercado, tarefa (data opcional) e evento
  (1h de duração, lembrete 1h antes). Qualquer registro em ≤ 2 toques.
- **Vila viva**: o céu do mapa segue o horário real de São Paulo (amanhecer /
  dia / entardecer / noite, com sol se movendo e janelas acesas à noite); o
  jardim floresce quando as tarefas estão em dia e murcha com atrasos; a
  chaminé só solta fumaça quando alguém concluiu tarefa hoje.
- **Deslizar para concluir** (`SwipeRow`): arrastar para a direita conclui
  tarefa (pendências e sem-data) e marca item do mercado; gesto só horizontal,
  rolagem vertical intacta.
- **Resumo diário configurável**: seção em Configurações > Notificações para
  ativar/desativar e escolher o horário (BRT); o push da `tick` agora inclui
  tarefas, eventos do dia e alerta de dia de compras.
- Workflow **Deploy functions** (só as 2 functions; schema continua no
  hotfix seguro).

## [Unreleased] — UX vila

### Added
- **Home como mapa da vila** (`src/components/VillageMap.tsx`): cena SVG
  ilustrada com a casinha no centro e caminhos de pedrinhas para Banco
  (Contas), Mercado (Compras), Academia e Pracinha (Agenda). Cada construção é
  clicável (acessível por teclado) e tem plaquinha com dado ao vivo: saldo,
  itens na lista, tarefas de hoje/atrasadas e próximo evento. No modo escuro a
  vila anoitece: lua, estrelas e janelas acesas.

### Added
- **Tarefa sem data**: a data da tarefa avulsa agora é opcional. Sem data, ela
  fica no grupo "Sem data" das pendências até alguém concluir (a conclusão
  registra ocorrência e conta pontos no equilíbrio). Editar e adicionar data
  depois cria/move a ocorrência automaticamente.
- **Diagnóstico de membros** (`scripts/diagnose-members.mjs` + workflow
  somente-leitura) para inspecionar teams/memberships/profiles pelo servidor.

### Fixed
- **Membros "Membro" e despesa com id vazio**: novo hook `useHouseholdPeople`
  une memberships confirmadas + perfis legíveis do lar; nunca produz
  participante com id vazio (causa do erro Zod ao lançar despesa) e resolve o
  nome em cascata (perfil → nome do cadastro → e-mail). Aplicado em Contas,
  Tarefas e Rotina.
- Vila mais orgânica: caminhos de terra sinuosos com pedrinhas (no lugar do
  pontilhado reto), pinheirinhos e copadas variadas, cerquinha na casinha,
  laguinho, tufos de grama e mais flores.
- Ícone de lixeira substitui o emoji no excluir tarefa.
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
