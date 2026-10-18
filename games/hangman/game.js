const WORDS = {
  Tech: 'python compiler variable function algorithm database network browser keyboard javascript recursion boolean pointer binary server firewall software hardware protocol internet integer string syntax debug array queue stack kernel router bandwidth encryption'.split(' '),
  Campus: 'lecture semester library student hostel laboratory lecturer project exam assignment hostel course credit campus timetable seminar thesis faculty graduate'.split(' '),
  Animals: 'elephant giraffe penguin dolphin crocodile leopard kangaroo octopus butterfly hippopotamus chimpanzee flamingo tortoise squirrel'.split(' '),
  Food: 'pizza jollof plantain spaghetti sandwich pancake chocolate pineapple watermelon noodles burger coconut'.split(' '),
  Places: 'lagos abuja ibadan nigeria canada brazil japan egypt london paris kenya ghana'.split(' '),
};
const wordEl = document.getElementById('wordEl'), kbEl = document.getElementById('kb'), statusMsg = document.getElementById('statusMsg');
const hintMsg = document.getElementById('hintMsg'), livesVal = document.getElementById('livesVal');
const MAX = 6;
let word, cat, guessed, wrong, over;
let stats = JSON.parse(localStorage.getItem('hangman-stats') || '{"wins":0,"streak":0}');
function showStats() { document.getElementById('winsVal').textContent = stats.wins; document.getElementById('streakVal').textContent = stats.streak; }
function save() { localStorage.setItem('hangman-stats', JSON.stringify(stats)); showStats(); }

function render() {
  wordEl.innerHTML = '';
  [...word].forEach(ch => {
    const s = document.createElement('div'); s.className = 'hm-letter';
    if (guessed.has(ch)) s.textContent = ch; else if (over) { s.textContent = ch; s.classList.add('missed'); }
    wordEl.appendChild(s);
  });
  for (let i = 0; i < MAX; i++) document.getElementById('p' + i).classList.toggle('show', i < wrong);
  livesVal.textContent = MAX - wrong;
  [...kbEl.children].forEach(b => { const L = b.dataset.k; b.disabled = over || guessed.has(L); b.classList.toggle('good', guessed.has(L) && word.includes(L)); b.classList.toggle('bad', guessed.has(L) && !word.includes(L)); });
}
function guess(L) {
  if (over || guessed.has(L)) return;
  guessed.add(L);
  if (!word.includes(L)) wrong++;
  if ([...word].every(c => guessed.has(c))) { over = true; stats.wins++; stats.streak++; save(); statusMsg.textContent = 'You got it! 🎉'; }
  else if (wrong >= MAX) { over = true; stats.streak = 0; save(); statusMsg.textContent = `Out of lives. The word was ${word.toUpperCase()}`; }
  else statusMsg.textContent = wrong ? `${MAX - wrong} lives left` : 'Guess the word';
  render();
}
function newGame() {
  const cats = Object.keys(WORDS); cat = cats[Math.floor(Math.random() * cats.length)];
  word = WORDS[cat][Math.floor(Math.random() * WORDS[cat].length)];
  guessed = new Set(); wrong = 0; over = false;
  hintMsg.textContent = `Category: ${cat} · ${word.length} letters`; statusMsg.textContent = 'Guess the word';
  if (!kbEl.children.length) 'abcdefghijklmnopqrstuvwxyz'.split('').forEach(L => {
    const b = document.createElement('button'); b.className = 'hm-key'; b.textContent = L; b.dataset.k = L; kbEl.appendChild(b);
  });
  render(); window.__word = word;
}
kbEl.addEventListener('click', e => { const b = e.target.closest('.hm-key'); if (b) { b.blur(); guess(b.dataset.k); } });
document.addEventListener('keydown', e => { if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[a-z]$/i.test(e.key)) guess(e.key.toLowerCase()); });
document.getElementById('resetBtn').addEventListener('click', e => { e.currentTarget.blur(); newGame(); });
showStats(); newGame();
