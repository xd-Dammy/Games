// Reads every game's saved scores from this device (localStorage) and summarises them.
const get = k => localStorage.getItem(k);
const num = k => { const v = parseInt(get(k) || '', 10); return Number.isFinite(v) ? v : null; };
const json = k => { try { return JSON.parse(get(k)); } catch (e) { return null; } };
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const keysWith = prefix => Object.keys(localStorage).filter(k => k.startsWith(prefix)).sort();
const cap = s => s[0].toUpperCase() + s.slice(1);
// each entry returns { lines: [..], wins: n } or null when the game has no score yet
const GAMES = [
  ['Puzzles', [
    ['Sudoku', 'sudoku', () => { const d = ['easy', 'medium', 'hard'].filter(k => num('sudoku-wins-' + k)); return d.length ? { lines: d.map(k => `${cap(k)}: ${num('sudoku-wins-' + k)} solved`), wins: d.reduce((a, k) => a + num('sudoku-wins-' + k), 0) } : null; }],
    ['Minesweeper', 'minesweeper', () => { const l = keysWith('minesweeper-best-').map(k => `${cap(k.split('-').pop())}: ${fmtTime(num(k))}`); return l.length ? { lines: l, wins: l.length } : null; }],
    ['Word Guess', 'wordguess', () => { const s = json('wordguess-stats'); return s && s.played ? { lines: [`${s.wins} wins / ${s.played} played`, `Streak ${s.streak}`], wins: s.wins } : null; }],
    ['Sliding Puzzle', 'sliding', () => { const l = keysWith('sliding-best-').map(k => `${k.split('-').pop()}×${k.split('-').pop()}: ${num(k)} moves`); return l.length ? { lines: l, wins: l.length } : null; }],
    ['Lights Out', 'lightsout', () => { const n = num('lightsout-cleared'); return n ? { lines: [`${n} levels cleared`], wins: n } : null; }],
    ['Memory Match', 'memory', () => { const l = keysWith('memory-best-').map(k => `${k.split('-').pop()}×${k.split('-').pop()}: ${fmtTime(num(k))}`); return l.length ? { lines: l, wins: l.length } : null; }],
    ['2048', '2048', () => { const n = num('2048-best'); return n ? { lines: [`Best ${n}`], wins: 0 } : null; }],
    ['Hangman', 'hangman', () => { const s = json('hangman-stats'); return s && s.wins ? { lines: [`${s.wins} words solved`, `Streak ${s.streak}`], wins: s.wins } : null; }],
    ['Math Rush', 'mathrush', () => { const l = keysWith('mathrush-best-').map(k => `${cap(k.split('-').pop())}: ${num(k)}`); return l.length ? { lines: l, wins: 0 } : null; }],
    ['Riddles & Tricks', 'riddles', () => { const s = json('riddles-stats'); return s && s.solved ? { lines: [`${s.solved} solved`, `Best streak ${s.best}`], wins: s.solved } : null; }],
  ]],
  ['Arcade', [
    ['Snake', 'snake', () => { const n = num('snake-best'); return n ? { lines: [`Best ${n}`], wins: 0 } : null; }],
    ['Simon', 'simon', () => { const n = num('simon-best'); return n ? { lines: [`Best round ${n}`], wins: 0 } : null; }],
    ['Whack-a-Mole', 'whack', () => { const n = num('whack-best'); return n ? { lines: [`Best ${n}`], wins: 0 } : null; }],
    ['Flap', 'flap', () => { const n = num('flap-best'); return n ? { lines: [`Best ${n}`], wins: 0 } : null; }],
    ['Breakout', 'breakout', () => { const n = num('breakout-best'); return n ? { lines: [`Best ${n}`], wins: 0 } : null; }],
    ['Blocks', 'blocks', () => { const n = num('blocks-best'); return n ? { lines: [`Best ${n}`], wins: 0 } : null; }],
    ['Reflex', 'reflex', () => { const n = num('reflex-best'); return n ? { lines: [`Fastest ${n} ms`], wins: 0 } : null; }],
    ['Pong', 'pong', () => { const r = json('pong-record'); return r && (r.w || r.l) ? { lines: [`${r.w} wins · ${r.l} losses`], wins: r.w } : null; }],
    ['Rock Paper Scissors', 'rps', () => { const s = json('rps-scores'); return s && (s.a || s.b || s.d) ? { lines: [`${s.a} W · ${s.d} D · ${s.b} L`], wins: s.a } : null; }],
    ['Tic-Tac-Toe', 'tictactoe', () => { const s = json('ttt-scores'); return s && (s.X || s.O || s.D) ? { lines: [`X ${s.X} · O ${s.O} · Draws ${s.D}`], wins: s.X + s.O } : null; }],
  ]],
  ['Board games vs CPU', [
    ['Connect Four', 'connect4', () => { const l = ['easy', 'medium', 'hard'].filter(d => num('connect4-wins-' + d)).map(d => `${cap(d)}: ${num('connect4-wins-' + d)} wins`); return l.length ? { lines: l, wins: l.reduce((a, d) => a + num('connect4-wins-' + d.split(':')[0].toLowerCase()), 0) } : null; }],
    ['Checkers', 'checkers', () => { const l = ['easy', 'medium', 'hard'].filter(d => num('checkers-wins-' + d)).map(d => `${cap(d)}: ${num('checkers-wins-' + d)} wins`); return l.length ? { lines: l, wins: l.reduce((a, d) => a + num('checkers-wins-' + d.split(':')[0].toLowerCase()), 0) } : null; }],
    ['Chess', 'chess', () => { const s = json('chess-scores'); return s && (s.w || s.b || s.d) ? { lines: [`White ${s.w} · Black ${s.b} · Draws ${s.d}`], wins: s.w } : null; }],
  ]],
];
const ALL_KEY_PREFIXES = ['minesweeper-best-', 'wordguess-stats', 'sliding-best-', 'lightsout-cleared', 'lightsout-best', 'memory-best-', '2048-best', 'hangman-stats', 'mathrush-best-', 'riddles-stats', 'snake-best', 'simon-best', 'simon-sound', 'whack-best', 'flap-best', 'breakout-best', 'blocks-best', 'reflex-best', 'pong-record', 'rps-scores', 'ttt-scores', 'connect4-wins-', 'checkers-wins-', 'sudoku-wins-', 'chess-scores'];

function render() {
  const list = document.getElementById('list'); list.innerHTML = '';
  let played = 0, total = 0, wins = 0;
  GAMES.forEach(([group, items]) => {
    const h = document.createElement('div'); h.className = 'sc-group'; h.textContent = group; list.appendChild(h);
    items.forEach(([name, folder, read]) => {
      total++; let r = null; try { r = read(); } catch (e) { r = null; }
      if (r) { played++; wins += r.wins || 0; }
      const a = document.createElement('a'); a.className = 'sc-row' + (r ? '' : ' empty'); a.href = `../games/${folder}/index.html`; a.dataset.game = folder;
      a.innerHTML = `<span class="sc-name"></span><span class="sc-stat"></span>`;
      a.querySelector('.sc-name').textContent = name;
      a.querySelector('.sc-stat').innerHTML = r ? r.lines.map(l => `<div>${l.replace(/</g, '&lt;')}</div>`).join('') : 'Not played yet';
      list.appendChild(a);
    });
  });
  document.getElementById('playedVal').textContent = played; document.getElementById('totalVal').textContent = total; document.getElementById('winsVal').textContent = wins;
  document.getElementById('fill').style.width = Math.round(played / total * 100) + '%';
  const ranks = [[0, 'New player — pick a cabinet!'], [3, 'Warming up 🔥'], [8, 'Regular 🎮'], [14, 'Arcade pro 🏆'], [total, 'XD legend 👑']];
  document.getElementById('rankMsg').textContent = [...ranks].reverse().find(([n]) => played >= n)[1];
}
const resetBtn = document.getElementById('resetAll'); let armed = null;
resetBtn.addEventListener('click', () => {
  if (!armed) { resetBtn.textContent = 'Tap again to erase everything'; resetBtn.classList.add('armed'); armed = setTimeout(() => { armed = null; resetBtn.textContent = 'Reset all scores'; resetBtn.classList.remove('armed'); }, 4000); return; }
  clearTimeout(armed); armed = null;
  Object.keys(localStorage).filter(k => ALL_KEY_PREFIXES.some(p => k.startsWith(p)) && k !== 'simon-sound').forEach(k => localStorage.removeItem(k));
  resetBtn.textContent = 'Reset all scores'; resetBtn.classList.remove('armed'); render();
});
render();
