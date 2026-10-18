const DIFFS = {
  easy:   { rows: 8,  cols: 8,  mines: 10 },
  medium: { rows: 10, cols: 10, mines: 18 },
  hard:   { rows: 12, cols: 12, mines: 30 },
};
const boardEl = document.getElementById('board');
const minesVal = document.getElementById('minesVal');
const timeVal = document.getElementById('timeVal');
const bestVal = document.getElementById('bestVal');
const statusMsg = document.getElementById('statusMsg');
const digBtn = document.getElementById('digBtn');
const flagBtn = document.getElementById('flagBtn');
const diffBtns = document.querySelectorAll('[data-diff]');

let diff = 'easy', R, C, M;
let grid = [];          // {mine, open, flag, n}
let started = false, over = false, flagMode = false;
let timer = null, seconds = 0, opened = 0, flags = 0;

const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const idx = (r, c) => r * C + c;
function neighbors(r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < R && nc >= 0 && nc < C) out.push([nr, nc]);
  }
  return out;
}
const bestKey = () => `minesweeper-best-${diff}`;
function loadBest() {
  const b = localStorage.getItem(bestKey());
  bestVal.textContent = b ? fmt(parseInt(b, 10)) : '—';
}
function stopTimer() { clearInterval(timer); timer = null; }
function startTimer() {
  stopTimer(); seconds = 0; timeVal.textContent = fmt(0);
  timer = setInterval(() => { seconds++; timeVal.textContent = fmt(seconds); }, 1000);
}

function newGame() {
  stopTimer();
  ({ rows: R, cols: C, mines: M } = DIFFS[diff]);
  grid = Array.from({ length: R * C }, () => ({ mine: false, open: false, flag: false, n: 0 }));
  started = false; over = false; opened = 0; flags = 0; seconds = 0;
  minesVal.textContent = M; timeVal.textContent = fmt(0);
  statusMsg.textContent = 'Tap to dig. Long-press or use Flag to mark mines.';
  loadBest(); render();
}

function placeMines(safeR, safeC) {
  const banned = new Set([idx(safeR, safeC), ...neighbors(safeR, safeC).map(([r, c]) => idx(r, c))]);
  const pool = [];
  for (let i = 0; i < R * C; i++) if (!banned.has(i)) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  pool.slice(0, M).forEach(i => { grid[i].mine = true; });
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    grid[idx(r, c)].n = neighbors(r, c).filter(([a, b]) => grid[idx(a, b)].mine).length;
  }
}

function render() {
  boardEl.style.gridTemplateColumns = `repeat(${C}, 1fr)`;
  boardEl.innerHTML = '';
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const b = document.createElement('button');
    b.className = 'ms-cell'; b.dataset.r = r; b.dataset.c = c;
    b.setAttribute('role', 'gridcell');
    boardEl.appendChild(b);
    paint(r, c);
  }
}
function paint(r, c, reveal) {
  const cell = grid[idx(r, c)];
  const el = boardEl.children[idx(r, c)];
  el.className = 'ms-cell'; el.textContent = '';
  if (cell.open) {
    el.classList.add('open');
    if (cell.mine) { el.textContent = '💣'; el.classList.add('boom'); }
    else if (cell.n) { el.textContent = cell.n; el.classList.add('n' + cell.n); }
  } else if (cell.flag) {
    el.textContent = '🚩'; el.classList.add('flag');
    if (reveal && !cell.mine) el.classList.add('wrong');
  } else if (reveal && cell.mine) {
    el.textContent = '💣'; el.classList.add('mine');
  }
}

function openCell(r, c) {
  const stack = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop();
    const cell = grid[idx(cr, cc)];
    if (cell.open || cell.flag) continue;
    cell.open = true; opened++; paint(cr, cc);
    if (cell.n === 0 && !cell.mine) neighbors(cr, cc).forEach(p => stack.push(p));
  }
}

function lose(r, c) {
  over = true; stopTimer();
  grid[idx(r, c)].open = true;
  for (let i = 0; i < grid.length; i++) {
    const rr = Math.floor(i / C), cc = i % C;
    paint(rr, cc, true);
  }
  boardEl.children[idx(r, c)].className = 'ms-cell open boom';
  boardEl.children[idx(r, c)].textContent = '💥';
  statusMsg.textContent = 'Boom! You hit a mine. Try again?';
}
function win() {
  over = true; stopTimer();
  grid.forEach((cell, i) => { if (cell.mine && !cell.flag) { cell.flag = true; paint(Math.floor(i / C), i % C); } });
  minesVal.textContent = 0;
  const best = parseInt(localStorage.getItem(bestKey()) || '0', 10);
  if (!best || seconds < best) {
    localStorage.setItem(bestKey(), String(seconds)); loadBest();
    statusMsg.textContent = `New best! Cleared in ${fmt(seconds)} 🎉`;
  } else statusMsg.textContent = `Cleared in ${fmt(seconds)} 🎉`;
}

function toggleFlag(r, c) {
  const cell = grid[idx(r, c)];
  if (cell.open || over) return;
  cell.flag = !cell.flag; flags += cell.flag ? 1 : -1;
  minesVal.textContent = M - flags; paint(r, c);
}

function dig(r, c) {
  if (over) return;
  const cell = grid[idx(r, c)];
  if (cell.flag) return;
  if (!started) { started = true; placeMines(r, c); startTimer(); }
  if (cell.open) { chord(r, c); return; }
  if (cell.mine) { lose(r, c); return; }
  openCell(r, c);
  if (opened === R * C - M) win();
}
// tapping a number whose flags match opens the rest of its neighbours
function chord(r, c) {
  const cell = grid[idx(r, c)];
  if (!cell.n) return;
  const nb = neighbors(r, c);
  if (nb.filter(([a, b]) => grid[idx(a, b)].flag).length !== cell.n) return;
  for (const [a, b] of nb) {
    const t = grid[idx(a, b)];
    if (t.flag || t.open) continue;
    if (t.mine) { lose(a, b); return; }
    openCell(a, b);
  }
  if (opened === R * C - M) win();
}

// --- input: tap, long-press, right-click ---
let pressTimer = null, longFired = false;
boardEl.addEventListener('pointerdown', e => {
  const t = e.target.closest('.ms-cell'); if (!t) return;
  longFired = false;
  pressTimer = setTimeout(() => {
    longFired = true;
    toggleFlag(+t.dataset.r, +t.dataset.c);
    if (navigator.vibrate) navigator.vibrate(20);
  }, 380);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
  boardEl.addEventListener(ev, () => clearTimeout(pressTimer)));
boardEl.addEventListener('click', e => {
  const t = e.target.closest('.ms-cell'); if (!t) return;
  if (longFired) { longFired = false; return; }
  const r = +t.dataset.r, c = +t.dataset.c;
  if (flagMode) toggleFlag(r, c); else dig(r, c);
});
boardEl.addEventListener('contextmenu', e => {
  e.preventDefault();
  const t = e.target.closest('.ms-cell'); if (t) toggleFlag(+t.dataset.r, +t.dataset.c);
});

function setMode(flag) {
  flagMode = flag;
  digBtn.classList.toggle('active', !flag);
  flagBtn.classList.toggle('active', flag);
}
digBtn.addEventListener('click', () => setMode(false));
flagBtn.addEventListener('click', () => setMode(true));
document.getElementById('resetBtn').addEventListener('click', newGame);
diffBtns.forEach(b => b.addEventListener('click', () => {
  diff = b.dataset.diff;
  diffBtns.forEach(x => x.classList.toggle('active', x === b));
  newGame();
}));
newGame();
