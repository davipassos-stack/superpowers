/**
 * Gesher Fisio e Saúde: recebe os pedidos de avaliação do site.
 * - grava cada pedido na aba "Pedidos" da planilha
 * - manda um e-mail para a equipe com o link do WhatsApp do paciente já com a mensagem de resposta
 * - todo dia, às 7h, manda à equipe a lista das visitas confirmadas para o dia seguinte, com o lembrete pronto
 *   para enviar a cada paciente pelo WhatsApp (um clique por paciente)
 * Como instalar: automacoes/README.md
 */
const EMAIL_EQUIPE = 'contato@fisioterapiadomiciliar.com.br';
const ABA = 'Pedidos';
const COLUNAS = ['Recebido em', 'Nome', 'WhatsApp', 'Bairro', 'Especialidade', 'Dia de preferência', 'Período',
  'Status', 'Data confirmada (dd/mm/aaaa)', 'Hora confirmada (hh:mm)', 'Fisioterapeuta'];

function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(ABA) || ss.insertSheet(ABA);
  if (sh.getLastRow() === 0) { sh.appendRow(COLUNAS); sh.setFrozenRows(1); }
  return sh;
}

function whatsapp_(numero, texto) {
  let d = String(numero || '').replace(/\D/g, '');
  if (d.length <= 11) d = '55' + d;   // número brasileiro sem o código do país
  return 'https://wa.me/' + d + '?text=' + encodeURIComponent(texto);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const nome = String(p.nome || '').slice(0, 120);
  if (!nome || !p.whatsapp) return resposta_({ ok: false, erro: 'faltam dados' });
  aba_().appendRow([new Date(), nome, p.whatsapp, p.bairro, p.especialidade, p.dia, p.periodo, 'Novo', '', '', '']);
  const link = whatsapp_(p.whatsapp, 'Olá, ' + nome.split(' ')[0] + '! Aqui é da Gesher Fisio e Saúde. Recebemos o seu pedido de avaliação. '
    + 'Podemos confirmar a visita no dia ' + p.dia + ', ' + String(p.periodo || '').toLowerCase() + '?');
  MailApp.sendEmail({
    to: EMAIL_EQUIPE,
    subject: 'Novo pedido de avaliação: ' + nome + ' (' + (p.bairro || 'bairro não informado') + ')',
    htmlBody: '<p><b>' + nome + '</b> pediu uma avaliação em casa.</p>'
      + '<p>Bairro: ' + p.bairro + '<br>Especialidade: ' + p.especialidade + '<br>Preferência: ' + p.dia + ', ' + p.periodo + '</p>'
      + '<p><a href="' + link + '">Responder no WhatsApp</a></p>',
  });
  return resposta_({ ok: true });
}

function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Lembretes: roda todo dia (gatilho criado por instalarLembretes). */
function lembretes() {
  const sh = aba_();
  const linhas = sh.getDataRange().getValues().slice(1);
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
  const alvo = Utilities.formatDate(amanha, 'America/Sao_Paulo', 'dd/MM/yyyy');
  const visitas = linhas.filter(l => {
    const d = l[8] instanceof Date ? Utilities.formatDate(l[8], 'America/Sao_Paulo', 'dd/MM/yyyy') : String(l[8]).trim();
    return d === alvo && String(l[7]).toLowerCase().startsWith('confirm');
  });
  if (!visitas.length) return;
  const itens = visitas.map(l => {
    const hora = l[9] instanceof Date ? Utilities.formatDate(l[9], 'America/Sao_Paulo', 'HH:mm') : l[9];
    const link = whatsapp_(l[2], 'Olá, ' + String(l[1]).split(' ')[0] + '! Lembrete da Gesher: a sua sessão de fisioterapia é amanhã, '
      + alvo + ', às ' + hora + '. Até lá!');
    return '<li>' + hora + ' · ' + l[1] + ' (' + l[3] + ')' + (l[10] ? ' · ' + l[10] : '') + ' · <a href="' + link + '">enviar lembrete</a></li>';
  });
  MailApp.sendEmail({ to: EMAIL_EQUIPE, subject: 'Visitas de amanhã (' + alvo + '): ' + visitas.length,
    htmlBody: '<p>Visitas confirmadas para amanhã:</p><ul>' + itens.join('') + '</ul>' });
}

/** Rode uma vez, no editor, para criar o gatilho diário das 7h. */
function instalarLembretes() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'lembretes').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('lembretes').timeBased().everyDays(1).atHour(7).inTimezone('America/Sao_Paulo').create();
}
