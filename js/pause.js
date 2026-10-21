/* pause.js — one shared pause button for every XD_Arcade game.
 * Load it BEFORE the game's own script. It freezes the game by taking over the browser's timers
 * (setTimeout / setInterval / requestAnimationFrame) and the clock (performance.now / Date.now),
 * so a pause stops everything: countdowns, CPU thinking, animations, reaction timers.
 *   data-auto="1"       also pause automatically when the tab/app is hidden
 *   data-countdown="1"  show 3-2-1 before a real-time game continues
 */
(function () {
  'use strict';
  if (window.__xdPause) return;
  const me = document.currentScript, AUTO = !!me && me.dataset.auto === '1', COUNT = !!me && me.dataset.countdown === '1';
  const nSTO = window.setTimeout.bind(window), nCTO = window.clearTimeout.bind(window), nSIV = window.setInterval.bind(window), nCIV = window.clearInterval.bind(window);
  const nRAF = window.requestAnimationFrame.bind(window), nCRAF = window.cancelAnimationFrame.bind(window);
  const nPerf = performance.now.bind(performance), nDate = Date.now.bind(Date);
  let paused = false, pauseP = 0, pauseD = 0, offP = 0, offD = 0, nextId = 1;
  const touts = new Map(), ivs = new Map(), rafs = new Map();

  // ---- the game's clock stops while paused ----
  const fakeNow = () => (paused ? pauseP : nPerf()) - offP;
  const fakeDate = () => (paused ? pauseD : nDate()) - offD;
  try { Object.defineProperty(performance, 'now', { value: fakeNow, configurable: true, writable: true }); } catch (e) { performance.now = fakeNow; }
  Date.now = fakeDate;

  // ---- timers ----
  function armTimeout(id, r, ms) { r.armedAt = nPerf(); r.armedMs = ms; r.native = nSTO(() => { touts.delete(id); r.fn.apply(window, r.args); }, ms); }
  function armInterval(id, r) { r.native = nSIV(() => r.fn.apply(window, r.args), r.period); }
  function armRaf(id, r) { r.native = nRAF(ts => { rafs.delete(id); r.cb(ts); }); }
  window.setTimeout = function (fn, delay) {
    const id = nextId++, r = { fn, args: Array.prototype.slice.call(arguments, 2), remaining: Math.max(0, +delay || 0), native: null };
    touts.set(id, r); if (!paused) armTimeout(id, r, r.remaining); return id;
  };
  window.setInterval = function (fn, delay) {
    const id = nextId++, r = { fn, args: Array.prototype.slice.call(arguments, 2), period: Math.max(1, +delay || 1), native: null };
    ivs.set(id, r); if (!paused) armInterval(id, r); return id;
  };
  window.requestAnimationFrame = function (cb) { const id = nextId++, r = { cb, native: null }; rafs.set(id, r); if (!paused) armRaf(id, r); return id; };
  const clearAny = id => {
    let r = touts.get(id); if (r) { if (r.native != null) nCTO(r.native); touts.delete(id); }
    r = ivs.get(id); if (r) { if (r.native != null) nCIV(r.native); ivs.delete(id); }
    r = rafs.get(id); if (r) { if (r.native != null) nCRAF(r.native); rafs.delete(id); }
  };
  window.clearTimeout = clearAny; window.clearInterval = clearAny; window.cancelAnimationFrame = clearAny;

  function freezeAll() {
    const now = nPerf();
    touts.forEach(r => { if (r.native != null) { nCTO(r.native); r.native = null; r.remaining = Math.max(0, r.armedMs - (now - r.armedAt)); } });
    ivs.forEach(r => { if (r.native != null) { nCIV(r.native); r.native = null; } });
    rafs.forEach(r => { if (r.native != null) { nCRAF(r.native); r.native = null; } });
  }
  function thawAll() {
    touts.forEach((r, id) => { if (r.native == null) armTimeout(id, r, r.remaining); });
    ivs.forEach((r, id) => { if (r.native == null) armInterval(id, r); });
    rafs.forEach((r, id) => { if (r.native == null) armRaf(id, r); });
  }

  // ---- UI ----
  let btn, overlay, titleEl, actionsEl, countEl, counting = null;
  const css = `
.xd-pause-btn{position:absolute;right:16px;top:22px;z-index:50;width:38px;height:38px;border-radius:50%;border:1px solid #2a3040;background:#12161F;color:#F5F5F0;font-size:13px;letter-spacing:-1px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:inherit}
.xd-pause-btn:hover{border-color:#FF3D6E}
.xd-pause-btn.floating{position:fixed;top:12px}
.xd-pause-overlay{position:fixed;inset:0;z-index:99999;background:rgba(11,14,20,.95);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;touch-action:none;user-select:none;-webkit-user-select:none;color:#F5F5F0;font-family:'Inter',system-ui,sans-serif;text-align:center}
.xd-pause-overlay[hidden]{display:none}
.xd-pause-title{font-family:'Bebas Neue',Impact,sans-serif;font-size:64px;letter-spacing:4px;line-height:1}
.xd-pause-sub{font-size:14px;color:#8A8F9C}
.xd-pause-actions{display:flex;flex-direction:column;gap:10px;width:min(78vw,260px)}
.xd-pause-actions button,.xd-pause-actions a{font-family:inherit;font-weight:700;font-size:16px;padding:13px 18px;border-radius:12px;border:1px solid #2a3040;background:#12161F;color:#F5F5F0;cursor:pointer;text-decoration:none;display:block}
.xd-pause-actions .primary{background:#FF3D6E;border-color:#FF3D6E}
.xd-pause-count{font-family:'Bebas Neue',Impact,sans-serif;font-size:120px;line-height:1;color:#FFD23D}`;
  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    btn = document.createElement('button'); btn.className = 'xd-pause-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Pause'); btn.textContent = '❚❚';
    const header = document.querySelector('.game-header');
    if (header) { if (getComputedStyle(header).position === 'static') header.style.position = 'relative'; header.appendChild(btn); }
    else { btn.classList.add('floating'); document.body.appendChild(btn); }
    overlay = document.createElement('div'); overlay.className = 'xd-pause-overlay'; overlay.hidden = true; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-label', 'Game paused');
    overlay.innerHTML = '<div class="xd-pause-title">PAUSED</div><div class="xd-pause-sub">Your game is frozen — take your time.</div><div class="xd-pause-count" hidden></div>' +
      '<div class="xd-pause-actions"><button type="button" class="primary" data-a="resume">▶ Resume</button><button type="button" data-a="restart">↻ Restart game</button><a data-a="home" href="../../index.html">← Back to XD_Arcade</a></div>' +
      '<div class="xd-pause-sub">Press Esc to resume</div>';
    document.body.appendChild(overlay);
    titleEl = overlay.querySelector('.xd-pause-title'); actionsEl = overlay.querySelector('.xd-pause-actions'); countEl = overlay.querySelector('.xd-pause-count');
    btn.addEventListener('click', () => (paused ? requestResume() : pause()));
    overlay.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'resume') requestResume(); else if (a.dataset.a === 'restart') location.reload(); });
    overlay.addEventListener('contextmenu', e => e.preventDefault());
    fitTitle(); window.addEventListener('resize', fitTitle); window.addEventListener('load', fitTitle); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
  }
  // long titles (e.g. "Rock Paper Scissors") shrink so they never run into the back link or the pause button
  function fitTitle() {
    const t = document.querySelector('.game-title'); if (!t || !btn) return;
    t.style.fontSize = '';
    const range = document.createRange(); range.selectNodeContents(t); const w = range.getBoundingClientRect().width; if (!w) return;
    const tr = t.getBoundingClientRect(), back = document.querySelector('.back-link'), center = tr.left + tr.width / 2;
    const left = (back ? back.getBoundingClientRect().right : 0) + 8, right = btn.getBoundingClientRect().left - 8, avail = 2 * Math.min(center - left, right - center);
    if (avail > 40 && w > avail) t.style.fontSize = Math.max(15, parseFloat(getComputedStyle(t).fontSize) * avail / w) + 'px';
  }

  function pause() {
    if (paused) return;
    paused = true; pauseP = nPerf(); pauseD = nDate(); freezeAll();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (overlay) { overlay.hidden = false; actionsEl.hidden = false; countEl.hidden = true; titleEl.textContent = 'PAUSED'; }
    if (btn) btn.textContent = '▶';
    window.dispatchEvent(new Event('xd-pause'));
  }
  function resume() {
    if (!paused) return;
    counting = null; offP += nPerf() - pauseP; offD += nDate() - pauseD; paused = false; thawAll();
    if (overlay) overlay.hidden = true; if (btn) btn.textContent = '❚❚';
    window.dispatchEvent(new Event('xd-resume'));
  }
  function requestResume() {
    if (!paused || counting) return;
    if (!COUNT) { resume(); return; }
    actionsEl.hidden = true; countEl.hidden = false; titleEl.textContent = 'GET READY'; let n = 3; counting = true; countEl.textContent = n;
    (function tick() { nSTO(() => { if (!counting) return; n--; if (n <= 0) resume(); else { countEl.textContent = n; tick(); } }, 650); })();
  }

  // ---- while paused, the game gets no keyboard input ----
  ['keydown', 'keyup', 'keypress'].forEach(type => window.addEventListener(type, e => {
    if (type === 'keydown' && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (paused) requestResume(); else pause(); return; }
    if (paused) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true));
  if (AUTO) document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  window.__xdPause = { pause, resume: requestResume, forceResume: resume, get paused() { return paused; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
