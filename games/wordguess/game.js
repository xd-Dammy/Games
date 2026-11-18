const WORDS = (`about above actor adapt admit adult after again agent agree ahead alarm album alert alive allow alone along
alter among angel anger angle angry apart apple apply arena argue arise armor array aside asset audio avoid awake award
aware badly baker basic beach began begin being below bench berry birth black blame blank blast blind block blood board
boost bonus brain brand bread break brick bride brief bring broad brown brush build bunch burst buyer cable candy carry
catch cause chain chair chalk charm chart chase cheap check cheek chest chief child chill civil claim class clean clear
clerk click cliff climb clock close cloth cloud coach coast color count court cover crack craft crane crash crazy cream
crime cross crowd crown curve cycle daily dance death delay depth dirty doubt dozen draft drama dream dress drink drive
eager early earth eight elbow elite empty enemy enjoy enter equal error event every exact exist extra faith false fancy
fault feast fever field fight final first flame flash fleet floor flour focus force frame fresh front fruit funny ghost
giant given glass globe glory grace grade grain grand grape grass great green greet group guard guess guest guide habit
happy harsh heart heavy hello hence honey horse hotel house human humor ideal image imply index inner input irony issue
jelly joint judge juice knife knock known label labor large laser later laugh layer learn least leave legal lemon
level light limit local logic loose lover lower loyal lucky lunch magic major maker march match maybe mayor media mercy
metal meter might minor mixed model money month moral motor mount mouse mouth movie music naive nerve never newly night
noble noise north novel nurse ocean offer often olive onion opera orbit order other ought outer owner paint panel paper
party pasta patch pause peace pearl phase phone photo piano piece pilot pitch pixel place plain plane plant plate point
pound power press price pride prime print prior prize proof proud prove queen quest quick quiet quite quote radio raise
range rapid ratio reach react ready realm rebel refer relax reply rider ridge right rigid river robot rough round route
royal rural salad scale scene scope score sense serve seven shade shake shall shape share sharp sheep sheet shelf shell
shift shine shirt shock shoot short shout sight silly since skill sleep slice slide small smart smile smoke snake solid
solve sorry sound south space spare speak speed spend spice split spoon sport staff stage stair stamp stand start state
steam steel stick still stock stone store storm story strip study stuff style sugar suite sunny super sweet swift swing
table taste teach thank theme there thick thing think third those three throw thumb tiger tight title toast today tooth
topic total touch tough tower track trade trail train treat trend trial tribe trick truck truly trust truth twice uncle
under union unite unity until upper upset urban usage usual valid value video virus visit vital vocal voice waste watch
water wheel where which while white whole whose woman world worry worth would write wrong young youth zebra`)
  .split(/\s+/).filter(w => w.length === 5);

const boardEl = document.getElementById('board');
const kbEl = document.getElementById('kb');
const statusMsg = document.getElementById('statusMsg');
const MAX = 6, LEN = 5;

let answer, row, col, guesses, over, keyState;
let stats = JSON.parse(localStorage.getItem('wordguess-stats') || '{"played":0,"wins":0,"streak":0}');
function saveStats() { localStorage.setItem('wordguess-stats', JSON.stringify(stats)); showStats(); }
function showStats() {
  document.getElementById('playedVal').textContent = stats.played;
  document.getElementById('winsVal').textContent = stats.wins;
  document.getElementById('streakVal').textContent = stats.streak;
}

function buildBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < MAX; r++) {
    const rowEl = document.createElement('div'); rowEl.className = 'wg-row';
    for (let c = 0; c < LEN; c++) {
      const t = document.createElement('div'); t.className = 'wg-tile'; rowEl.appendChild(t);
    }
    boardEl.appendChild(rowEl);
  }
}
const KEYS = ['qwertyuiop', 'asdfghjkl', '+zxcvbnm-'];
function buildKeyboard() {
  kbEl.innerHTML = '';
  KEYS.forEach(line => {
    const rowEl = document.createElement('div'); rowEl.className = 'wg-kb-row';
    [...line].forEach(k => {
      const b = document.createElement('button'); b.className = 'wg-key';
      if (k === '+') { b.textContent = 'Enter'; b.dataset.key = 'Enter'; b.classList.add('wide'); }
      else if (k === '-') { b.textContent = '⌫'; b.dataset.key = 'Backspace'; b.classList.add('wide'); }
      else { b.textContent = k; b.dataset.key = k; }
      rowEl.appendChild(b);
    });
    kbEl.appendChild(rowEl);
  });
}
const tile = (r, c) => boardEl.children[r].children[c];

function newGame() {
  answer = WORDS[Math.floor(Math.random() * WORDS.length)];
  row = 0; col = 0; guesses = []; over = false; keyState = {};
  buildBoard(); buildKeyboard();
  statusMsg.textContent = 'Guess the 5-letter word in 6 tries';
  window.__answer = answer; // handy for testing
}

function typeLetter(ch) {
  if (over || col >= LEN) return;
  const t = tile(row, col); t.textContent = ch; t.classList.add('filled'); col++;
}
function backspace() {
  if (over || col === 0) return;
  col--; const t = tile(row, col); t.textContent = ''; t.classList.remove('filled');
}

function score(guess, target) {
  const res = Array(LEN).fill('absent');
  const left = {};
  for (let i = 0; i < LEN; i++) {
    if (guess[i] === target[i]) res[i] = 'correct';
    else left[target[i]] = (left[target[i]] || 0) + 1;
  }
  for (let i = 0; i < LEN; i++) {
    if (res[i] === 'correct') continue;
    if (left[guess[i]] > 0) { res[i] = 'present'; left[guess[i]]--; }
  }
  return res;
}

function submit() {
  if (over) return;
  if (col < LEN) {
    boardEl.children[row].classList.remove('shake'); void boardEl.children[row].offsetWidth;
    boardEl.children[row].classList.add('shake');
    statusMsg.textContent = 'Not enough letters'; return;
  }
  let guess = '';
  for (let c = 0; c < LEN; c++) guess += tile(row, c).textContent;
  const res = score(guess, answer);
  const rank = { absent: 0, present: 1, correct: 2 };
  res.forEach((state, c) => {
    const t = tile(row, c);
    t.classList.remove('filled'); t.classList.add(state);
    const L = guess[c];
    if (!keyState[L] || rank[state] > rank[keyState[L]]) keyState[L] = state;
  });
  Object.entries(keyState).forEach(([L, s]) => {
    const k = kbEl.querySelector(`[data-key="${L}"]`);
    if (k) { k.classList.remove('absent', 'present', 'correct'); k.classList.add(s); }
  });
  if (guess === answer) {
    over = true; stats.played++; stats.wins++; stats.streak++; saveStats();
    statusMsg.textContent = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][row];
    return;
  }
  row++; col = 0;
  if (row === MAX) {
    over = true; stats.played++; stats.streak = 0; saveStats();
    statusMsg.textContent = `The word was ${answer.toUpperCase()}`;
  } else statusMsg.textContent = `${MAX - row} ${MAX - row === 1 ? 'try' : 'tries'} left`;
}

function press(key) {
  if (key === 'Enter') submit();
  else if (key === 'Backspace') backspace();
  else if (/^[a-z]$/.test(key)) typeLetter(key);
}
kbEl.addEventListener('click', e => { const b = e.target.closest('.wg-key'); if (b) { b.blur(); press(b.dataset.key); } });
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter') e.preventDefault(); // don't re-trigger a focused button
  press(e.key.length === 1 ? e.key.toLowerCase() : e.key);
});
document.getElementById('resetBtn').addEventListener('click', e => { e.currentTarget.blur(); newGame(); });
showStats(); newGame();
