document.querySelectorAll('[data-help]').forEach(
  (b) =>
    (b.onclick = () => {
      document
        .querySelectorAll('[data-help]')
        .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      document
        .querySelectorAll('[data-category]')
        .forEach(
          (c) =>
            (c.hidden =
              b.dataset.help !== 'todos' && b.dataset.help !== c.dataset.category),
        );
    }),
);
document.querySelector('#adoption').onsubmit = (e) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget),
    s = document.querySelector('#adoption-status');
  s.textContent = `${data.get('name')}, você explorou o interesse em: ${data.get('animal')}. Em um atendimento real, o próximo passo seria conversar com a equipe do abrigo. Simulação concluída; nenhum pedido foi enviado.`;
  s.hidden = false;
};
