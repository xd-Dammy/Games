const boardEl = document.getElementById('memoryBoard');
const timeValEl = document.getElementById('timeVal');
const movesValEl = document.getElementById('movesVal');
const bestValEl = document.getElementById('bestVal');
const statusMsg = document.getElementById('statusMsg');
const resetBtn = document.getElementById('resetBtn');
const sizeBtns = document.querySelectorAll('.mode-btn');

const SYMBOLS = ['🎮','👾','🕹️','🚀','⭐','🎯','🔥','💎','🍀','🎲','⚡','🌙','🎧','🏆','🧩','🛸','🍕','🐙'];

let gridSize = 4; // 4 -> 4x4, 6 -> 6x6
let cards = [];
let flipped = [];
let matchedCount = 0;
let moves = 0;
let timerInterval = null;
let secondsElapsed = 0;
let lockBoard = false;
let gameStarted = false;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(size) {
  const pairCount = (size * size) / 2;
  const symbolSet = shuffle(SYMBOLS).slice(0, pairCount);
  const deck = shuffle([...symbolSet, ...symbolSet]);
  return deck.map((symbol, i) => ({ id: i, symbol, matched: false }));
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function startTimer() {
  stopTimer();
  secondsElapsed = 0;
  timeValEl.textContent = formatTime(0);
  timerInterval = setInterval(() => {
    secondsElapsed++;
    timeValEl.textContent = formatTime(secondsElapsed);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function bestKey() {
  return `memory-best-${gridSize}`;
}

function loadBest() {
  const saved = localStorage.getItem(bestKey());
  bestValEl.textContent = saved ? formatTime(parseInt(saved, 10)) : '—';
}

function maybeSaveBest() {
  const saved = localStorage.getItem(bestKey());
  if (!saved || secondsElapsed < parseInt(saved, 10)) {
    localStorage.setItem(bestKey(), String(secondsElapsed));
    loadBest();
    return true;
  }
  return false;
}

function renderBoard() {
  boardEl.className = `memory-board size-${gridSize}`;
  boardEl.innerHTML = '';
  cards.forEach((card) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'mem-card';
    cardEl.dataset.id = card.id;
    cardEl.innerHTML = `
      <div class="mem-card-inner">
        <div class="mem-face mem-face-back"></div>
        <div class="mem-face mem-face-front">${card.symbol}</div>
      </div>
    `;
    cardEl.addEventListener('click', () => handleCardClick(card.id));
    boardEl.appendChild(cardEl);
  });
}

function handleCardClick(id) {
  if (lockBoard) return;
  const card = cards.find(c => c.id === id);
  if (!card || card.matched) return;
  if (flipped.includes(id)) return;

  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }

  const cardEl = boardEl.querySelector(`[data-id="${id}"]`);
  cardEl.classList.add('flipped');
  flipped.push(id);

  if (flipped.length === 2) {
    moves++;
    movesValEl.textContent = moves;
    lockBoard = true;
    checkMatch();
  }
}

function checkMatch() {
  const [id1, id2] = flipped;
  const c1 = cards.find(c => c.id === id1);
  const c2 = cards.find(c => c.id === id2);
  const el1 = boardEl.querySelector(`[data-id="${id1}"]`);
  const el2 = boardEl.querySelector(`[data-id="${id2}"]`);

  if (c1.symbol === c2.symbol) {
    c1.matched = true;
    c2.matched = true;
    el1.classList.add('matched');
    el2.classList.add('matched');
    matchedCount += 2;
    flipped = [];
    lockBoard = false;
    statusMsg.textContent = 'Match!';

    if (matchedCount === cards.length) {
      finishGame();
    }
  } else {
    el1.classList.add('mismatch');
    el2.classList.add('mismatch');
    statusMsg.textContent = 'Not a match — try again';
    setTimeout(() => {
      el1.classList.remove('flipped', 'mismatch');
      el2.classList.remove('flipped', 'mismatch');
      flipped = [];
      lockBoard = false;
    }, 700);
  }
}

function finishGame() {
  stopTimer();
  const isBest = maybeSaveBest();
  statusMsg.textContent = isBest
    ? `New best! Solved in ${formatTime(secondsElapsed)} — ${moves} moves`
    : `Solved in ${formatTime(secondsElapsed)} — ${moves} moves`;
}

function newGame() {
  stopTimer();
  gameStarted = false;
  moves = 0;
  matchedCount = 0;
  flipped = [];
  lockBoard = false;
  secondsElapsed = 0;
  movesValEl.textContent = '0';
  timeValEl.textContent = formatTime(0);
  statusMsg.textContent = 'Flip two cards to find a match';
  cards = buildDeck(gridSize);
  loadBest();
  renderBoard();
}

resetBtn.addEventListener('click', newGame);

sizeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    gridSize = parseInt(btn.dataset.size, 10);
    sizeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    newGame();
  });
});

newGame();
