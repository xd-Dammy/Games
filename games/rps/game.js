const EMOJI = { rock: '🪨', paper: '📄', scissors: '✂️' };
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const handYou = document.getElementById('handYou'), handCpu = document.getElementById('handCpu'), statusMsg = document.getElementById('statusMsg');
const btns = document.querySelectorAll('.rps-btn');
let scores = JSON.parse(localStorage.getItem('rps-scores') || '{"a":0,"b":0,"d":0}'), busy = false;
function showScores() { scoreA.textContent = scores.a; scoreB.textContent = scores.b; scoreD.textContent = scores.d; }
function play(move) {
  if (busy) return; busy = true; btns.forEach(b => b.disabled = true);
  handYou.className = handCpu.className = 'rps-hand shake'; handYou.textContent = handCpu.textContent = '✊';
  statusMsg.textContent = 'Rock… paper… scissors…';
  setTimeout(() => {
    const keys = Object.keys(EMOJI), cpu = keys[Math.floor(Math.random() * 3)];
    handYou.textContent = EMOJI[move]; handCpu.textContent = EMOJI[cpu]; handYou.className = handCpu.className = 'rps-hand';
    if (move === cpu) { scores.d++; statusMsg.textContent = "It's a draw."; }
    else if (BEATS[move] === cpu) { scores.a++; handYou.classList.add('win'); handCpu.classList.add('lose'); statusMsg.textContent = `${cap(move)} beats ${cpu}. You win! 🎉`; }
    else { scores.b++; handCpu.classList.add('win'); handYou.classList.add('lose'); statusMsg.textContent = `${cap(cpu)} beats ${move}. CPU wins.`; }
    localStorage.setItem('rps-scores', JSON.stringify(scores)); showScores();
    busy = false; btns.forEach(b => b.disabled = false);
  }, 550);
}
const cap = s => s[0].toUpperCase() + s.slice(1);
btns.forEach(b => b.addEventListener('click', () => play(b.dataset.move)));
document.getElementById('resetBtn').addEventListener('click', () => { scores = { a: 0, b: 0, d: 0 }; localStorage.setItem('rps-scores', JSON.stringify(scores)); showScores(); handYou.textContent = handCpu.textContent = '❔'; handYou.className = handCpu.className = 'rps-hand'; statusMsg.textContent = 'Pick your move'; });
showScores();
