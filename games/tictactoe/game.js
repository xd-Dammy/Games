const boardEl = document.getElementById('board');
const turnIndicator = document.getElementById('turnIndicator');
const resetBtn = document.getElementById('resetBtn');
const mode2pBtn = document.getElementById('mode2p');
const modeCPUBtn = document.getElementById('modeCPU');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDEl = document.getElementById('scoreD');
const difficultyToggle = document.getElementById('difficultyToggle');
const diffBtns = document.querySelectorAll('.diff-btn');

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameOver = false;
let vsCPU = false;
let difficulty = 'medium'; // easy | medium | expert
let scores = { X: 0, O: 0, D: 0 };

function loadScores() {
  try {
    const saved = JSON.parse(localStorage.getItem('ttt-scores'));
    if (saved) scores = saved;
  } catch (e) { /* ignore */ }
  updateScoreDisplay();
}

function saveScores() {
  try {
    localStorage.setItem('ttt-scores', JSON.stringify(scores));
  } catch (e) { /* ignore */ }
}

function updateScoreDisplay() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDEl.textContent = scores.D;
}

function renderBoard() {
  boardEl.innerHTML = '';
  board.forEach((val, i) => {
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('aria-label', `Cell ${i + 1}${val ? ', ' + val : ', empty'}`);
    if (val) {
      btn.textContent = val;
      btn.classList.add(val === 'X' ? 'x-mark' : 'o-mark');
      btn.disabled = true;
    }
    if (gameOver) btn.disabled = true;
    btn.addEventListener('click', () => handleMove(i));
    boardEl.appendChild(btn);
  });
}

function checkWinner(b) {
  for (const line of WIN_LINES) {
    const [a, bb, c] = line;
    if (b[a] && b[a] === b[bb] && b[a] === b[c]) {
      return { winner: b[a], line };
    }
  }
  if (b.every(cell => cell)) return { winner: 'draw', line: null };
  return null;
}

function handleMove(index) {
  if (gameOver || board[index]) return;
  board[index] = currentPlayer;
  renderBoard();

  const result = checkWinner(board);
  if (result) {
    endGame(result);
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateTurnIndicator();

  if (vsCPU && currentPlayer === 'O' && !gameOver) {
    setTimeout(cpuMove, 400);
  }
}

function cpuMove() {
  if (gameOver) return;
  const move = getMoveForDifficulty(board, difficulty);
  if (move !== -1) handleMove(move);
}

function getEmptyCells(b) {
  const cells = [];
  for (let i = 0; i < 9; i++) if (!b[i]) cells.push(i);
  return cells;
}

// Picks a move based on selected difficulty
function getMoveForDifficulty(b, level) {
  const empty = getEmptyCells(b);
  if (empty.length === 0) return -1;

  if (level === 'easy') {
    // Mostly random, but still blocks an immediate loss sometimes to feel fair
    const winMove = findImmediateMove(b, 'O');
    if (winMove !== -1 && Math.random() < 0.5) return winMove;
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (level === 'medium') {
    // Always take a winning move, always block an immediate loss,
    // otherwise play a reasonably good but not perfect move.
    const winMove = findImmediateMove(b, 'O');
    if (winMove !== -1) return winMove;
    const blockMove = findImmediateMove(b, 'X');
    if (blockMove !== -1) return blockMove;
    // 70% best move via minimax, 30% random — makes it beatable
    if (Math.random() < 0.7) return getBestMove(b);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // expert — unbeatable, full minimax
  return getBestMove(b);
}

// Returns a cell that lets `mark` win immediately, or -1
function findImmediateMove(b, mark) {
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = mark;
      const result = checkWinner(b);
      b[i] = null;
      if (result && result.winner === mark) return i;
    }
  }
  return -1;
}

// Full minimax — unbeatable CPU (used for expert, and partially for medium)
function getBestMove(b) {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = 'O';
      const score = minimax(b, 0, false);
      b[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function minimax(b, depth, isMaximizing) {
  const result = checkWinner(b);
  if (result) {
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    return 0;
  }

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'O';
        best = Math.max(best, minimax(b, depth + 1, false));
        b[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'X';
        best = Math.min(best, minimax(b, depth + 1, true));
        b[i] = null;
      }
    }
    return best;
  }
}

function endGame(result) {
  gameOver = true;
  if (result.winner === 'draw') {
    turnIndicator.textContent = "It's a draw!";
    scores.D++;
  } else {
    turnIndicator.textContent = `${result.winner} wins!`;
    scores[result.winner]++;
    highlightWinningLine(result.line);
  }
  updateScoreDisplay();
  saveScores();
  renderBoard();
}

function highlightWinningLine(line) {
  const cells = boardEl.querySelectorAll('.cell');
  line.forEach(i => cells[i].classList.add('winning'));
}

function updateTurnIndicator() {
  if (vsCPU && currentPlayer === 'O') {
    turnIndicator.textContent = "CPU's turn...";
  } else {
    turnIndicator.textContent = `${currentPlayer}'s turn`;
  }
}

function resetBoard() {
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;
  renderBoard();
  updateTurnIndicator();
}

resetBtn.addEventListener('click', resetBoard);

mode2pBtn.addEventListener('click', () => {
  vsCPU = false;
  mode2pBtn.classList.add('active');
  modeCPUBtn.classList.remove('active');
  resetBoard();
});

modeCPUBtn.addEventListener('click', () => {
  vsCPU = true;
  modeCPUBtn.classList.add('active');
  mode2pBtn.classList.remove('active');
  if (difficultyToggle) difficultyToggle.hidden = false;
  resetBoard();
});

mode2pBtn.addEventListener('click', () => {
  if (difficultyToggle) difficultyToggle.hidden = true;
});

diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    difficulty = btn.dataset.diff;
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    resetBoard();
  });
});

loadScores();
renderBoard();
updateTurnIndicator();
