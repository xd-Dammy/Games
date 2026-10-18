const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const bestVal = document.getElementById('bestVal');
const overlay = document.getElementById('overlay');
const overlayMsg = document.getElementById('overlayMsg');
const startBtn = document.getElementById('startBtn');

const GRID_SIZE = 15;
const CELL = canvas.width / GRID_SIZE;
const BASE_SPEED_MS = 140;
const MIN_SPEED_MS = 70;

const COLORS = {
  snakeHead: '#FF3D6E',
  snakeBody: '#3DDCFF',
  food: '#FFD23D',
  grid: '#12161F'
};

let snake, direction, nextDirection, food, score, best, speed, loopHandle, running;

function loadBest() {
  best = parseInt(localStorage.getItem('snake-best') || '0', 10);
  bestVal.textContent = best;
}

function saveBest() {
  if (score > best) {
    best = score;
    localStorage.setItem('snake-best', best);
  }
  bestVal.textContent = best;
}

function resetState() {
  snake = [
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = BASE_SPEED_MS;
  scoreVal.textContent = 0;
  placeFood();
}

function placeFood() {
  let valid = false;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    valid = !snake.some(seg => seg.x === food.x && seg.y === food.y);
  }
}

function drawGrid() {
  ctx.fillStyle = '#070A10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCell(x, y, color, inset = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + inset, y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
}

function draw() {
  drawGrid();
  snake.forEach((seg, i) => {
    drawCell(seg.x, seg.y, i === 0 ? COLORS.snakeHead : COLORS.snakeBody);
  });
  drawCell(food.x, food.y, COLORS.food, 2);
}

function tick() {
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Wall collision
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return gameOver();
  }
  // Self collision
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreVal.textContent = score;
    placeFood();
    speed = Math.max(MIN_SPEED_MS, speed - 3);
    restartLoop();
  } else {
    snake.pop();
  }

  draw();
}

function restartLoop() {
  clearInterval(loopHandle);
  loopHandle = setInterval(tick, speed);
}

function gameOver() {
  running = false;
  clearInterval(loopHandle);
  saveBest();
  overlayMsg.textContent = `Game over — score ${score}`;
  startBtn.textContent = 'Play again';
  overlay.classList.remove('hidden');
}

function startGame() {
  resetState();
  running = true;
  overlay.classList.add('hidden');
  draw();
  restartLoop();
}

function setDirection(x, y) {
  // prevent reversing directly into self
  if (direction.x === -x && direction.y === -y) return;
  nextDirection = { x, y };
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  const keyMap = {
    ArrowUp: [0, -1], ArrowDown: [0, 1],
    ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
  };
  if (keyMap[e.key]) {
    e.preventDefault();
    if (!running) { startGame(); return; }
    setDirection(...keyMap[e.key]);
  }
});

// Touch d-pad controls
document.getElementById('btnUp').addEventListener('click', () => { if (!running) startGame(); else setDirection(0, -1); });
document.getElementById('btnDown').addEventListener('click', () => { if (!running) startGame(); else setDirection(0, 1); });
document.getElementById('btnLeft').addEventListener('click', () => { if (!running) startGame(); else setDirection(-1, 0); });
document.getElementById('btnRight').addEventListener('click', () => { if (!running) startGame(); else setDirection(1, 0); });

// Swipe controls on canvas
let touchStart = null;
canvas.addEventListener('touchstart', (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? 1 : -1, 0);
  } else {
    setDirection(0, dy > 0 ? 1 : -1);
  }
  if (!running) startGame();
  touchStart = null;
}, { passive: true });

startBtn.addEventListener('click', startGame);

loadBest();
resetState();
draw();
