# Relatório: digitalização de recibos, importação de cartão e funções úteis

Pedido: avaliar (a) leitura de nota fiscal entendendo item a item, (b) import
de transações de cartão, e (c) listar funções úteis para o MinhaCasinha.
Nada aqui está implementado — é análise de viabilidade.

## a) Digitalização de recibos (nota fiscal)

Três caminhos, do mais confiável ao menos:

1. **QR code da NFC-e (recomendado no Brasil)** — todo cupom fiscal tem um QR
   que aponta para a página da SEFAZ com os itens exatos (nome, quantidade,
   preço). Ler o QR com a câmera (lib `jsQR`/BarcodeDetector, gratuito) e
   buscar a página via a function `api` (proxy server-side, pois a SEFAZ não
   tem CORS). Dá os itens **perfeitos, sem OCR**. Desafios: o layout da página
   varia por estado (SP/RS/etc. têm parsers conhecidos da comunidade) e alguns
   estados pedem captcha — cobertura parcial, mas quando funciona é exato.
2. **Foto + IA multimodal** — enviar a foto do cupom para um modelo de visão
   (ex.: API do Claude) que devolve JSON com os itens. Qualidade alta,
   funciona com qualquer cupom, mas tem custo por nota e exige guardar uma API
   key na function `api` (nunca no app).
3. **OCR clássico (Tesseract.js)** — gratuito e offline, mas cupom térmico
   amassado dá texto ruim; o parsing de itens vira heurística frágil. Só como
   fallback.

O app já tem metade do caminho: bucket `receipts`, coluna
`expenses.receiptFileId` (anexo de comprovante) e itens de mercado com preço.
Com os itens da nota importados dá para: preencher a despesa automaticamente,
alimentar o histórico de preços por item e casar com a lista de compras.

## b) Importar transações de cartão

- **Open Finance Brasil (oficial)**: pessoa física não pluga direto; precisa
  de um agregador autorizado (Pluggy, Belvo, Klavi) — todos pagos em produção.
  Inviável para o custo do projeto hoje.
- **Import manual de OFX/CSV (recomendado)**: Nubank, Itaú, Inter etc.
  exportam extrato OFX/CSV. Parser no cliente (OFX é XML simples), tela de
  revisão que sugere categoria por regras + histórico de descrições, e cada
  linha vira despesa com um toque. Gratuito, sem credenciais de banco no app,
  privacidade total.
- **Parsing de e-mail de fatura**: frágil e invasivo — não recomendo.

## c) Funções úteis para o MinhaCasinha (backlog sugerido)

Aproveitando dados que o app já coleta (custo baixo, ganho alto primeiro):

1. **Orçamento mensal por categoria** com barra de progresso e push ao passar
   de 80% — as despesas por categoria já existem.
2. **Metas do fundo do casal** — objetivo (ex.: "Viagem Chile — R$ 6.000")
   com barra de progresso sobre os aportes (tabela nova `fundContributions`
   já criada).
3. **Histórico de preços por item** — o mercado já grava `priceCents`;
   mostrar "menor preço já pago" e gráfico simples ao tocar num item.
4. **Modelos de lista** — "Churrasco", "Feira da semana", "Faxina" com um
   toque para popular a lista.
5. **Anexo de comprovante na despesa** — o bucket e a coluna já existem; falta
   só a UI de foto.
6. **Retrospectiva semanal do casal** — push de domingo à noite (via `tick`):
   tarefas feitas por cada um, gasto da semana, treinos, e o "destaque da
   semana". Reforço positivo barato.
7. **Conquistas da vila** — badges por streaks (7 dias de tarefas em dia, 4
   semanas de treino…) destravando decorações no mapa. A vila já evolui.
8. **Relatório de carga mental** — quem planeja vs. quem executa (o
   `createdBy` das tarefas já registra isso); gráfico mensal na aba de
   equilíbrio… que foi removida — entraria em Configurações ou no fechamento.
9. **Despensa com validade** — estoque simples com data de vencimento e
   aviso "vence em 3 dias" no resumo diário.
10. **Atalhos do PWA** (manifest shortcuts): pressionar o ícone → "+ Despesa",
    "+ Item", "+ Tarefa" direto.
11. **Exportar fechamento mensal em CSV/PDF** — os dados do fechamento já são
    agregados no cliente.
12. **Modo Viagem** — plano detalhado em `docs/travel-mode-plan.md`.
