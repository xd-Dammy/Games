const cv = document.getElementById('cv'), g = cv.getContext('2d');
const scoreVal = document.getElementById('scoreVal'), livesVal = document.getElementById('livesVal');
const levelVal = document.getElementById('levelVal'), bestVal = document.getElementById('bestVal'), statusMsg = document.getElementById('statusMsg');
const W = cv.width, H = cv.height;
const PH = 10, PY = H - 30, BALL_R = 6, COLS = 8, BRICK_H = 14, PAD = 4, TOP = 50, SIDE = 16;
const BW = (W - SIDE * 2 - (COLS - 1) * PAD) / COLS;
const ROW_COLORS = ['#FF3D6E', '#ff7a3d', '#FFD23D', '#4ade80', '#3DDCFF', '#a78bfa', '#f472b6', '#8A8F9C'];

let px, pw, bx, by, bvx, bvy, bricks, score, lives, level, state, last = 0;   // state: ready | playing | over
let keys = { l: false, r: false };
let best = parseInt(localStorage.getItem('breakout-best') || '0', 10); bestVal.textContent = best;

function buildBricks() {
  bricks = [];
  const rows = Math.min(8, 4 + level);
  for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++)
    bricks.push({ x: SIDE + c * (BW + PAD), y: TOP + r * (BRICK_H + PAD), r, alive: true });
}
function resetBall() {
  bx = px; by = PY - BALL_R - 1; bvx = 0; bvy = 0; state = 'ready';
  statusMsg.textContent = 'Drag to move the paddle. Tap to launch.';
}
function newGame() {
  score = 0; lives = 3; level = 1; pw = 64; px = W / 2;
  scoreVal.textContent = 0; livesVal.textContent = 3; levelVal.textContent = 1;
  buildBricks(); resetBall();
}
function launch() {
  if (state === 'over') { newGame(); return; }
  if (state !== 'ready') return;
  const speed = 250 + level * 25, ang = (-60 - Math.random() * 60) * Math.PI / 180;
  bvx = Math.cos(ang) * speed; bvy = Math.sin(ang) * speed; state = 'playing'; statusMsg.textContent = '';
}
function finish() {
  state = 'over';
  if (score > best) { best = score; localStorage.setItem('breakout-best', String(best)); bestVal.textContent = best; statusMsg.textContent = `New best: ${score}! Tap to retry`; }
  else statusMsg.textContent = `Game over — ${score} points. Tap to retry`;
}

function update(dt) {
  const move = ((keys.r ? 1 : 0) - (keys.l ? 1 : 0)) * 340 * dt;
  if (move) px = Math.max(pw / 2, Math.min(W - pw / 2, px + move));
  if (state === 'ready') { bx = px; by = PY - BALL_R - 1; return; }
  if (state !== 'playing') return;
  // sub-step so fast balls don't tunnel through bricks
  const steps = Math.ceil(Math.hypot(bvx, bvy) * dt / 4);
  for (let s = 0; s < steps; s++) {
    bx += bvx * dt / steps; by += bvy * dt / steps;
    if (bx < BALL_R) { bx = BALL_R; bvx = Math.abs(bvx); }
    if (bx > W - BALL_R) { bx = W - BALL_R; bvx = -Math.abs(bvx); }
    if (by < BALL_R) { by = BALL_R; bvy = Math.abs(bvy); }
    if (bvy > 0 && by + BALL_R >= PY && by + BALL_R <= PY + PH + 6 && bx > px - pw / 2 - 3 && bx < px + pw / 2 + 3) {
      const hit = (bx - px) / (pw / 2), sp = Math.min(520, Math.hypot(bvx, bvy) * 1.015), ang = hit * 65 * Math.PI / 180;
      bvx = Math.sin(ang) * sp; bvy = -Math.cos(ang) * sp; by = PY - BALL_R;
    }
    for (const b of bricks) {
      if (!b.alive) continue;
      if (bx + BALL_R > b.x && bx - BALL_R < b.x + BW && by + BALL_R > b.y && by - BALL_R < b.y + BRICK_H) {
        b.alive = false; score += 10 * (8 - Math.min(7, b.r)); scoreVal.textContent = score;
        const ox = Math.min(bx + BALL_R - b.x, b.x + BW - (bx - BALL_R)), oy = Math.min(by + BALL_R - b.y, b.y + BRICK_H - (by - BALL_R));
        if (ox < oy) bvx = -bvx; else bvy = -bvy;
        break;
      }
    }
    if (by - BALL_R > H) {
      lives--; livesVal.textContent = lives;
      if (lives <= 0) finish(); else resetBall();
      return;
    }
  }
  if (bricks.every(b => !b.alive)) {
    level++; levelVal.textContent = level; pw = Math.max(44, pw - 3);
    buildBricks(); resetBall(); statusMsg.textContent = `Level ${level}! Tap to launch.`;
  }
}

function draw() {
  g.fillStyle = '#070A10'; g.fillRect(0, 0, W, H);
  bricks.forEach(b => { if (!b.alive) return; g.fillStyle = ROW_COLORS[b.r % 8]; g.beginPath(); g.roundRect(b.x, b.y, BW, BRICK_H, 3); g.fill(); });
  g.fillStyle = '#F5F5F0'; g.beginPath(); g.roundRect(px - pw / 2, PY, pw, PH, 5); g.fill();
  g.fillStyle = '#3DDCFF'; g.beginPath(); g.arc(bx, by, BALL_R, 0, 7); g.fill();
  if (state === 'over') { g.fillStyle = '#F5F5F0'; g.font = '34px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center'; g.fillText('GAME OVER', W / 2, H / 2 + 30); }
}
function loop(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; update(dt); draw(); requestAnimationFrame(loop); }

function setPaddle(e) {
  const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) * (W / r.width);
  px = Math.max(pw / 2, Math.min(W - pw / 2, x));
}
cv.addEventListener('pointermove', e => { e.preventDefault(); setPaddle(e); });
cv.addEventListener('pointerdown', e => { e.preventDefault(); setPaddle(e); launch(); });
document.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.l = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.r = true;
  if (e.code === 'Space') { e.preventDefault(); launch(); }
});
document.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.l = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.r = false;
});
newGame(); requestAnimationFrame(loop);
