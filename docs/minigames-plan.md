# Plano: mini-games da vila

Visão: cada detalhe do mapa vira uma porta para um mini-game de 30–90
segundos, com recorde do casal e recompensas estéticas para a vila. Hoje o
toque já gera reações (cervo foge, demônio muda de moita…) — o passo seguinte
é o toque **segurar** virar jogo.

## Princípios

- **Curto e tocável**: um dedo, partidas de menos de 2 minutos, sem tutorial.
- **Recorde do casal**: cada jogo guarda o high score dos dois (tabela única
  `gameScores`: householdId, game, memberId, score, playedAt — 1 tabela para
  todos os jogos, dentro do plano Free).
- **Recompensa na vila**: recordes destravam decorações (bandeirinha no
  moinho, gnomo no jardim, luzinha na doca…), reforçando o loop "cuidar do
  lar → vila mais bonita".
- **Tecnologia**: tudo em SVG/Canvas + rAF no próprio app (sem lib de jogo),
  cada jogo é um componente lazy (`src/games/*`), abre em tela cheia com botão
  de sair. `prefers-reduced-motion` ganha modos sem tremor/flash.

## Os jogos, personagem por personagem

| Alvo no mapa | Jogo | Como funciona |
|---|---|---|
| **Pássaros no céu** | *Acerta o pássaro* | Pássaros cruzam a tela em arcos cada vez mais rápidos; toque para acertar. 3 escapadas = fim. Combos valem x2. |
| **Pescador na doca** | *Pescaria* | A bóia afunda em tempos aleatórios: toque na hora certa para fisgar. Peixes raros (dourado, bota velha, tesouro) valem mais; linha arrebenta se puxar cedo. |
| **Cervo** | *Siga o cervo* | O cervo some entre as árvores e reaparece: memorize e toque na moita certa (tipo jogo da memória espacial), sequência cresce. |
| **Demônio** | *Esconde-esconde* | 10 moitas tremem; o demônio troca de moita a cada acerto e fica mais rápido. Achou 5 vezes = ele deixa cair uma moeda pro cofre da vila. |
| **Maromba** | *Série perfeita* | Barra de força vai e volta; toque na zona verde para completar a repetição. Zona encolhe a cada rep. 10 reps = PR do maromba. |
| **Pato do lago** | *Corrida de patos* | O pato do casal nada contra 2 patos rivais; toque em ritmo constante para remar (nem rápido demais, nem devagar). |
| **Peixinho que salta** | *Salto acrobático* | Toque e segure para carregar o salto, solte no ângulo certo para passar pelos arcos de bolhas. |
| **Esquilo** | *Chuva de nozes* | Nozes caem da copa; arraste o esquilo na base pra pegar. Pinhas dão ponto duplo, galhos tiram vida. |
| **Abelha** | *Voo do pólen* | Arraste a abelha por um traçado de flores sem encostar nos espinhos (labirinto suave, estilo one-line). |
| **Caracol** | *Grande Prêmio do caracol* | Corrida absurda de lentidão: toque alternado esquerda/direita para "acelerar" o caracol contra o caracol vizinho. |
| **Vagalumes (noite)** | *Caça-vagalume* | Vagalumes piscam e somem; toque enquanto acesos. Escuro total entre rodadas. Modo zen sem derrota. |
| **Moinho** | *Vento a favor* | Toque para dar rajadas de vento e manter as pás na velocidade-alvo enquanto nuvens atrapalham. |
| **Barquinho / doca** | *Travessia do rio* | Conduza o barquinho por entre troncos e pedras tocando em cima/embaixo (estilo flappy deitado). |
| **Baú misterioso** | *Escavação* | Grade 5×5 de areia: raspe com o dedo; pistas de "quente/frio" até achar o tesouro em N tentativas. |
| **UFO / alien** | *Invasores da vila* | O UFO tenta abduzir a vaquinha/pato: toque nos feixes de luz para desligá-los antes do rapto. |
| **Vizinhos passeando** | *Entrega de encomendas* | Ajude o casal vizinho: arraste pacotes para a casa certa antes deles chegarem na esquina. |
| **Cachorro do passeador** | *Busca o graveto* | Arremesso com gesto de arrastar; o cachorro corre; acerte a força pra ele não cair no rio. |
| **Gato / telhado** | *Equilibrista* | O gato anda no varal: incline (toques esq./dir.) para equilibrar contra o vento. |
| **Aeroporto** | *Check-in relâmpago* | Malas passam na esteira; toque só nas do casal (com as cores/avatars deles) e deixe as outras passarem. |
| **Fonte do lago** | *Moedinha da sorte* | Arremesso de moeda com física simples; acertar o centro 3x seguidas = arco-íris na vila por 1 dia. |
| **Casinha/palácio** | *Faxina relâmpago* | Sujeirinhas aparecem nas janelas; limpe com o dedo antes da barra encher (tie-in: só desbloqueia com as tarefas do dia em dia). |
| **Banco** | *Cofrinho* | Moedas caem em 3 colunas; mova o cofre para empilhar e formar combos de mesmo valor (estilo match de coluna). |
| **Mercado** | *Feira maluca* | O feirante joga frutas; segure a sacola na posição certa. Frutas podres tiram ponto (tie-in: itens da lista real viram as frutas). |

## Integração com a vida real (o charme)

- Recordes semanais aparecem no **resumo de domingo** ("Fernanda destronou
  Matheus na Pescaria 🎣").
- Jogar destrava **decoração**, nunca vantagem — o app continua sendo sobre a
  casa, o jogo é o tempero.
- Alguns jogos só abrem com o lar em dia (Faxina relâmpago exige zero
  atrasadas) — gamificação puxando o hábito, não o contrário.

## Fases sugeridas

| Fase | Entrega |
|---|---|
| G1 | Infra: tabela `gameScores`, moldura de jogo (tela cheia, pausa, recorde), 2 jogos-piloto: **Acerta o pássaro** e **Pescaria** |
| G2 | **Esconde-esconde do demônio**, **Série perfeita**, **Caça-vagalume** + recompensas estéticas |
| G3 | Mais 4 jogos por votação do casal + recordes no resumo semanal |
| G4 | Restante do catálogo, sazonal (junina: pescaria de brinde; natal: entrega de presentes) |
