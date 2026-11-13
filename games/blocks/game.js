const cv = document.getElementById('cv'), g = cv.getContext('2d');
const nx = document.getElementById('next'), ng = nx.getContext('2d');
const scoreVal = document.getElementById('scoreVal'), linesVal = document.getElementById('linesVal');
const levelVal = document.getElementById('levelVal'), bestVal = document.getElementById('bestVal');
const statusMsg = document.getElementById('statusMsg'), startBtn = document.getElementById('startBtn');
const COLS = 10, ROWS = 20, CELL = 20;
const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
};
const COLORS = { I: '#3DDCFF', O: '#FFD23D', T: '#a78bfa', S: '#4ade80', Z: '#FF3D6E', J: '#4f7cff', L: '#ff9f3d' };

let board, cur, nextType, bag = [], score, lines, level, running = false, over = false, dropMs, acc = 0, last = 0;
let best = parseInt(localStorage.getItem('blocks-best') || '0', 10); bestVal.textContent = best;

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
function nextFromBag() {
  if (!bag.length) { bag = Object.keys(SHAPES).sort(() => Math.random() - 0.5); }
  return bag.pop();
}
const rotateCW = m => m[0].map((_, c) => m.map(row => row[c]).reverse());
function collides(m, x, y) {
  for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
    if (!m[r][c]) continue;
    const bx = x + c, by = y + r;
    if (bx < 0 || bx >= COLS || by >= ROWS) return true;
    if (by >= 0 && board[by][bx]) return true;
  }
  return false;
}
function spawn() {
  const type = nextType || nextFromBag(); nextType = nextFromBag();
  const m = SHAPES[type].map(r => [...r]);
  cur = { type, m, x: Math.floor((COLS - m[0].length) / 2), y: type === 'I' ? -1 : 0 };
  drawNext();
  if (collides(cur.m, cur.x, cur.y)) endGame();
}
function start() {
  board = emptyBoard(); score = 0; lines = 0; level = 1; dropMs = 800; acc = 0; over = false; running = true; bag = []; nextType = null;
  scoreVal.textContent = 0; linesVal.textContent = 0; levelVal.textContent = 1;
  statusMsg.textContent = 'Arrow keys / WASD · Space = drop · Up = rotate';
  startBtn.textContent = 'Restart'; startBtn.blur(); spawn();
}
function endGame() {
  running = false; over = true;
  if (score > best) { best = score; localStorage.setItem('blocks-best', String(best)); bestVal.textContent = best; statusMsg.textContent = `Game over — new best: ${score}! 🎉`; }
  else statusMsg.textContent = `Game over — ${score} points`;
  startBtn.textContent = 'Play again';
}
function lock() {
  cur.m.forEach((row, r) => row.forEach((v, c) => { if (v) { const y = cur.y + r; if (y >= 0) board[y][cur.x + c] = cur.type; } }));
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v)) { board.splice(r, 1); board.unshift(Array(COLS).fill(null)); cleared++; r++; }
  }
  if (cleared) {
    score += [0, 100, 300, 500, 800][cleared] * level; lines += cleared;
    level = 1 + Math.floor(lines / 10); dropMs = Math.max(90, 800 - (level - 1) * 70);
    scoreVal.textContent = score; linesVal.textContent = lines; levelVal.textContent = level;
  }
  spawn();
}
function move(dx) { if (!running) return; if (!collides(cur.m, cur.x + dx, cur.y)) { cur.x += dx; draw(); } }
function softDrop() {
  if (!running) return;
  if (!collides(cur.m, cur.x, cur.y + 1)) { cur.y++; score++; scoreVal.textContent = score; acc = 0; } else { lock(); acc = 0; }
  draw();
}
function hardDrop() {
  if (!running) return;
  let n = 0; while (!collides(cur.m, cur.x, cur.y + 1)) { cur.y++; n++; }
  score += n * 2; scoreVal.textContent = score; lock(); acc = 0; draw();
}
function rotate() {
  if (!running || cur.type === 'O') return;
  const m = rotateCW(cur.m);
  for (const k of [0, -1, 1, -2, 2]) if (!collides(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; draw(); return; }
}

function cell(ctx, x, y, color, size = CELL, alpha = 1) {
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x * size + 1, y * size + 1, size - 2, 3); ctx.globalAlpha = 1;
}
function draw() {
  g.fillStyle = '#070A10'; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 1;
  for (let x = 1; x < COLS; x++) { g.beginPath(); g.moveTo(x * CELL, 0); g.lineTo(x * CELL, ROWS * CELL); g.stroke(); }
  for (let y = 1; y < ROWS; y++) { g.beginPath(); g.moveTo(0, y * CELL); g.lineTo(COLS * CELL, y * CELL); g.stroke(); }
  if (!board) return;
  board.forEach((row, y) => row.forEach((t, x) => { if (t) cell(g, x, y, COLORS[t]); }));
  if (cur && running) {
    let gy = cur.y; while (!collides(cur.m, cur.x, gy + 1)) gy++;
    cur.m.forEach((row, r) => row.forEach((v, c) => { if (v) { cell(g, cur.x + c, gy + r, COLORS[cur.type], CELL, 0.2); } }));
    cur.m.forEach((row, r) => row.forEach((v, c) => { if (v && cur.y + r >= 0) cell(g, cur.x + c, cur.y + r, COLORS[cur.type]); }));
  }
  if (over) { g.fillStyle = 'rgba(7,10,16,.7)'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#F5F5F0'; g.font = '30px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center'; g.fillText('GAME OVER', cv.width / 2, cv.height / 2); }
}
function drawNext() {
  ng.fillStyle = '#070A10'; ng.fillRect(0, 0, 80, 80);
  if (!nextType) return;
  const m = SHAPES[nextType], s = 16, ox = (80 - m[0].length * s) / 2, oy = (80 - m.length * s) / 2;
  m.forEach((row, r) => row.forEach((v, c) => { if (v) { ng.fillStyle = COLORS[nextType]; ng.fillRect(ox + c * s + 1, oy + r * s + 1, s - 2, s - 2); } }));
}
function loop(t) {
  const dt = Math.min(100, t - last || 0); last = t;
  if (running) { acc += dt; if (acc >= dropMs) { acc = 0; if (!collides(cur.m, cur.x, cur.y + 1)) cur.y++; else lock(); draw(); } }
  requestAnimationFrame(loop);
}

// ---- input ----
document.addEventListener('keydown', e => {
  const k = e.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(k)) e.preventDefault();
  if (k === 'ArrowLeft' || k === 'KeyA') move(-1);
  else if (k === 'ArrowRight' || k === 'KeyD') move(1);
  else if (k === 'ArrowDown' || k === 'KeyS') softDrop();
  else if (k === 'ArrowUp' || k === 'KeyW') rotate();
  else if (k === 'Space') hardDrop();
});
const ACTIONS = { left: () => move(-1), right: () => move(1), down: softDrop, rotate, drop: hardDrop };
let repeat = null;
document.getElementById('pad').addEventListener('pointerdown', e => {
  const b = e.target.closest('button'); if (!b) return; e.preventDefault();
  const fn = ACTIONS[b.dataset.act]; fn();
  if (['left', 'right', 'down'].includes(b.dataset.act)) { clearInterval(repeat); repeat = setTimeout(() => { repeat = setInterval(fn, 90); }, 220); }
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => document.getElementById('pad').addEventListener(ev, () => { clearTimeout(repeat); clearInterval(repeat); }));
// swipe / tap on the board: tap = rotate, swipe sideways = move, swipe down = drop
let sx = 0, sy = 0, st = 0;
cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; st = Date.now(); });
cv.addEventListener('pointerup', e => {
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.abs(dx) < 12 && Math.abs(dy) < 12) rotate();
  else if (Math.abs(dx) > Math.abs(dy)) { const n = Math.min(4, Math.max(1, Math.round(Math.abs(dx) / 30))); for (let i = 0; i < n; i++) move(dx > 0 ? 1 : -1); }
  else if (dy > 40) hardDrop();
});
startBtn.addEventListener('click', start);
draw(); drawNext(); requestAnimationFrame(loop);
