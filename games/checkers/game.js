// Pieces: {c:'r'|'b', k:bool}. Red starts at the bottom and moves up (row -1). Black moves down.
const boardEl = document.getElementById('board'), statusMsg = document.getElementById('statusMsg');
const modeBtns = document.querySelectorAll('[data-mode]');
let mode = 'medium', board, turn, selected = null, pathSoFar = [], candidates = [], over = false, busy = false, lastMove = null, quiet = 0;
let scores = { r: 0, b: 0, d: 0 };

function initBoard() {
  const b = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) { if (r < 3) b[r][c] = { c: 'b', k: false }; else if (r > 4) b[r][c] = { c: 'r', k: false }; }
  return b;
}
const clone = b => b.map(row => row.map(p => p && { ...p }));
const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const dirsFor = p => p.k ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : (p.c === 'r' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);
const kingRow = c => c === 'r' ? 0 : 7;

// ---- move generation: returns full sequences {from, path:[[r,c]..], caps:[[r,c]..]} ----
function jumpsFrom(b, r, c, p, caps, path, out) {
  let any = false;
  for (const [dr, dc] of dirsFor(p)) {
    const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
    if (!inB(lr, lc)) continue;
    const mid = b[mr][mc];
    if (!mid || mid.c === p.c || caps.some(([a, d]) => a === mr && d === mc)) continue;
    if (b[lr][lc] && !(lr === path[0][0] && lc === path[0][1])) continue;   // landing must be empty (the origin counts as empty)
    any = true;
    const ncaps = [...caps, [mr, mc]], npath = [...path, [lr, lc]];
    if (!p.k && lr === kingRow(p.c)) out.push({ from: path[0], path: npath.slice(1), caps: ncaps });   // becoming a king ends the jump
    else jumpsFrom(b, lr, lc, p, ncaps, npath, out);
  }
  if (!any && caps.length) out.push({ from: path[0], path: path.slice(1), caps });
}
function genMoves(b, color) {
  const jumps = [], steps = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = b[r][c]; if (!p || p.c !== color) continue;
    jumpsFrom(b, r, c, p, [], [[r, c]], jumps);
    for (const [dr, dc] of dirsFor(p)) { const nr = r + dr, nc = c + dc; if (inB(nr, nc) && !b[nr][nc]) steps.push({ from: [r, c], path: [[nr, nc]], caps: [] }); }
  }
  return jumps.length ? jumps : steps;
}
function applyMove(b, m) {
  const nb = clone(b), [fr, fc] = m.from, p = nb[fr][fc]; nb[fr][fc] = null;
  m.caps.forEach(([r, c]) => { nb[r][c] = null; });
  const [lr, lc] = m.path[m.path.length - 1]; nb[lr][lc] = p;
  if (!p.k && lr === kingRow(p.c)) p.k = true;
  return nb;
}

// ---- AI ----
function evaluate(b, me) {
  let s = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = b[r][c]; if (!p) continue;
    let v = p.k ? 170 : 100;
    if (!p.k) { const adv = p.c === 'r' ? 7 - r : r; v += adv * 4; if ((p.c === 'r' && r === 7) || (p.c === 'b' && r === 0)) v += 6; }
    v += (3.5 - Math.abs(3.5 - c)) * 1.5;               // prefer the middle
    s += p.c === me ? v : -v;
  }
  return s;
}
function search(b, depth, alpha, beta, color, me) {
  const moves = genMoves(b, color);
  if (!moves.length) return color === me ? -10000 - depth : 10000 + depth;
  if (depth === 0) return evaluate(b, me);
  const next = color === 'r' ? 'b' : 'r';
  if (color === me) { let best = -Infinity; for (const m of moves) { best = Math.max(best, search(applyMove(b, m), depth - 1, alpha, beta, next, me)); alpha = Math.max(alpha, best); if (alpha >= beta) break; } return best; }
  let best = Infinity; for (const m of moves) { best = Math.min(best, search(applyMove(b, m), depth - 1, alpha, beta, next, me)); beta = Math.min(beta, best); if (alpha >= beta) break; } return best;
}
function cpuMove(color) {
  const moves = genMoves(board, color); if (!moves.length) return null;
  if (mode === 'easy' && Math.random() < 0.6) return moves[Math.floor(Math.random() * moves.length)];
  const depth = mode === 'hard' ? 7 : mode === 'medium' ? 4 : 2, next = color === 'r' ? 'b' : 'r';
  let best = [], bv = -Infinity;
  for (const m of moves) {
    const v = search(applyMove(board, m), depth - 1, -Infinity, Infinity, next, color);
    if (v > bv + 0.01) { bv = v; best = [m]; } else if (Math.abs(v - bv) <= 0.01) best.push(m);
  }
  return best[Math.floor(Math.random() * best.length)];
}

// ---- UI ----
function render() {
  boardEl.innerHTML = '';
  const legal = over ? [] : genMoves(board, turn);
  const mustCapture = legal.some(m => m.caps.length);
  const movable = new Set(legal.map(m => m.from.join(',')));
  const dests = new Set(); candidates.forEach(m => dests.add(m.path[pathSoFar.length].join(',')));
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const sq = document.createElement('button'); sq.className = 'ck-sq ' + ((r + c) % 2 ? 'dark' : 'light'); sq.dataset.r = r; sq.dataset.c = c;
    if (selected && selected[0] === r && selected[1] === c) sq.classList.add('sel');
    if (pathSoFar.some(([a, d]) => a === r && d === c)) sq.classList.add('sel');
    if (dests.has(r + ',' + c)) sq.classList.add('dest');
    if (lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || lastMove.path.some(([a, d]) => a === r && d === c))) sq.classList.add('last');
    if (mustCapture && !selected && movable.has(r + ',' + c) && humanTurn()) sq.classList.add('must');
    const p = board[r][c];
    if (p) { const d = document.createElement('div'); d.className = 'ck-piece ' + p.c; d.textContent = p.k ? '♛' : ''; sq.appendChild(d); }
    boardEl.appendChild(sq);
  }
}
const humanTurn = () => mode === '2p' || turn === 'r';
const nameOf = c => mode === '2p' ? (c === 'r' ? 'Red' : 'Black') : (c === 'r' ? 'You' : 'CPU');
function setStatus() {
  if (over) return;
  const must = genMoves(board, turn).some(m => m.caps.length);
  statusMsg.textContent = mode === '2p' ? `${turn === 'r' ? 'Red' : 'Black'} to move${must ? ' — you must capture' : ''}` : (turn === 'r' ? `Your move (red)${must ? ' — you must capture' : ''}` : 'CPU is thinking…');
}
function updateScores() { scoreA.textContent = scores.r; scoreB.textContent = scores.b; scoreD.textContent = scores.d; }
function updateLabels() { labelA.textContent = mode === '2p' ? 'Red' : 'You'; labelB.textContent = mode === '2p' ? 'Black' : 'CPU'; }

function finishMove(m) {
  const wasMan = !board[m.from[0]][m.from[1]].k;
  board = applyMove(board, m); lastMove = m; selected = null; pathSoFar = []; candidates = [];
  quiet = (m.caps.length || wasMan) ? 0 : quiet + 1;
  turn = turn === 'r' ? 'b' : 'r';
  const moves = genMoves(board, turn);
  if (!moves.length) {
    over = true; const winner = turn === 'r' ? 'b' : 'r'; scores[winner]++; updateScores();
    if (mode !== '2p' && winner === 'r') localStorage.setItem('checkers-wins-' + mode, String(+(localStorage.getItem('checkers-wins-' + mode) || 0) + 1));
    statusMsg.textContent = mode === '2p' ? `${winner === 'r' ? 'Red' : 'Black'} wins! 🎉` : (winner === 'r' ? 'You win! 🎉' : 'CPU wins this one.');
  } else if (quiet >= 40) { over = true; scores.d++; updateScores(); statusMsg.textContent = 'Draw — 40 moves without a capture.'; }
  else setStatus();
  render();
  if (!over && !humanTurn()) { busy = true; setTimeout(() => { const cm = cpuMove(turn); busy = false; if (cm) finishMove(cm); }, 350); }
}

boardEl.addEventListener('click', e => {
  const sq = e.target.closest('.ck-sq'); if (!sq || over || busy || !humanTurn()) return;
  const r = +sq.dataset.r, c = +sq.dataset.c, legal = genMoves(board, turn);
  if (!selected) {
    const mine = legal.filter(m => m.from[0] === r && m.from[1] === c);
    if (mine.length) { selected = [r, c]; candidates = mine; pathSoFar = []; render(); }
    else if (board[r][c] && board[r][c].c === turn && legal.some(m => m.caps.length)) { statusMsg.textContent = 'A capture is available — you must take it.'; }
    return;
  }
  // choose the next landing square
  const next = candidates.filter(m => m.path[pathSoFar.length] && m.path[pathSoFar.length][0] === r && m.path[pathSoFar.length][1] === c);
  if (next.length) {
    pathSoFar = [...pathSoFar, [r, c]]; candidates = next;
    const done = next.find(m => m.path.length === pathSoFar.length);
    if (done) finishMove(done); else render();
    return;
  }
  // re-select another piece or cancel
  const mine = legal.filter(m => m.from[0] === r && m.from[1] === c);
  if (mine.length && !pathSoFar.length) { selected = [r, c]; candidates = mine; render(); } else if (!pathSoFar.length) { selected = null; candidates = []; render(); }
});

function newGame() {
  board = initBoard(); turn = 'r'; selected = null; pathSoFar = []; candidates = []; over = false; busy = false; lastMove = null; quiet = 0;
  setStatus(); render();
}
document.getElementById('resetBtn').addEventListener('click', newGame);
modeBtns.forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; modeBtns.forEach(x => x.classList.toggle('active', x === b)); scores = { r: 0, b: 0, d: 0 }; updateScores(); updateLabels(); newGame(); }));
updateLabels(); newGame();
