const cv = document.getElementById('cv'), g = cv.getContext('2d');
const scoreVal = document.getElementById('scoreVal'), bestVal = document.getElementById('bestVal'), statusMsg = document.getElementById('statusMsg');
const W = cv.width, H = cv.height, GROUND = H - 40;
const GRAV = 1500, FLAP = -430, SPEED = 135, GAP = 135, PIPE_W = 52, SPACING = 175, BX = 90, BR = 12;

let state = 'ready';        // ready | playing | dead
let by, vy, pipes, score, dist, last = 0, groundX = 0, tilt = 0;
let best = parseInt(localStorage.getItem('flap-best') || '0', 10);
bestVal.textContent = best;

function reset() {
  by = H / 2 - 20; vy = 0; pipes = []; score = 0; dist = 0; tilt = 0;
  scoreVal.textContent = 0; state = 'ready';
  statusMsg.textContent = 'Tap, click or press Space to flap';
}
function addPipe(x) {
  const top = 60 + Math.random() * (GROUND - GAP - 120);
  pipes.push({ x, top, passed: false });
}
function flap() {
  if (state === 'dead') { if (performance.now() - deadAt > 450) reset(); return; }
  if (state === 'ready') { state = 'playing'; statusMsg.textContent = 'Go!'; addPipe(W + 40); }
  vy = FLAP;
}
let deadAt = 0;
function die() {
  state = 'dead'; deadAt = performance.now();
  if (score > best) { best = score; localStorage.setItem('flap-best', String(best)); bestVal.textContent = best; statusMsg.textContent = `New best: ${score}! Tap to retry`; }
  else statusMsg.textContent = `Score ${score}. Tap to retry`;
}

function update(dt) {
  groundX = (groundX - SPEED * dt) % 24;
  if (state === 'ready') { by = H / 2 - 20 + Math.sin(performance.now() / 250) * 6; return; }
  if (state === 'dead') { if (by < GROUND - BR) { vy += GRAV * dt; by = Math.min(GROUND - BR, by + vy * dt); } return; }
  vy += GRAV * dt; by += vy * dt; tilt = Math.max(-0.5, Math.min(1.2, vy / 500));
  dist += SPEED * dt;
  pipes.forEach(p => { p.x -= SPEED * dt; });
  const lastP = pipes[pipes.length - 1];
  if (!lastP || lastP.x < W - SPACING) addPipe(W + 20);
  pipes = pipes.filter(p => p.x > -PIPE_W - 10);
  for (const p of pipes) {
    if (!p.passed && p.x + PIPE_W < BX - BR) { p.passed = true; score++; scoreVal.textContent = score; }
    const inX = BX + BR > p.x && BX - BR < p.x + PIPE_W;
    if (inX && (by - BR < p.top || by + BR > p.top + GAP)) { die(); return; }
  }
  if (by + BR >= GROUND) { by = GROUND - BR; die(); return; }
  if (by - BR < 0) { by = BR; vy = 0; }
}

function draw() {
  g.clearRect(0, 0, W, H);
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0B0E14'); sky.addColorStop(1, '#16203a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.5)';
  for (let i = 0; i < 18; i++) g.fillRect((i * 67) % W, (i * 41) % 260, 2, 2);
  pipes.forEach(p => {
    g.fillStyle = '#1f9d55';
    g.fillRect(p.x, 0, PIPE_W, p.top); g.fillRect(p.x, p.top + GAP, PIPE_W, GROUND - p.top - GAP);
    g.fillStyle = '#34d27b';
    g.fillRect(p.x - 3, p.top - 16, PIPE_W + 6, 16); g.fillRect(p.x - 3, p.top + GAP, PIPE_W + 6, 16);
  });
  g.fillStyle = '#12161F'; g.fillRect(0, GROUND, W, H - GROUND);
  g.fillStyle = '#232838';
  for (let x = groundX; x < W; x += 24) g.fillRect(x, GROUND, 12, 6);
  g.save(); g.translate(BX, by); g.rotate(tilt);
  g.fillStyle = '#FFD23D'; g.beginPath(); g.arc(0, 0, BR, 0, 7); g.fill();
  g.fillStyle = '#FF3D6E'; g.beginPath(); g.moveTo(BR - 2, -2); g.lineTo(BR + 8, 2); g.lineTo(BR - 2, 6); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(4, -4, 4, 0, 7); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.arc(5, -4, 2, 0, 7); g.fill();
  g.restore();
  g.fillStyle = '#F5F5F0'; g.font = '40px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center';
  if (state !== 'ready') g.fillText(score, W / 2, 60);
  if (state === 'ready') { g.font = '22px "Bebas Neue", Impact, sans-serif'; g.fillText('TAP TO FLAP', W / 2, 120); }
  if (state === 'dead') { g.font = '34px "Bebas Neue", Impact, sans-serif'; g.fillText('GAME OVER', W / 2, H / 2 - 40); }
}
function loop(t) {
  const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t;
  update(dt); draw(); requestAnimationFrame(loop);
}
cv.addEventListener('pointerdown', e => { e.preventDefault(); flap(); });
document.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); } });
reset(); requestAnimationFrame(loop);
