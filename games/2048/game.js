const SIZE = 4;
const boardEl = document.getElementById('board2048');
const tilesLayer = document.getElementById('tilesLayer');
const scoreVal = document.getElementById('scoreVal');
const bestVal = document.getElementById('bestVal');
const overlay = document.getElementById('overlay');
const overlayMsg = document.getElementById('overlayMsg');
const startBtn = document.getElementById('startBtn');
const newGameBtn = document.getElementById('newGameBtn');

let grid, score, best, won, over;

// ---------- Core grid engine (pure functions, testable independently of DOM) ----------

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function getEmptyCells(g) {
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomTile(g) {
  const empties = getEmptyCells(g);
  if (empties.length === 0) return null;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  g[r][c] = value;
  return { r, c, value };
}

// Slides a single row left, merging equal adjacent tiles once each.
// Returns { row, gained, moved } where row is the new 4-length array.
function slideRowLeft(row) {
  const nonZero = row.filter(v => v !== 0);
  const merged = [];
  let gained = 0;
  let i = 0;
  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const mergedVal = nonZero[i] * 2;
      merged.push(mergedVal);
      gained += mergedVal;
      i += 2;
    } else {
      merged.push(nonZero[i]);
      i += 1;
    }
  }
  while (merged.length < SIZE) merged.push(0);
  const moved = merged.some((v, idx) => v !== row[idx]);
  return { row: merged, gained, moved };
}

function rotateGridCW(g) {
  const n = g.length;
  const result = emptyGrid();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = g[r][c];
    }
  }
  return result;
}

// direction: 'left' | 'right' | 'up' | 'down'
function move(g, direction) {
  let working = g.map(row => [...row]);
  let rotations = 0;

  // Normalize every direction to a "slide left" operation via rotation
  if (direction === 'up') rotations = 3;
  else if (direction === 'right') rotations = 2;
  else if (direction === 'down') rotations = 1;

  for (let i = 0; i < rotations; i++) working = rotateGridCW(working);

  let totalGained = 0;
  let anyMoved = false;
  const newGrid = working.map(row => {
    const { row: newRow, gained, moved } = slideRowLeft(row);
    totalGained += gained;
    if (moved) anyMoved = true;
    return newRow;
  });

  let result = newGrid;
  const rotationsBack = (4 - rotations) % 4;
  for (let i = 0; i < rotationsBack; i++) result = rotateGridCW(result);

  return { grid: result, gained: totalGained, moved: anyMoved };
}

function hasMovesLeft(g) {
  if (getEmptyCells(g).length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = g[r][c];
      if (c + 1 < SIZE && g[r][c + 1] === v) return true;
      if (r + 1 < SIZE && g[r + 1][c] === v) return true;
    }
  }
  return false;
}

function hasWon(g) {
  return g.some(row => row.some(v => v >= 2048));
}

// ---------- DOM / rendering ----------

function loadBest() {
  best = parseInt(localStorage.getItem('2048-best') || '0', 10);
  bestVal.textContent = best;
}

function saveBest() {
  if (score > best) {
    best = score;
    localStorage.setItem('2048-best', best);
  }
  bestVal.textContent = best;
}

function buildBackground() {
  boardEl.innerHTML = '';
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'bg-cell';
    boardEl.appendChild(cell);
  }
}

function renderTiles(newTilePos = null, mergedPositions = []) {
  tilesLayer.innerHTML = '';
  const wrapRect = tilesLayer.getBoundingClientRect();
  const gap = 8;
  const cellSize = (wrapRect.width - gap * (SIZE + 1)) / SIZE;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.val = val;
      tile.textContent = val;
      tile.style.width = `${cellSize}px`;
      tile.style.height = `${cellSize}px`;
      tile.style.left = `${gap + c * (cellSize + gap)}px`;
      tile.style.top = `${gap + r * (cellSize + gap)}px`;

      if (newTilePos && newTilePos.r === r && newTilePos.c === c) {
        tile.classList.add('tile-new');
      }
      if (mergedPositions.some(p => p.r === r && p.c === c)) {
        tile.classList.add('tile-merged');
      }

      tilesLayer.appendChild(tile);
    }
  }
}

function findMergedPositions(oldGrid, newGrid) {
  // A cell is "merged" this turn if its value increased relative to what
  // could be explained by a simple slide — approximate by comparing new
  // grid values against the old grid's multiset of values per row context.
  // Simplify: detect any cell whose value doubled a previous adjacent value
  // by checking newGrid cells with even values that exceed all old values seen.
  const merged = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = newGrid[r][c];
      if (v !== 0 && !oldGrid.flat().includes(v) && v !== 2 && v !== 4) {
        merged.push({ r, c });
      }
    }
  }
  return merged;
}

function doMove(direction) {
  if (over) return;
  const oldGrid = grid.map(row => [...row]);
  const { grid: newGrid, gained, moved } = move(grid, direction);

  if (!moved) return;

  const mergedPositions = findMergedPositions(oldGrid, newGrid);
  grid = newGrid;
  score += gained;
  scoreVal.textContent = score;

  const newTile = addRandomTile(grid);
  renderTiles(newTile, mergedPositions);
  saveBest();

  if (!won && hasWon(grid)) {
    won = true;
    overlayMsg.textContent = `You hit 2048! Score ${score}`;
    overlay.classList.remove('hidden');
    // allow continuing by hiding overlay on next input handled via startBtn text
    startBtn.textContent = 'Keep playing / new game';
  } else if (!hasMovesLeft(grid)) {
    over = true;
    overlayMsg.textContent = `No more moves — score ${score}`;
    overlay.classList.remove('hidden');
    startBtn.textContent = 'New game';
  }
}

function newGame() {
  grid = emptyGrid();
  score = 0;
  won = false;
  over = false;
  scoreVal.textContent = 0;
  overlay.classList.add('hidden');
  startBtn.textContent = 'New game';
  buildBackground();
  addRandomTile(grid);
  addRandomTile(grid);
  renderTiles();
}

// ---------- Input ----------

const KEY_DIRECTIONS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right'
};

document.addEventListener('keydown', (e) => {
  const dir = KEY_DIRECTIONS[e.key];
  if (dir) {
    e.preventDefault();
    doMove(dir);
  }
});

document.getElementById('btnUp').addEventListener('click', () => doMove('up'));
document.getElementById('btnDown').addEventListener('click', () => doMove('down'));
document.getElementById('btnLeft').addEventListener('click', () => doMove('left'));
document.getElementById('btnRight').addEventListener('click', () => doMove('right'));

let touchStart = null;
const wrap = document.querySelector('.board-2048-wrap');
wrap.addEventListener('touchstart', (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

wrap.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) { touchStart = null; return; }
  if (Math.abs(dx) > Math.abs(dy)) {
    doMove(dx > 0 ? 'right' : 'left');
  } else {
    doMove(dy > 0 ? 'down' : 'up');
  }
  touchStart = null;
}, { passive: true });

startBtn.addEventListener('click', newGame);
newGameBtn.addEventListener('click', newGame);
window.addEventListener('resize', () => renderTiles());

loadBest();
newGame();
