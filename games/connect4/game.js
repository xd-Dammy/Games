const ROWS = 6, COLS = 7;
const boardEl = document.getElementById('board');
const statusMsg = document.getElementById('statusMsg');
const scoreEls = { 1: document.getElementById('scoreA'), 2: document.getElementById('scoreB'), d: document.getElementById('scoreD') };
const modeBtns = document.querySelectorAll('[data-mode]');

let mode = 'medium';             // '2p' | 'easy' | 'medium' | 'hard'
let board, turn, over, busy;
let scores = { 1: 0, 2: 0, d: 0 };

const newBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));
const dropRow = (b, c) => { for (let r = ROWS - 1; r >= 0; r--) if (b[r][c] === 0) return r; return -1; };
const validCols = b => [3, 2, 4, 1, 5, 0, 6].filter(c => b[0][c] === 0);   // centre-first ordering

function findWin(b) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const p = b[r][c]; if (!p) continue;
    for (const [dr, dc] of dirs) {
      const cells = [[r, c]];
      for (let k = 1; k < 4; k++) {
        const nr = r + dr * k, nc = c + dc * k;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr][nc] !== p) break;
        cells.push([nr, nc]);
      }
      if (cells.length === 4) return { p, cells };
    }
  }
  return null;
}
const full = b => b[0].every(v => v !== 0);

// ---------- AI ----------
function scoreWindow(w, me) {
  const opp = 3 - me;
  const m = w.filter(v => v === me).length, o = w.filter(v => v === opp).length, e = w.filter(v => v === 0).length;
  if (m === 4) return 1000;
  if (m === 3 && e === 1) return 6;
  if (m === 2 && e === 2) return 2;
  if (o === 3 && e === 1) return -8;
  return 0;
}
function evaluate(b, me) {
  let s = 0;
  for (let r = 0; r < ROWS; r++) if (b[r][3] === me) s += 3;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (c + 3 < COLS) s += scoreWindow([b[r][c], b[r][c + 1], b[r][c + 2], b[r][c + 3]], me);
    if (r + 3 < ROWS) s += scoreWindow([b[r][c], b[r + 1][c], b[r + 2][c], b[r + 3][c]], me);
    if (r + 3 < ROWS && c + 3 < COLS) s += scoreWindow([b[r][c], b[r + 1][c + 1], b[r + 2][c + 2], b[r + 3][c + 3]], me);
    if (r + 3 < ROWS && c - 3 >= 0) s += scoreWindow([b[r][c], b[r + 1][c - 1], b[r + 2][c - 2], b[r + 3][c - 3]], me);
  }
  return s;
}
function minimax(b, depth, alpha, beta, maxing, me) {
  const w = findWin(b);
  if (w) return w.p === me ? 100000 + depth : -100000 - depth;
  if (full(b) || depth === 0) return evaluate(b, me);
  const player = maxing ? me : 3 - me;
  let best = maxing ? -Infinity : Infinity;
  for (const c of validCols(b)) {
    const r = dropRow(b, c); b[r][c] = player;
    const v = minimax(b, depth - 1, alpha, beta, !maxing, me);
    b[r][c] = 0;
    if (maxing) { best = Math.max(best, v); alpha = Math.max(alpha, v); }
    else { best = Math.min(best, v); beta = Math.min(beta, v); }
    if (alpha >= beta) break;
  }
  return best;
}
function immediate(b, p) {
  for (const c of validCols(b)) { const r = dropRow(b, c); b[r][c] = p; const w = findWin(b); b[r][c] = 0; if (w) return c; }
  return -1;
}
function cpuMove() {
  const cols = validCols(board);
  if (mode === 'easy') {
    const win = immediate(board, 2); if (win >= 0 && Math.random() < 0.8) return win;
    const block = immediate(board, 1); if (block >= 0 && Math.random() < 0.6) return block;
    return cols[Math.floor(Math.random() * cols.length)];
  }
  const depth = mode === 'medium' ? 3 : 6;
  let bestC = cols[0], bestV = -Infinity;
  for (const c of cols) {
    const r = dropRow(board, c); board[r][c] = 2;
    const v = minimax(board, depth - 1, -Infinity, Infinity, false, 2);
    board[r][c] = 0;
    if (v > bestV) { bestV = v; bestC = c; }
  }
  return bestC;
}

// ---------- UI ----------
function render() {
  boardEl.innerHTML = '';
  for (let c = 0; c < COLS; c++) {
    const col = document.createElement('button'); col.className = 'c4-col'; col.dataset.c = c;
    col.setAttribute('aria-label', 'Column ' + (c + 1));
    for (let r = 0; r < ROWS; r++) {
      const s = document.createElement('div'); s.className = 'c4-slot'; s.dataset.r = r; col.appendChild(s);
    }
    boardEl.appendChild(col);
  }
  syncDisabled();
}
function syncDisabled() {
  [...boardEl.children].forEach((col, c) => { col.disabled = over || busy || board[0][c] !== 0; });
}
function placeDisc(r, c, p) {
  const slot = boardEl.children[c].children[r];
  const d = document.createElement('div'); d.className = 'c4-disc p' + p;
  d.style.setProperty('--from', `${-(r + 1) * 108}%`);
  slot.appendChild(d);
}
function setStatus() {
  if (over) return;
  if (mode === '2p') statusMsg.textContent = turn === 1 ? "Red's turn" : "Yellow's turn";
  else statusMsg.textContent = turn === 1 ? 'Your turn' : 'CPU is thinking…';
}
function updateLabels() {
  document.getElementById('labelA').textContent = mode === '2p' ? 'Red' : 'You';
  document.getElementById('labelB').textContent = mode === '2p' ? 'Yellow' : 'CPU';
}
function updateScores() { scoreEls[1].textContent = scores[1]; scoreEls[2].textContent = scores[2]; scoreEls.d.textContent = scores.d; }

function play(c, p) {
  const r = dropRow(board, c); if (r < 0) return;
  board[r][c] = p; placeDisc(r, c, p);
  const w = findWin(board);
  if (w) {
    over = true; scores[w.p]++; updateScores();
    if (mode !== '2p' && w.p === 1) localStorage.setItem('connect4-wins-' + mode, String(+(localStorage.getItem('connect4-wins-' + mode) || 0) + 1));
    w.cells.forEach(([wr, wc]) => boardEl.children[wc].children[wr].firstChild.classList.add('win'));
    statusMsg.textContent = mode === '2p' ? (w.p === 1 ? 'Red wins! 🎉' : 'Yellow wins! 🎉') : (w.p === 1 ? 'You win! 🎉' : 'CPU wins this one.');
  } else if (full(board)) {
    over = true; scores.d++; updateScores(); statusMsg.textContent = "It's a draw.";
  } else {
    turn = 3 - p; setStatus();
  }
  syncDisabled();
}

function humanClick(c) {
  if (over || busy) return;
  if (mode !== '2p' && turn !== 1) return;
  if (board[0][c] !== 0) return;
  play(c, turn);
  if (!over && mode !== '2p') {
    busy = true; syncDisabled();
    setTimeout(() => { if (!over) play(cpuMove(), 2); busy = false; syncDisabled(); }, 450);
  }
}

function newRound() {
  board = newBoard(); turn = 1; over = false; busy = false;
  render(); setStatus();
}
boardEl.addEventListener('click', e => { const col = e.target.closest('.c4-col'); if (col) humanClick(+col.dataset.c); });
document.getElementById('resetBtn').addEventListener('click', newRound);
modeBtns.forEach(b => b.addEventListener('click', () => {
  mode = b.dataset.mode; modeBtns.forEach(x => x.classList.toggle('active', x === b));
  scores = { 1: 0, 2: 0, d: 0 }; updateScores(); updateLabels(); newRound();
}));
updateLabels(); newRound();
window.__c4 = { get board() { return board; } };
