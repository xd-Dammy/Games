const boardEl = document.getElementById('sudokuBoard');
const mistakesVal = document.getElementById('mistakesVal');
const timeVal = document.getElementById('timeVal');
const overlay = document.getElementById('overlay');
const overlayMsg = document.getElementById('overlayMsg');
const startBtn = document.getElementById('startBtn');
const newGameBtn = document.getElementById('newGameBtn');
const numpad = document.getElementById('numpad');
const diffBtns = document.querySelectorAll('.mode-toggle .mode-btn');

const DIFFICULTY_CLUES = { easy: 40, medium: 32, hard: 26 };

let solution = [];
let puzzle = [];
let given = [];
let selectedIndex = null;
let mistakes = 0;
let seconds = 0;
let timerHandle = null;
let difficulty = 'easy';
let solved = false;

// ---------- Generator ----------

function emptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValid(grid, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[br + r][bc + c] === num) return false;
    }
  }
  return true;
}

function shuffledDigits() {
  const digits = [1,2,3,4,5,6,7,8,9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

function fillGrid(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (const num of shuffledDigits()) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(grid, limit = 2) {
  let count = 0;
  function solve(g) {
    if (count >= limit) return;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (g[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(g, row, col, num)) {
              g[row][col] = num;
              solve(g);
              g[row][col] = 0;
              if (count >= limit) return;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  solve(grid.map(r => [...r]));
  return count;
}

function generatePuzzle(clueCount) {
  const full = emptyGrid();
  fillGrid(full);

  const puz = full.map(r => [...r]);
  const cells = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c]);
  // shuffle cell removal order
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  let filled = 81;
  for (const [r, c] of cells) {
    if (filled <= clueCount) break;
    const backup = puz[r][c];
    puz[r][c] = 0;
    if (countSolutions(puz) !== 1) {
      puz[r][c] = backup; // revert, keep unique-solution property
    } else {
      filled--;
    }
  }

  return { full, puz };
}

// ---------- Game state ----------

function startTimer() {
  clearInterval(timerHandle);
  seconds = 0;
  timeVal.textContent = '0:00';
  timerHandle = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timeVal.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

function newGame() {
  overlay.classList.add('hidden');
  solved = false;
  mistakes = 0;
  mistakesVal.textContent = '0';
  selectedIndex = null;

  const { full, puz } = generatePuzzle(DIFFICULTY_CLUES[difficulty]);
  solution = full.flat();
  puzzle = puz.flat();
  given = puzzle.map(v => v !== 0);

  renderBoard();
  startTimer();
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const btn = document.createElement('button');
    btn.className = 'sudoku-cell';
    if (row === 2 || row === 5) btn.classList.add('sudoku-row-thick');
    if (given[i]) btn.classList.add('given');
    if (puzzle[i] !== 0) btn.textContent = puzzle[i];
    btn.dataset.index = i;
    btn.addEventListener('click', () => selectCell(i));
    boardEl.appendChild(btn);
  }
  applySelectionStyles();
}

function selectCell(i) {
  if (given[i] || solved) return;
  selectedIndex = i;
  applySelectionStyles();
}

function applySelectionStyles() {
  const cells = boardEl.querySelectorAll('.sudoku-cell');
  cells.forEach((cell, i) => {
    cell.classList.remove('selected', 'peer', 'same-value');
    if (selectedIndex === null) return;

    const selRow = Math.floor(selectedIndex / 9), selCol = selectedIndex % 9;
    const row = Math.floor(i / 9), col = i % 9;
    const selBoxR = Math.floor(selRow / 3), selBoxC = Math.floor(selCol / 3);
    const boxR = Math.floor(row / 3), boxC = Math.floor(col / 3);

    if (i === selectedIndex) {
      cell.classList.add('selected');
    } else if (row === selRow || col === selCol || (boxR === selBoxR && boxC === selBoxC)) {
      cell.classList.add('peer');
    }
    if (puzzle[selectedIndex] !== 0 && puzzle[i] === puzzle[selectedIndex] && i !== selectedIndex) {
      cell.classList.add('same-value');
    }
  });
}

function placeNumber(num) {
  if (selectedIndex === null || given[selectedIndex] || solved) return;
  const cells = boardEl.querySelectorAll('.sudoku-cell');
  const cell = cells[selectedIndex];

  if (num === 0) {
    puzzle[selectedIndex] = 0;
    cell.textContent = '';
    cell.classList.remove('error');
    return;
  }

  puzzle[selectedIndex] = num;
  cell.textContent = num;

  if (num !== solution[selectedIndex]) {
    cell.classList.add('error');
    mistakes++;
    mistakesVal.textContent = mistakes;
  } else {
    cell.classList.remove('error');
  }

  applySelectionStyles();
  checkComplete();
}

function checkComplete() {
  const isFull = puzzle.every(v => v !== 0);
  const isCorrect = puzzle.every((v, i) => v === solution[i]);
  if (isFull && isCorrect) {
    solved = true;
    try { localStorage.setItem('sudoku-wins-' + difficulty, String(+(localStorage.getItem('sudoku-wins-' + difficulty) || 0) + 1)); } catch (e) { /* ignore */ }
    clearInterval(timerHandle);
    overlayMsg.textContent = `Solved in ${timeVal.textContent} with ${mistakes} mistake${mistakes === 1 ? '' : 's'}`;
    overlay.classList.remove('hidden');
  }
}

// ---------- Input ----------

numpad.addEventListener('click', (e) => {
  const btn = e.target.closest('.num-btn');
  if (!btn) return;
  placeNumber(parseInt(btn.dataset.num, 10));
});

document.addEventListener('keydown', (e) => {
  if (selectedIndex === null) return;
  if (e.key >= '1' && e.key <= '9') {
    placeNumber(parseInt(e.key, 10));
  } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    placeNumber(0);
  } else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const row = Math.floor(selectedIndex / 9), col = selectedIndex % 9;
    let newRow = row, newCol = col;
    if (e.key === 'ArrowUp') newRow = Math.max(0, row - 1);
    if (e.key === 'ArrowDown') newRow = Math.min(8, row + 1);
    if (e.key === 'ArrowLeft') newCol = Math.max(0, col - 1);
    if (e.key === 'ArrowRight') newCol = Math.min(8, col + 1);
    selectCell(newRow * 9 + newCol);
  }
});

startBtn.addEventListener('click', newGame);
newGameBtn.addEventListener('click', newGame);

diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.diff;
    newGame();
  });
});

newGame();
