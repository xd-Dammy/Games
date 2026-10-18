const padsEl = document.getElementById('pads');
const pads = [...padsEl.querySelectorAll('.pad')];
const startBtn = document.getElementById('startBtn');
const roundVal = document.getElementById('roundVal');
const bestVal = document.getElementById('bestVal');
const statusMsg = document.getElementById('statusMsg');
const soundBtn = document.getElementById('soundBtn');

const FREQS = [329.63, 261.63, 392.0, 523.25]; // E4, C4, G4, C5
let seq = [], pos = 0, accepting = false, playing = false, token = 0;
let soundOn = localStorage.getItem('simon-sound') !== 'off';
let best = parseInt(localStorage.getItem('simon-best') || '0', 10);
let ctx = null;

function audio() {
  if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, ms) {
  if (!soundOn) return; const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(a.destination);
  const t = a.currentTime; g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  o.start(t); o.stop(t + ms / 1000 + 0.02);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function flash(i, ms = 320) {
  pads[i].classList.add('lit'); tone(FREQS[i], ms);
  return sleep(ms).then(() => pads[i].classList.remove('lit'));
}

async function playSequence(myToken) {
  accepting = false; padsEl.classList.add('locked');
  statusMsg.textContent = 'Watch…';
  await sleep(600);
  const speed = Math.max(140, 380 - seq.length * 16);
  for (const i of seq) {
    if (myToken !== token) return;
    await flash(i, speed); await sleep(speed * 0.45);
  }
  if (myToken !== token) return;
  pos = 0; accepting = true; padsEl.classList.remove('locked');
  statusMsg.textContent = 'Your turn!';
}

function nextRound() {
  seq.push(Math.floor(Math.random() * 4));
  roundVal.textContent = seq.length;
  playSequence(token);
}

function gameOver() {
  accepting = false; playing = false; token++;
  padsEl.classList.add('locked');
  const score = seq.length - 1;
  if (score > best) { best = score; localStorage.setItem('simon-best', String(best)); bestVal.textContent = best; statusMsg.textContent = `New best: ${score}! 🎉`; }
  else statusMsg.textContent = `Wrong pad. You reached round ${score}.`;
  tone(110, 500);
  startBtn.disabled = false; startBtn.textContent = 'RETRY';
}

async function press(i) {
  if (!accepting) return;
  flash(i, 220);
  if (i !== seq[pos]) { gameOver(); return; }
  pos++;
  if (pos === seq.length) {
    accepting = false; statusMsg.textContent = 'Nice!';
    const t = token; await sleep(700); if (t === token) nextRound();
  }
}

padsEl.addEventListener('pointerdown', e => {
  const b = e.target.closest('.pad'); if (b) { e.preventDefault(); press(+b.dataset.i); }
});
startBtn.addEventListener('click', () => {
  audio(); token++; seq = []; playing = true; roundVal.textContent = 0;
  startBtn.disabled = true; startBtn.textContent = '…';
  nextRound();
});
function showSound() { soundBtn.textContent = soundOn ? '🔊 Sound on' : '🔇 Sound off'; soundBtn.classList.toggle('active', soundOn); }
soundBtn.addEventListener('click', () => { soundOn = !soundOn; localStorage.setItem('simon-sound', soundOn ? 'on' : 'off'); showSound(); });
bestVal.textContent = best; showSound(); padsEl.classList.add('locked');
