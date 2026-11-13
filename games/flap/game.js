const cv = document.getElementById('cv'), g = cv.getContext('2d');
const scoreVal = document.getElementById('scoreVal'), bestVal = document.getElementById('bestVal'), statusMsg = document.getElementById('statusMsg');
const W = 320, H = 440, GROUND = H - 40;
const GRAV = 1500, FLAP = -430, SPEED = 135, GAP = 135, PIPE_W = 52, SPACING = 175, BX = 90, BR = 12;

// ---- sharp canvas: draw at the real on-screen resolution ----
function sizeCanvas() {
  const scale = Math.max(1, (cv.clientWidth || W) / W) * Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(W * scale); cv.height = Math.round(H * scale);
  g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
}
sizeCanvas();
if (window.ResizeObserver) new ResizeObserver(sizeCanvas).observe(cv); else window.addEventListener('resize', sizeCanvas);

let state = 'ready';        // ready | playing | dead
let by, vy, pipes, score, dist, last = null, groundX = 0, tilt = 0;
let pBy = 0, pTilt = 0, pGround = 0, acc = 0;   // previous-step values, used to draw smoothly between physics steps
const STEP = 1 / 120;
let best = parseInt(localStorage.getItem('flap-best') || '0', 10);
bestVal.textContent = best;

function reset() {
  by = H / 2 - 20; vy = 0; pipes = []; score = 0; dist = 0; tilt = 0; pBy = by; pTilt = 0; pGround = groundX;
  scoreVal.textContent = 0; state = 'ready';
  statusMsg.textContent = 'Tap, click or press Space to flap';
}
function addPipe(x) {
  const top = 60 + Math.random() * (GROUND - GAP - 120);
  pipes.push({ x, px: x, top, passed: false });
}
function flap() {
  if (state === 'dead') { if (performance.now() - deadAt > 450) reset(); return; }
  if (state === 'ready') { state = 'playing'; statusMsg.textContent = 'Go!'; addPipe(W + 40); }
  vy = FLAP;
}
let deadAt = 0, bob = 0;
function die() {
  state = 'dead'; deadAt = performance.now();
  if (score > best) { best = score; localStorage.setItem('flap-best', String(best)); bestVal.textContent = best; statusMsg.textContent = `New best: ${score}! Tap to retry`; }
  else statusMsg.textContent = `Score ${score}. Tap to retry`;
}

function update(dt) {
  pBy = by; pTilt = tilt; pGround = groundX; pipes.forEach(p => { p.px = p.x; });
  groundX = (groundX - SPEED * dt) % 24;
  if (state === 'ready') { bob += dt; by = H / 2 - 20 + Math.sin(bob * 4) * 6; return; }
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

function draw(a) {
  const dBy = pBy + (by - pBy) * a, dTilt = pTilt + (tilt - pTilt) * a;
  let dGround = pGround + (groundX - pGround) * a; if (groundX > pGround) dGround = groundX;   // groundX wraps every 24px
  g.clearRect(0, 0, W, H);
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0B0E14'); sky.addColorStop(1, '#16203a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.5)';
  for (let i = 0; i < 18; i++) g.fillRect((i * 67) % W, (i * 41) % 260, 2, 2);
  pipes.forEach(p => {
    g.fillStyle = '#1f9d55';
    const x = p.px + (p.x - p.px) * a;
    g.fillRect(x, 0, PIPE_W, p.top); g.fillRect(x, p.top + GAP, PIPE_W, GROUND - p.top - GAP);
    g.fillStyle = '#34d27b';
    g.fillRect(x - 3, p.top - 16, PIPE_W + 6, 16); g.fillRect(x - 3, p.top + GAP, PIPE_W + 6, 16);
  });
  g.fillStyle = '#12161F'; g.fillRect(0, GROUND, W, H - GROUND);
  g.fillStyle = '#232838';
  for (let x = dGround; x < W; x += 24) g.fillRect(x, GROUND, 12, 6);
  g.save(); g.translate(BX, dBy); g.rotate(dTilt);
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
  // fixed physics step + interpolated drawing = the same smooth motion on 60 Hz, 90 Hz and 120 Hz screens
  if (last === null || t - last > 250) last = t;          // first frame, or coming back from pause / another tab
  acc += Math.min(0.1, (t - last) / 1000); last = t;
  while (acc >= STEP) { update(STEP); acc -= STEP; }
  draw(acc / STEP);
  requestAnimationFrame(loop);
}
cv.addEventListener('pointerdown', e => { e.preventDefault(); flap(); });
document.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); } });
reset(); requestAnimationFrame(loop);
