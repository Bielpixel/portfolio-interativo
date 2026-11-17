const canvas = document.getElementById('pong');
const context = canvas.getContext('2d');
const playerScore = document.getElementById('player-score');
const computerScore = document.getElementById('computer-score');
const message = document.getElementById('game-message');
const ultimateScene = document.getElementById('ultimate-scene');
const pauseButton = document.getElementById('pause-button');
const restartButton = document.getElementById('restart-button');
const arena = document.getElementById('arena');
const playerState = document.getElementById('player-state');
const cpuState = document.getElementById('cpu-state');
const playerHealthValue = document.getElementById('player-health-value');
const playerHealthFill = document.getElementById('player-health-fill');

const game = { running:false, paused:false, gameOver:false, player:0, computer:0, playerHealth:10, keys:new Set() };
const passives = { barrier: true, spectralDeflect: true };
const effects = { barrierVisibleUntil:0, barrierImpactUntil:0, barrierImpactX:0, barrierImpactY:0, playerBarrierDisabledUntil:0, enemyBarrierVisibleUntil:0, enemyBarrierImpactUntil:0, enemyBarrierImpactX:0, enemyBarrierImpactY:0, reliefWaveStart:0, playerHitUntil:0, ninjaSlashUntil:0, ninjaSlashX:0, ninjaSlashY:0, enemyDashUntil:0, enemyDashCooldownUntil:0, spectralFlashUntil:0, spectralCooldownUntil:0, shockwaveStart:0, shockwaveX:0, shockwaveY:0, sparks:[] };
const abilities = { reliefUntil:0, reliefCooldownUntil:0, aimShotCooldownUntil:0, enemyUltUntil:0, enemyUltCooldownUntil:0, ultUntil:0, ultSceneUntil:0 };
let respawnTimer = 0;
let reliefCooldownTimer = 0;
const aimTarget = { x:canvas.width / 2, y:canvas.height / 2 };
const player = { x:28, y:220, width:16, height:100, speed:8 };
const computer = { x:918, y:220, width:14, height:100, speed:4.7 };
const ball = { x:480, y:270, radius:9, speed:6, vx:6, vy:3, color:'#f2f4ff', trail:[] };

function resetBall(direction = 1) {
  ball.x = canvas.width / 2; ball.y = canvas.height / 2;
  ball.speed = 4; ball.vx = direction * ball.speed; ball.vy = (Math.random() * 3 - 1.5) || 1.5; ball.color = '#f2f4ff'; ball.trail = [];
}

function resetGame() {
  clearTimeout(respawnTimer);
  clearInterval(reliefCooldownTimer);
  reliefCooldownTimer = 0;
  game.player = 0; game.computer = 0; game.playerHealth = 10; game.running = false; game.paused = false; game.gameOver = false;
  player.y = canvas.height / 2 - player.height / 2;
  computer.y = canvas.height / 2 - computer.height / 2;
  resetBall(Math.random() > .5 ? 1 : -1);
  effects.barrierVisibleUntil = 0; effects.barrierImpactUntil = 0; effects.playerBarrierDisabledUntil = 0; effects.enemyBarrierVisibleUntil = 0; effects.enemyBarrierImpactUntil = 0; effects.reliefWaveStart = 0; effects.playerHitUntil = 0; effects.ninjaSlashUntil = 0; effects.enemyDashUntil = 0; effects.enemyDashCooldownUntil = 0; effects.spectralFlashUntil = 0; effects.spectralCooldownUntil = 0; effects.shockwaveStart = 0; effects.sparks = [];
  abilities.reliefUntil = 0; abilities.reliefCooldownUntil = 0; abilities.aimShotCooldownUntil = 0; abilities.enemyUltUntil = 0; abilities.enemyUltCooldownUntil = performance.now() + 6000; abilities.ultUntil = 0; abilities.ultSceneUntil = 0; ultimateScene.hidden = true;
  arena.classList.remove('orange-domain'); updateHealthBar();
  updateScore(); updateMessage('Pressione Espaço para começar'); pauseButton.textContent = 'Pausar';
}

function updateScore() { playerScore.textContent = game.player; computerScore.textContent = game.computer; }
function updateMessage(text) { message.textContent = text; message.hidden = !text; }

function movePlayer(timeScale = 1) {
  if (game.keys.has('w') || game.keys.has('arrowup')) player.y -= player.speed * timeScale;
  if (game.keys.has('s') || game.keys.has('arrowdown')) player.y += player.speed * timeScale;
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function moveComputer(timeScale = 1, ultActive = false) {
  const targetY = ball.vx > 0 ? predictBallY(Math.max(0, computer.x - ball.x)) : ball.y;
  const target = targetY - computer.height / 2;
  const speed = ultActive ? .75 : performance.now() < effects.enemyDashUntil ? 9 : computer.speed;
  computer.y += Math.sign(target - computer.y) * Math.min(speed * timeScale, Math.abs(target - computer.y));
  computer.y = Math.max(0, Math.min(canvas.height - computer.height, computer.y));
}

function predictBallY(distance) {
  const travelTime = distance / Math.max(.5, Math.abs(ball.vx));
  let predicted = ball.y + ball.vy * travelTime;
  const limit = canvas.height - ball.radius;
  while (predicted < ball.radius || predicted > limit) {
    if (predicted < ball.radius) predicted = ball.radius + (ball.radius - predicted);
    if (predicted > limit) predicted = limit - (predicted - limit);
  }
  return predicted;
}

function hitPaddle(currentPaddle, isPlayer) {
  const hit = ball.x - ball.radius < currentPaddle.x + currentPaddle.width && ball.x + ball.radius > currentPaddle.x && ball.y + ball.radius > currentPaddle.y && ball.y - ball.radius < currentPaddle.y + currentPaddle.height;
  if (!hit) return false;
  const relative = (ball.y - (currentPaddle.y + currentPaddle.height / 2)) / (currentPaddle.height / 2);
  ball.vx = (isPlayer ? 1 : -1) * Math.min(5, Math.abs(ball.vx));
  ball.vy = relative * 6;
  ball.x = isPlayer ? currentPaddle.x + currentPaddle.width + ball.radius : currentPaddle.x - ball.radius;
  ball.color = isPlayer ? '#5ee7d0' : performance.now() < abilities.enemyUltUntil ? '#ff9f1c' : '#ff6ca8';
  if (!isPlayer) {
    const attackBuff = 1.4;
    ball.vx = Math.sign(ball.vx) * Math.min(10, Math.abs(ball.vx) * attackBuff);
    ball.vy = Math.max(-10, Math.min(10, ball.vy * attackBuff));
    effects.ninjaSlashUntil = performance.now() + 260;
    effects.ninjaSlashX = currentPaddle.x - 4;
    effects.ninjaSlashY = ball.y;
    for (let index = 0; index < 6; index += 1) effects.sparks.push({ x:effects.ninjaSlashX, y:effects.ninjaSlashY, vx:-Math.random() * 3, vy:Math.random() * 5 - 2.5, life:1, color:'#ff6ca8' });
  } else effects.playerHitUntil = performance.now() + 240;
  return true;
}

function update() {
  if (!game.running || game.paused || game.gameOver) return;
  const now = performance.now();
  if (now < abilities.ultSceneUntil) return;
  if (!ultimateScene.hidden && now >= abilities.ultSceneUntil) ultimateScene.hidden = true;
  if (effects.playerBarrierDisabledUntil && now >= effects.playerBarrierDisabledUntil) {
    effects.playerBarrierDisabledUntil = 0; game.playerHealth = 10; updateHealthBar(); updateMessage('BARREIRA RESTAURADA');
    setTimeout(() => { if (!game.paused && !game.gameOver) updateMessage(''); }, 700);
  }
  const ultActive = now < abilities.ultUntil;
  const reliefActive = performance.now() < abilities.reliefUntil;
  tryActivateEnemyUltimate(now);
  if (now >= abilities.enemyUltUntil && ball.color === '#ff9f1c') ball.color = '#f2f4ff';
  if (now >= abilities.enemyUltUntil) arena.classList.remove('orange-domain');
  const timeScale = ultActive ? .45 : 1;
    movePlayer(timeScale); 
    tryEnemyDash(performance.now(), ultActive); 
    moveComputer(timeScale, ultActive);
  const multiplier = ultActive ? 3 : 1;
  if (ultActive) autoDodgeComputer();
  ball.x += ball.vx * multiplier; ball.y += ball.vy * multiplier;
  ball.trail.push({ x:ball.x, y:ball.y, color:ultActive ? '#ffd166' : reliefActive ? '#75f58a' : ball.color, life:1 });
  if (ball.trail.length > 52) ball.trail.shift();
  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) { ball.vy *= -1; ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y)); }
  hitPaddle(player, true);
  hitPaddle(computer, false);
  if (ball.x < -ball.radius) scorePoint('computer');
  if (ball.x > canvas.width + ball.radius) scorePoint('player');
}

function tryActivateEnemyUltimate(now) {
  if (now < abilities.enemyUltCooldownUntil || now < abilities.enemyUltUntil || ball.vx <= 0 || ball.x < canvas.width * .35) return;
  abilities.enemyUltUntil = now + 15000;
  abilities.enemyUltCooldownUntil = now + 30000;
  ball.color = '#ff9f1c';
  arena.classList.add('orange-domain');
  updateMessage('KAGE · DOMÍNIO LARANJA · 15s');
  setTimeout(() => { if (!game.paused && !game.gameOver) updateMessage(''); }, 900);
}

function updateHealthBar() {
  const health = Math.max(0, game.playerHealth);
  playerHealthValue.textContent = `${health} / 10`;
  playerHealthFill.style.width = `${health * 10}%`;
}

function tryEnemyDash(now, ultActive) {
  const approaching = ball.vx > 0 && ball.x > computer.x - 220;
  const predictedY = predictBallY(Math.max(0, computer.x - ball.x));
  const error = predictedY - (computer.y + computer.height / 2);
  if (ultActive || !approaching || Math.abs(error) < 34 || now < effects.enemyDashCooldownUntil || Math.random() > .68) return;
  effects.enemyDashUntil = now + 520;
  effects.enemyDashCooldownUntil = now + 5000;
  computer.y += Math.sign(error) * Math.min(72, Math.abs(error));
  computer.y = Math.max(0, Math.min(canvas.height - computer.height, computer.y));
  for (let index = 0; index < 8; index += 1) effects.sparks.push({ x:computer.x, y:computer.y + computer.height / 2, vx:-Math.random() * 4, vy:Math.random() * 5 - 2.5, life:1, color:'#ff6ca8' });
}

function autoDodgeComputer() {
  const awayFromPaddle = ball.y < computer.y + computer.height / 2 ? -4 : 4;
  ball.vy += awayFromPaddle;
  ball.vy = Math.max(-12, Math.min(12, ball.vy));
}

function toggleSpeedControl() {
  const now = performance.now();
  if (!game.running || game.paused || game.gameOver || now < abilities.ultSceneUntil || now < abilities.ultUntil || now < abilities.reliefUntil || now < effects.spectralFlashUntil) return;
  if (now < abilities.reliefCooldownUntil) { showReliefCooldown(); return; }
  abilities.reliefUntil = now + 900;
  abilities.reliefCooldownUntil = now + 5000;
  ball.vx *= .5; ball.vy *= .5;
  effects.reliefWaveStart = now;
  updateMessage('ALÍVIO CINÉTICO · EMERGÊNCIA');
  setTimeout(() => { if (!game.paused && !game.gameOver) updateMessage(''); }, 900);
}

function showReliefCooldown() {
  clearInterval(reliefCooldownTimer);
  updateMessage('');
  const updateCooldown = () => {
    const remaining = Math.max(0, abilities.reliefCooldownUntil - performance.now());
    if (remaining === 0) {
      clearInterval(reliefCooldownTimer); reliefCooldownTimer = 0;
      return;
    }
  };
  updateCooldown(); reliefCooldownTimer = setInterval(updateCooldown, 100);
}

function activateUltimate() {
  const now = performance.now();
  if (!game.running || game.paused || game.gameOver || now < abilities.ultUntil || now < abilities.ultSceneUntil || now < abilities.reliefUntil || now < effects.spectralFlashUntil) return;
  abilities.ultSceneUntil = now + 900;
  ultimateScene.hidden = false;
  updateMessage('');
  setTimeout(() => {
    if (!game.running || game.gameOver) return;
    abilities.ultSceneUntil = 0;
    const activationTime = performance.now();
    abilities.ultUntil = activationTime + 700;
    ultimateScene.hidden = true;
    effects.spectralFlashUntil = performance.now() + 700;
    effects.shockwaveStart = performance.now();
    updateMessage('VELOCIDADE CELESTIAL · 3x · CÂMERA LENTA');
    setTimeout(() => { if (!game.paused && !game.gameOver) updateMessage(''); }, 700);
  }, 900);
  effects.shockwaveX = player.x + player.width + 8;
  effects.shockwaveY = ball.y;
}

function scorePoint(winner) {
  if (winner === 'player' && performance.now() < abilities.enemyUltUntil) {
    const now = performance.now();
    effects.enemyBarrierVisibleUntil = now + 1;
    effects.enemyBarrierImpactUntil = now + 220;
    effects.enemyBarrierImpactX = computer.x - ball.radius;
    effects.enemyBarrierImpactY = ball.y;
    ball.x = effects.enemyBarrierImpactX;
    ball.vx = -Math.abs(ball.vx || ball.speed);
    for (let index = 0; index < 10; index += 1) effects.sparks.push({ x:effects.enemyBarrierImpactX, y:effects.enemyBarrierImpactY, vx:-Math.random() * 3 - 1, vy:Math.random() * 5 - 2.5, life:1, color:'#ff9f1c' });
    return;
  }
    if (winner === 'computer' && passives.barrier && performance.now() >= effects.playerBarrierDisabledUntil) {
    const now = performance.now();
      const orangeImpact = ball.color === '#ff9f1c' && now < abilities.enemyUltUntil;
      if (orangeImpact) {
        game.playerHealth = Math.max(0, game.playerHealth - 2);
        if (game.playerHealth === 0) effects.playerBarrierDisabledUntil = now + 10000;
        updateHealthBar(); updateMessage(game.playerHealth === 0 ? 'BARREIRA QUEBRADA · RECARGA 10s' : `IMPACTO NA BARREIRA · HP ${game.playerHealth}`);
        setTimeout(() => { if (!game.paused && !game.gameOver) updateMessage(''); }, 800);
      }
    effects.barrierVisibleUntil = now + 1;
    effects.barrierImpactUntil = now + 220;
    effects.barrierImpactX = player.x + player.width + ball.radius;
    effects.barrierImpactY = ball.y;
      for (let index = 0; index < 10; index += 1) effects.sparks.push({ x:effects.barrierImpactX, y:effects.barrierImpactY, vx:Math.random() * 3 + 1, vy:Math.random() * 5 - 2.5, life:1, color:orangeImpact ? '#ff9f1c' : '#5ee7d0' });
    ball.x = player.x + player.width + ball.radius;
    ball.vx = Math.abs(ball.vx) || ball.speed;
    ball.vy += (Math.random() * 2 - 1);
    return;
  }
  game[winner] += 1; updateScore();
  abilities.ultUntil = 0; abilities.ultSceneUntil = 0; ultimateScene.hidden = true;
  effects.spectralFlashUntil = 0; effects.shockwaveStart = 0; effects.sparks = [];
  game.running = false; resetBall(winner === 'player' ? 1 : -1); updateMessage('PONTO! Prepare-se...');
  respawnTimer = setTimeout(() => { if (!game.gameOver) { game.running = true; updateMessage(''); } }, 1000);
}

function activateSpectral() {
  const now = performance.now();
  if (!game.running || game.paused || game.gameOver || !passives.spectralDeflect || now < effects.spectralCooldownUntil || now < abilities.ultSceneUntil || now < abilities.ultUntil || now < abilities.reliefUntil) return;
  effects.spectralCooldownUntil = now + 900;
  effects.spectralFlashUntil = now + 420;
  effects.shockwaveStart = now;
  effects.shockwaveX = player.x + player.width + 8;
  effects.shockwaveY = ball.y;
  ball.vy += ball.y < canvas.height / 2 ? -3.2 : 3.2;
  ball.vy = Math.max(-7, Math.min(7, ball.vy));
  for (let index = 0; index < 14; index += 1) effects.sparks.push({ x:effects.shockwaveX, y:effects.shockwaveY, vx:Math.random() * 5 + 1, vy:Math.random() * 6 - 3, life:1, color:'#ffffff' });
}

function aimAstralShot(event) {
  const now = performance.now();
  if (!game.running || game.paused || game.gameOver || ball.x >= canvas.width / 2 || now < abilities.aimShotCooldownUntil || now < abilities.ultSceneUntil || now < abilities.ultUntil || now < abilities.reliefUntil || now < effects.spectralFlashUntil) return false;
  if (event) {
    const bounds = canvas.getBoundingClientRect();
    aimTarget.x = ((event.clientX - bounds.left) / bounds.width) * canvas.width;
    aimTarget.y = ((event.clientY - bounds.top) / bounds.height) * canvas.height;
  }
  const angle = Math.atan2(aimTarget.y - ball.y, aimTarget.x - ball.x);
  ball.vx = Math.cos(angle) * 6;
  ball.vy = Math.sin(angle) * 6;
  ball.color = '#b9a7ff';
  abilities.aimShotCooldownUntil = now + 1000;
  updateMessage('VELOCIDADE ASTRAL · DISPARO');
  setTimeout(() => { if (!game.paused && !game.gameOver) updateMessage(''); }, 450);
  for (let index = 0; index < 8; index += 1) effects.sparks.push({ x:ball.x, y:ball.y, vx:Math.cos(angle) * (index + 1), vy:Math.sin(angle) * (index + 1), life:1, color:'#b9a7ff' });
  return true;
}

function drawNet() {
  context.setLineDash([8,16]); context.strokeStyle = '#263048'; context.lineWidth = 2; context.beginPath(); context.moveTo(canvas.width / 2, 0); context.lineTo(canvas.width / 2, canvas.height); context.stroke(); context.setLineDash([]);
}
function drawCharacter(currentPaddle, isPlayer, color, now) {
  const centerX = currentPaddle.x + currentPaddle.width / 2;
  const centerY = currentPaddle.y + currentPaddle.height / 2;
  const direction = isPlayer ? 1 : -1;
  const hitUntil = isPlayer ? effects.playerHitUntil : effects.ninjaSlashUntil;
  const swingProgress = hitUntil ? Math.max(0, Math.min(1, 1 - (hitUntil - now) / 240)) : 0;
  const swing = Math.sin(swingProgress * Math.PI);
  context.save(); context.translate(centerX, centerY); context.scale(direction, 1); context.rotate(swing * .12);
  context.shadowColor = color; context.shadowBlur = 18;
  if (isPlayer) {
    context.fillStyle = '#142d38'; context.fillRect(-10, -23, 20, 46);
    context.fillStyle = color; context.fillRect(-13, -17, 26, 5); context.fillRect(-13, 12, 26, 5);
    context.fillStyle = '#f2f4ff'; context.beginPath(); context.arc(0, -34, 10, 0, Math.PI * 2); context.fill();
    context.fillStyle = color; context.fillRect(5, -36, 13, 4);
    context.strokeStyle = color; context.lineWidth = 4; context.beginPath(); context.moveTo(-7, 23); context.lineTo(-12, 38); context.moveTo(7, 23); context.lineTo(12, 38); context.stroke();
    context.strokeStyle = '#d5fff5'; context.lineWidth = 2; context.beginPath(); context.moveTo(13, -10); context.lineTo(25 + swing * 12, 4 - swing * 22); context.stroke();
  } else {
    context.fillStyle = '#281526'; context.fillRect(-11, -21, 22, 43);
    context.fillStyle = color; context.fillRect(-14, -15, 28, 4); context.fillRect(-14, 11, 28, 4);
    context.fillStyle = '#17101d'; context.beginPath(); context.arc(0, -32, 11, 0, Math.PI * 2); context.fill();
    context.fillStyle = color; context.fillRect(-12, -35, 24, 5);
    context.fillStyle = '#fff0f5'; context.fillRect(3, -33, 3, 2); context.fillRect(9, -33, 3, 2);
    context.strokeStyle = color; context.lineWidth = 4; context.beginPath(); context.moveTo(-7, 21); context.lineTo(-13, 37); context.moveTo(7, 21); context.lineTo(13, 37); context.stroke();
    context.strokeStyle = '#ffd5e5'; context.lineWidth = 2; context.beginPath(); context.moveTo(13, -10); context.lineTo(25 + swing * 12, 4 - swing * 22); context.stroke();
  }
  context.restore(); context.shadowBlur = 0;
}
function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const now = performance.now();
  if (now < abilities.enemyUltUntil) { context.fillStyle = '#ff9f1c12'; context.fillRect(0, 0, canvas.width, canvas.height); }
  drawNet();
  updateCharacterPanels(now);
  drawReliefWave(now);
  drawSpectralEffect(now);
  drawNinjaSlash(now);
  drawEnemyDash(now);
  drawAimGuide(now);
  const ultimateGlow = now < abilities.ultSceneUntil || now < abilities.ultUntil;
  if (now < effects.barrierVisibleUntil) drawBarrier(ultimateGlow);
  if (now < effects.playerBarrierDisabledUntil) drawDisabledBarrier();
  if (now < abilities.enemyUltUntil) drawEnemyBarrier();
  if (now < abilities.enemyUltUntil) drawEnemyBarrier(now);
  drawBarrierImpact(now);
  drawCharacter(player, true, ultimateGlow ? '#ffd166' : '#5ee7d0', now); drawCharacter(computer, false, '#ff6ca8', now);
  drawBallTrail();
  const reliefActive = now < abilities.reliefUntil;
  const ballColor = ultimateGlow ? '#ffd166' : reliefActive ? '#75f58a' : ball.color; context.fillStyle = ballColor; context.shadowColor = ballColor; context.shadowBlur = ultimateGlow ? 35 : 18; context.beginPath(); context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); context.fill(); context.shadowBlur = 0;
  context.fillStyle = '#7d879f'; context.font = '12px Space Mono'; context.fillText('PLAYER', 28, 24); context.fillText('CPU', canvas.width - 53, 24);
}

function updateCharacterPanels(now) {
  if (now < abilities.ultSceneUntil) playerState.textContent = 'CARREGANDO ULT';
  else if (now < abilities.ultUntil) playerState.textContent = 'VELOCIDADE CELESTIAL';
  else if (now < abilities.reliefCooldownUntil) playerState.textContent = `ALÍVIO · RECARGA ${Math.ceil((abilities.reliefCooldownUntil - now) / 1000)}s`;
  else if (ball.x < canvas.width / 2 && now >= abilities.aimShotCooldownUntil) playerState.textContent = 'MIRA ASTRAL DISPONÍVEL';
  else if (ball.x < canvas.width / 2) playerState.textContent = `MIRA ASTRAL · ${Math.ceil((abilities.aimShotCooldownUntil - now) / 1000)}s`;
  else if (now < effects.playerBarrierDisabledUntil) playerState.textContent = `BARREIRA · RECARGA ${Math.ceil((effects.playerBarrierDisabledUntil - now) / 1000)}s`;
  else playerState.textContent = game.running ? `BARREIRA · HP ${game.playerHealth}` : `PRONTO · HP ${game.playerHealth}`;
    cpuState.textContent = game.gameOver ? 'DERROTADO' : now < abilities.enemyUltUntil ? `DOMÍNIO LARANJA · ${Math.ceil((abilities.enemyUltUntil - now) / 1000)}s` : now < effects.enemyDashUntil ? 'DASH SOMBRIO' : game.running ? 'EM GUARDA' : 'AGUARDANDO';
}

function drawReliefWave(now) {
  if (!effects.reliefWaveStart) return;
  const progress = Math.min(1, (now - effects.reliefWaveStart) / 520);
  const maxRadius = Math.hypot(canvas.width, canvas.height);
  const radius = 10 + progress * maxRadius;
  context.fillStyle = `rgba(117,245,138,${(1 - progress) * .08})`;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = `rgba(117,245,138,${1 - progress})`;
  context.lineWidth = 5 - progress * 3;
  context.beginPath(); context.arc(ball.x, ball.y, radius, 0, Math.PI * 2); context.stroke();
  if (progress >= 1) effects.reliefWaveStart = 0;
}

function drawBarrier(ultimateGlow) {
  const height = 58;
  const y = Math.max(10, Math.min(canvas.height - height - 10, ball.y - height / 2));
  const color = ultimateGlow ? '#ffd166' : '#5ee7d0';
  context.fillStyle = `${color}44`; context.shadowColor = color; context.shadowBlur = 18; context.fillRect(9, y, 9, height);
  context.strokeStyle = color; context.lineWidth = 2; context.strokeRect(9, y, 9, height); context.shadowBlur = 0;
}

function drawDisabledBarrier() {
  const light = context.createLinearGradient(0, 0, 28, 0);
  light.addColorStop(0, '#ffffff00'); light.addColorStop(.65, '#ffffffaa'); light.addColorStop(1, '#ffffff00');
  context.save(); context.fillStyle = light; context.shadowColor = '#ffffff'; context.shadowBlur = 24; context.fillRect(0, 0, 28, canvas.height); context.fillStyle = '#ffffff'; context.fillRect(10, 0, 2, canvas.height); context.restore();
}

function drawEnemyBarrier() {
  const height = 58;
  const y = Math.max(10, Math.min(canvas.height - height - 10, ball.y - height / 2));
  context.save(); context.fillStyle = '#ff9f1c44'; context.shadowColor = '#ff9f1c'; context.shadowBlur = 18; context.fillRect(canvas.width - 18, y, 9, height); context.strokeStyle = '#ff9f1c'; context.lineWidth = 2; context.strokeRect(canvas.width - 18, y, 9, height); context.restore();
}

function drawEnemyBarrier(now) {
  const height = 58;
  const y = Math.max(10, Math.min(canvas.height - height - 10, ball.y - height / 2));
  context.save(); context.fillStyle = '#ff9f1c44'; context.shadowColor = '#ff9f1c'; context.shadowBlur = 18; context.fillRect(canvas.width - 18, y, 9, height);
  context.strokeStyle = '#ff9f1c'; context.lineWidth = 2; context.strokeRect(canvas.width - 18, y, 9, height); context.restore();
}

function drawBarrierImpact(now) {
  if (now >= effects.barrierImpactUntil) return;
  const progress = Math.max(0, Math.min(1, 1 - (effects.barrierImpactUntil - now) / 220));
  context.strokeStyle = `rgba(94,231,208,${1 - progress})`;
  context.lineWidth = 3;
  context.beginPath(); context.arc(effects.barrierImpactX, effects.barrierImpactY, 8 + progress * 38, 0, Math.PI * 2); context.stroke();
}

function drawNinjaSlash(now) {
  if (now >= effects.ninjaSlashUntil) return;
  const progress = 1 - (effects.ninjaSlashUntil - now) / 260;
  context.strokeStyle = `rgba(255,108,168,${1 - progress})`;
  context.lineWidth = 5;
  context.beginPath(); context.moveTo(effects.ninjaSlashX - 18, effects.ninjaSlashY + 20 - progress * 12); context.lineTo(effects.ninjaSlashX + 18, effects.ninjaSlashY - 20 + progress * 12); context.stroke();
}

function drawEnemyDash(now) {
  if (now >= effects.enemyDashUntil) return;
  const progress = 1 - (effects.enemyDashUntil - now) / 520;
  context.strokeStyle = `rgba(255,108,168,${.65 - progress * .5})`;
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(computer.x + 14, computer.y + 15); context.lineTo(computer.x + 14, computer.y + computer.height - 15); context.stroke();
}

function drawAimGuide(now) {
  if (!game.running || game.paused || game.gameOver || ball.x >= canvas.width / 2 || now < abilities.ultSceneUntil) return;
  context.save(); context.strokeStyle = '#b9a7ff99'; context.lineWidth = 2; context.setLineDash([6, 8]);
  context.beginPath(); context.moveTo(ball.x, ball.y); context.lineTo(aimTarget.x, aimTarget.y); context.stroke(); context.setLineDash([]);
  context.fillStyle = '#b9a7ff'; context.beginPath(); context.arc(aimTarget.x, aimTarget.y, 5, 0, Math.PI * 2); context.fill(); context.restore();
}

function drawBallTrail() {
  ball.trail.forEach((point, index) => { const alpha = (index + 1) / ball.trail.length * .62; const size = 2 + index / ball.trail.length * 7; context.globalAlpha = alpha; context.fillStyle = point.color; context.shadowColor = point.color; context.shadowBlur = 10; context.beginPath(); context.arc(point.x, point.y, size, 0, Math.PI * 2); context.fill(); });
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

function drawSpectralEffect(now) {
  if (effects.shockwaveStart) {
    const progress = Math.min(1, (now - effects.shockwaveStart) / 420);
    context.strokeStyle = `rgba(255,255,255,${1 - progress})`;
    context.lineWidth = 4;
    context.beginPath(); context.arc(effects.shockwaveX, effects.shockwaveY, 18 + progress * 105, 0, Math.PI * 2); context.stroke();
    if (progress >= 1 && effects.sparks.length === 0) effects.shockwaveStart = 0;
  }
  effects.sparks = effects.sparks.filter(spark => spark.life > 0);
  effects.sparks.forEach(spark => { spark.x += spark.vx; spark.y += spark.vy; spark.vy += .12; spark.life -= .045; context.fillStyle = spark.color || '#ffffff'; context.globalAlpha = spark.life; context.fillRect(spark.x, spark.y, 3, 3); });
  context.globalAlpha = 1;
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
function startGame() {
  if (game.gameOver) return;
  game.running = true; game.paused = false; pauseButton.textContent = 'Pausar'; updateMessage('');
}
function toggleGame() {
  if (game.gameOver) return;
  game.running = !game.running; game.paused = false; pauseButton.textContent = 'Pausar'; updateMessage('');
}
function togglePause() {
  if (!game.running || game.gameOver) return;
  game.paused = !game.paused; pauseButton.textContent = game.paused ? 'Continuar' : 'Pausar'; updateMessage(game.paused ? 'Pausado' : '');
}

document.addEventListener('keydown', event => { const key = event.key.toLowerCase(); game.keys.add(key); if (key === ' ') { event.preventDefault(); game.running ? togglePause() : startGame(); } if (key === 'x') activateUltimate(); if (key === 'c') activateSpectral(); });
document.addEventListener('keyup', event => game.keys.delete(event.key.toLowerCase()));
pauseButton.addEventListener('click', togglePause); restartButton.addEventListener('click', resetGame);
canvas.addEventListener('pointermove', event => { const bounds = canvas.getBoundingClientRect(); aimTarget.x = ((event.clientX - bounds.left) / bounds.width) * canvas.width; aimTarget.y = ((event.clientY - bounds.top) / bounds.height) * canvas.height; player.y = aimTarget.y - player.height / 2; player.y = Math.max(0, Math.min(canvas.height - player.height, player.y)); });
canvas.addEventListener('contextmenu', event => event.preventDefault());
canvas.addEventListener('pointerdown', event => { if (event.button === 2) toggleSpeedControl(); if (event.button === 0 && !game.running && !game.gameOver) startGame(); else if (event.button === 0) aimAstralShot(event); });
resetGame(); loop();
