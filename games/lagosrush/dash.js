// ===================== dash.js — the home DASHBOARD: pick a character (live preview), take boosters on your run, and visit the SHOP =====================
// Loaded before game.js. Everything it needs from the game (OUTFITS, totalNaira, startGame, ...) is looked up when it runs.

// ---------- shop catalogue (edit prices and text here) ----------
const SHOP = [
  { id: 'boost',  icon: '🏍️', name: 'Okada Head Start', price: 120, desc: 'Start your run on an okada for a few seconds, smashing through traffic (+100 each).' },
  { id: 'magnet', icon: '🧲', name: 'Jara Magnet',      price: 80,  desc: 'Start with a magnet that pulls nearby naira to you.' },
  { id: 'shield', icon: '🛡️', name: 'Ankara Shield',    price: 100, desc: 'Start with a shield that absorbs your first crash.' },
  { id: 'double', icon: '💸', name: 'Double Naira',     price: 150, desc: 'Every naira you pick up in the run counts twice.' },
  { id: 'revive', icon: '🙏', name: 'Second Chance',    price: 250, desc: 'Survive one fatal crash: the road ahead clears and you keep running.' },
];
const UPGRADES = [
  { id: 'magT',  icon: '🧲', name: 'Magnet Power', prices: [200, 400, 800, 1500], desc: n => `Magnet lasts ${9 + 3 * n}s → ${9 + 3 * (n + 1)}s` },
  { id: 'boostT', icon: '🏍️', name: 'Okada Power',  prices: [250, 500, 900, 1600], desc: n => `Okada rides last ${5 + 1.5 * n}s → ${5 + 1.5 * (n + 1)}s` },
  { id: 'lucky', icon: '🍀', name: 'Lucky Road',   prices: [300, 700, 1400],      desc: n => `Power-ups appear ${n === 0 ? 'a bit' : 'even'} more often on the road` },
];

// ---------- saved data ----------
const readJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
let inv = Object.assign({ boost: 0, magnet: 0, shield: 0, double: 0, revive: 0 }, readJSON('lagosrush-inv', {}));
let upg = Object.assign({ magT: 0, boostT: 0, lucky: 0 }, readJSON('lagosrush-upg', {}));
let takeOn = Object.assign({ boost: true, magnet: true, shield: true, double: true, revive: true }, readJSON('lagosrush-take', {}));
const saveInv = () => writeJSON('lagosrush-inv', inv), saveUpg = () => writeJSON('lagosrush-upg', upg), saveTake = () => writeJSON('lagosrush-take', takeOn);
const magDur = () => 9 + 3 * upg.magT, boostDur = () => 5 + 1.5 * upg.boostT, luckyBonus = () => 0.03 * upg.lucky;
let coinMul = 1, revives = 0;            // set at the start of every run from what you chose to take

function applyLoadout() {                // called when a run begins: use up the boosters you chose to take
  coinMul = 1; revives = 0; let used = false;
  const use = id => { if (takeOn[id] && inv[id] > 0) { inv[id]--; used = true; return true; } return false; };
  if (use('magnet')) magnetT = magDur();
  if (use('shield')) shield = true;
  if (use('boost')) { boostT = boostDur(); mountT = 0; rideKind = 'okada'; }
  if (use('double')) coinMul = 2;
  if (use('revive')) revives = 1;
  if (used) saveInv();
}

// ---------- drawing characters on small canvases (re-uses the game's own box engine) ----------
function withCam(ctx, w, h, fn) {
  const sg = g, sv = Object.assign({}, V), camX = 1.0;
  g = ctx; V.W = w; V.H = h; V.camZ = -6; V.camY = 1.25; V.camX = camX; V.view = 125; V.bend = 0; V.F = h * 1.95; V.hy = h * 0.47; V.cx = w / 2 + camX * V.F / 6;
  try { fn(); } finally { g = sg; Object.assign(V, sv); }
}
const thumbs = {};
function thumb(i) {
  if (thumbs[i]) return thumbs[i];
  const c = document.createElement('canvas'); c.width = 120; c.height = 150; const ctx = c.getContext('2d');
  withCam(ctx, 120, 150, () => drawFrontFigure(OUTFITS[i], 0.6));
  return (thumbs[i] = c.toDataURL());
}

// ---------- the dashboard ----------
let viewIdx = 0, heroCv = null, heroCtx = null, heroDpr = 1, heroW = 0, heroH = 0;
const fmt = n => '₦' + n.toLocaleString('en-US');
function setView(i) { viewIdx = (i + OUTFITS.length) % OUTFITS.length; if (unlocked.includes(viewIdx)) { outfit = viewIdx; store.set('lagosrush-outfit', outfit); } dashRefresh(); }

function dashRefresh() {
  if (!heroCv) {
    heroCv = $('heroCv'); heroCtx = heroCv.getContext('2d'); viewIdx = outfit;
    $('prevChar').addEventListener('click', () => setView(viewIdx - 1)); $('nextChar').addEventListener('click', () => setView(viewIdx + 1));
    $('shopBtn').addEventListener('click', openShop); $('shopBack').addEventListener('click', closeShop);
    $('shopTabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { shopTab = b.dataset.t; renderShop(); } });
    $('shopList').addEventListener('click', onShopClick);
    $('loadout').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (!b) return; takeOn[b.dataset.id] = !takeOn[b.dataset.id]; saveTake(); renderLoadout(); });
    $('soundBtn').addEventListener('click', () => { /* game.js toggles the sound; we only refresh the label */ setTimeout(() => { $('soundBtn').textContent = soundOn ? '🔊' : '🔇'; }, 0); });
  }
  const o = OUTFITS[viewIdx] || OUTFITS[0], has = unlocked.includes(viewIdx);
  $('bestVal').textContent = best.toLocaleString('en-US'); $('totalVal').textContent = fmt(totalNaira); $('soundBtn').textContent = soundOn ? '🔊' : '🔇';
  $('heroName').textContent = o.name;
  $('heroRole').textContent = o.role || '🏃 Everyday runner';
  $('charInfo').textContent = o.blurb || 'Just run, dodge the danfos and collect naira.';
  $('heroLock').hidden = has; $('heroLock').textContent = '🔒 ' + fmt(o.price);
  const strip = $('outfits'); strip.innerHTML = '';
  OUTFITS.forEach((c, i) => {
    const b = document.createElement('button'), own = unlocked.includes(i);
    b.className = 'tb' + (i === viewIdx ? ' sel' : '') + (own ? '' : ' locked'); b.setAttribute('aria-label', c.name);
    b.innerHTML = `<img src="${thumb(i)}" alt=""><span>${c.name.replace('Officer ', '')}</span>${own ? '' : '<i>🔒</i>'}`;
    b.addEventListener('click', () => setView(i)); strip.appendChild(b);
  });
  const pb = $('playBtn');
  if (has) { pb.textContent = '▶ PLAY'; pb.classList.remove('buy'); }
  else { pb.textContent = (totalNaira >= o.price ? '🔓 BUY ' : '🔒 ') + fmt(o.price); pb.classList.add('buy'); }
  renderLoadout(); if (!$('shop').hidden) renderShop();
}
function dashPlay() {
  const o = OUTFITS[viewIdx];
  if (unlocked.includes(viewIdx)) { outfit = viewIdx; store.set('lagosrush-outfit', outfit); startGame(); return; }
  if (totalNaira >= o.price) {
    totalNaira -= o.price; unlocked.push(viewIdx); outfit = viewIdx;
    store.set('lagosrush-naira', totalNaira); localStorage.setItem('lagosrush-unlocked', JSON.stringify(unlocked)); store.set('lagosrush-outfit', outfit);
    dashRefresh(); toast('NEW CHARACTER! 🎉 ' + o.name, 'good');
  } else { $('playBtn').textContent = 'Need ' + fmt(o.price - totalNaira) + ' more'; setTimeout(dashRefresh, 1200); }
}
function renderLoadout() {
  const owned = SHOP.filter(s => inv[s.id] > 0), box = $('loadout');
  if (!owned.length) { box.innerHTML = '<button class="ld-empty" type="button" onclick="document.getElementById(\'shopBtn\').click()">🛒 Boosters make runs easier — visit the Shop</button>'; return; }
  box.innerHTML = '<span class="ld-label">TAKE ON THIS RUN</span>' + owned.map(s => `<button type="button" class="ld${takeOn[s.id] ? ' on' : ''}" data-id="${s.id}" title="${s.name}">${s.icon}<b>×${inv[s.id]}</b></button>`).join('');
}
// live animated hero (only while the menu is showing)
function dashFrame(now) {
  if (!heroCv || $('menu').hidden || !$('shop').hidden) return;
  const w = heroCv.clientWidth, h = heroCv.clientHeight; if (!w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (heroW !== w || heroH !== h || heroDpr !== dpr) { heroW = w; heroH = h; heroDpr = dpr; heroCv.width = Math.round(w * dpr); heroCv.height = Math.round(h * dpr); }
  heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0); heroCtx.clearRect(0, 0, w, h);
  const gl = heroCtx.createRadialGradient(w / 2, h * 0.8, 4, w / 2, h * 0.8, w * 0.42); gl.addColorStop(0, 'rgba(255,210,61,.35)'); gl.addColorStop(1, 'rgba(255,210,61,0)');
  heroCtx.fillStyle = gl; heroCtx.fillRect(0, 0, w, h);
  const has = unlocked.includes(viewIdx); if (!has) heroCtx.filter = 'brightness(.55) saturate(.6)';
  withCam(heroCtx, w, h, () => drawFrontFigure(OUTFITS[viewIdx], now / 1000));
  heroCtx.filter = 'none';
}

// ---------- the shop ----------
let shopTab = 'boost';
function openShop() { $('menu').hidden = true; $('shop').hidden = false; renderShop(); }
function closeShop() { $('shop').hidden = true; $('menu').hidden = false; dashRefresh(); }
function renderShop() {
  $('shopNaira').textContent = fmt(totalNaira);
  $('shopTabs').innerHTML = [['boost', '🛒 Boosters'], ['upg', '⬆️ Upgrades']].map(([id, n]) => `<button type="button" class="${shopTab === id ? 'on' : ''}" data-t="${id}">${n}</button>`).join('');
  const list = $('shopList');
  if (shopTab === 'boost') {
    list.innerHTML = SHOP.map(s => `<div class="item"><div class="ic">${s.icon}</div><div class="tx"><b>${s.name}</b><span>${s.desc}</span><em>You have ${inv[s.id]}</em></div><button type="button" class="buy" data-buy="${s.id}"${totalNaira < s.price ? ' disabled' : ''}>${fmt(s.price)}</button></div>`).join('');
  } else {
    list.innerHTML = UPGRADES.map(u => {
      const n = upg[u.id], max = u.prices.length, pips = Array.from({ length: max }, (_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('');
      const btn = n >= max ? '<button type="button" class="buy" disabled>MAX</button>' : `<button type="button" class="buy" data-upg="${u.id}"${totalNaira < u.prices[n] ? ' disabled' : ''}>${fmt(u.prices[n])}</button>`;
      return `<div class="item"><div class="ic">${u.icon}</div><div class="tx"><b>${u.name}</b><span>${n >= max ? 'Fully upgraded!' : u.desc(n)}</span><div class="pips">${pips}</div></div>${btn}</div>`;
    }).join('');
  }
}
function onShopClick(e) {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.buy) {
    const s = SHOP.find(x => x.id === b.dataset.buy); if (totalNaira < s.price) return;
    totalNaira -= s.price; inv[s.id]++; takeOn[s.id] = true; store.set('lagosrush-naira', totalNaira); saveInv(); saveTake(); sfx.coin(); toast(s.icon + ' ' + s.name + ' bought!', 'good');
  } else if (b.dataset.upg) {
    const u = UPGRADES.find(x => x.id === b.dataset.upg), n = upg[u.id]; if (n >= u.prices.length || totalNaira < u.prices[n]) return;
    totalNaira -= u.prices[n]; upg[u.id]++; store.set('lagosrush-naira', totalNaira); saveUpg(); sfx.power(); toast(u.icon + ' ' + u.name + ' level ' + upg[u.id] + '!', 'good');
  } else return;
  renderShop();
}
