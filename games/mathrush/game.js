const qEl = document.getElementById('question'), aEl = document.getElementById('answer'), padEl = document.getElementById('padEl');
const timeVal = document.getElementById('timeVal'), scoreVal = document.getElementById('scoreVal'), bestVal = document.getElementById('bestVal');
const statusMsg = document.getElementById('statusMsg'), startBtn = document.getElementById('startBtn');
const lvlBtns = document.querySelectorAll('[data-lvl]');
const DURATION = 30;
let lvl = 'normal', running = false, input = '', answer = 0, score = 0, timeLeft = DURATION, tick = null;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function makeQuestion() {
  let a, b, op, ans;
  if (lvl === 'easy') { op = Math.random() < 0.5 ? '+' : '−'; a = rnd(2, 20); b = rnd(1, 20); if (op === '−' && b > a) [a, b] = [b, a]; ans = op === '+' ? a + b : a - b; }
  else if (lvl === 'normal') {
    const r = Math.random();
    if (r < 0.35) { op = '+'; a = rnd(10, 60); b = rnd(5, 50); ans = a + b; }
    else if (r < 0.65) { op = '−'; a = rnd(20, 90); b = rnd(5, a - 1); ans = a - b; }
    else { op = '×'; a = rnd(2, 12); b = rnd(2, 12); ans = a * b; }
  } else {
    const r = Math.random();
    if (r < 0.25) { op = '+'; a = rnd(100, 500); b = rnd(50, 400); ans = a + b; }
    else if (r < 0.5) { op = '−'; a = rnd(200, 900); b = rnd(50, a - 1); ans = a - b; }
    else if (r < 0.8) { op = '×'; a = rnd(6, 15); b = rnd(6, 15); ans = a * b; }
    else { op = '÷'; b = rnd(3, 12); ans = rnd(3, 15); a = b * ans; }
  }
  answer = ans; qEl.textContent = `${a} ${op} ${b}`;
}
function setInput(s) { input = s; aEl.textContent = s; aEl.className = 'mr-ans'; }
function submit() {
  if (!running || input === '') return;
  if (parseInt(input, 10) === answer) { good(); } else { aEl.className = 'mr-ans bad'; setTimeout(() => setInput(''), 250); }
}
function good() { score++; scoreVal.textContent = score; makeQuestion(); setInput(''); aEl.classList.add('good'); }
function typeKey(k) {
  if (!running) return;
  if (k === 'back') setInput(input.slice(0, -1));
  else if (k === 'ok') submit();
  else if (input.length < 5) { setInput(input + k); if (parseInt(input, 10) === answer && String(answer) === input) good(); }
}
function bestKey() { return 'mathrush-best-' + lvl; }
function showBest() { bestVal.textContent = localStorage.getItem(bestKey()) || 0; }
function end() {
  running = false; clearInterval(tick); qEl.textContent = 'Time!'; setInput('');
  const best = parseInt(localStorage.getItem(bestKey()) || '0', 10);
  if (score > best) { localStorage.setItem(bestKey(), String(score)); showBest(); statusMsg.textContent = `New best: ${score}! 🎉`; }
  else statusMsg.textContent = `You solved ${score}.`;
  startBtn.hidden = false; startBtn.textContent = 'Play again'; lvlBtns.forEach(b => b.disabled = false);
}
function start() {
  score = 0; timeLeft = DURATION; running = true; scoreVal.textContent = 0; timeVal.textContent = DURATION;
  statusMsg.textContent = 'Type the answer — it checks automatically'; startBtn.hidden = true; lvlBtns.forEach(b => b.disabled = true);
  setInput(''); makeQuestion();
  tick = setInterval(() => { timeLeft--; timeVal.textContent = timeLeft; if (timeLeft <= 0) end(); }, 1000);
}
['1','2','3','4','5','6','7','8','9','back','0','ok'].forEach(k => {
  const b = document.createElement('button'); b.textContent = k === 'back' ? '⌫' : k === 'ok' ? '✓' : k; if (k === 'ok') b.className = 'ok';
  b.addEventListener('pointerdown', e => { e.preventDefault(); typeKey(k); }); padEl.appendChild(b);
});
document.addEventListener('keydown', e => {
  if (/^[0-9]$/.test(e.key)) typeKey(e.key); else if (e.key === 'Backspace') typeKey('back'); else if (e.key === 'Enter') { e.preventDefault(); submit(); }
});
startBtn.addEventListener('click', () => { startBtn.blur(); start(); });
lvlBtns.forEach(b => b.addEventListener('click', () => { lvl = b.dataset.lvl; lvlBtns.forEach(x => x.classList.toggle('active', x === b)); showBest(); }));
showBest();
