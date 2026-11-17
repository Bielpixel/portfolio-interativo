(() => {
  'use strict';
  const embedded = parent !== window;
  const close = () => parent.postMessage({ type: 'portfolio-close' }, '*');
  document.querySelector('#back-portfolio').addEventListener('click', (event) => {
    if (embedded) {
      event.preventDefault();
      close();
    }
  });
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && embedded) {
      event.preventDefault();
      close();
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault();
  });
  addEventListener('blur', () => {
    game.keys.clear();
    if (game.running && !game.paused) togglePause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.keys.clear();
      if (game.running && !game.paused) togglePause();
    }
  });
  if (embedded) parent.postMessage({ type: 'portfolio-ready' }, '*');
})();
