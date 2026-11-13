/* boardtheme.js — board games (Chess, Checkers):
 *   1) auto-fits the board to the screen (width AND height, any phone / desktop / rotation)
 *   2) 🎨 Theme picker: board style + table background, remembered on this device
 * Add new looks in BOARDS / TABLES below (and a matching html[data-...] block in css/boardkit.css).
 * Load in <head>, before pause.js, so the saved look is applied before the first paint.
 */
(function () {
  'use strict';
  const BOARDS = [
    { id: 'wood',       name: 'Classic Wood',  l: '#ecd0a1', d: '#b07a46' },
    { id: 'walnut',     name: 'Walnut',        l: '#d5aa7b', d: '#6e4527' },
    { id: 'tournament', name: 'Tournament',    l: '#eeeed2', d: '#769656' },
    { id: 'ice',        name: 'Ice',           l: '#dfe5e8', d: '#8aa3b0' },
    { id: 'midnight',   name: 'Midnight',      l: '#5a6486', d: '#2a3048' },
  ];
  const TABLES = [
    { id: 'oak',    name: 'Oak table',   bg: 'linear-gradient(180deg,#9b6a38,#744a22)' },
    { id: 'dark',   name: 'Dark wood',   bg: 'linear-gradient(180deg,#3a2517,#1f130b)' },
    { id: 'felt',   name: 'Green felt',  bg: 'radial-gradient(circle at 50% 40%,#2c7a50,#123a25)' },
    { id: 'sunset', name: 'Sunset',      bg: 'linear-gradient(160deg,#2f1c4a,#a03a4f 58%,#f08a4b)' },
    { id: 'night',  name: 'Night',       bg: '#0B0E14' },
  ];
  const KB = 'xd-board-style', KT = 'xd-board-table';
  const get = (k, list) => { try { const v = localStorage.getItem(k); if (list.some(x => x.id === v)) return v; } catch (e) {} return list[0].id; };
  const root = document.documentElement;
  let board = get(KB, BOARDS), table = get(KT, TABLES);
  root.dataset.board = board; root.dataset.table = table;
  const save = () => { try { localStorage.setItem(KB, board); localStorage.setItem(KT, table); } catch (e) {} };

  // ---------------- auto-fit ----------------
  let boardEl, mainEl, headerEl;
  function fit() {
    if (!boardEl || !mainEl) return;
    const cs = getComputedStyle(mainEl);
    const kids = [...mainEl.children].filter(c => c !== boardEl && getComputedStyle(c).display !== 'none');
    const gap = parseFloat(cs.rowGap) || 0, pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const used = kids.reduce((s, c) => s + c.offsetHeight, 0) + gap * kids.length;   // gaps between all items, board included
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const availH = vh - (headerEl ? headerEl.offsetHeight : 0) - pad - used;
    const availW = Math.min(window.innerWidth * 0.96, 760);
    const size = Math.floor(Math.max(240, Math.min(availW, availH)));
    boardEl.style.setProperty('--bs', size + 'px');
    mainEl.style.setProperty('--bs-w', size + 'px');
  }

  // ---------------- picker ----------------
  let wrap, open = false, lastFocus;
  function opts(list, cur, kind) {
    return list.map(o => '<button type="button" class="bt-opt" data-k="' + kind + '" data-id="' + o.id + '" aria-pressed="' + (o.id === cur) + '">' +
      (kind === 'board'
        ? '<span class="bt-sw bt-bd">' + [0,1,2,3,1,0,3,2,0,1,2,3,1,0,3,2].map((n, i) => '<i style="background:' + (((i % 4) + Math.floor(i / 4)) % 2 ? o.d : o.l) + '"></i>').join('') + '</span>'
        : '<span class="bt-sw" style="background:' + o.bg + '"></span>') +
      '<span>' + o.name + '</span></button>').join('');
  }
  function renderPicker() {
    wrap.querySelector('.bt-boards').innerHTML = opts(BOARDS, board, 'board');
    wrap.querySelector('.bt-tables').innerHTML = opts(TABLES, table, 'table');
  }
  function build() {
    wrap = document.createElement('div'); wrap.className = 'bt-wrap'; wrap.hidden = true;
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Theme');
    wrap.innerHTML = '<div class="bt-card"><div class="bt-head"><h2>🎨 Theme</h2><button type="button" class="bt-x" aria-label="Close">✕</button></div>' +
      '<h3>Board</h3><div class="bt-grid bt-boards"></div><h3>Background</h3><div class="bt-grid bt-tables"></div>' +
      '<p class="bt-hint">Your choice is saved on this device and used in Chess and Checkers.</p></div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', e => {
      if (e.target === wrap || e.target.closest('.bt-x')) { toggle(false); return; }
      const b = e.target.closest('.bt-opt'); if (!b) return;
      if (b.dataset.k === 'board') board = b.dataset.id; else table = b.dataset.id;
      root.dataset.board = board; root.dataset.table = table; save(); renderPicker();
    });
  }
  function toggle(show) {
    if (!wrap) build();
    open = show; wrap.hidden = !show;
    if (show) { lastFocus = document.activeElement; renderPicker(); wrap.querySelector('.bt-x').focus(); }
    else if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }
  window.addEventListener('keydown', e => { if (open && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); toggle(false); } }, true);

  function init() {
    boardEl = document.getElementById('board'); mainEl = document.querySelector('.game-main'); headerEl = document.querySelector('.game-header');
    if (!boardEl || !mainEl) return;
    document.body.classList.add('board-game'); boardEl.classList.add('board-frame');
    const row = document.getElementById('resetBtn') && document.getElementById('resetBtn').parentElement;
    if (row) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mode-btn'; b.id = 'themeBtn'; b.textContent = '🎨 Theme';
      b.addEventListener('click', () => toggle(true)); row.appendChild(b);
    }
    fit();
    window.addEventListener('resize', fit); window.addEventListener('orientationchange', () => setTimeout(fit, 150));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    if (window.ResizeObserver) { const ro = new ResizeObserver(fit); [...mainEl.children].forEach(c => { if (c !== boardEl) ro.observe(c); }); if (headerEl) ro.observe(headerEl); }
    setTimeout(fit, 300);   // after pause.js / howto.js add their header buttons
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
