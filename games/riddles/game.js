// [question, [accepted answers], hint, explanation shown after]
const RIDDLES = [
  ['I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', ['echo'], 'Shout in a canyon.'],
  ['What has keys but can\'t open locks?', ['piano', 'keyboard'], 'Think music or typing.'],
  ['What gets wetter the more it dries?', ['towel'], 'You use it after a bath.'],
  ['What has hands but can\'t clap?', ['clock', 'watch'], 'It tells you something all day.'],
  ['The more you take, the more you leave behind. What are they?', ['footsteps', 'steps', 'footprints'], 'You make them when you walk.'],
  ['What has a head and a tail but no body?', ['coin'], 'You flip it to decide things.'],
  ['What can travel around the world while staying in a corner?', ['stamp'], 'It goes on an envelope.'],
  ['What has many teeth but can\'t bite?', ['comb', 'zip', 'zipper'], 'You use it on your hair.'],
  ['What goes up but never comes down?', ['age', 'your age'], 'Every birthday it grows.'],
  ['I\'m tall when I\'m young and short when I\'m old. What am I?', ['candle'], 'I give light as I shrink.'],
  ['What has one eye but can\'t see?', ['needle'], 'Used for sewing.'],
  ['What can you catch but not throw?', ['cold', 'a cold'], 'You may sneeze with it.'],
  ['What has a neck but no head?', ['bottle'], 'Water often comes in one.'],
  ['What begins with T, ends with T, and has T in it?', ['teapot'], 'Pour yourself a cup.'],
  ['What runs but never walks, and has a mouth but never talks?', ['river'], 'It flows to the sea.'],
  ['What is full of holes but still holds water?', ['sponge'], 'Found next to the kitchen sink.'],
  ['What belongs to you, but other people use it more than you do?', ['name', 'your name'], 'People call you by it.'],
  ['What can fill a room but takes up no space?', ['light', 'air', 'sound'], 'Turn the switch on.'],
  ['What has words but never speaks?', ['book'], 'You read it.'],
  ['What breaks the moment you say its name?', ['silence'], 'Shhh…'],
  ['I have cities but no houses, mountains but no trees, and water but no fish. What am I?', ['map'], 'You use me to find places.'],
  ['Which 5-letter word becomes shorter when you add two letters to it?', ['short'], 'Add "er".'],
  ['The more of me there is, the less you see. What am I?', ['darkness', 'dark'], 'Light is my enemy.'],
  ['What is always coming but never arrives?', ['tomorrow', 'the future', 'future'], 'It is never today.'],
  ['I have keys, but no locks; space, but no room; and you can enter, but you can\'t go in. What am I?', ['keyboard'], 'You are probably using one now.'],
  ['What has a thumb and four fingers but is not alive?', ['glove'], 'Keeps your hand warm.'],
  ['What can you hold without ever touching it?', ['breath', 'your breath', 'a conversation'], 'You do it before diving.'],
  ['What do you throw out when you want to use it, and take in when you are done?', ['anchor'], 'Ships use it.'],
  ['What has a bank but no money?', ['river', 'riverbank'], 'Fish swim by it.'],
  ['I have branches, but no fruit, trunk or leaves. What am I?', ['bank'], 'Money is kept here.'],
  ['What invention lets you look right through a wall?', ['window'], 'It lets the light in.'],
  ['I am taken from a mine and shut up in a wooden case, from which I am never released, yet I am used by almost everyone. What am I?', ['pencil lead', 'pencil', 'graphite', 'lead'], 'You write with me.'],
];
const TRICKS = [
  ['How many months of the year have 28 days?', ['all', '12', 'twelve', 'every month', 'all of them'], 'Think about what "have" means.', 'All 12 months have at least 28 days.'],
  ['A farmer has 17 sheep. All but 9 run away. How many are left?', ['9', 'nine'], 'Read "all but" slowly.', '"All but 9" means 9 stayed.'],
  ['There are 6 apples in a bowl and you take away 4. How many do YOU have?', ['4', 'four'], 'The question asks about you.', 'You took 4, so you have 4.'],
  ['Which weighs more: a kilogram of feathers or a kilogram of iron?', ['same', 'equal', 'neither', 'both', 'the same'], 'Look at the units.', 'Both weigh exactly one kilogram.'],
  ['How many animals of each kind did Moses take on the ark?', ['none', 'zero', '0', 'noah', 'zero animals'], 'Who built the ark?', 'It was Noah, not Moses.'],
  ['A plane crashes exactly on the border of two countries. Where do they bury the survivors?', ['nowhere', 'dont', 'you dont', 'not', 'no where'], 'Think about who gets buried.', 'You don\'t bury survivors.'],
  ['You are in a race and you pass the person in second place. What place are you in now?', ['second', '2nd', '2', 'second place'], 'You didn\'t pass the leader.', 'You took over second place.'],
  ['A doctor gives you 3 pills and says take one every half hour. How long do the pills last?', ['1 hour', 'one hour', 'an hour', 'hour', '60 minutes', 'sixty minutes'], 'When do you take the first one?', 'First now, second at 30 mins, third at 60 mins.'],
  ['Is it legal for a man to marry his widow\'s sister?', ['no', 'dead', 'he is dead', 'hes dead', 'impossible', 'cant'], 'What does "widow" mean?', 'A man with a widow is dead.'],
  ['How many times can you subtract 10 from 100?', ['once', '1', 'one', 'one time', '1 time'], 'What is it after the first time?', 'After once it is 90, not 100.'],
  ['What can you add to a bucket of water to make it lighter?', ['hole', 'a hole'], 'Think about what leaves the bucket.', 'A hole lets the water out.'],
  ['How far can a dog run into the woods?', ['halfway', 'half way', 'half', 'half of the way'], 'After that point, which way is it running?', 'After halfway it is running out.'],
  ['Before Mount Everest was discovered, what was the highest mountain on Earth?', ['everest', 'mount everest'], 'Discovering it didn\'t move it.', 'It was Everest all along.'],
  ['How many letters are in "the alphabet"?', ['11', 'eleven'], 'Count the letters in the two words.', 'T-H-E-A-L-P-H-A-B-E-T = 11.'],
  ['What has to be broken before you can use it?', ['egg', 'an egg'], 'Breakfast.', 'You crack an egg first.'],
  ['A man pushes his car to a hotel and tells the owner he\'s bankrupt. Why?', ['monopoly', 'playing monopoly', 'a game', 'board game'], 'He isn\'t really driving.', 'He is playing Monopoly.'],
  ['Mary\'s father has five daughters: Nana, Nene, Nini and Nono. What is the fifth daughter\'s name?', ['mary'], 'Read the first words again.', 'The fifth daughter is Mary.'],
  ['How much dirt is in a hole that is 3 feet deep, 3 feet wide and 3 feet long?', ['none', 'zero', 'nothing', '0', 'no dirt', 'no'], 'What is a hole?', 'A hole has no dirt in it.'],
  ['If an electric train travels north at 100 km/h and the wind blows west, which way does the smoke go?', ['none', 'nowhere', 'no smoke', 'electric', 'doesnt have smoke', 'no'], 'What powers the train?', 'Electric trains don\'t make smoke.'],
  ['What do you call a bear with no teeth?', ['gummy bear', 'gummy', 'a gummy bear'], 'It is a sweet.', 'A gummy bear.'],
  ['If you have only one match and walk into a dark room with a candle, a lamp and a fire, what do you light first?', ['match', 'the match'], 'What do you need before everything else?', 'The match.'],
  ['If it takes 5 machines 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?', ['5', 'five', '5 minutes', 'five minutes'], 'How long does ONE machine take to make ONE widget?', 'Each machine makes a widget in 5 minutes.'],
  ['What is the next letter in this sequence: O, T, T, F, F, S, S, ?', ['e', 'eight'], 'Think of counting.', 'One, Two, Three… the next is Eight.'],
  ['Two fathers and two sons go fishing. They each catch one fish, but only three fish are caught. How?', ['grandfather', 'three people', '3 people', 'a grandfather', 'grandfather father and son'], 'Count the people, not the roles.', 'Grandfather, father and son: only 3 people.'],
  ['What is the 3rd month if you count backwards from December?', ['october'], 'December, November, …', 'Dec, Nov, Oct.'],
];
const qEl = document.getElementById('qEl'), tagEl = document.getElementById('tagEl'), hintEl = document.getElementById('hintEl'), statusMsg = document.getElementById('statusMsg');
const input = document.getElementById('ansInput'), formEl = document.getElementById('formEl'), nextBtn = document.getElementById('nextBtn');
const hintBtn = document.getElementById('hintBtn'), revealBtn = document.getElementById('revealBtn'), kindBtns = document.querySelectorAll('[data-kind]');
let kind = 'riddle', deck = [], cur = null, answered = false, usedHint = false;
let st = JSON.parse(localStorage.getItem('riddles-stats') || '{"solved":0,"streak":0,"best":0}');
function showStats() { solvedVal.textContent = st.solved; streakVal.textContent = st.streak; bestVal.textContent = st.best; }
function save() { localStorage.setItem('riddles-stats', JSON.stringify(st)); showStats(); }

const norm = s => s.toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^(a|an|the|it is|its|they are|theyre|i think) /, '');
function isCorrect(user, answers) {
  const u = ' ' + norm(user) + ' '; if (u.trim() === '') return false;
  return answers.some(a => {
    const n = norm(a); if (!n) return false;
    if (/^[a-z]{1,2}$/.test(n)) return u.trim() === n;       // very short words must match exactly ("no", "e")
    return u.includes(' ' + n + ' ');
  });
}
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function nextQuestion() {
  if (!deck.length) deck = shuffle(kind === 'riddle' ? RIDDLES : TRICKS);
  cur = deck.pop(); answered = false; usedHint = false; window.__cur = cur;
  tagEl.textContent = kind === 'riddle' ? 'Riddle' : 'Trick question'; tagEl.className = 'rd-tag' + (kind === 'trick' ? ' trick' : '');
  qEl.textContent = cur[0]; hintEl.hidden = true; input.value = ''; input.className = 'rd-input';
  formEl.classList.remove('done'); nextBtn.hidden = true; hintBtn.hidden = false; revealBtn.hidden = false;
  statusMsg.textContent = kind === 'riddle' ? 'Think carefully…' : 'Careful — it\'s a trick!';
}
function finish(correct) {
  answered = true; formEl.classList.add('done'); nextBtn.hidden = false; hintBtn.hidden = true; revealBtn.hidden = true;
  const ans = cur[3] ? cur[3] : `Answer: ${cur[1][0]}`;
  if (correct) { st.solved++; st.streak++; st.best = Math.max(st.best, st.streak); statusMsg.textContent = `Correct! 🎉 ${ans}`; }
  else { st.streak = 0; statusMsg.textContent = `The answer: ${cur[3] || cur[1][0]}`; }
  save();
}
function check() {
  if (answered) return;
  if (isCorrect(input.value, cur[1])) { input.className = 'rd-input good'; finish(true); }
  else { input.className = 'rd-input'; void input.offsetWidth; input.className = 'rd-input bad'; statusMsg.textContent = 'Not quite — try again, or take a hint.'; }
}
document.getElementById('submitBtn').addEventListener('click', check);
input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
hintBtn.addEventListener('click', () => { hintEl.textContent = '💡 ' + cur[2]; hintEl.hidden = false; usedHint = true; });
revealBtn.addEventListener('click', () => finish(false));
nextBtn.addEventListener('click', nextQuestion);
kindBtns.forEach(b => b.addEventListener('click', () => { kind = b.dataset.kind; kindBtns.forEach(x => x.classList.toggle('active', x === b)); deck = []; nextQuestion(); }));
showStats(); nextQuestion();
window.__bank = { RIDDLES, TRICKS };
