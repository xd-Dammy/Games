const SIZE = 5;
const boardEl = document.getElementById('board');
const levelVal = document.getElementById('levelVal');
const movesVal = document.getElementById('movesVal');
const bestVal = document.getElementById('bestVal');
const statusMsg = document.getElementById('statusMsg');
const nextBtn = document.getElementById('nextBtn');

let level = 1, moves = 0, lights = [], solution = new Set(), startLights = [], done = false;
let best = parseInt(localStorage.getItem('lightsout-cleared') || '0', 10);

function applyPress(arr, i) {
  const r = Math.floor(i / SIZE), c = i % SIZE;
  [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) arr[nr * SIZE + nc] = !arr[nr * SIZE + nc];
  });
}

function generate(lvl) {
  // Press N random distinct cells on a dark board. Pressing the same cells again solves it,
  // so every level is guaranteed solvable and the hint always works.
  const count = Math.min(3 + lvl, 14);
  let arr, sol;
  do {
    arr = Array(SIZE * SIZE).fill(false); sol = new Set();
    const cells = [...Array(SIZE * SIZE).keys()].sort(() => Math.random() - 0.5).slice(0, count);
    cells.forEach(i => { applyPress(arr, i); sol.add(i); });
  } while (arr.every(v => !v));
  return { arr, sol };
}

function build() {
  boardEl.innerHTML = ''; boardEl.classList.remove('done');
  for (let i = 0; i < SIZE * SIZE; i++) {
    const b = document.createElement('button'); b.className = 'cell'; b.dataset.i = i;
    b.setAttribute('aria-label', 'Light ' + (i + 1));
    boardEl.appendChild(b);
  }
  paint();
}
function paint() {
  [...boardEl.children].forEach((el, i) => { el.classList.toggle('on', lights[i]); el.classList.remove('hint'); });
}

function loadLevel(lvl, reuse) {
  level = lvl; levelVal.textContent = lvl;
  if (!reuse) { const g = generate(lvl); startLights = g.arr; solution = g.sol; }
  lights = [...startLights]; done = false; moves = 0; movesVal.textContent = 0;
  // recompute remaining solution set for a restarted board
  if (reuse) solution = new Set(startSolution);
  startSolution = new Set(solution);
  nextBtn.hidden = true;
  statusMsg.textContent = 'Turn every light off. Each tap flips a cell and its neighbours.';
  build();
}
let startSolution = new Set();

boardEl.addEventListener('click', e => {
  const t = e.target.closest('.cell'); if (!t || done) return;
  const i = +t.dataset.i;
  applyPress(lights, i);
  if (solution.has(i)) solution.delete(i); else solution.add(i);
  moves++; movesVal.textContent = moves; paint();
  if (lights.every(v => !v)) {
    done = true; boardEl.classList.add('done');
    statusMsg.textContent = `Level ${level} cleared in ${moves} moves 🎉`;
    if (level > best) { best = level; localStorage.setItem('lightsout-cleared', String(best)); bestVal.textContent = best; }
    nextBtn.hidden = false;
  }
});

document.getElementById('hintBtn').addEventListener('click', () => {
  if (done || !solution.size) return;
  paint();
  const pick = [...solution][0];
  boardEl.children[pick].classList.add('hint');
  statusMsg.textContent = 'Try tapping the highlighted cell.';
});
document.getElementById('restartBtn').addEventListener('click', () => loadLevel(level, true));
nextBtn.addEventListener('click', () => loadLevel(level + 1, false));
bestVal.textContent = best || '—';
loadLevel(1, false);
