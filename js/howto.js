/* howto.js — How to Play guides + Updates (changelog) for every XD_Arcade game.
 *
 * On a game page it adds a "?" button next to the pause button (the game is detected from the URL).
 * On the hub, call XDHowTo.openAll() / XDHowTo.openUpdates() from any button.
 *
 * TO ADD A NEW UPDATE:  add an object at the TOP of UPDATES below.
 * TO EDIT A GUIDE:      edit its entry in GUIDES (goal / controls / tips).
 *
 * Load this file BEFORE pause.js so Esc closes the guide first instead of toggling pause.
 *   data-button="0"  on the script tag = don't add the floating "?" button (the page wires its own buttons)
 */
(function () {
  'use strict';
  if (window.XDHowTo) return;
  const me = document.currentScript;
  const AUTO_BUTTON = !(me && me.dataset.button === '0');

  // ====================================================== UPDATES (newest first)
  const UPDATES = [
    { date: 'Nov 14, 2026', tag: 'NEW', title: 'Lagos Rush · Dashboard, Shop and a real road',
      items: ['New home dashboard: see your character up close, swipe through all 6 with the arrows and buy new ones.',
              '🛒 Shop: buy Okada Head Start, Jara Magnet, Ankara Shield, Double Naira and Second Chance, and take them on your next run.',
              '⬆️ Upgrades: make magnets and okada rides last longer and get more power-ups on the road.',
              'The road now bends left and right, and has junctions with side streets, zebra crossings and traffic lights.',
              'Danfos and trucks signal and turn off into the side streets.',
              'New slide: a smooth lean-back slide instead of the flat block.'] },
    { date: 'Nov 13, 2026', title: 'Chess and Checkers, wooden boards',
      items: ['New wooden board and table look, like a real board game.',
              'The board now fits any screen on its own: phone, tablet, desktop, even after rotating.',
              '🎨 Theme button: pick a board (Classic Wood, Walnut, Tournament, Ice, Midnight) and a background (Oak, Dark wood, Green felt, Sunset, Night). Your choice is saved.'] },
    { date: 'Nov 11, 2026', title: 'How to Play + Updates',
      items: ['Every game now has a ? button next to the pause button with its rules, controls and tips.',
              'The hub has a How to Play guide for all 24 games and this Updates page.',
              'Lagos Rush has a full guide: obstacles, power-ups, outfits and story characters.'] },
    { date: 'Oct 23, 2026', title: 'Lagos Rush · Story characters',
      items: ['Play as Officer Bala (chase the Yahoo Boy) or Slim Jay (run from the police).',
              'Short animated story scenes before each story run. You can skip them.',
              'Smoother traffic: every lane flows at its own steady speed and danfos stop at bus bays.'] },
    { date: 'Oct 21, 2026', title: 'Pause on every game',
      items: ['A ❚❚ pause button on every game. Press Esc on a keyboard to pause or resume.',
              'Timers, countdowns and animations all freeze while paused.',
              'Real-time games pause automatically if you leave the tab, and resume with a 3-2-1.'] },
    { date: 'Oct 18, 2026', title: 'Lagos Rush 3D + Scores',
      items: ['Lagos Rush, a 3D run through Lagos, joins the arcade: dodge danfos, collect naira, unlock outfits.',
              '🏆 Scores page shows your total across all games.',
              'Chess and Checkers with a CPU opponent and a 2-player option.'] },
  ];

  // ====================================================== GUIDES
  const g = (name, emoji, goal, controls, tips) => ({ name, emoji, sections: [
    { h: 'Goal', p: goal }, { h: 'Controls', li: controls }, { h: 'Tips', li: tips } ] });

  const GUIDES = {
    lagosrush: { name: 'Lagos Rush', emoji: '🚌', sections: [
      { h: 'Goal', p: 'Run down a busy Lagos road for as long as you can. Dodge the traffic, grab naira (₦) and beat your best score. Score = distance + naira × 10 + bonuses.' },
      { h: 'Controls', li: [
        '📱 Swipe left / right to change lane (3 lanes)',
        '📱 Swipe up (or tap) to jump · swipe down to slide',
        '⌨️ ← → or A D to change lane · ↑ / W / Space to jump · ↓ / S to slide (lean back and slide under banners)',
        '❚❚ Top-right pauses the run' ] },
      { h: 'What is on the road', li: [
        '🚌 Danfos and 🚚 trucks are too big to jump. Change lane.',
        '🚦 At junctions, a danfo waiting in the outer lane flashes its indicator and turns into the side street. Wait for it to leave, or switch lane.',
        '🏍️ Okadas: change lane or jump over them.',
        '🚧 Road barriers: jump. 🪧 Banners: slide under.',
        'Road-works walls across every lane: jump or slide through.',
        'The extra lane at the road edge is a bus bay where danfos stop. You can never enter it.' ] },
      { h: 'Naira and bonuses', li: [
        '₦ Coins are worth 10 points each and are added to your naira wallet.',
        'Squeeze past a danfo, truck or okada without touching it for a +50 near-miss bonus.',
        'Speed rises the further you go.' ] },
      { h: 'Home dashboard and Shop', li: [
        'Use ‹ › or tap a face to look at each character. Owned characters are worn straight away. Tap the price to buy a new one.',
        '🛒 Shop → Boosters: Okada Head Start ₦120, Jara Magnet ₦80, Ankara Shield ₦100, Double Naira ₦150, Second Chance ₦250.',
        'Bought boosters show on the home screen. Tap one to switch it on or off for your next run, and each switched-on one is used up when you start.',
        '🙏 Second Chance saves you from one fatal crash and clears the road ahead.',
        '⬆️ Shop → Upgrades: Magnet Power, Okada Power and Lucky Road make your power-ups last longer and appear more often.' ] },
      { h: 'Power-ups', li: [
        '🧲 Jara Magnet (9 s): pulls nearby coins to you.',
        '🛡️ Ankara Shield: absorbs your next crash.',
        '⚡ Okada / Lady-bike ride (5 s): extra speed, and you smash through traffic for +100 each.' ] },
      { h: 'Outfits and story characters', li: [
        'Your naira is saved between runs. Spend it in the menu: Ankara ₦150, Agbada ₦400, Street ₦800.',
        '🚔 Officer Bala (₦600): chase a Yahoo Boy. Collect naira, make near-misses and clear barriers, okadas and banners to close the gap, then arrest him for a bonus.',
        '💰 Slim Jay (₦900): the police are behind you. Running clean builds your lead. Each crash is a stumble that costs 11 m. Three stumbles close together and you are caught.',
        'Story scenes play before these runs. Tap Skip to jump straight in.' ] },
      { h: 'Tips', li: [
        'Stay in the middle lane when you can. It keeps both escapes open.',
        'Press jump a moment early. The game remembers it and jumps as soon as you land.',
        'Press slide while in the air to drop to the ground fast.',
        'After a run, tap Share to send your score on WhatsApp.' ] },
    ] },

    sudoku: g('Sudoku', '🔢', 'Fill the 9×9 grid so every row, column and 3×3 box contains the digits 1 to 9 exactly once.',
      ['Tap a cell, then tap a number 1–9 below the grid', 'Erase clears the selected cell', '⌨️ Arrow keys move, 1–9 enter a digit, Backspace / Delete erases', 'Pick Easy, Medium or Hard, then tap New game'],
      ['Start with rows, columns or boxes that are almost full.', 'Mistakes are counted, so look for the only possible spot for a digit before you guess.']),
    minesweeper: g('Minesweeper', '💣', 'Uncover every safe square without touching a mine.',
      ['Tap to dig a square', 'Long-press a square (or switch to 🚩 Flag mode) to flag a mine', '🖱️ Right-click also flags', 'Choose Easy, Medium or Hard'],
      ['A number tells you how many mines touch that square.', 'Your first dig is safe. Open big empty areas first.']),
    wordguess: g('Word Guess', '🔤', 'Find the hidden 5-letter word in 6 tries.',
      ['Type with the on-screen keys or your keyboard', 'Enter submits a guess, Backspace deletes', 'New word starts another round'],
      ['🟩 right letter, right spot · 🟨 right letter, wrong spot · ⬜ not in the word.', 'Open with a word that has common letters, and reuse the greens and yellows.']),
    sliding: g('Sliding Puzzle', '🧩', 'Slide the tiles until the numbers are in order, with the gap in the last corner.',
      ['Tap a tile next to the gap to slide it', 'Choose 3×3, 4×4 or 5×5', 'Shuffle makes a new puzzle'],
      ['Solve the top row first, then the next one, and leave the last two rows for the end.', 'Time and moves are tracked, so go for fewer moves.']),
    lightsout: g('Lights Out', '💡', 'Turn every light off.',
      ['Tap a cell to flip it and its four neighbours', '💡 Hint highlights a good cell to tap', '↺ Restart level or Next level →'],
      ['Work row by row from the top. Each light you fix in a row is cleared by tapping the cell below it.', 'Use Restart level if you get stuck, or Hint for a suggested tap.']),
    memory: g('Memory Match', '🃏', 'Flip cards two at a time and find all the matching pairs as fast as you can.',
      ['Tap a card to flip it, then tap a second card', 'New game reshuffles the board'],
      ['Remember where the cards were, not only the ones you matched.', 'Your best result is saved.']),
    '2048': g('2048', '🔥', 'Slide and merge matching tiles to make a 2048 tile.',
      ['📱 Swipe in any direction', '⌨️ Arrow keys', 'New game starts over'],
      ['Keep your biggest tile in a corner and build next to it.', 'Pick one or two directions and avoid swiping the opposite way unless you have to.', 'You can keep playing after you reach 2048.']),
    hangman: g('Hangman', '🪢', 'Guess the hidden word one letter at a time before you run out of lives.',
      ['Tap a letter to guess it (or type it)', 'You get 6 lives, and each wrong letter costs one', 'New word starts another round'],
      ['Start with vowels: E, A, O and I.', 'The category and letter count shown above the word are clues.']),
    mathrush: g('Math Rush', '➕', 'Solve as many sums as you can in 30 seconds.',
      ['Type the answer. It checks automatically', 'Backspace fixes a digit', 'Choose a level, then Start'],
      ['Do not wait for Enter. When the number is right it moves on.', 'Skip the sums you find too hard and keep the streak going.']),
    riddles: g('Riddles & Tricks', '🧠', 'Solve riddles and trick questions.',
      ['Type your answer and press Check (or Enter)', '💡 Hint gives a nudge', 'Show answer reveals it and Next → moves on'],
      ['Read the question twice. Many riddles are about wording.', 'Switch between riddles and trick questions at the top. Try a Hint before you reveal the answer.']),
    snake: g('Snake', '🐍', 'Eat the food to grow longer without hitting the walls or your own tail.',
      ['📱 Swipe or use the on-screen arrows', '⌨️ Arrow keys', 'Tap Start or press any arrow key to begin'],
      ['Plan a few moves ahead and keep space around your tail.', 'Do not turn straight back on yourself.']),
    simon: g('Simon', '🎵', 'Watch the colour-and-sound pattern, then repeat it. It gets one step longer every round.',
      ['Tap START', 'Watch the pads light up, then tap them in the same order'],
      ['Say the colours in your head as they light up.', 'One wrong pad ends the game, and your best round is saved.']),
    whack: g('Whack-a-Mole', '🔨', 'Whack as many moles as you can in 30 seconds.',
      ['Tap or click the mole when it pops up', 'Tap Start'],
      ['🐹 +1 · 🌟 +3 · 💣 −3. Do not touch the bombs!', 'Look at the whole board, not one hole.']),
    tictactoe: g('Tic-Tac-Toe', '⭕', 'Get three of your marks in a row: across, down or diagonally.',
      ['Tap an empty square to place your mark', 'Choose 2 Player (one screen) or vs CPU, then pick Easy, Medium or Expert', 'New round starts again'],
      ['Take the centre first, then the corners.', 'Block the CPU\'s two-in-a-row before you make your own.']),
    connect4: g('Connect Four', '🔴', 'Drop discs into the grid and connect four of yours in a row: across, down or diagonally.',
      ['Tap a column to drop a disc there', 'Play the CPU (Easy / Medium / Hard) or a friend on the same screen', 'New round restarts'],
      ['The centre column gives you the most ways to win.', 'Build two threats at once. The CPU can only block one.']),
    flap: g('Flap', '🐦', 'Fly through the gaps in the pipes. Every pipe you pass is a point.',
      ['Tap, click or press Space / ↑ to flap'],
      ['Short, steady taps work better than panic taps.', 'Aim for the middle of each gap.']),
    breakout: g('Breakout', '🧱', 'Bounce the ball off your paddle and smash all the bricks.',
      ['Drag to move the paddle (or ← → / A D on a keyboard)', 'Tap (or press Space) to launch the ball'],
      ['You have 3 lives. Do not let the ball fall past the paddle.', 'Hit the ball with the edge of the paddle to change its angle.', 'Clear the board to go up a level.']),
    blocks: g('Blocks', '🟦', 'Stack the falling shapes and fill complete rows to clear them.',
      ['⌨️ ← → / A D move · ↑ rotates · ↓ drops slowly · Space drops straight down', '📱 Use the on-screen buttons: ← ↻ → ↓ ⤓'],
      ['Keep the stack flat and avoid leaving holes.', 'Clearing several lines at once scores more.', 'The pieces fall faster as your level goes up.']),
    rps: g('Rock Paper Scissors', '✂️', 'Beat the CPU. 🪨 beats ✂️, ✂️ beats 📄, 📄 beats 🪨.',
      ['Tap Rock, Paper or Scissors', 'Reset score clears the tally'],
      ['It is a game of luck, so do not read too much into streaks.']),
    reflex: g('Reflex', '⚡', 'Test your reaction time over 5 rounds.',
      ['Tap the screen to start', 'Wait for the screen to turn green, then tap as fast as you can (Space also works)'],
      ['Tapping before it turns green says "Too soon!" and you retry that round, so wait for green.', 'Your best time and average are shown at the end.']),
    pong: g('Pong', '🏓', 'First to 7 points wins the match against the CPU.',
      ['Drag to move your paddle (or ← → on a keyboard)', 'Tap (or press Space) to serve', 'Pick Easy, Medium or Hard for the CPU'],
      ['Hit the ball with the edge of your paddle to send it at a sharper angle.', 'Your win/loss record is kept.']),
    checkers: g('Checkers', '⚫', 'Capture all of your opponent\'s pieces, or block them so they cannot move.',
      ['Tap a piece, then tap where to move it', 'Play the CPU (Easy / Medium / Hard) or a friend (2 Player) on the same screen', 'New game restarts', '🎨 Theme changes the board and background'],
      ['Pieces move diagonally forward. Reach the far row to become a king.', 'If a capture is available you must take it.', '40 moves without a capture is a draw.']),
    chess: g('Chess', '♟️', 'Checkmate the opponent\'s king, with full chess rules.',
      ['Tap a piece, then tap a highlighted square to move', 'Play the CPU (Easy / Medium / Hard) or a friend on the same screen', '↶ Undo takes back your last move. New game restarts', '🎨 Theme changes the board and background', 'A pawn that reaches the last row lets you pick a piece to promote to'],
      ['Control the centre and bring your knights and bishops out early.', 'Castle early to keep your king safe.', 'Stalemate (no legal move but not in check) is a draw.']),
  };

  // ====================================================== modal
  const CSS = `
.xd-help-btn{position:absolute;right:62px;top:22px;z-index:50;width:38px;height:38px;border-radius:50%;border:1px solid #2a3040;background:#12161F;color:#FFD23D;font:700 17px/1 'Bebas Neue',Impact,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.xd-help-btn:hover{border-color:#FFD23D}
.xd-help-btn.floating{position:fixed;top:12px}
.xd-help-btn.pulse{animation:xdPulse 1.8s ease-out 3}
@keyframes xdPulse{0%{box-shadow:0 0 0 0 rgba(255,210,61,.6)}100%{box-shadow:0 0 0 14px rgba(255,210,61,0)}}
.xd-hw{position:fixed;inset:0;z-index:100000;background:rgba(11,14,20,.92);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:14px;font-family:'Inter',system-ui,sans-serif;color:#F5F5F0;touch-action:pan-y;user-select:text;-webkit-user-select:text}
.xd-hw[hidden]{display:none}
.xd-hw-card{width:min(560px,100%);max-height:100%;display:flex;flex-direction:column;background:#12161F;border:1px solid #2a3040;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.xd-hw-head{display:flex;align-items:center;gap:10px;padding:14px 16px 10px}
.xd-hw-title{font-family:'Bebas Neue',Impact,sans-serif;font-size:30px;letter-spacing:2px;line-height:1;flex:1}
.xd-hw-x{width:36px;height:36px;border-radius:50%;border:1px solid #2a3040;background:#0B0E14;color:#F5F5F0;font-size:16px;cursor:pointer;padding:0}
.xd-hw-x:hover{border-color:#FF3D6E}
.xd-hw-tabs{display:flex;gap:6px;padding:0 16px 10px}
.xd-hw-tab{flex:1;font:600 14px 'Inter',system-ui,sans-serif;padding:9px 10px;border-radius:10px;border:1px solid #2a3040;background:#0B0E14;color:#8A8F9C;cursor:pointer}
.xd-hw-tab[aria-selected=true]{background:#FF3D6E;border-color:#FF3D6E;color:#fff}
.xd-hw-body{overflow-y:auto;overscroll-behavior:contain;padding:4px 16px 18px;font-size:14.5px;line-height:1.55;-webkit-overflow-scrolling:touch}
.xd-hw-body h3{font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;letter-spacing:1.5px;font-size:20px;color:#FFD23D;margin:16px 0 6px}
.xd-hw-body h3:first-child{margin-top:4px}
.xd-hw-body p{color:#D9DBE0}
.xd-hw-body ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:7px}
.xd-hw-body li{background:#0B0E14;border:1px solid #1e2430;border-radius:10px;padding:8px 11px;color:#D9DBE0}
.xd-hw-sub{color:#8A8F9C;font-size:13px;margin-bottom:10px}
.xd-hw-up{border:1px solid #2a3040;border-radius:12px;padding:12px 13px;margin-bottom:10px;background:#0B0E14}
.xd-hw-up h4{font-size:15px;margin:2px 0 6px;font-weight:700}
.xd-hw-up .d{font-size:12px;color:#8A8F9C;letter-spacing:.5px}
.xd-hw-up .n{display:inline-block;background:#FF3D6E;color:#fff;font-size:10px;font-weight:800;letter-spacing:1px;padding:2px 7px;border-radius:20px;margin-left:8px;vertical-align:1px}
.xd-hw-up ul{gap:4px}
.xd-hw-up li{background:none;border:none;padding:0 0 0 16px;position:relative;color:#D9DBE0}
.xd-hw-up li::before{content:'•';position:absolute;left:3px;color:#FFD23D}
.xd-hw details{border:1px solid #2a3040;border-radius:12px;margin-bottom:8px;background:#0B0E14}
.xd-hw summary{cursor:pointer;padding:11px 13px;font-weight:600;list-style:none;display:flex;align-items:center;gap:10px}
.xd-hw summary::-webkit-details-marker{display:none}
.xd-hw summary::after{content:'＋';margin-left:auto;color:#8A8F9C}
.xd-hw details[open] summary::after{content:'－'}
.xd-hw details .in{padding:0 13px 13px}
@media (max-width:420px){.xd-hw{padding:8px}.xd-hw-body{font-size:14px}}`;

  let root, titleEl, tabsEl, bodyEl, open = false, curKey = null, curTab = 'guide', lastFocus = null, weFroze = false;

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function sectionsHTML(sections) {
    return sections.map(s => '<h3>' + esc(s.h) + '</h3>' + (s.p ? '<p>' + esc(s.p) + '</p>' : '') +
      (s.li ? '<ul>' + s.li.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '')).join('');
  }
  function updatesHTML() {
    return '<div class="xd-hw-sub">What changed in XD_Arcade, newest first.</div>' + UPDATES.map(u =>
      '<div class="xd-hw-up"><div class="d">' + esc(u.date) + (u.tag ? '<span class="n">' + esc(u.tag) + '</span>' : '') + '</div><h4>' + esc(u.title) + '</h4><ul>' +
      u.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>').join('');
  }
  function allHTML() {
    const hub = [
      { h: 'Getting started', li: ['Tap any cabinet on the home screen to play.', 'Inside a game, tap ? for that game\'s rules and ❚❚ to pause (Esc on a keyboard).', 'Install XD_Arcade from your browser to play offline, with no connection needed.', 'Your best scores are saved on this device, and 🏆 Scores shows your total.'] }];
    const order = ['lagosrush', 'sudoku', 'minesweeper', 'wordguess', 'sliding', 'lightsout', 'memory', '2048', 'hangman', 'mathrush', 'riddles', 'snake', 'simon', 'whack', 'tictactoe', 'connect4', 'flap', 'breakout', 'blocks', 'rps', 'reflex', 'pong', 'checkers', 'chess'];
    return sectionsHTML(hub) + '<h3>All games</h3>' + order.map(k => { const G = GUIDES[k]; return '<details' + '><summary><span>' + G.emoji + '</span>' + esc(G.name) + '</summary><div class="in">' + sectionsHTML(G.sections) + '</div></details>'; }).join('');
  }

  function render() {
    const G = curKey && GUIDES[curKey];
    const guideLabel = G ? 'How to play' : 'How to play';
    titleEl.textContent = curTab === 'updates' ? "What's new" : (G ? G.emoji + ' ' + G.name : 'How to play');
    tabsEl.innerHTML = '<button type="button" class="xd-hw-tab" role="tab" data-t="guide" aria-selected="' + (curTab === 'guide') + '">' + guideLabel + '</button>' +
      '<button type="button" class="xd-hw-tab" role="tab" data-t="updates" aria-selected="' + (curTab === 'updates') + '">What\'s new</button>';
    bodyEl.innerHTML = curTab === 'updates' ? updatesHTML() : (G ? sectionsHTML(G.sections) : allHTML());
    bodyEl.scrollTop = 0;
  }

  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.className = 'xd-hw'; root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'How to play');
    root.innerHTML = '<div class="xd-hw-card"><div class="xd-hw-head"><div class="xd-hw-title"></div><button type="button" class="xd-hw-x" aria-label="Close">✕</button></div><div class="xd-hw-tabs" role="tablist"></div><div class="xd-hw-body"></div></div>';
    document.body.appendChild(root);
    titleEl = root.querySelector('.xd-hw-title'); tabsEl = root.querySelector('.xd-hw-tabs'); bodyEl = root.querySelector('.xd-hw-body');
    root.addEventListener('click', e => {
      if (e.target === root || e.target.closest('.xd-hw-x')) { close(); return; }
      const t = e.target.closest('.xd-hw-tab'); if (t) { curTab = t.dataset.t; render(); }
    });
    root.addEventListener('contextmenu', e => e.stopPropagation());
  }

  function openModal(key, tab) {
    build(); curKey = key; curTab = tab; lastFocus = document.activeElement; render();
    root.hidden = false; open = true;
    // freeze a running game while the guide is on screen
    const P = window.__xdPause; weFroze = false;
    if (P && !P.paused) { P.pause(); weFroze = true; }
    root.querySelector('.xd-hw-x').focus();
    if (key) { try { localStorage.setItem('xd-howto-seen-' + key, '1'); } catch (e) {} const b = document.querySelector('.xd-help-btn'); if (b) b.classList.remove('pulse'); }
  }
  function close() {
    if (!open) return;
    root.hidden = true; open = false;
    const P = window.__xdPause;
    if (weFroze && P && P.paused) P.resume();   // uses the 3-2-1 countdown on real-time games
    weFroze = false;
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  // Esc closes the guide (runs before pause.js, which is loaded after this file)
  window.addEventListener('keydown', e => {
    if (open && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  }, true);

  // ---- floating ? button on game pages ----
  function gameKey() { const m = location.pathname.match(/\/games\/([^/]+)\//); return m ? decodeURIComponent(m[1]) : null; }
  function addButton() {
    const key = gameKey(); if (!key || !GUIDES[key] || !AUTO_BUTTON) return;
    build();
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'xd-help-btn'; btn.textContent = '?'; btn.setAttribute('aria-label', 'How to play');
    const header = document.querySelector('.game-header');
    if (header) { if (getComputedStyle(header).position === 'static') header.style.position = 'relative'; header.appendChild(btn); }
    else { btn.classList.add('floating'); document.body.appendChild(btn); }
    let seen = false; try { seen = !!localStorage.getItem('xd-howto-seen-' + key); } catch (e) {}
    if (!seen) btn.classList.add('pulse');
    btn.addEventListener('click', () => openModal(key, 'guide'));
    window.dispatchEvent(new Event('resize'));   // lets pause.js re-fit long game titles around the new button
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton); else addButton();

  window.XDHowTo = {
    open: key => openModal(key || gameKey(), 'guide'),
    openAll: () => openModal(null, 'guide'),
    openUpdates: () => openModal(gameKey(), 'updates'),
    close, GUIDES, UPDATES,
  };
})();
