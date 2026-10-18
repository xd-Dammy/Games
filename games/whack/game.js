const boardEl = document.getElementById('board');
const timeVal = document.getElementById('timeVal');
const scoreVal = document.getElementById('scoreVal');
const bestVal = document.getElementById('bestVal');
const statusMsg = document.getElementById('statusMsg');
const startBtn = document.getElementById('startBtn');

const DURATION = 30;
let holes = [], state = [], score = 0, timeLeft = DURATION, running = false;
let tickTimer = null, spawnTimer = null, runId = 0;
let best = parseInt(localStorage.getItem('whack-best') || '0', 10);

function buildBoard() {
  boardEl.innerHTML = ''; holes = []; state = [];
  for (let i = 0; i < 9; i++) {
    const h = document.createElement('button'); h.className = 'wk-hole'; h.dataset.i = i;
    h.setAttribute('aria-label', 'Hole ' + (i + 1));
    h.innerHTML = '<span class="wk-mole"></span>';
    boardEl.appendChild(h); holes.push(h); state.push(null);
  }
}

function pickType() {
  const r = Math.random();
  if (r < 0.12) return { kind: 'bomb', emoji: '💣', pts: -3, life: 1000 };
  if (r < 0.24) return { kind: 'gold', emoji: '🌟', pts: 3, life: 650 };
  return { kind: 'mole', emoji: '🐹', pts: 1, life: 0 };
}
function popup(i, text, cls) {
  const p = document.createElement('div'); p.className = 'wk-pop ' + cls; p.textContent = text;
  holes[i].appendChild(p); setTimeout(() => p.remove(), 620);
}
function hide(i) {
  const s = state[i]; if (!s) return;
  clearTimeout(s.timeout); state[i] = null;
  holes[i].classList.remove('up', 'gold');
}

function spawn(id) {
  if (!running || id !== runId) return;
  const progress = 1 - timeLeft / DURATION;           // 0 -> 1 over the round
  const free = state.map((s, i) => (s ? -1 : i)).filter(i => i >= 0);
  if (free.length) {
    const i = free[Math.floor(Math.random() * free.length)];
    const t = pickType();
    const life = t.life || Math.round(1000 - progress * 450);
    holes[i].querySelector('.wk-mole').textContent = t.emoji;
    holes[i].classList.add('up'); holes[i].classList.toggle('gold', t.kind === 'gold');
    state[i] = { ...t, timeout: setTimeout(() => hide(i), life) };
  }
  const delay = Math.round(780 - progress * 400);
  spawnTimer = setTimeout(() => spawn(id), delay * (0.7 + Math.random() * 0.6));
}

function whack(i) {
  if (!running) return;
  const s = state[i]; if (!s) return;
  score = Math.max(0, score + s.pts); scoreVal.textContent = score;
  popup(i, (s.pts > 0 ? '+' : '') + s.pts, s.pts > 0 ? 'plus' : 'minus');
  const h = holes[i]; h.classList.add(s.pts > 0 ? 'hit' : 'boom');
  setTimeout(() => h.classList.remove('hit', 'boom'), 180);
  hide(i);
}

function end() {
  running = false; clearInterval(tickTimer); clearTimeout(spawnTimer);
  state.forEach((_, i) => hide(i));
  if (score > best) { best = score; localStorage.setItem('whack-best', String(best)); bestVal.textContent = best; statusMsg.textContent = `Time! New best: ${score} 🎉`; }
  else statusMsg.textContent = `Time! You scored ${score}.`;
  startBtn.hidden = false; startBtn.textContent = 'Play again';
}

function start() {
  clearInterval(tickTimer); clearTimeout(spawnTimer);
  buildBoard(); score = 0; timeLeft = DURATION; running = true; runId++;
  scoreVal.textContent = 0; timeVal.textContent = timeLeft;
  statusMsg.textContent = 'Go go go!'; startBtn.hidden = true;
  tickTimer = setInterval(() => { timeLeft--; timeVal.textContent = timeLeft; if (timeLeft <= 0) end(); }, 1000);
  spawn(runId);
}

boardEl.addEventListener('pointerdown', e => { const h = e.target.closest('.wk-hole'); if (h) { e.preventDefault(); whack(+h.dataset.i); } });
startBtn.addEventListener('click', start);
bestVal.textContent = best; buildBoard();
