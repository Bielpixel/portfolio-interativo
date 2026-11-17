const dialog = document.querySelector('#panel');
document.querySelectorAll('[data-panel]').forEach(
  (b) =>
    (b.onclick = () => {
      dialog
        .querySelectorAll('section')
        .forEach((s) => (s.hidden = s.id !== b.dataset.panel));
      document.querySelector('#panel-title').textContent =
        b.querySelector('h2').textContent;
      dialog.showModal();
    }),
);
document.querySelector('#close').onclick = () => dialog.close();
document.querySelector('#theme').onclick = (e) => {
  const on = document.body.classList.toggle('dark');
  e.currentTarget.setAttribute('aria-pressed', String(on));
};

function accent(c) {
  document.body.style.setProperty('--accent', c);
  document.querySelector('#accent').value = c;
}
document.querySelector('#accent').oninput = (e) => accent(e.target.value);
document
  .querySelectorAll('[data-color]')
  .forEach((b) => (b.onclick = () => accent(b.dataset.color)));
document.querySelector('#compact').onchange = (e) =>
  document.body.classList.toggle('compact', e.target.checked);
document.querySelector('#draft').oninput = (e) =>
  (document.querySelector('#draft-preview').textContent =
    e.target.value || 'Minha próxima ideia');
