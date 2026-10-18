const pad = document.getElementById('pad'), padMain = document.getElementById('padMain'), padSub = document.getElementById('padSub');
const lastVal = document.getElementById('lastVal'), avgVal = document.getElementById('avgVal'), bestVal = document.getElementById('bestVal'), statusMsg = document.getElementById('statusMsg');
const ROUNDS = 5;
let phase = 'idle', timer = null, goAt = 0, times = [];
let best = parseInt(localStorage.getItem('reflex-best') || '0', 10);
bestVal.textContent = best ? best + ' ms' : '—';
function setPad(cls, main, sub) { pad.className = 'rx-pad ' + cls; padMain.textContent = main; padSub.textContent = sub || ''; }
function arm() {
  phase = 'waiting'; setPad('ready', 'Wait…', `Round ${times.length + 1} of ${ROUNDS}`);
  timer = setTimeout(() => { phase = 'go'; goAt = performance.now(); setPad('go', 'TAP!', ''); }, 1200 + Math.random() * 2800);
}
function press() {
  if (phase === 'idle' || phase === 'done') { times = []; avgVal.textContent = '—'; lastVal.textContent = '—'; statusMsg.textContent = 'Tap as soon as the screen turns green'; arm(); return; }
  if (phase === 'waiting') { clearTimeout(timer); phase = 'early'; setPad('early', 'Too soon!', 'Tap to retry this round'); return; }
  if (phase === 'early') { arm(); return; }
  if (phase === 'go') {
    const ms = Math.round(performance.now() - goAt); times.push(ms); lastVal.textContent = ms + ' ms';
    if (times.length >= ROUNDS) {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / ROUNDS), top = Math.min(...times);
      avgVal.textContent = avg + ' ms'; phase = 'done'; setPad('result', avg + ' ms', 'Average · tap to play again');
      if (!best || top < best) { best = top; localStorage.setItem('reflex-best', String(best)); bestVal.textContent = best + ' ms'; statusMsg.textContent = `New best single reaction: ${top} ms 🎉`; }
      else statusMsg.textContent = `Fastest this run: ${top} ms`;
    } else { phase = 'between'; setPad('result', ms + ' ms', `Tap for round ${times.length + 1} of ${ROUNDS}`); }
    return;
  }
  if (phase === 'between') arm();
}
pad.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); press(); } });
