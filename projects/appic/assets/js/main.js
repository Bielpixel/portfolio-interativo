let items = [
    { id: 1, text: 'Explorar o portfólio interativo', done: true },
    { id: 2, text: 'Praticar HTML e CSS', done: true },
    { id: 3, text: 'Revisar um projeto do GitHub', done: false },
  ],
  filter = 'all',
  removed = null;
try {
  const saved = JSON.parse(localStorage.getItem('biel-appic-v1'));
  if (
    Array.isArray(saved) &&
    saved.every((t) => typeof t.text === 'string' && typeof t.done === 'boolean')
  )
    items = saved;
} catch {}
try {
  if (!localStorage.getItem('biel-appic-second-completed-v2')) {
    const second = items.find((t) => t.id === 2 && t.text === 'Praticar HTML e CSS');
    if (second) {
      second.done = true;
      localStorage.setItem('biel-appic-v1', JSON.stringify(items));
    }
    localStorage.setItem('biel-appic-second-completed-v2', '1');
  }
} catch {}
function save() {
  try {
    localStorage.setItem('biel-appic-v1', JSON.stringify(items));
    document.querySelector('#storage-status').textContent = 'Salvo neste navegador.';
  } catch {
    document.querySelector('#storage-status').textContent =
      'Nesta sessão, sem armazenamento persistente.';
  }
}

function render() {
  const list = document.querySelector('#tasks');
  list.replaceChildren();
  const show = items.filter(
    (t) => filter === 'all' || (filter === 'done' ? t.done : !t.done),
  );
  show.forEach((t) => {
    const li = document.createElement('li');
    li.classList.toggle('done', t.done);
    const label = document.createElement('label'),
      box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = t.done;
    box.onchange = () => {
      t.done = box.checked;
      save();
      render();
    };
    label.append(box, document.createTextNode(t.text));
    const del = document.createElement('button');
    del.className = 'secondary';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Remover ' + t.text);
    del.onclick = () => {
      removed = { item: t, index: items.indexOf(t) };
      items = items.filter((x) => x !== t);
      document.querySelector('#undo-wrap').hidden = false;
      save();
      render();
    };
    li.append(label, del);
    list.append(li);
  });
  const done = items.filter((t) => t.done).length,
    percent = items.length ? Math.round((done / items.length) * 100) : 0;
  document.querySelector('#percent').textContent = percent + '%';
  document.querySelector('#meter').style.width = percent + '%';
  document.querySelector('#summary').textContent =
    done + ' de ' + items.length + ' objetivos concluídos';
  document.querySelector('#empty').hidden = show.length > 0;
}
document.querySelector('#new-task').onsubmit = (e) => {
  e.preventDefault();
  const input = document.querySelector('#task-input'),
    value = input.value.trim();
  if (!value) return;
  items.push({ id: Date.now(), text: value, done: false });
  input.value = '';
  filter = 'all';
  document
    .querySelectorAll('[data-filter]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  save();
  render();
  input.focus();
};
document.querySelectorAll('[data-filter]').forEach(
  (b) =>
    (b.onclick = () => {
      filter = b.dataset.filter;
      document
        .querySelectorAll('[data-filter]')
        .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }),
);
document.querySelector('#undo').onclick = () => {
  if (removed) {
    items.splice(removed.index, 0, removed.item);
    removed = null;
    save();
    render();
  }
  document.querySelector('#undo-wrap').hidden = true;
};
render();
