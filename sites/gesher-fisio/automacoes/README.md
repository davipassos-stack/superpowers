# Automações do site da Gesher

O site é estático (HTML, CSS e JS) e funciona em qualquer hospedagem: GitHub Pages, Netlify, Vercel ou a hospedagem
atual. As ferramentas abaixo já funcionam sem servidor; o envio do pedido para a planilha precisa de um passo de 10 minutos.

## O que já funciona sem configurar nada

| Ferramenta | Onde | Como |
|---|---|---|
| Triagem de sintomas | `index.html#triagem` | Roda no navegador. Indica a especialidade e mostra sinais de alerta (manda ligar 192). Nada é enviado. |
| Enviar pelo WhatsApp | formulário em `#agendar` | Monta a mensagem com nome, bairro, especialidade e preferência e abre a conversa com a equipe. |
| Exercícios para casa | `exercicios.html` | Filtro por região do corpo e botão de imprimir. Os textos ficam em `assets/gesher/exercicios-data.js`. |

## Ligar o formulário à planilha (Google Apps Script)

1. Crie uma planilha no Google Drive (por exemplo "Pedidos do site").
2. Na planilha: **Extensões > Apps Script**. Apague o conteúdo e cole o arquivo `agendamento.gs`.
3. Confira o e-mail da equipe na linha `EMAIL_EQUIPE`.
4. **Implantar > Nova implantação > Tipo: App da Web**. Executar como: *Eu*. Quem pode acessar: *Qualquer pessoa*.
   Autorize e copie a URL que termina em `/exec`.
5. Em `index.html`, cole essa URL no atributo `data-endpoint=""` do formulário (procure por `data-booking`).
6. No editor do Apps Script, rode a função `instalarLembretes` uma vez (cria o lembrete diário das 7h).

Depois disso, cada pedido:

- entra na aba **Pedidos** da planilha, com status "Novo";
- gera um e-mail para a equipe com o botão **Responder no WhatsApp**, já com a mensagem de confirmação;
- mostra ao paciente a confirmação no site e o botão **Adicionar à agenda** (arquivo `.ics` e Google Agenda).

Para os lembretes: ao confirmar uma visita, mude o status para "Confirmado" e preencha a data e a hora. Todo dia às 7h a
equipe recebe a lista das visitas do dia seguinte, com um link de lembrete pronto por paciente.

O envio automático de mensagens pelo WhatsApp, sem clique, exige a API oficial do WhatsApp Business (paga, via um
provedor como Twilio ou Z-API). O script deixa o lembrete a um clique; dá para trocar depois sem mudar o site.

## Onde mudar cada coisa

| O quê | Arquivo |
|---|---|
| Número do WhatsApp | `assets/gesher/gesher.js` (`WHATSAPP`) e os links `wa.me` no HTML |
| Endereço do formulário | `index.html`, atributo `data-endpoint` |
| Exercícios | `assets/gesher/exercicios-data.js` |
| Regras da triagem | `assets/gesher/gesher.js`, bloco "triagem" |
| Cores, logo e tamanhos | `index.html` (bloco `:root`) e `assets/gesher/gesher.css` |
