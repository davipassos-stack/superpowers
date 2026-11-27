// Gesher: as ferramentas do site. Triagem de sintomas, biblioteca de exercícios, pedido de avaliação pelo WhatsApp e o
// arquivo de agenda (.ics) depois de um envio real. O envio do formulário em si é do system.js (data-endpoint).
import { REGIOES, EXERCICIOS } from './exercicios-data.js';

// O número do WhatsApp da equipe, só dígitos, com o código do país (55) e o DDD.
export const WHATSAPP = '5521966300195';

const waLink = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/* ------------------------------------------------------------------ triagem */
const ESPECIALIDADE = {
  coluna: 'Ortopedia e traumatologia',
  articulacao: 'Ortopedia e traumatologia',
  equilibrio: 'Geriatria',
  respiracao: 'Fisioterapia respiratória',
  pelve: 'Saúde da mulher',
  neuro: 'Neurologia funcional',
};
const TEXTO = {
  coluna: 'Dor na coluna ou no pescoço é tratada com terapia manual e exercícios pensados para a sua rotina.',
  colunaCronica: 'Para dor na coluna há mais de 3 meses, o tratamento junta exercícios com RPG, pilates clínico, liberação miofascial ou dry needling.',
  articulacao: 'Dores e lesões de joelho, quadril e ombro são tratadas com terapia manual e exercícios funcionais.',
  articulacaoCirurgia: 'No pós-operatório de joelho, quadril ou ombro, o protocolo segue a orientação do seu cirurgião desde a primeira sessão.',
  equilibrio: 'Quedas e fraqueza pedem treino de força e de equilíbrio, e ajustes na casa, como tapetes e apoios no banheiro.',
  respiracao: 'DPOC, asma e COVID longa são tratadas com exercícios respiratórios e treino gradual de resistência.',
  pelve: 'Incontinência, dor pélvica, gestação e pós-parto são atendidos pela fisioterapeuta pélvica da equipe, com privacidade em casa.',
  neuro: 'Depois de AVC ou com Parkinson, o treino trabalha a marcha, o equilíbrio e as tarefas do dia a dia dentro da sua casa.',
};
const NOTA_MOBILIDADE = {
  livre: '',
  apoio: 'Para quem usa bengala ou andador, a avaliação inclui a segurança da casa.',
  leito: 'Atendemos no leito e levamos o equipamento necessário.',
};
const URGENTE = {
  peito: 'Dor no peito ou falta de ar de repente pedem avaliação médica imediata.',
  avc: 'Fraqueza repentina de um lado do corpo pode ser um AVC. Cada minuto conta.',
  esfincter: 'Perda do controle da urina ou das fezes precisa de avaliação médica no mesmo dia.',
  febre: 'Febre com dor forte nas costas precisa de avaliação médica antes da fisioterapia.',
};

function triage(root) {
  const form = root.querySelector('[data-triage-form]');
  const result = root.querySelector('[data-triage-result]');
  if (!form || !result) return;
  const selects = [...form.querySelectorAll('select')];
  const errOf = el => document.getElementById((el.getAttribute('aria-describedby') || '').split(/\s+/)[0]);
  const check = el => {
    const ok = !!el.value;
    const err = errOf(el);
    el.toggleAttribute('aria-invalid', !ok);
    if (!ok) el.setAttribute('aria-invalid', 'true');
    if (err) err.hidden = ok;
    return ok;
  };
  const book = result.querySelector('[data-triage-book]');
  const empty = result.querySelector('[data-triage-empty]');
  const answer = result.querySelector('[data-triage-answer]');
  let indicada = '';
  let mostrou = false;

  const mostrar = () => {
    const v = Object.fromEntries(selects.map(el => [el.name, el.value]));
    const title = result.querySelector('[data-triage-title]');
    const text = result.querySelector('[data-triage-text]');
    const note = result.querySelector('[data-triage-note]');
    const kicker = result.querySelector('[data-triage-kicker]');
    if (v.alerta !== 'nenhum') {
      result.classList.add('is-urgent');
      kicker.textContent = 'Atenção';
      title.textContent = 'Procure atendimento de urgência agora';
      text.textContent = URGENTE[v.alerta];
      note.textContent = 'Ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo. A fisioterapia começa depois da liberação médica.';
      book.hidden = true;
      indicada = '';
    } else {
      result.classList.remove('is-urgent');
      indicada = v.regiao === 'coluna' && v.tempo === 'cronico' ? 'Medicina integrativa' : ESPECIALIDADE[v.regiao];
      kicker.textContent = 'Indicação';
      title.textContent = indicada;
      text.textContent = v.regiao === 'coluna' && v.tempo === 'cronico' ? TEXTO.colunaCronica
        : v.regiao === 'articulacao' && v.tempo === 'cirurgia' ? TEXTO.articulacaoCirurgia
        : TEXTO[v.regiao];
      note.textContent = NOTA_MOBILIDADE[v.mobilidade] || '';
      book.hidden = false;
    }
    note.hidden = !note.textContent;
    empty.hidden = true;
    answer.hidden = false;
    mostrou = true;
  };

  root.querySelector('[data-triage-go]')?.addEventListener('click', () => {
    const bad = selects.filter(el => !check(el));
    if (bad.length) { bad[0].focus(); return; }
    mostrar();
    result.focus({ preventScroll: true });
  });
  // depois da primeira indicação, trocar uma resposta atualiza a indicação na hora
  selects.forEach(el => el.addEventListener('change', () => {
    if (el.getAttribute('aria-invalid') === 'true') check(el);
    if (mostrou && selects.every(s => s.value)) mostrar();
  }));

  book?.addEventListener('click', () => {
    const esp = document.getElementById('f-esp');
    if (esp && indicada) {
      esp.value = indicada;
      esp.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

/* ------------------------------------------------------------------ exercícios */
function exlib(root) {
  const list = root.querySelector('[data-exlib-list]');
  const filters = root.querySelector('[data-exlib-filters]');
  if (!list || !filters) return;
  const limit = Number(root.dataset.limit) || Infinity;
  const only = (root.dataset.regions || '').split(',').filter(Boolean);
  const regioes = only.length ? REGIOES.filter(r => only.includes(r.id)) : REGIOES;
  const nomeDe = id => (REGIOES.find(r => r.id === id) || {}).nome || id;
  let atual = 'todas';

  const render = () => {
    const itens = EXERCICIOS.filter(x => atual === 'todas' ? (!only.length || only.includes(x.regiao)) : x.regiao === atual).slice(0, limit);
    list.replaceChildren(...itens.map(x => {
      const li = document.createElement('li');
      li.className = 'exlib__item';
      const h = document.createElement('p'); h.className = 'exlib__name'; h.textContent = x.nome;
      const meta = document.createElement('p'); meta.className = 'exlib__meta'; meta.textContent = `${nomeDe(x.regiao)} · ${x.dose}`;
      const p = document.createElement('p'); p.textContent = x.texto;
      li.append(h, meta, p);
      return li;
    }));
  };

  const botao = (id, nome) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'exlib__filter';
    b.textContent = nome;
    b.setAttribute('aria-pressed', String(id === atual));
    b.addEventListener('click', () => {
      atual = id;
      filters.querySelectorAll('.exlib__filter').forEach(el => el.setAttribute('aria-pressed', String(el === b)));
      render();
    });
    return b;
  };
  filters.replaceChildren(botao('todas', 'Todos'), ...regioes.map(r => botao(r.id, r.nome)));
  render();
}

/* ------------------------------------------------------------------ pedido de avaliação */
const HORA = { 'Manhã': 9, 'Tarde': 14, 'Noite': 18 };

function dataDoPedido(dia) {
  const m = String(dia || '').trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const hoje = new Date();
  let ano = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : hoje.getFullYear();
  const mes = Number(m[2]) - 1, d = Number(m[1]);
  if (!m[3] && new Date(ano, mes, d, 23, 59) < hoje) ano += 1;
  return { ano, mes, d };
}

// O Rio de Janeiro fica em UTC-3 o ano todo (sem horário de verão desde 2019).
function intervalo(pedido) {
  const dt = dataDoPedido(pedido.dia);
  if (!dt) return null;
  const hora = HORA[pedido.periodo] ?? 9;
  const inicio = Date.UTC(dt.ano, dt.mes, dt.d, hora + 3, 0, 0);
  return { inicio, fim: inicio + 90 * 60 * 1000 };
}
const utc = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const fold = line => {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
};

function evento(pedido) {
  const t = intervalo(pedido);
  if (!t) return null;
  const titulo = 'Avaliação de fisioterapia em casa (horário a confirmar)';
  const detalhe = `Pedido enviado à Gesher Fisio e Saúde para ${pedido.especialidade || 'avaliação'}. A equipe confirma o horário pelo WhatsApp.`;
  const local = `${pedido.bairro}, Rio de Janeiro`;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gesher Fisio e Saude//Pedido de avaliacao//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${t.inicio}-${Math.random().toString(36).slice(2, 10)}@gesherfisio`,
    `DTSTAMP:${utc(Date.now())}`, `DTSTART:${utc(t.inicio)}`, `DTEND:${utc(t.fim)}`,
    `SUMMARY:${esc(titulo)}`, `DESCRIPTION:${esc(detalhe)}`, `LOCATION:${esc(local)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${esc('Avaliação de fisioterapia em casa')}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
  const google = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE', text: titulo, dates: `${utc(t.inicio)}/${utc(t.fim)}`, details: detalhe, location: local, ctz: 'America/Sao_Paulo',
  });
  return { ics, google };
}

function mensagem(dados) {
  const linhas = ['Olá! Quero agendar uma avaliação de fisioterapia em casa.'];
  if (dados.nome) linhas.push(`Nome: ${dados.nome}`);
  if (dados.bairro) linhas.push(`Bairro: ${dados.bairro}`);
  if (dados.especialidade) linhas.push(`Especialidade: ${dados.especialidade}`);
  if (dados.dia || dados.periodo) linhas.push(`Preferência: ${[dados.dia, dados.periodo && dados.periodo.toLowerCase()].filter(Boolean).join(', ')}`);
  return linhas.join('\n');
}

function booking(form) {
  const valores = () => Object.fromEntries([...form.elements].filter(el => el.name).map(el => [el.name, el.value.trim()]));
  const wa = form.querySelector('[data-wa-booking]');
  const atualizarWa = () => { if (wa) wa.href = waLink(mensagem(valores())); };
  form.addEventListener('input', atualizarWa);
  form.addEventListener('change', atualizarWa);
  atualizarWa();

  // O system.js só chama form.reset() depois que o endereço do formulário respondeu 2xx: é aí que a agenda aparece.
  let enviado = null;
  form.addEventListener('submit', () => { enviado = valores(); });
  const depois = form.parentElement.querySelector('[data-booking-after]');
  form.addEventListener('reset', () => {
    if (!enviado || !depois) return;
    const ev = evento(enviado);
    atualizarWa();
    if (!ev) return;
    const google = depois.querySelector('[data-ics-google]');
    if (google) google.href = ev.google;
    const baixar = depois.querySelector('[data-ics-download]');
    if (baixar) baixar.onclick = () => {
      const url = URL.createObjectURL(new Blob([ev.ics], { type: 'text/calendar;charset=utf-8' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'avaliacao-gesher.ics' });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    };
    depois.hidden = false;
  });
}

/* ------------------------------------------------------------------ links do WhatsApp sem texto */
function whatsappLinks() {
  document.querySelectorAll(`a[href^="https://wa.me/${WHATSAPP}"]:not([data-wa-booking])`).forEach(a => {
    if (!a.href.includes('?text=')) a.href = waLink('Olá! Vim pelo site da Gesher e quero saber mais sobre a fisioterapia em casa.');
  });
}

const run = (name, fn) => { try { fn(); } catch (e) { console.warn(`gesher.js: ${name}`, e); } };
run('triagem', () => document.querySelectorAll('[data-triage]').forEach(triage));
run('exercicios', () => document.querySelectorAll('[data-exlib]').forEach(exlib));
run('agendamento', () => document.querySelectorAll('form[data-booking]').forEach(booking));
run('whatsapp', whatsappLinks);
