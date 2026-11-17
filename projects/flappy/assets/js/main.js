(() => {
  'use strict';
  const canvas = document.querySelector('#game'),
    ctx = canvas.getContext('2d'),
    sprite = new Image();
  sprite.src = 'assets/images/sprites.png';
  const $ = (s) => document.querySelector(s);
  let mode = 'ready',
    bird,
    pipes,
    score = 0,
    best = 0,
    elapsed = 0,
    last = 0,
    spawn = 0,
    sound = false,
    loaded = false;
  try {
    best = Number(localStorage.getItem('biel-flappy-best')) || 0;
  } catch {}
  $('#best').textContent = best;
  const audio = {
    jump: new Audio('assets/audio/pulo.wav'),
    hit: new Audio('assets/audio/hit.wav'),
    point: new Audio('assets/audio/ponto.wav'),
  };

  function play(k) {
    if (sound) {
      audio[k].currentTime = 0;
      audio[k].play().catch(() => {});
    }
  }

  function init() {
    bird = { x: 68, y: 190, v: 0, w: 28, h: 21 };
    pipes = [];
    score = 0;
    spawn = 0.8;
    elapsed = 0;
    $('#score').textContent = 0;
  }

  function start() {
    if (!loaded) return;
    init();
    mode = 'play';
    bird.v = -260;
    $('#start').textContent = 'Recomeçar';
    $('#pause').disabled = false;
    $('#pause').textContent = 'Pausar';
    $('#game-status').textContent = 'Em voo. Use espaço ou toque para saltar.';
    canvas.focus();
    play('jump');
  }

  function jump() {
    if (mode === 'ready' || mode === 'over') {
      start();
      return;
    }
    if (mode === 'play') {
      bird.v = -260;
      play('jump');
    }
  }

  function pause() {
    if (mode !== 'play' && mode !== 'pause') return;
    mode = mode === 'play' ? 'pause' : 'play';
    $('#pause').textContent = mode === 'pause' ? 'Continuar' : 'Pausar';
    $('#game-status').textContent = mode === 'pause' ? 'Jogo pausado.' : 'Em voo.';
    last = 0;
  }

  function hit() {
    mode = 'over';
    play('hit');
    $('#pause').disabled = true;
    $('#game-status').textContent =
      'Fim de jogo: ' + score + ' pontos. Tente mais uma vez!';
    if (score > best) {
      best = score;
      $('#best').textContent = best;
      try {
        localStorage.setItem('biel-flappy-best', best);
      } catch {}
    }
  }

  function intersects(b, p) {
    return b.x + b.w > p.x && b.x < p.x + 52 && (b.y < p.top || b.y + b.h > p.top + 136);
  }

  function update(dt) {
    elapsed += dt;
    if (mode !== 'play') return;
    bird.v += 760 * dt;
    bird.y += bird.v * dt;
    spawn -= dt;
    if (spawn <= 0) {
      pipes.push({ x: 340, top: 55 + Math.random() * 160, scored: false });
      spawn = 1.65;
    }
    for (const p of pipes) {
      p.x -= 116 * dt;
      if (intersects(bird, p)) {
        hit();
        return;
      }
      if (!p.scored && p.x + 52 < bird.x) {
        p.scored = true;
        score++;
        $('#score').textContent = score;
        play('point');
      }
    }
    pipes = pipes.filter((p) => p.x > -60);
    if (bird.y < 0 || bird.y + bird.h > 390) hit();
  }

  function draw() {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, 320, 480);
    if (!loaded) return;
    for (let x = 0; x < 550; x += 275)
      ctx.drawImage(sprite, 390, 0, 275, 204, x, 226, 275, 204);
    for (const p of pipes) {
      ctx.drawImage(sprite, 52, 169, 52, 400, p.x, p.top - 400, 52, 400);
      ctx.drawImage(sprite, 0, 169, 52, 400, p.x, p.top + 136, 52, 400);
    }
    const ground = -((elapsed * 48) % 224);
    for (let x = ground; x < 400; x += 224)
      ctx.drawImage(sprite, 0, 610, 224, 112, x, 390, 224, 112);
    const wing = Math.floor(elapsed * 10) % 3;
    ctx.save();
    ctx.translate(bird.x + 14, bird.y + 10);
    ctx.rotate(Math.max(-0.35, Math.min(0.9, bird.v / 550)));
    ctx.drawImage(sprite, 0, wing * 26, 33, 24, -16, -12, 33, 24);
    ctx.restore();
    if (mode !== 'play') {
      ctx.fillStyle = '#102d36bb';
      ctx.fillRect(18, 126, 284, 130);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 25px system-ui';
      ctx.fillText(
        { ready: 'Pronto para voar?', pause: 'Pausado', over: 'Mais uma tentativa?' }[
          mode
        ],
        160,
        174,
      );
      ctx.font = '14px system-ui';
      ctx.fillText(
        mode === 'pause' ? 'P ou Continuar para voltar' : 'Toque ou pressione espaço',
        160,
        208,
      );
    }
  }

  function loop(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.032) : 0;
    last = now;
    if (!document.hidden) {
      update(dt);
      draw();
    }
    requestAnimationFrame(loop);
  }
  $('#start').onclick = start;
  $('#pause').onclick = pause;
  $('#sound').onclick = (e) => {
    sound = !sound;
    e.currentTarget.textContent = 'Som: ' + (sound ? 'ligado' : 'desligado');
    e.currentTarget.setAttribute('aria-pressed', sound);
  };
  canvas.onpointerdown = (e) => {
    e.preventDefault();
    canvas.focus();
    jump();
  };
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input,textarea,select,button')) return;
    if ([' ', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      if (!e.repeat) jump();
    }
    if (e.key.toLowerCase() === 'p') pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode === 'play') pause();
    last = 0;
  });
  sprite.onload = () => {
    loaded = true;
    $('#game-status').textContent = 'Pronto para voar.';
  };
  sprite.onerror = () =>
    ($('#game-status').textContent =
      'Não foi possível carregar os gráficos. Reabra o projeto.');
  init();
  $('#game-status').textContent = 'Carregando gráficos…';
  requestAnimationFrame(loop);
})();
