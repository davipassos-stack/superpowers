// MODELO: troque os dados abaixo para cada restaurante.
const SITE = {
  nome: 'Kuroumi',
  bairro: 'Botafogo',
  rua: 'Rua Voluntários da Pátria',   // só a rua, sem número
  cidade: 'Rio de Janeiro',
  whatsapp: '',                        // só dígitos, com 55 e DDD, ex.: 5521999990000
  instagram: '',                       // ex.: https://www.instagram.com/seu_perfil/
};

const $$ = s => document.querySelectorAll(s);
$$('[data-nome]').forEach(el => { el.textContent = SITE.nome; });
$$('[data-bairro]').forEach(el => { el.textContent = SITE.bairro; });
$$('[data-rua]').forEach(el => { el.textContent = SITE.rua; });
$$('[data-ano]').forEach(el => { el.textContent = new Date().getFullYear(); });
$$('[data-mapa]').forEach(a => {
  a.href = 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(`${SITE.rua}, ${SITE.bairro}, ${SITE.cidade}`);
});
const wa = texto => SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(texto)}` : '';
$$('[data-whatsapp]').forEach(a => { const u = wa(`Olá! Quero saber mais sobre o ${SITE.nome}.`); if (u) a.href = u; else a.closest('li').remove(); });
$$('[data-instagram]').forEach(a => { if (SITE.instagram) a.href = SITE.instagram; else a.closest('li').remove(); });

// reserva: confere os campos, mostra o erro embaixo de cada um e abre o WhatsApp com a mensagem pronta
const form = document.getElementById('form-reserva');
if (form) {
  const status = form.querySelector('.status');
  const campos = [...form.querySelectorAll('input, select')];
  const confere = el => {
    const ok = el.checkValidity();
    const erro = document.getElementById(el.getAttribute('aria-describedby'));
    if (ok) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
    if (erro) erro.hidden = ok;
    return ok;
  };
  campos.forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
    if (el.getAttribute('aria-invalid') === 'true') confere(el);
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ruins = campos.filter(el => !confere(el));
    if (ruins.length) {
      status.textContent = ruins.length === 1 ? '1 campo para corrigir.' : `${ruins.length} campos para corrigir.`;
      ruins[0].focus();
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    const link = wa(`Olá! Quero reservar o balcão.\nNome: ${d.nome}\nDia: ${d.dia.trim()}\nSessão: ${d.sessao}\nPessoas: ${d.pessoas}`);
    if (!link) { status.textContent = 'Configure o número do WhatsApp em site.js para receber reservas.'; return; }
    status.textContent = 'Abrindo o WhatsApp com o pedido de reserva.';
    window.open(link, '_blank', 'noopener');
  });
}
