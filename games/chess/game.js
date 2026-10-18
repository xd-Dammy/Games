// ===== Engine =====  board index = row*8+col, row 0 = rank 8. Uppercase = white, lowercase = black, '' = empty.
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const isW = p => p !== '' && p === p.toUpperCase();
const colorOf = p => p === '' ? '' : (isW(p) ? 'w' : 'b');
const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
let S;   // {b, turn, cast:{K,Q,k,q}, ep, half, full}

function loadFEN(fen) {
  const [pos, turn, cast, ep, half, full] = fen.split(' ');
  const b = [];
  for (const ch of pos) { if (ch === '/') continue; if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) b.push(''); else b.push(ch); }
  S = { b, turn, cast: { K: cast.includes('K'), Q: cast.includes('Q'), k: cast.includes('k'), q: cast.includes('q') },
        ep: ep && ep !== '-' ? (8 - +ep[1]) * 8 + 'abcdefgh'.indexOf(ep[0]) : -1, half: +half || 0, full: +full || 1 };
}
const KN = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]], KG = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const DIAG = [[-1,-1],[-1,1],[1,-1],[1,1]], ORTH = [[-1,0],[1,0],[0,-1],[0,1]];

function attacked(S, sq, by) {            // is square sq attacked by colour `by`?
  const b = S.b, r = sq >> 3, c = sq & 7, w = by === 'w';
  const pr = r + (w ? 1 : -1);            // a white pawn attacking sq sits one row below it
  if (pr >= 0 && pr < 8) for (const dc of [-1, 1]) { const cc = c + dc; if (cc >= 0 && cc < 8 && b[pr * 8 + cc] === (w ? 'P' : 'p')) return true; }
  for (const [dr, dc] of KN) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === (w ? 'N' : 'n')) return true; }
  for (const [dr, dc] of KG) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === (w ? 'K' : 'k')) return true; }
  for (const [dr, dc] of DIAG) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const p = b[rr * 8 + cc]; if (p) { if (p === (w ? 'B' : 'b') || p === (w ? 'Q' : 'q')) return true; break; } rr += dr; cc += dc; } }
  for (const [dr, dc] of ORTH) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const p = b[rr * 8 + cc]; if (p) { if (p === (w ? 'R' : 'r') || p === (w ? 'Q' : 'q')) return true; break; } rr += dr; cc += dc; } }
  return false;
}
const kingSq = (S, col) => S.b.indexOf(col === 'w' ? 'K' : 'k');
const inCheck = (S, col) => { const k = kingSq(S, col); return k >= 0 && attacked(S, k, col === 'w' ? 'b' : 'w'); };

function pseudo(S, col, capsOnly) {
  const b = S.b, out = [], w = col === 'w';
  const add = (f, t, p, extra) => out.push({ f, t, p, cap: b[t], promo: '', ep: false, castle: '', ...extra });
  for (let f = 0; f < 64; f++) {
    const p = b[f]; if (!p || colorOf(p) !== col) continue;
    const r = f >> 3, c = f & 7, lp = p.toLowerCase();
    if (lp === 'p') {
      const dir = w ? -1 : 1, start = w ? 6 : 1, last = w ? 0 : 7, nr = r + dir;
      const push = (t, extra) => { if (nr === last) for (const pr of ['q', 'r', 'b', 'n']) add(f, t, p, { ...extra, promo: pr }); else add(f, t, p, extra); };
      if (!capsOnly && nr >= 0 && nr < 8 && !b[nr * 8 + c]) { push(nr * 8 + c, {}); if (r === start && !b[(r + 2 * dir) * 8 + c]) add(f, (r + 2 * dir) * 8 + c, p, { dbl: true }); }
      for (const dc of [-1, 1]) { const cc = c + dc; if (cc < 0 || cc > 7 || nr < 0 || nr > 7) continue; const t = nr * 8 + cc;
        if (b[t] && colorOf(b[t]) !== col) push(t, {}); else if (t === S.ep && !b[t]) add(f, t, p, { ep: true, cap: w ? 'p' : 'P' }); }
    } else if (lp === 'n' || lp === 'k') {
      for (const [dr, dc] of (lp === 'n' ? KN : KG)) { const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue; const t = rr * 8 + cc;
        if (!b[t] ? !capsOnly : colorOf(b[t]) !== col) add(f, t, p, {}); }
      if (lp === 'k' && !capsOnly) {
        const home = w ? 60 : 4, enemy = w ? 'b' : 'w';
        if (f === home && !attacked(S, home, enemy)) {
          if (S.cast[w ? 'K' : 'k'] && !b[home + 1] && !b[home + 2] && b[home + 3] === (w ? 'R' : 'r') && !attacked(S, home + 1, enemy) && !attacked(S, home + 2, enemy)) add(f, home + 2, p, { castle: 'K' });
          if (S.cast[w ? 'Q' : 'q'] && !b[home - 1] && !b[home - 2] && !b[home - 3] && b[home - 4] === (w ? 'R' : 'r') && !attacked(S, home - 1, enemy) && !attacked(S, home - 2, enemy)) add(f, home - 2, p, { castle: 'Q' });
        }
      }
    } else {
      const dirs = lp === 'b' ? DIAG : lp === 'r' ? ORTH : [...DIAG, ...ORTH];
      for (const [dr, dc] of dirs) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const t = rr * 8 + cc;
        if (!b[t]) { if (!capsOnly) add(f, t, p, {}); } else { if (colorOf(b[t]) !== col) add(f, t, p, {}); break; } rr += dr; cc += dc; } }
    }
  }
  return out;
}
function make(S, m) {
  const u = { cast: { ...S.cast }, ep: S.ep, half: S.half, full: S.full }, b = S.b, w = S.turn === 'w';
  b[m.t] = m.promo ? (w ? m.promo.toUpperCase() : m.promo) : m.p; b[m.f] = '';
  if (m.ep) b[m.t + (w ? 8 : -8)] = '';
  if (m.castle) { const home = m.f; if (m.castle === 'K') { b[home + 1] = b[home + 3]; b[home + 3] = ''; } else { b[home - 1] = b[home - 4]; b[home - 4] = ''; } }
  const c = S.cast;
  if (m.p === 'K') { c.K = c.Q = false; } if (m.p === 'k') { c.k = c.q = false; }
  for (const sq of [m.f, m.t]) { if (sq === 63) c.K = false; if (sq === 56) c.Q = false; if (sq === 7) c.k = false; if (sq === 0) c.q = false; }
  S.ep = m.dbl ? (m.f + m.t) / 2 : -1;
  S.half = (m.p.toLowerCase() === 'p' || m.cap) ? 0 : S.half + 1;
  if (!w) S.full++;
  S.turn = w ? 'b' : 'w';
  return u;
}
function unmake(S, m, u) {
  const b = S.b; S.turn = S.turn === 'w' ? 'b' : 'w'; const w = S.turn === 'w';
  b[m.f] = m.p; b[m.t] = m.ep ? '' : m.cap;
  if (m.ep) b[m.t + (w ? 8 : -8)] = w ? 'p' : 'P';
  if (m.castle) { const home = m.f; if (m.castle === 'K') { b[home + 3] = b[home + 1]; b[home + 1] = ''; } else { b[home - 4] = b[home - 1]; b[home - 1] = ''; } }
  S.cast = u.cast; S.ep = u.ep; S.half = u.half; S.full = u.full;
}
function legal(S, capsOnly) {
  const col = S.turn, out = [];
  for (const m of pseudo(S, col, capsOnly)) { const u = make(S, m); const ok = !inCheck(S, col); unmake(S, m, u); if (ok) out.push(m); }
  return out;
}
function perft(d) { if (d === 0) return 1; let n = 0; for (const m of legal(S)) { const u = make(S, m); n += perft(d - 1); unmake(S, m, u); } return n; }

// ===== AI =====
const PST_P = [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0];
const PST_N = [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50];
const PST_B = [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20];
const PST_K = [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20];
function evalPos(S) {
  let s = 0;
  for (let i = 0; i < 64; i++) {
    const p = S.b[i]; if (!p) continue; const w = isW(p), lp = p.toLowerCase(), idx = w ? i : (7 - (i >> 3)) * 8 + (i & 7);
    let v = VAL[lp]; if (lp === 'p') v += PST_P[idx]; else if (lp === 'n') v += PST_N[idx]; else if (lp === 'b') v += PST_B[idx]; else if (lp === 'k') v += PST_K[idx];
    s += w ? v : -v;
  }
  return S.turn === 'w' ? s : -s;     // from the side to move
}
let deadline = 0, nodes = 0, aborted = false;
function order(ms) { return ms.sort((a, b) => ((b.cap ? 10 * VAL[b.cap.toLowerCase()] - VAL[b.p.toLowerCase()] : 0) + (b.promo ? 800 : 0)) - ((a.cap ? 10 * VAL[a.cap.toLowerCase()] - VAL[a.p.toLowerCase()] : 0) + (a.promo ? 800 : 0))); }
function qsearch(S, alpha, beta, qd) {
  const stand = evalPos(S); if (qd <= 0) return stand; if (stand >= beta) return beta; if (stand > alpha) alpha = stand;
  for (const m of order(legal(S, true))) { const u = make(S, m); const v = -qsearch(S, -beta, -alpha, qd - 1); unmake(S, m, u); if (v >= beta) return beta; if (v > alpha) alpha = v; }
  return alpha;
}
function negamax(S, depth, alpha, beta, ply) {
  if ((++nodes & 1023) === 0 && Date.now() > deadline) aborted = true;
  if (aborted) return 0;
  if (S.half >= 100) return 0;
  const ms = legal(S);
  if (!ms.length) return inCheck(S, S.turn) ? -100000 + ply : 0;
  if (depth <= 0) return qsearch(S, alpha, beta, 4);
  for (const m of order(ms)) { const u = make(S, m); const v = -negamax(S, depth - 1, -beta, -alpha, ply + 1); unmake(S, m, u); if (aborted) return 0; if (v >= beta) return beta; if (v > alpha) alpha = v; }
  return alpha;
}
function chooseMove(level) {
  const ms = legal(S); if (!ms.length) return null;
  if (level === 'easy') {
    if (Math.random() < 0.4) return ms[Math.floor(Math.random() * ms.length)];
    return searchBest(ms, 1, 400);
  }
  return level === 'medium' ? searchBest(ms, 2, 1200) : searchBest(ms, 4, 2200);
}
function searchBest(ms, maxDepth, budget) {
  deadline = Date.now() + budget; nodes = 0; aborted = false; let best = ms[0];
  ms = order([...ms]);
  for (let d = 1; d <= maxDepth; d++) {
    let bv = -Infinity, bm = null, alpha = -Infinity; const scored = [];
    for (const m of ms) { const u = make(S, m); const v = -negamax(S, d - 1, -Infinity, -alpha, 1); unmake(S, m, u); if (aborted) break; scored.push([v, m]); if (v > bv) { bv = v; bm = m; } if (v > alpha) alpha = v; }
    if (aborted) break;
    best = bm; ms = scored.sort((a, b) => b[0] - a[0]).map(x => x[1]);
    if (bv > 90000) break;
  }
  return best;
}

// ===== UI =====
const boardEl = document.getElementById('board'), statusMsg = document.getElementById('statusMsg'), promoEl = document.getElementById('promo');
const modeBtns = document.querySelectorAll('[data-mode]');
const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟︎' };
let mode = 'medium', selected = -1, targets = [], lastMove = null, over = false, busy = false, history = [], pendingPromo = null, repeat = {};
let scores = JSON.parse(localStorage.getItem('chess-scores') || '{"w":0,"b":0,"d":0}');
const humanTurn = () => mode === '2p' || S.turn === 'w';
const posKey = () => S.b.join('') + S.turn + JSON.stringify(S.cast) + S.ep;
function showScores() { scoreA.textContent = scores.w; scoreB.textContent = scores.b; scoreD.textContent = scores.d; labelA.textContent = mode === '2p' ? 'White' : 'You'; labelB.textContent = mode === '2p' ? 'Black' : 'CPU'; }
function saveScores() { localStorage.setItem('chess-scores', JSON.stringify(scores)); showScores(); }

function render() {
  boardEl.innerHTML = '';
  const kSq = inCheck(S, S.turn) ? kingSq(S, S.turn) : -1;
  for (let i = 0; i < 64; i++) {
    const r = i >> 3, c = i & 7, sq = document.createElement('button');
    sq.className = 'ch-sq ' + ((r + c) % 2 ? 'd' : 'l'); sq.dataset.i = i; sq.setAttribute('aria-label', 'abcdefgh'[c] + (8 - r));
    if (i === selected) sq.classList.add('sel');
    if (lastMove && (lastMove.f === i || lastMove.t === i)) sq.classList.add('last');
    if (i === kSq) sq.classList.add('check');
    const tg = targets.find(m => m.t === i); if (tg) sq.classList.add(S.b[i] || tg.ep ? 'cap' : 'dot');
    const p = S.b[i]; if (p) { const s = document.createElement('span'); s.className = 'ch-piece ' + colorOf(p); s.textContent = GLYPH[p.toLowerCase()]; sq.appendChild(s); }
    boardEl.appendChild(sq);
  }
  // captured pieces
  const have = { w: {}, b: {} }; S.b.forEach(p => { if (p && p.toLowerCase() !== 'k') have[colorOf(p)][p.toLowerCase()] = (have[colorOf(p)][p.toLowerCase()] || 0) + 1; });
  const start = { p: 8, n: 2, b: 2, r: 2, q: 1 }, lost = col => Object.entries(start).map(([k, n]) => GLYPH[k].repeat(Math.max(0, n - (have[col][k] || 0)))).join('');
  document.getElementById('capTop').textContent = lost('b'); document.getElementById('capBot').textContent = lost('w');
}
function setStatus() {
  if (over) return;
  const chk = inCheck(S, S.turn) ? ' — check!' : '';
  statusMsg.textContent = mode === '2p' ? `${S.turn === 'w' ? 'White' : 'Black'} to move${chk}` : (S.turn === 'w' ? `Your move (white)${chk}` : 'CPU is thinking…');
}
function endCheck() {
  const ms = legal(S), k = posKey(); repeat[k] = (repeat[k] || 0) + 1;
  const pcs = S.b.filter(p => p && p.toLowerCase() !== 'k'), light = pcs.length <= 1 && pcs.every(p => 'nb'.includes(p.toLowerCase()));
  if (!ms.length) {
    over = true;
    if (inCheck(S, S.turn)) { const win = S.turn === 'w' ? 'b' : 'w'; scores[win]++; statusMsg.textContent = mode === '2p' ? `Checkmate! ${win === 'w' ? 'White' : 'Black'} wins 🎉` : (win === 'w' ? 'Checkmate — you win! 🎉' : 'Checkmate — CPU wins.'); }
    else { scores.d++; statusMsg.textContent = 'Stalemate — draw.'; }
    saveScores(); return true;
  }
  if (light || S.half >= 100 || repeat[k] >= 3) { over = true; scores.d++; saveScores(); statusMsg.textContent = light ? 'Draw — not enough material.' : S.half >= 100 ? 'Draw — 50-move rule.' : 'Draw — threefold repetition.'; return true; }
  return false;
}
function play(m) {
  history.push({ S: JSON.parse(JSON.stringify(S)), last: lastMove, repeat: { ...repeat } });
  make(S, m); lastMove = m; selected = -1; targets = []; promoEl.hidden = true; pendingPromo = null;
  const done = endCheck(); if (!done) setStatus(); render();
  if (!done && !humanTurn()) { busy = true; setTimeout(() => { const cm = chooseMove(mode); busy = false; if (cm) play(cm); }, 60); }
}
boardEl.addEventListener('click', e => {
  const sq = e.target.closest('.ch-sq'); if (!sq || over || busy || !humanTurn() || pendingPromo) return;
  const i = +sq.dataset.i, mv = targets.filter(m => m.t === i);
  if (mv.length) {
    if (mv[0].promo) { pendingPromo = mv; promoEl.innerHTML = ''; promoEl.hidden = false;
      ['q', 'r', 'b', 'n'].forEach(k => { const b = document.createElement('button'); b.textContent = GLYPH[k]; b.style.color = S.turn === 'w' ? '#fff' : '#9aa'; b.dataset.k = k; promoEl.appendChild(b); });
      statusMsg.textContent = 'Promote to…'; return; }
    play(mv[0]); return;
  }
  if (S.b[i] && colorOf(S.b[i]) === S.turn) { selected = i; targets = legal(S).filter(m => m.f === i); } else { selected = -1; targets = []; }
  render();
});
promoEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || !pendingPromo) return; play(pendingPromo.find(m => m.promo === b.dataset.k)); });
document.getElementById('undoBtn').addEventListener('click', () => {
  if (busy || !history.length) return;
  const n = mode === '2p' ? 1 : (humanTurn() || over ? 2 : 1);
  for (let k = 0; k < n && history.length; k++) { const h = history.pop(); S = h.S; lastMove = h.last; repeat = h.repeat; }
  over = false; selected = -1; targets = []; promoEl.hidden = true; pendingPromo = null; setStatus(); render();
});
function newGame() { loadFEN(START); selected = -1; targets = []; lastMove = null; over = false; busy = false; history = []; repeat = {}; promoEl.hidden = true; pendingPromo = null; repeat[posKey()] = 1; setStatus(); render(); }
document.getElementById('resetBtn').addEventListener('click', newGame);
modeBtns.forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; modeBtns.forEach(x => x.classList.toggle('active', x === b)); showScores(); newGame(); }));
showScores(); newGame();
