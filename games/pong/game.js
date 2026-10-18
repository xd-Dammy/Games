const cv = document.getElementById('cv'), g = cv.getContext('2d');
const youVal = document.getElementById('youVal'), cpuVal = document.getElementById('cpuVal'), recVal = document.getElementById('recVal'), statusMsg = document.getElementById('statusMsg');
const lvlBtns = document.querySelectorAll('[data-lvl]');
const W = cv.width, H = cv.height, PW = 62, PH = 8, MARGIN = 22, BR = 6, WIN = 7;
const LEVELS = { easy: { speed: 120, err: 34, react: 0.55 }, medium: { speed: 200, err: 14, react: 0.8 }, hard: { speed: 300, err: 3, react: 1 } };

let lvl = 'medium', px = W / 2, cx = W / 2, bx, by, vx, vy, speed, state = 'ready', you = 0, cpu = 0, serveDir = 1, last = 0, aim = 0;
let rec = JSON.parse(localStorage.getItem('pong-record') || '{"w":0,"l":0}');
const showRec = () => { recVal.textContent = `${rec.w}-${rec.l}`; }; showRec();

function placeBall() { bx = W / 2; by = H / 2; vx = vy = 0; speed = 230; state = 'ready'; aim = 0; }
function serve() {
  if (state === 'over') { you = cpu = 0; youVal.textContent = cpuVal.textContent = 0; placeBall(); statusMsg.textContent = 'Tap to serve'; return; }
  if (state !== 'ready') return;
  const a = (Math.random() * 50 - 25) * Math.PI / 180;
  vx = Math.sin(a) * speed; vy = Math.cos(a) * speed * serveDir; state = 'playing'; statusMsg.textContent = '';
}
function point(who) {
  if (who === 'you') { you++; youVal.textContent = you; serveDir = -1; } else { cpu++; cpuVal.textContent = cpu; serveDir = 1; }
  if (you >= WIN || cpu >= WIN) {
    state = 'over';
    if (you >= WIN) { rec.w++; statusMsg.textContent = 'You win the match! 🎉 Tap to play again'; } else { rec.l++; statusMsg.textContent = 'CPU wins the match. Tap to rematch'; }
    localStorage.setItem('pong-record', JSON.stringify(rec)); showRec(); return;
  }
  placeBall(); statusMsg.textContent = who === 'you' ? 'Point! Tap to serve' : 'CPU scores. Tap to serve';
}
function bounce(py, dir) {                       // dir = +1 moving down toward player paddle
  const paddleX = dir > 0 ? px : cx, hit = (bx - paddleX) / (PW / 2), ang = Math.max(-1, Math.min(1, hit)) * 58 * Math.PI / 180;
  speed = Math.min(520, speed * 1.05);
  vx = Math.sin(ang) * speed; vy = -dir * Math.cos(ang) * speed; by = py;
}
function update(dt) {
  const L = LEVELS[lvl];
  if (state === 'playing') {
    bx += vx * dt; by += vy * dt;
    if (bx < BR) { bx = BR; vx = Math.abs(vx); } if (bx > W - BR) { bx = W - BR; vx = -Math.abs(vx); }
    const yP = H - MARGIN - PH;                         // top edge of player paddle
    if (vy > 0 && by + BR >= yP && by + BR <= yP + PH + 8 && Math.abs(bx - px) <= PW / 2 + BR) bounce(yP - BR, 1);
    const yC = MARGIN + PH;                             // bottom edge of cpu paddle
    if (vy < 0 && by - BR <= yC && by - BR >= yC - PH - 8 && Math.abs(bx - cx) <= PW / 2 + BR) bounce(yC + BR, -1);
    if (by > H + 10) point('cpu'); else if (by < -10) point('you');
  }
  // CPU: follow the ball when it is coming at it, drift to the middle otherwise
  let target = W / 2;
  if (state === 'playing' && vy < 0) { if (!aim) aim = (Math.random() * 2 - 1) * L.err; target = bx + aim; }
  if (vy > 0) aim = 0;
  const maxMove = L.speed * dt * (state === 'playing' && vy < 0 ? 1 : 0.5), d = target - cx;
  cx += Math.max(-maxMove, Math.min(maxMove, d)); cx = Math.max(PW / 2, Math.min(W - PW / 2, cx));
}
function draw() {
  g.fillStyle = '#070A10'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#232838'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#FFD23D'; g.beginPath(); g.roundRect(cx - PW / 2, MARGIN, PW, PH, 4); g.fill();
  g.fillStyle = '#FF3D6E'; g.beginPath(); g.roundRect(px - PW / 2, H - MARGIN - PH, PW, PH, 4); g.fill();
  g.fillStyle = '#F5F5F0'; g.beginPath(); g.arc(bx, by, BR, 0, 7); g.fill();
}
function loop(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; update(dt); draw(); requestAnimationFrame(loop); }
function setPaddle(e) { const r = cv.getBoundingClientRect(); px = Math.max(PW / 2, Math.min(W - PW / 2, (e.clientX - r.left) * (W / r.width))); }
cv.addEventListener('pointermove', e => { e.preventDefault(); setPaddle(e); });
cv.addEventListener('pointerdown', e => { e.preventDefault(); setPaddle(e); serve(); });
const keys = { l: 0, r: 0 };
document.addEventListener('keydown', e => { if (e.code === 'ArrowLeft') keys.l = 1; if (e.code === 'ArrowRight') keys.r = 1; if (e.code === 'Space') { e.preventDefault(); serve(); } });
document.addEventListener('keyup', e => { if (e.code === 'ArrowLeft') keys.l = 0; if (e.code === 'ArrowRight') keys.r = 0; });
setInterval(() => { if (keys.l || keys.r) px = Math.max(PW / 2, Math.min(W - PW / 2, px + (keys.r - keys.l) * 7)); }, 16);
lvlBtns.forEach(b => b.addEventListener('click', () => { lvl = b.dataset.lvl; lvlBtns.forEach(x => x.classList.toggle('active', x === b)); you = cpu = 0; youVal.textContent = cpuVal.textContent = 0; placeBall(); statusMsg.textContent = 'First to 7 wins. Drag to move, tap to serve.'; }));
placeBall(); requestAnimationFrame(loop);
