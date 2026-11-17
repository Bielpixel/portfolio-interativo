(() => {
  'use strict';
  const projects = portfolioProjects;
  const dialog = document.querySelector('#project-portal'),
    frame = document.querySelector('#project-frame'),
    loading = document.querySelector('#project-loading');
  const base = new URL('projects/', location.href);
  let launcher = null,
    scrollBefore = 0,
    current = null,
    timeout = null,
    closing = false,
    returnURL = location.pathname + location.search + '#work';

  function open(slug, button, push = true) {
    const project = projects.find((p) => p.slug === slug);
    if (!project || closing) return;
    if (!dialog.open) {
      launcher = button || document.querySelector(`[data-open-project="${slug}"]`);
      scrollBefore = scrollY;
      returnURL =
        location.pathname +
        location.search +
        (location.hash.startsWith('#project=') ? '#work' : location.hash);
      window.dispatchEvent(new Event('portfolio:open'));
      const r = launcher?.getBoundingClientRect();
      dialog.style.setProperty(
        '--ox',
        Math.min(innerWidth, Math.max(0, r ? r.left + r.width / 2 : innerWidth / 2)) +
          'px',
      );
      dialog.style.setProperty(
        '--oy',
        Math.min(innerHeight, Math.max(0, r ? r.top + r.height / 2 : innerHeight / 2)) +
          'px',
      );
      dialog.showModal();
      document.body.classList.add('portal-open');
    }
    current = project;
    document.querySelector('#portal-title').textContent = project.title;
    document.querySelector('#loading-title').textContent = project.title;
    document.querySelector('#loading-status').textContent = 'Abrindo a experiência';
    loading.hidden = false;
    const url = new URL(project.slug + '/index.html', base).href;
    document.querySelector('#portal-direct').href = url;
    document.querySelector('#portal-source').href =
      'https://github.com/Bielpixel/' + project.repo;
    frame.title = project.title;
    clearTimeout(timeout);
    frame.src = url;
    timeout = setTimeout(() => {
      if (!loading.hidden)
        document.querySelector('#loading-status').textContent =
          'O carregamento está demorando. Tente abrir em outra aba ou voltar.';
    }, 12000);
    if (push) history.pushState({ project: slug }, '', '#project=' + slug);
    document.querySelector('#portal-back').focus();
  }

  function close(update = true) {
    if (!dialog.open || closing) return;
    closing = true;
    clearTimeout(timeout);
    dialog.classList.add('closing');
    const done = () => {
      dialog.classList.remove('closing');
      dialog.close();
      frame.src = 'about:blank';
      current = null;
      closing = false;
      document.body.classList.remove('portal-open');
      window.scrollTo(0, scrollBefore);
      launcher?.focus({ preventScroll: true });
      if (update) history.replaceState({}, '', returnURL);
    };
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) done();
    else setTimeout(done, 450);
  }
  document
    .querySelectorAll('[data-open-project]')
    .forEach((b) => b.addEventListener('click', () => open(b.dataset.openProject, b)));
  document.querySelector('#portal-back').onclick = () => close();
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow || !dialog.open) return;
    const origin = new URL(base).origin;
    if (e.origin !== origin && !(location.protocol === 'file:' && e.origin === 'null'))
      return;
    if (e.data?.type === 'portfolio-ready') {
      clearTimeout(timeout);
      loading.hidden = true;
    } else if (e.data?.type === 'portfolio-close') close();
    else if (e.data?.type === 'portfolio-project') open(e.data.slug, null);
  });
  addEventListener('popstate', () => {
    const match = location.hash.match(/^#project=([a-z]+)$/);
    if (match) open(match[1], null, false);
    else close(false);
  });
  const initial = location.hash.match(/^#project=([a-z]+)$/);
  if (initial) open(initial[1], null, false);
})();
