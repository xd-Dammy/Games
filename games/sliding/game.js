const boardEl = document.getElementById('board');
const timeVal = document.getElementById('timeVal');
const movesVal = document.getElementById('movesVal');
const bestVal = document.getElementById('bestVal');
const statusMsg = document.getElementById('statusMsg');
const sizeBtns = document.querySelectorAll('[data-size]');

let N = 4, tiles = [], moves = 0, seconds = 0, timer = null, started = false, solved = false;
const GAP = 8; // px between tiles, as a fraction of board handled below

const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const bestKey = () => `sliding-best-${N}`;
function loadBest() { const b = localStorage.getItem(bestKey()); bestVal.textContent = b ? b + ' moves' : '—'; }
function stopTimer() { clearInterval(timer); timer = null; }
function startTimer() { stopTimer(); seconds = 0; timeVal.textContent = fmt(0); timer = setInterval(() => { seconds++; timeVal.textContent = fmt(seconds); }, 1000); }

// tiles[i] = value at cell i (0 = gap). Solved = 1..N*N-1, 0
function solvedState() { return Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N)); }
function isSolved() { return tiles.every((v, i) => v === (i + 1) % (N * N)); }

function shuffleBoard() {
  // random legal moves from the solved state => always solvable
  tiles = solvedState();
  let gap = N * N - 1, prev = -1;
  const steps = N * N * 40;
  for (let s = 0; s < steps; s++) {
    const r = Math.floor(gap / N), c = gap % N, opts = [];
    if (r > 0) opts.push(gap - N);
    if (r < N - 1) opts.push(gap + N);
    if (c > 0) opts.push(gap - 1);
    if (c < N - 1) opts.push(gap + 1);
    const choices = opts.filter(o => o !== prev);
    const pick = choices[Math.floor(Math.random() * choices.length)];
    [tiles[gap], tiles[pick]] = [tiles[pick], tiles[gap]];
    prev = gap; gap = pick;
  }
  if (isSolved()) return shuffleBoard();
}

function layout() {
  const pad = 6;
  const size = boardEl.clientWidth;
  const cell = (size - pad * 2) / N;
  const gap = 4;
  boardEl.querySelectorAll('.tile').forEach(el => {
    const v = +el.dataset.v, i = tiles.indexOf(v);
    el.style.width = el.style.height = (cell - gap) + 'px';
    el.style.left = (pad + (i % N) * cell + gap / 2) + 'px';
    el.style.top = (pad + Math.floor(i / N) * cell + gap / 2) + 'px';
    el.style.fontSize = Math.max(18, cell * 0.42) + 'px';
    el.classList.toggle('home', !solved && v === i + 1);
  });
}
function build() {
  boardEl.innerHTML = ''; boardEl.classList.remove('solved');
  for (let v = 1; v < N * N; v++) {
    const el = document.createElement('button');
    el.className = 'tile'; el.dataset.v = v; el.textContent = v;
    el.setAttribute('aria-label', 'Tile ' + v);
    el.addEventListener('click', () => tapTile(v));
    boardEl.appendChild(el);
  }
  layout();
}

function tapTile(v) {
  if (solved) return;
  const i = tiles.indexOf(v), g = tiles.indexOf(0);
  const ir = Math.floor(i / N), ic = i % N, gr = Math.floor(g / N), gc = g % N;
  if (ir !== gr && ic !== gc) return;              // must share row or column with gap
  if (!started) { started = true; startTimer(); }
  // slide the whole line of tiles toward the gap
  const stepIdx = ir === gr ? (ic < gc ? 1 : -1) : (ir < gr ? N : -N);
  let pos = g;
  while (pos !== i) { tiles[pos] = tiles[pos - stepIdx]; pos -= stepIdx; }
  tiles[i] = 0;
  moves++; movesVal.textContent = moves;
  layout();
  if (isSolved()) win();
}

function win() {
  solved = true; stopTimer(); boardEl.classList.add('solved'); layout();
  const best = parseInt(localStorage.getItem(bestKey()) || '0', 10);
  if (!best || moves < best) { localStorage.setItem(bestKey(), String(moves)); loadBest(); statusMsg.textContent = `New best! ${moves} moves in ${fmt(seconds)} 🎉`; }
  else statusMsg.textContent = `Solved in ${moves} moves, ${fmt(seconds)} 🎉`;
}

function newGame() {
  stopTimer(); started = false; solved = false; moves = 0; seconds = 0;
  movesVal.textContent = 0; timeVal.textContent = fmt(0);
  statusMsg.textContent = 'Put the tiles in order. Tap a tile next to the gap.';
  shuffleBoard(); loadBest(); build();
}

document.getElementById('resetBtn').addEventListener('click', newGame);
sizeBtns.forEach(b => b.addEventListener('click', () => {
  N = +b.dataset.size; sizeBtns.forEach(x => x.classList.toggle('active', x === b)); newGame();
}));
window.addEventListener('resize', layout);
newGame();
