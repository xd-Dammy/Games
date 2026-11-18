/* gamekit.js — loaded in <head> of every game page.
 *  1) BACKGROUND: applies the saved background (html[data-table]) before the page paints, and adds a "🎨 Background" button
 *     with a picker. The choice is shared by all games (same key chess and checkers already used).
 *  2) AUTO-FIT: any element with data-fit="square" (or "tall") inside .game-main is sized to the space left on the screen.
 * To add a background: add it to TABLES below and a html[data-table="id"] block in css/gamekit.css.
 */
(function () {
  'use strict';
  const TABLES = [
    { id: 'lagos',  name: 'Lagos dusk',  bg: 'linear-gradient(180deg,#2a1745,#8a3a5c 58%,#f08a4b)' },
    { id: 'oak',    name: 'Oak table',   bg: 'linear-gradient(180deg,#9b6a38,#744a22)' },
    { id: 'dark',   name: 'Dark wood',   bg: 'linear-gradient(180deg,#3a2517,#1f130b)' },
    { id: 'felt',   name: 'Green felt',  bg: 'radial-gradient(circle at 50% 40%,#2c7a50,#123a25)' },
    { id: 'ocean',  name: 'Deep ocean',  bg: 'linear-gradient(180deg,#0d4c78,#06182c)' },
    { id: 'neon',   name: 'Neon grid',   bg: 'linear-gradient(135deg,#34115c,#0b0714)' },
    { id: 'sunset', name: 'Sunset',      bg: 'linear-gradient(160deg,#2f1c4a,#a03a4f 58%,#f08a4b)' },
    { id: 'night',  name: 'Night',       bg: '#0B0E14' },
  ];
  const KEY = 'xd-board-table', root = document.documentElement;
  const isBoardGame = /\/games\/(chess|checkers)\//.test(location.pathname);
  const dflt = isBoardGame ? 'oak' : 'lagos';
  const getTable = () => { try { const v = localStorage.getItem(KEY); if (TABLES.some(t => t.id === v)) return v; } catch (e) {} return dflt; };
  const setTable = id => { try { localStorage.setItem(KEY, id); } catch (e) {} root.dataset.table = id; };
  root.dataset.table = getTable();

  // ---------------- picker (background only; chess/checkers have their own picker with a board section too) ----------------
  let wrap, open = false, lastFocus;
  function opts() {
    const cur = getTable();
    return TABLES.map(o => '<button type="button" class="bt-opt" data-id="' + o.id + '" aria-pressed="' + (o.id === cur) + '"><span class="bt-sw" style="background:' + o.bg + '"></span><span>' + o.name + '</span></button>').join('');
  }
  function toggle(show) {
    if (!wrap) {
      wrap = document.createElement('div'); wrap.className = 'bt-wrap'; wrap.hidden = true;
      wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Background');
      wrap.innerHTML = '<div class="bt-card"><div class="bt-head"><h2>🎨 Background</h2><button type="button" class="bt-x" aria-label="Close">✕</button></div><div class="bt-grid"></div><p class="bt-hint">Saved on this device and used in every game.</p></div>';
      document.body.appendChild(wrap);
      wrap.addEventListener('click', e => {
        if (e.target === wrap || e.target.closest('.bt-x')) { toggle(false); return; }
        const b = e.target.closest('.bt-opt'); if (!b) return;
        setTable(b.dataset.id); wrap.querySelector('.bt-grid').innerHTML = opts();
      });
    }
    open = show; wrap.hidden = !show;
    if (show) { lastFocus = document.activeElement; wrap.querySelector('.bt-grid').innerHTML = opts(); wrap.querySelector('.bt-x').focus(); }
    else if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }
  window.addEventListener('keydown', e => { if (open && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); toggle(false); } }, true);

  // ---------------- auto-fit ----------------
  function fitOne(el) {
    const main = document.querySelector('.game-main'), header = document.querySelector('.game-header'); if (!main) return;
    let top = el; while (top.parentElement && top.parentElement !== main) top = top.parentElement;
    const cs = getComputedStyle(main), gap = parseFloat(cs.rowGap) || 0, pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const others = [...main.children].filter(c => c !== top && getComputedStyle(c).display !== 'none');
    const used = others.reduce((s, c) => s + c.offsetHeight + (parseFloat(getComputedStyle(c).marginTop) || 0) * (c.classList.contains('touch-controls') || c.classList.contains('bl-pad') ? 0 : 1), 0) + gap * others.length;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const availH = Math.max(0, vh - (header ? header.offsetHeight : 0) - pad - used - 6);
    if (el.dataset.fit === 'tall') {                                          // portrait field next to a side panel (Blocks)
      const side = el.querySelector('.bl-side'), sideW = side ? side.offsetWidth + 14 : 0;
      el.style.setProperty('--fh', Math.floor(Math.max(260, Math.min(availH, (window.innerWidth * 0.96 - sideW) * 2, 620))) + 'px');
    } else if (el.dataset.fit === 'ratio') {                                  // portrait canvas with a fixed width:height ratio (Flap, Breakout)
      const r = parseFloat(el.dataset.ratio) || 0.727;
      el.style.setProperty('--bs', Math.floor(Math.max(200, Math.min(availH * r, window.innerWidth * 0.94, 380))) + 'px');
    } else {                                                                  // square field (Snake, 2048)
      el.style.setProperty('--bs', Math.floor(Math.max(240, Math.min(availH, window.innerWidth * 0.96, 640))) + 'px');
    }
  }
  let raf = 0;
  function fitAll() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { document.querySelectorAll('[data-fit]').forEach(fitOne); window.dispatchEvent(new Event('xd-fit')); }); }

  function init() {
    const main = document.querySelector('.game-main');
    if (main && !isBoardGame) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'xd-bg-pill'; b.textContent = '🎨 Background';
      b.addEventListener('click', () => toggle(true)); main.appendChild(b);
    }
    fitAll();
    window.addEventListener('resize', fitAll); window.addEventListener('orientationchange', () => setTimeout(fitAll, 150));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fitAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    if (window.ResizeObserver && main) { const ro = new ResizeObserver(fitAll); [...main.children].forEach(c => ro.observe(c)); const h = document.querySelector('.game-header'); if (h) ro.observe(h); }
    setTimeout(fitAll, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.XDKit = { TABLES, getTable, setTable, fit: fitAll };
})();
