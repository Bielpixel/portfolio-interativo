(() => {
  const target = '*';
  const notify = () => {
    if (parent !== window) parent.postMessage({ type: 'portfolio-ready' }, target);
  };
  addEventListener('load', notify);
  notify();
  addEventListener('keydown', (e) => {
    if (
      e.key === 'Escape' &&
      !document.querySelector('dialog[open]') &&
      parent !== window
    )
      parent.postMessage({ type: 'portfolio-close' }, target);
  });
  document.querySelectorAll('[data-project]').forEach((b) =>
    b.addEventListener('click', () => {
      if (parent !== window)
        parent.postMessage(
          { type: 'portfolio-project', slug: b.dataset.project },
          target,
        );
      else location.href = '../' + b.dataset.project + '/index.html';
    }),
  );
})();
