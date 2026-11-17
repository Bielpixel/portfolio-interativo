(() => {
  'use strict';
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)),
    ease = (x) => x * x * (3 - 2 * x);
  const colors = [
    '#5bc7ff',
    '#e68bff',
    '#ff8583',
    '#f2c769',
    '#7feca7',
    '#5b98ff',
    '#d09aff',
    '#7be4d9',
  ];
  const names = [
    'Layout',
    'Texto',
    'Forma',
    'Interface',
    'Detalhes',
    'Composição',
    'Código',
    'Revisão',
  ];
  const layer = $('#cursor-layer'),
    tasks = [];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const speed = 2;
  let time = 0,
    last = 0,
    playing = true,
    finished = false,
    manualScroll = false,
    mergeStart = null;
  let pointer = { x: innerWidth / 2, y: innerHeight / 2, seen: false, inside: false };
  const phases = [
    { t: 0, id: 'home', name: '01 / Primeiros traços' },
    { t: 11.5, id: 'proof', name: '02 / Formação' },
    { t: 21, id: 'work', name: '03 / Projetos' },
    { t: 44, id: 'contact', name: '04 / Últimos detalhes' },
  ];

  function task(selector, start, duration, kind, agent) {
    const el = typeof selector === 'string' ? $(selector) : selector;
    if (!el) throw Error('Missing build target: ' + selector);
    const t = { el, start, duration, kind, agent, nodes: [], original: el.style.cssText };
    el.dataset.build = kind;
    if (kind === 'type') {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) t.nodes.push({ node, text: node.textContent });
      t.length = t.nodes.reduce((n, x) => n + x.text.length, 0);
    }
    tasks.push(t);
    return t;
  }
  task('.header', 0.7, 1, 'draw', 0);
  task('.brand', 1.5, 1, 'type', 4);
  task('.nav', 2, 1, 'place', 3);
  task('.header-right', 2.5, 1, 'place', 4);
  task('.eyebrow', 1.8, 1.2, 'type', 1);
  task('h1', 3.2, 3.3, 'type', 1);
  task('.hero-desc', 6.6, 3.2, 'type', 1);
  task('.artifact', 3, 3.2, 'draw', 2);
  task('.artifact-tag', 6.4, 1, 'type', 2);
  task('.primary-btn', 8.1, 1.2, 'place', 3);
  task('.ghost-btn', 9.3, 1, 'place', 3);
  task('.hero-meta', 9, 1, 'place', 4);
  task('.hero-meta-right', 10, 1, 'place', 4);
  task('#proof .section-kicker', 12.3, 0.9, 'type', 1);
  task('#proof h2', 13.3, 2, 'type', 1);
  task('#proof .section-head>p', 15.5, 3, 'type', 1);
  task('.spotlight', 13, 2, 'draw', 0);
  task('.big-word', 15, 1, 'place', 2);
  task('.spotlight-terminal', 16, 1.5, 'place', 3);
  $$('.terminal-line').forEach((el, i) => task(el, 17.7 + i * 0.3, 0.25, 'draw', 5));
  task('.spotlight-right', 18, 1.3, 'place', 2);
  task('.spotlight-right span', 19.4, 1, 'type', 1);
  task('#work .section-kicker', 21.8, 0.9, 'type', 1);
  task('#work h2', 22.8, 2, 'type', 1);
  task('#work .section-head>p', 25, 1.3, 'type', 1);
  $$('.project').forEach((el, i) => {
    task(el, 26.5 + i * 2.1, 0.7, 'draw', 0);
    task(el.querySelector('.project-visual'), 27.2 + i * 2.1, 0.6, 'place', 3);
    task(el.querySelector('.project-caption'), 27.8 + i * 2.1, 0.7, 'type', 1);
  });
  task('.other-projects', 41.2, 1, 'place', 4);
  task('.story-strip', 42.3, 1, 'place', 4);
  task('#contact .section-kicker', 44.8, 1, 'type', 1);
  task('#contact h2', 46, 2.6, 'type', 1);
  task('#contact .footer-grid p', 48.8, 2.4, 'type', 1);
  task('.mock-email', 48, 1.4, 'place', 3);
  task('.footer-bottom', 51.3, 1.3, 'draw', 0);
  const BUILD_END = 53.5;
  const agents = Array.from({ length: 6 }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'agent';
    el.style.opacity = '0';
    el.style.setProperty('--agent', colors[i]);
    el.innerHTML =
      '<svg viewBox="0 0 23 29"><path d="M2 1 L2.5 23 L8.3 17.8 L13 27 L17 24.8 L12.4 15.9 L20.2 15.1 Z" fill="var(--agent)" stroke="#0a1020" stroke-width="1.35" stroke-linejoin="round"/></svg><span class="agent-name"></span>';
    el.querySelector('span').textContent = names[i % 8];
    layer.append(el);
    return { el, x: pointer.x, y: pointer.y, docked: true };
  });
  const frames = Array.from({ length: 8 }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'select-frame';
    el.style.setProperty('--sel', colors[i]);
    el.innerHTML =
      '<span class="frame-tag"></span><span class="handles"><i></i><i></i><i></i><i></i></span>';
    layer.prepend(el);
    return el;
  });
  const halo = document.createElement('div');
  halo.className = 'merge-halo';
  layer.append(halo);

  function rect(el) {
    return el.getBoundingClientRect();
  }

  function type(t, p) {
    let remaining = Math.floor(t.length * p);
    t.caret = null;
    for (const n of t.nodes) {
      const count = clamp(remaining, 0, n.text.length);
      n.node.textContent = n.text.slice(0, count);
      remaining -= count;
      if (count) {
        const range = document.createRange();
        range.setStart(n.node, count - 1);
        range.setEnd(n.node, count);
        const r = range.getBoundingClientRect();
        if (r.width) t.caret = { x: r.right + 3, y: r.bottom - 4 };
      }
    }
  }

  function renderTasks() {
    for (const t of tasks) {
      const p = clamp((time - t.start) / t.duration),
        active = time >= t.start;
      if (t.p === p && t.active === active) continue;
      t.p = p;
      t.active = active;
      t.el.style.visibility = active ? 'visible' : 'hidden';
      t.el.inert = !active || p < 1;
      // A measured minimum height keeps typing from moving the next component.
      if (t.kind === 'type') type(t, p);
      if (t.kind === 'draw')
        t.el.style.clipPath =
          p >= 1 ? 'none' : `inset(0 ${100 - p * 100}% ${100 - p * 100}% 0)`;
      if (t.kind === 'place') {
        t.el.style.translate = `${(1 - ease(p)) * -65}px ${(1 - ease(p)) * 45}px`;
        t.el.style.opacity = active ? String(clamp(p * 5)) : 0;
      }
    }
  }

  function focusY(t) {
    const section = document.getElementById(t.id);
    let y = section.offsetTop - 30;
    // On narrow screens, follow each project so both cards are actually built in view.
    if (t.id === 'work' && time >= 41.1)
      y = $('.other-projects').getBoundingClientRect().top + scrollY - 100;
    else if (t.id === 'work' && time >= 26.5) {
      const cards = $$('.project'),
        i = clamp(Math.floor((time - 26.5) / 2.1), 0, cards.length - 1);
      y =
        cards[i].getBoundingClientRect().top +
        scrollY -
        Math.min(130, innerHeight * 0.15);
    } else if (t.id === 'home' && innerWidth <= 700 && time >= 7)
      y = Math.max(
        0,
        $('.artifact').getBoundingClientRect().top + scrollY - innerHeight * 0.48,
      );
    else if (t.id === 'proof' && time >= 16)
      y =
        $('.spotlight').getBoundingClientRect().top +
        scrollY -
        Math.min(230, innerHeight * 0.28);
    return clamp(y, 0, Math.max(0, document.documentElement.scrollHeight - innerHeight));
  }

  function render(dt = 16) {
    renderTasks();
    let phase = phases.filter((p) => time >= p.t).at(-1);
    if (!manualScroll && playing && !finished) {
      const y = focusY(phase);
      window.scrollTo(0, scrollY + (y - scrollY) * (1 - Math.exp(-dt / 180)));
    }
    const active = Array.from({ length: 8 }, (_, i) =>
      tasks.find(
        (t) => t.agent === i && time >= t.start - 0.65 && time < t.start + t.duration,
      ),
    );
    frames.forEach((f, i) => {
      const t = active[i];
      f.classList.toggle('visible', !!t && time >= t.start && time < BUILD_END);
      if (t) {
        const r = rect(t.el);
        f.style.transform = `translate(${r.x}px,${r.y}px)`;
        f.style.width = r.width + 'px';
        f.style.height = r.height + 'px';
        f.querySelector('.frame-tag').textContent =
          names[i] +
          ' / ' +
          { type: 'digitando', draw: 'desenhando', place: 'posicionando' }[t.kind];
      }
    });
    if (
      time >= BUILD_END &&
      mergeStart === null &&
      (pointer.seen || matchMedia('(pointer:coarse)').matches)
    )
      mergeStart = time;
    const merging = mergeStart !== null,
      mp = merging ? clamp((time - mergeStart) / 1.8) : 0;
    agents.forEach((a, i) => {
      const owner = i,
        t = active[owner];
      let x = pointer.x,
        y = pointer.y;
      if (t && time < BUILD_END) {
        const r = rect(t.el),
          p = t.p;
        a.docked = false;
        if (i < 8 && t.kind === 'type' && t.caret) {
          x = t.caret.x;
          y = t.caret.y;
        } else if (i < 8 && t.kind === 'draw') {
          x = r.left + r.width * p;
          y = r.top + r.height * p;
        } else if (i < 8 && t.kind === 'place') {
          x = r.left + Math.min(40, r.width * 0.3);
          y = r.top + 16;
        } else {
          const corner = i % 4;
          x = r.left + (corner % 2 ? r.width : 0);
          y = r.top + (corner >= 2 ? r.height : 0);
          x += ((i % 3) - 1) * 12;
          y += Math.floor(i / 8) * 10;
        }
      }
      if (time >= BUILD_END) {
        const angle = (i / agents.length) * Math.PI * 2;
        const radius = merging ? 110 * (1 - ease(mp)) : 80;
        x = pointer.x + Math.cos(angle) * radius;
        y = pointer.y + Math.sin(angle) * radius;
      }
      if (t && time < BUILD_END) {
        x = clamp(x, 8, innerWidth - 24);
        y = clamp(y, 8, innerHeight - 75);
      }
      // Idle collaborators live at the real pointer. They travel home once, then
      // follow it invisibly until their next assignment, instead of milling about.
      if (!t && time < BUILD_END && a.docked) {
        a.x = pointer.x;
        a.y = pointer.y;
      }
      const k = 1 - Math.exp(-dt / (merging ? 65 : 85));
      a.x += (x - a.x) * k;
      a.y += (y - a.y) * k;
      const homeDistance = Math.hypot(a.x - pointer.x, a.y - pointer.y);
      if (!t && time < BUILD_END && homeDistance < 7) {
        a.docked = true;
        a.x = pointer.x;
        a.y = pointer.y;
      }
      if (mp > 0.98) {
        a.x = pointer.x;
        a.y = pointer.y;
      }
      a.el.style.transform = `translate3d(${a.x}px,${a.y}px,0)`;
      const returning = !t && !a.docked && pointer.seen;
      const working = time < BUILD_END ? !!t || returning : merging;
      a.el.style.opacity =
        finished || !working ? '0' : String(1 - clamp((mp - 0.75) * 4));
      a.el.classList.toggle('working', i < 6 && !!active[owner] && time < BUILD_END);
    });
    halo.style.left = pointer.x + 'px';
    halo.style.top = pointer.y + 'px';
    halo.style.opacity =
      merging && !finished ? String(Math.sin(mp * Math.PI) * 0.7) : '0';
    if (mp >= 1 && !finished) finish();
    $('#progress-fill').style.width = clamp(time / BUILD_END) * 100 + '%';
    $('#phase-label').textContent = finished
      ? 'Seu mouse. Sua vez.'
      : time >= BUILD_END
        ? merging
          ? 'Todos em um.'
          : 'Mova o mouse para unir'
        : phase.name;
  }

  function restore() {
    for (const t of tasks) {
      t.el.style.cssText = t.original;
      t.el.inert = false;
      for (const n of t.nodes) n.node.textContent = n.text;
    }
  }

  function measure() {
    restore();
    tasks.forEach((t) => (t.p = -1));
    for (const t of tasks.filter((t) => t.kind === 'type'))
      t.el.style.minHeight = t.el.getBoundingClientRect().height + 'px';
  }

  function finish() {
    finished = true;
    playing = false;
    restore();
    frames.forEach((f) => f.classList.remove('visible'));
    agents.forEach((a) => (a.el.style.opacity = '0'));
    halo.style.opacity = 0;
    document.body.classList.remove('building', 'is-paused');
    document.body.classList.add('is-finished');
    $('#announcement').textContent = 'Portfólio pronto. Agora o controle é seu.';
    controls();
  }

  function controls() {
    $('#play-btn').textContent = playing ? 'Pausar' : 'Continuar';
    $('#play-btn').disabled = finished;
    $('#play-btn').setAttribute(
      'aria-label',
      playing ? 'Pausar construção' : 'Continuar construção',
    );
    $('#skip-btn').disabled = finished;
    document.body.classList.toggle('is-paused', !playing && !finished);
  }

  function reset() {
    time = 0;
    last = 0;
    mergeStart = null;
    finished = false;
    manualScroll = false;
    playing = true;
    window.scrollTo(0, 0);
    agents.forEach((a) => {
      a.docked = true;
      a.x = pointer.x;
      a.y = pointer.y;
    });
    measure();
    document.body.classList.remove('is-finished');
    document.body.classList.add('building');
    $('#announcement').textContent = 'Construção iniciada.';
    render(0);
    controls();
  }
  $('#reset-btn').onclick = reset;
  $('#restart-hero').onclick = reset;
  $('#nav-replay').onclick = reset;
  $('#play-btn').onclick = () => {
    playing = !playing;
    controls();
  };

  function skip() {
    time = BUILD_END;
    finish();
    render(0);
  }
  $('#skip-btn').onclick = skip;
  addEventListener('portfolio:open', skip);
  addEventListener('keydown', (e) => {
    if (
      finished ||
      e.repeat ||
      e.defaultPrevented ||
      e.isComposing ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      e.key.toLowerCase() !== 'p'
    )
      return;
    const target = e.target;
    if (
      target instanceof Element &&
      (target.closest('input,textarea,select,[role="textbox"]') ||
        target.isContentEditable)
    )
      return;
    e.preventDefault();
    skip();
  });
  addEventListener(
    'pointermove',
    (e) => {
      pointer = { x: e.clientX, y: e.clientY, seen: true, inside: true };
    },
    { passive: true },
  );
  addEventListener(
    'pointerdown',
    (e) => {
      pointer = { x: e.clientX, y: e.clientY, seen: true, inside: true };
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => (pointer.inside = false));
  addEventListener('wheel', () => (manualScroll = true), { passive: true });
  addEventListener('touchmove', () => (manualScroll = true), { passive: true });
  addEventListener('keydown', (e) => {
    if (
      ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)
    )
      manualScroll = true;
  });
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', () => {
      manualScroll = true;
    }),
  );
  addEventListener('resize', () => {
    measure();
    if (!finished) render(0);
  });
  document.addEventListener('visibilitychange', () => {
    last = 0;
  });
  reduce.addEventListener('change', (e) => {
    if (e.matches) {
      time = BUILD_END;
      finish();
      render(0);
    }
  });

  function tick(now) {
    const dt = last ? Math.min(now - last, 64) : 0;
    last = now;
    if (playing && !document.hidden) {
      time += dt * 0.001 * speed;
      render(dt * speed);
    }
    requestAnimationFrame(tick);
  }
  reset();
  document.body.classList.remove('booting');
  if (reduce.matches) {
    time = BUILD_END;
    finish();
    render(0);
  }
  requestAnimationFrame(tick);
})();
