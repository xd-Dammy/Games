// ===================== LAGOS RUSH =====================
const cv = document.getElementById('cv'); let g = cv.getContext('2d');
const $ = id => document.getElementById(id);
const LANES = [-3, 0, 3], GRAV = 54, JUMP_V = 15, SLIDE_T = 0.6, SEG = 14, JUMP_BUFFER = 0.16;
const OUTFITS = [
  { name: 'Naija', price: 0, style: 'jersey', shirt: [28, 150, 78], trim: [245, 245, 245], pants: [245, 245, 245], skin: [140, 92, 62], hair: [24, 20, 20] },
  { name: 'Ankara', price: 150, style: 'ankara', shirt: [235, 160, 30], trim: [150, 40, 140], pants: [125, 40, 125], skin: [120, 78, 52], hair: [20, 16, 16] },
  { name: 'Agbada', price: 400, style: 'agbada', shirt: [45, 95, 205], trim: [235, 215, 120], pants: [235, 235, 235], skin: [150, 100, 70], hair: [24, 20, 20] },
  { name: 'Street', price: 800, style: 'hoodie', shirt: [44, 44, 56], trim: [255, 210, 60], pants: [60, 75, 170], skin: [105, 68, 46], hair: [20, 16, 16] },
  { name: 'Officer Bala', price: 600, style: 'police', role: '🚔 Police · Chase', blurb: 'A Yahoo Boy is running — keep collecting naira and near-misses to close in and arrest him!', scene: 'yahoo_chase', mode: 'chase', shirt: [48, 78, 140], trim: [240, 200, 60], pants: [28, 28, 38], skin: [120, 78, 52], hair: [20, 16, 16] },
  { name: 'Slim Jay', price: 900, style: 'yahoo', role: '💰 Yahoo Boy · On the run', blurb: 'The police are right behind you! Crashes make you stumble — 3 stumbles close together and you are caught.', scene: 'getaway', mode: 'hunted', shirt: [130, 50, 190], trim: [255, 210, 60], pants: [30, 30, 40], skin: [105, 68, 46], hair: [20, 16, 16] },
];
const OB = {   // obstacle sizes
  danfo: { w: 2.0, h: 2.8, d: 5.2 }, truck: { w: 2.5, h: 3.4, d: 8.5 }, okada: { w: 0.9, h: 1.35, d: 1.8 },
  barrier: { w: 2.6, h: 0.85, d: 0.9 }, banner: { w: 2.8, h: 1.0, d: 0.6, y: 1.15 },
};
const SLOGANS = ['NO CONDITION IS PERMANENT', 'ENJOY YOUR LIFE', 'FOCUS', 'WE ARE ONE', 'OSHODI EXPRESS', 'GOD\'S TIME IS BEST'];
const SIGNS = ['SUYA SPOT', 'JOLLOF • RICE', 'EKO O NI BAJE', 'PEPPER SOUP', 'BUKA 24/7'];
const CRASH_LINES = ['Wahala! Na danfo carry you go.', 'You no see road? Abeg look front!', 'Go-slow don catch you.', 'Na so e be for Lagos.', 'Okada man say: "Where you dey go?"', 'Conductor: "Oga, collect your change!"', 'Even Lagos traffic no fit stop you… but that one did.', 'Oya, try again — Lagos no dey carry last!'];
const ARREST_LINES = ['"You are under arrest!" — the officer, panting.', 'Handcuffs on. Oga, the chase is over.', 'Lagos is big, but not big enough to hide in… today.', 'Slim Jay: "I was only counting my money o!"'];
const MILES = [[250, 'Yaba'], [700, 'Ikeja'], [2100, 'Lekki'], [3200, 'Ajah — you reach!']];

// ---------- persistence ----------
const store = {
  num: (k, d = 0) => { const v = parseInt(localStorage.getItem(k) || '', 10); return Number.isFinite(v) ? v : d; },
  set: (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* ignore */ } },
};
let best = store.num('lagosrush-best'), totalNaira = store.num('lagosrush-naira'), outfit = store.num('lagosrush-outfit');
let unlocked = (() => { try { return JSON.parse(localStorage.getItem('lagosrush-unlocked')) || [0]; } catch (e) { return [0]; } })();
if (!unlocked.includes(0)) unlocked.push(0);
let soundOn = localStorage.getItem('lagosrush-sound') !== 'off';

// ---------- state ----------
let lastZone = 'street', runId = 0, mode = 'menu', T = 0, P, speed = 20, naira = 0, bonus = 0, obstacles = [], coins = [], pups = [], nextRow = 60;
let tgt = null, cop = null, arrests = 0, stumbles = 0;                      // story modes: the suspect we chase / the police chasing us
let rideKind = 'okada', mountT = 0, leftBike = null;                 // the okada / lady-bike that carries you during a boost
let magnetT = 0, shield = false, boostT = 0, invuln = 0, shake = 0, flash = 0, mileIdx = 0, streak = 0, lastRowSafe = 1, camShift = 0;
const dist = () => Math.max(0, Math.floor(P.z));
const score = () => dist() + naira * 10 + bonus;

function reset() {
  runId++;
  P = { x: 0, lane: 1, y: 0, vy: 0, z: 0, slide: 0, duck: 0, run: 0 };
  jumpBuf = 0; laneFront = [-1e9, -1e9, -1e9]; laneEnd = [-1e9, -1e9, -1e9]; lastZone = 'street'; speed = 20; naira = 0; bonus = 0; obstacles = []; coins = []; pups = []; nextRow = 70; magnetT = 0; shield = false; boostT = 0; invuln = 0; mountT = 0; leftBike = null; tgt = null; cop = null; arrests = 0; stumbles = 0;
  shake = 0; flash = 0; mileIdx = 0; streak = 0; lastRowSafe = 1; coinMul = 1; revives = 0; juncScan = 0; V.bend = 0;
  V.camX = 0; V.camZ = -7.4;
}

// ---------- sound ----------
let actx = null;
function audio() { if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); } if (actx && actx.state === 'suspended') actx.resume(); return actx; }
function beep(f1, f2, ms, type = 'square', vol = 0.12) {
  if (!soundOn) return; const a = audio(); if (!a) return;
  const o = a.createOscillator(), gn = a.createGain(), t = a.currentTime;
  o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + ms / 1000);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  o.connect(gn); gn.connect(a.destination); o.start(t); o.stop(t + ms / 1000 + 0.02);
}
const sfx = {
  whistle: () => { beep(1750, 1700, 260, 'sine', 0.13); setTimeout(() => beep(1750, 1700, 320, 'sine', 0.13), 300); },
  siren: () => { beep(720, 760, 200, 'triangle', 0.08); setTimeout(() => beep(980, 1000, 200, 'triangle', 0.08), 210); },
  coin: () => beep(880, 1320, 90), jump: () => beep(300, 620, 140, 'sine', 0.14), slide: () => beep(420, 160, 160, 'sawtooth', 0.07),
  horn: () => { beep(420, 400, 180, 'sawtooth', 0.09); setTimeout(() => beep(420, 400, 180, 'sawtooth', 0.09), 220); },
  crash: () => { beep(180, 40, 420, 'sawtooth', 0.22); beep(90, 30, 500, 'square', 0.15); }, power: () => { beep(500, 1000, 160, 'triangle', 0.15); setTimeout(() => beep(800, 1400, 160, 'triangle', 0.15), 120); },
  lane: () => beep(240, 300, 50, 'sine', 0.05),
};

// ---------- toast ----------
let toastTimer = null;
function toast(msg, kind = 'good') {
  const el = $('toast'); el.textContent = msg; el.className = 'toast ' + kind; void el.offsetWidth; el.classList.add('show');
}

// ---------- world generation ----------
const rint = n => Math.floor(Math.random() * n);
// ---------- zones: street → Third Mainland Bridge → street (repeats every 4 km) ----------
const ZONE_CYCLE = 4000, BRIDGE_FROM = 1300, BRIDGE_TO = 2100, RAMP_LEN = 42;
function zoneAt(z) {
  const m = ((z % ZONE_CYCLE) + ZONE_CYCLE) % ZONE_CYCLE;
  if (m >= BRIDGE_FROM && m < BRIDGE_TO) return 'bridge';
  if (m >= BRIDGE_FROM - RAMP_LEN && m < BRIDGE_FROM) return 'ramp';
  return 'street';
}

// ---------- junctions: every ~320 m a side street opens on both sides of the road (no buildings there) ----------
const JUNC_EVERY = 23, JUNC_AT = 9;
function isJunction(i) {
  if (i * SEG < 420 || (((i % JUNC_EVERY) + JUNC_EVERY) % JUNC_EVERY) !== JUNC_AT) return false;
  for (let d = -2; d <= 2; d++) if (zoneAt((i + d) * SEG + SEG / 2) !== 'street') return false;
  return true;
}
// the road itself bends gently left and right (straight on the bridge and for the first 120 m)
function bendAt(z) {
  if (zoneAt(z + 30) !== 'street') return 0;
  return clamp((z - 120) / 220, 0, 1) * (Math.sin(z / 330) * 0.00075 + Math.sin(z / 141 + 1.7) * 0.0004);
}
// ---------- bus bays: a 4th lane at the edge of the road where danfos stop to call passengers (you can never enter it) ----------
const BAY_RUN = 14, BAY_FIRST = 3, BAY_LEN = 5, BAY_X0 = 4.7, BAY_X1 = 7.7;
function bayAt(i) {                                                   // -1 = bay on the left, +1 = on the right, 0 = none
  const run = Math.floor(i / BAY_RUN), k = i - run * BAY_RUN;
  if (k < BAY_FIRST || k >= BAY_FIRST + BAY_LEN) return 0;
  const start = run * BAY_RUN + BAY_FIRST;
  if (start * SEG < 120) return 0;
  for (let j = 0; j < BAY_LEN; j++) if (zoneAt((start + j) * SEG + SEG / 2) !== 'street' || isJunction(start + j - 1) || isJunction(start + j) || isJunction(start + j + 1)) return 0;   // the whole stretch must fit on normal street
  if (rnd(run, 77) < 0.4) return 0;
  return rnd(run, 78) < 0.5 ? -1 : 1;
}
const bayAtZ = z => bayAt(Math.floor(z / SEG));

// ---------- traffic: every lane flows at its own steady speed, so vehicles in one lane can never run through each other ----------
const LANE_FLOW = [0.22, 0.15, 0.09];                      // fraction of the player's base speed (left lane is the fast lane)
const baseSpeed = d => Math.min(46, 20 + d * 0.0045);
const flowScale = d => clamp((d - 250) / 900, 0, 1);       // the first 250 m are parked traffic (a gentle start), then it starts to flow
const laneFlow = lane => LANE_FLOW[lane] * baseSpeed(dist()) * flowScale(dist());
let laneFront = [-1e9, -1e9, -1e9], laneEnd = [-1e9, -1e9, -1e9];   // where each lane's last vehicle will be (front / rear) at the moment the player reaches it

const rowSpacing = () => Math.max(21, baseSpeed(dist()) * 1.05);   // front-to-front distance == at least 1.05 s between two obstacles in a lane
function addObstacle(type, lane, z, vz = 0) {
  const s = OB[type]; const o = { type, lane, x: LANES[lane], y: s.y || 0, z, w: s.w, h: s.h, d: s.d, vz, slogan: SLOGANS[rint(SLOGANS.length)], sign: SIGNS[rint(SIGNS.length)], seed: Math.random(), passed: false, dead: false };
  obstacles.push(o);
  // where will this vehicle be when the player reaches it? (traffic keeps drifting forward until then)
  const closing = Math.max(4, baseSpeed(dist()) - vz), tMeet = Math.max(0, (z - P.z) / closing), front = z + vz * tMeet;
  laneFront[lane] = Math.max(laneFront[lane], front); laneEnd[lane] = Math.max(laneEnd[lane], front + s.d);
  return o;
}
// can a new vehicle start at z in this lane without arriving too close behind (or inside) the previous one?
const canPlace = (l, z) => z - laneFront[l] >= rowSpacing() && z >= laneEnd[l] + 3;
// is the stretch of lane starting at `from` free of any earlier vehicle (used for the safe lane, coins and power-ups)?
const laneFree = (l, from) => laneEnd[l] + 3.5 < from;
function spawnRow(z, gap) {
  const lvl = clamp(dist() / 1500, 0, 1), flow = flowScale(dist());
  const roll = Math.random();
  const zone = zoneAt(z);
  // wall row: every lane must be jumped or slid (static road-works) — only when all three lanes are clear
  if (dist() > 150 && roll < 0.14 && [0, 1, 2].every(l => canPlace(l, z))) {
    const kind = Math.random() < 0.5 ? 'barrier' : 'banner';
    for (let l = 0; l < 3; l++) addObstacle(kind, l, z);
    for (let i = 0; i < 5; i++) coins.push({ x: 0, y: kind === 'barrier' ? 2.1 : 0.9, z: z - 3 + i * 1.4, got: false });
    lastRowSafe = 1; return;
  }
  const traffic = Math.random() < 0.8 * flow;                              // traffic rows MOVE, road-works rows are parked
  // the safe lane: a neighbour of the last one, and not "spoken for" by a vehicle that is still sweeping through
  const eligible = [0, 1, 2].filter(l => laneFree(l, z - 5));
  if (!eligible.length) return;                                            // breather row: nothing spawns (always fair)
  const near = eligible.filter(l => Math.abs(l - lastRowSafe) <= 1);
  const safe = (near.length ? near : eligible)[rint((near.length ? near : eligible).length)];
  lastRowSafe = safe;
  const pool = traffic ? ['danfo', 'danfo', 'truck', 'okada', 'okada'] : ['danfo', 'truck', 'okada', 'barrier', 'banner', 'barrier'];
  const jumpables = traffic ? ['okada'] : ['barrier', 'okada', 'banner'];
  const vOf = l => traffic ? laneFlow(l) : 0;
  for (let l = 0; l < 3; l++) {
    if (!canPlace(l, z)) continue;                                         // never put a vehicle closer than 1.05 s behind (or inside) the previous one
    if (l === safe) { if (Math.random() < 0.22 + lvl * 0.15) { const t = jumpables[rint(jumpables.length)]; addObstacle(t, l, z, t === 'barrier' || t === 'banner' ? 0 : vOf(l)); } continue; }
    if (Math.random() < 0.62 + lvl * 0.2) { const t = pool[rint(pool.length)]; addObstacle(t, l, z, t === 'barrier' || t === 'banner' ? 0 : vOf(l)); }
  }
  const bay = bayAtZ(z);
  if (bay) for (const o of obstacles) if (o.z === z && o.type === 'danfo' && ((bay < 0 && o.lane === 0) || (bay > 0 && o.lane === 2)) && Math.random() < 0.8) o.bayFrom = bay * 6.5;
  const sOb = obstacles.some(o => o.z === z && o.lane === safe);
  if (!sOb && laneFree(safe, z - 5)) for (let i = 0; i < 6; i++) coins.push({ x: LANES[safe], y: 0.9, z: z - 4 + i * 2.2, got: false });
  if (Math.random() < 0.11 + luckyBonus()) { const l = rint(3); if (laneFree(l, z + 10.5)) pups.push({ x: LANES[l], y: 1.1, z: z + 10.5, kind: ['magnet', 'shield', 'boost'][rint(3)], got: false }); }
  if (Math.random() < 0.5) { const l = rint(3), zc = z + 10; if (laneFree(l, zc)) for (let i = 0; i < 3; i++) coins.push({ x: LANES[l], y: 0.9, z: zc + i * 2.2, got: false }); }
}


// ---------- junction buses: wait at the junction with the indicator on, then turn off into the side street ----------
let juncScan = 0;
// if a junction falls inside the next row's gap, put that row exactly on the junction (returns its z, or null)
function junctionRowZ(from, gap) {
  for (;; juncScan++) {
    if (juncScan * SEG > from + gap) return null;
    if (!isJunction(juncScan)) continue;
    const z = juncScan * SEG + SEG / 2 - 2.6;
    if (z < from) continue;
    if (z < from + gap) { juncScan++; return z; }
    return null;
  }
}
function addTurners(z) {                                                          // buses in the outer lanes that signal and turn into the side street
  const order = Math.random() < 0.5 ? [0, 2] : [2, 0]; let made = 0;
  for (const l of order) {
    if (made && Math.random() < 0.55) break;
    let o = obstacles.find(ob => ob.z === z && ob.lane === l && (ob.type === 'danfo' || ob.type === 'truck'));
    if (!o && canPlace(l, z)) o = addObstacle(Math.random() < 0.82 ? 'danfo' : 'truck', l, z, 0);
    if (o) { o.turn = l === 0 ? -1 : 1; o.vz = 0; o.bayFrom = 0; made++; }
  }
}
function turnUpdate(o, dt) {
  if (!o.turning) { if (o.z - P.z < 48 + speed * 0.35) { o.turning = true; o.tt = 0; o.x0 = o.x; o.z0 = o.z; o.len = o.d; o.wid = o.w; o.vz = 0; } return; }
  o.tt += dt; const u = Math.min(1, o.tt / 1.7), e = u * u * (3 - 2 * u);
  if (!o.sideways) {
    o.x = o.x0 + o.turn * e * 7; o.z = o.z0 + u * 5;                                       // pulls out towards the kerb, still facing forward ...
    if (u > 0.5) { const cz = o.z + o.len / 2; o.sideways = true; o.w = o.len; o.d = o.wid; o.z = cz - o.d / 2; }   // ... then swings across into the side street
  } else {
    o.x += o.turn * (3 + 10 * e) * dt; if (Math.abs(o.x) > 62) o.dead = true;
  }
}

// ---------- story missions ----------
const CHASE = { start: 28, widen: 1.0, widenPerArrest: 0.06, coin: 0.5, near: 5, hurdle: 2, escape: 75, catchAt: 3 };
// CHASE (Officer Bala): a suspect runs ahead, dodging traffic like a good player. He pulls away slowly; coins, near-misses and hurdles close the gap.
function targetUpdate(dt) {
  const t = tgt;
  if (t.hidden > 0) { t.hidden -= dt; if (t.hidden <= 0) {
      t.hidden = 0; t.gap = t.nextGap; t.z = P.z + t.gap; t.y = 0; t.vy = 0;
      const clear = l => !obstacles.some(o => !o.dead && (o.type === 'danfo' || o.type === 'truck') && o.lane === l && o.z < t.z + 8 && o.z + o.d > t.z - 4);
      const free = [1, 0, 2].filter(clear); t.lane = free.length ? free[0] : 1; t.x = LANES[t.lane];     // the new suspect appears in a clear lane
    } return; }
  t.gap += (CHASE.widen + CHASE.widenPerArrest * arrests) * dt - (boostT > 0 ? 7 * dt : 0);
  t.z = P.z + t.gap; t.run += dt * speed * 0.42; t.lc -= dt;
  const solid = o => o.type === 'danfo' || o.type === 'truck';
  const obs = obstacles.filter(o => !o.dead && o.z + o.d > t.z - 3 && o.z - t.z < 40);
  const nextSolid = l => { const o = obs.filter(o => o.lane === l && solid(o) && o.z + o.d > t.z - 1.5).sort((a, b) => a.z - b.z)[0]; return o ? Math.max(0, o.z - t.z) : 1e9; };
  const occupied = l => obs.some(o => o.lane === l && o.z < t.z + 4 && o.z + o.d > t.z - 2);
  if (nextSolid(t.lane) < 24 && t.lc <= 0) {
    const sc = l => nextSolid(l) + (l === t.lane ? 0 : -0.01), best = [0, 1, 2].sort((a, b) => sc(b) - sc(a))[0];
    if (best !== t.lane) { const dir = Math.sign(best - t.lane); if (!occupied(t.lane + dir)) { t.lane += dir; t.lc = 0.12; } }
  }
  t.x += (LANES[t.lane] - t.x) * Math.min(1, dt * 12);
  const cur = obs.filter(o => o.lane === t.lane && !solid(o) && o.z > t.z - 0.4).sort((a, b) => a.z - b.z)[0];
  if (cur && t.y === 0 && t.slide <= 0 && cur.z - t.z < Math.max(0, speed - (cur.vz || 0)) * 0.2 + 1.2) { if (cur.type === 'banner') t.slide = 0.55; else t.vy = JUMP_V; }
  if (t.y > 0 || t.vy > 0) { t.vy -= GRAV * dt; t.y += t.vy * dt; if (t.y <= 0) { t.y = 0; t.vy = 0; } }
  t.slide = Math.max(0, t.slide - dt);
  if (obs.some(o => solid(o) && Math.abs(t.x - o.x) < o.w / 2 + 0.3 && t.z > o.z && t.z < o.z + o.d)) {   // never stand inside a vehicle
    const free = [0, 1, 2].filter(l => !obs.some(o => solid(o) && o.lane === l && t.z > o.z - 1 && t.z < o.z + o.d + 1)); if (free.length) { t.lane = free[0]; t.x = LANES[t.lane]; }
  }
  if (t.gap <= CHASE.catchAt) {                                                                        // ARREST!
    arrests++; bonus += 100 + 50 * arrests; naira += 20; sfx.power(); sfx.whistle(); shake = 0.15;
    toast(`ARRESTED! 👮 +₦20`, 'cash'); t.hidden = 1.4; t.nextGap = 34 + 3 * arrests; t.look = rint(4); t.gap = 99;
  } else if (t.gap >= CHASE.escape) { toast('He got away! 😤', 'bad'); t.hidden = 1.5; t.nextGap = 40; t.look = rint(4); t.gap = 99; }
}
// HUNTED (Slim Jay): the police chase from behind. Running clean slowly builds your lead; every crash is a stumble that costs 11 m.
function copUpdate(dt) {
  const c = cop; c.t += dt; c.run += dt * speed * 0.42;
  c.gap = Math.min(40, c.gap + (0.7 + (c.t < 8 ? 2.2 : 0) + (boostT > 0 ? 9 : 0)) * dt);
  c.sirenT -= dt; if (c.gap < 22 && c.sirenT <= 0) { sfx.siren(); c.sirenT = 0.45 + c.gap * 0.02; }
}

// ---------- gameplay ----------
function startGame() {
  audio(); reset();
  $('menu').hidden = true; $('over').hidden = true; $('pausePanel').hidden = true; $('toast').className = 'toast';
  const ch = OUTFITS[outfit] || OUTFITS[0];
  if (ch.scene && typeof startScene === 'function') { mode = 'scene'; $('hud').hidden = true; startScene(ch.scene, beginRun); return; }   // a short play first
  beginRun();
}
function beginRun() {
  mode = 'play'; P.x = 0; P.lane = 1; P.z = Math.max(0, P.z); P.y = 0; P.vy = 0; P.slide = 0; P.duck = 0; nextRow = P.z + 70; juncScan = Math.floor(nextRow / SEG);
  $('hud').hidden = false; initMission(); applyLoadout(); toast('GO! 🏃', 'good'); updateHud(true);
}
function initMission() {
  tgt = cop = null; arrests = 0; stumbles = 0; const ch = OUTFITS[outfit] || OUTFITS[0];
  if (ch.mode === 'chase') tgt = { gap: CHASE.start, z: P.z + CHASE.start, x: 0, lane: 1, y: 0, vy: 0, slide: 0, run: 0, look: rint(4), hidden: 0, nextGap: 0, lc: 0 };
  if (ch.mode === 'hunted') cop = { gap: 14, run: 0, t: 0, variant: Math.random() < 0.7 ? 'police' : 'army', sirenT: 0 };
}
function changeLane(d) {
  if (mode !== 'play') return; const n = clamp(P.lane + d, 0, 2); if (n !== P.lane) { P.lane = n; sfx.lane(); }
}
let jumpBuf = 0;
function jump() { if (mode !== 'play') return; if (P.y <= 0.001 && P.vy <= 0) { P.vy = JUMP_V; P.slide = 0; jumpBuf = 0; sfx.jump(); } else jumpBuf = JUMP_BUFFER; }
function slide() { if (mode !== 'play') return; if (P.y > 0.05) { P.vy = Math.min(P.vy, -22); } P.slide = SLIDE_T; sfx.slide(); }

function hits(o) {
  if (Math.abs(P.x - o.x) >= o.w / 2 + 0.36) return false;
  if (P.z + 0.35 <= o.z || P.z - 0.35 >= o.z + o.d) return false;
  const top = P.y + (P.slide > 0 ? 0.7 : 1.9), oy = o.y || 0;
  return P.y < oy + o.h - 0.03 && top > oy + 0.03;
}
function crash(o) {
  if (boostT > 0) { o.dead = true; bonus += 100; toast('BOOM! +100', 'good'); shake = 0.25; sfx.crash(); return; }
  if (invuln > 0) return;
  if (shield) { shield = false; invuln = 1.2; o.dead = true; shake = 0.3; toast('SHIELD BROKE! 🛡️', 'bad'); sfx.crash(); return; }
  if (cop) {                                                                    // Slim Jay stumbles: the police gain 11 m
    cop.gap -= 11; invuln = 1.0; o.dead = true; shake = 0.35; flash = 0.2; stumbles++; sfx.crash();
    if (cop.gap <= 0) { gameOver(o, 'caught'); return; }
    toast(cop.gap < 8 ? 'THEY ARE ON YOU! 🚨' : 'YOU STUMBLED! 🚨', 'bad'); return;
  }
  gameOver(o);
}

function step(dt) {
  T += dt;
  const base = Math.min(46, 20 + dist() * 0.0045);
  speed = base * (boostT > 0 ? 1.45 : 1);
  P.z += speed * dt; P.run += dt * speed * 0.42;
  P.x += (LANES[P.lane] - P.x) * Math.min(1, dt * 16);
  if (jumpBuf > 0) jumpBuf -= dt;
  if (P.y > 0 || P.vy > 0) { P.vy -= GRAV * dt; P.y += P.vy * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; if (jumpBuf > 0) { jumpBuf = 0; P.vy = JUMP_V; sfx.jump(); } } }
  if (P.slide > 0) P.slide -= dt;
  P.duck += ((P.slide > 0 ? 1 : 0) - P.duck) * Math.min(1, dt * 16); if (P.duck < 0.01) P.duck = 0;
  V.bend += (bendAt(P.z) - V.bend) * Math.min(1, dt * 1.5);
  const wasBoost = boostT > 0; mountT += dt;
  magnetT = Math.max(0, magnetT - dt); boostT = Math.max(0, boostT - dt);
  if (wasBoost && boostT === 0) { leftBike = { x: P.x, z: P.z, t: 0, kind: rideKind }; toast('Thanks, oga! 👋', 'good'); }
  if (leftBike) { leftBike.t += dt; leftBike.z += 30 * dt; if (leftBike.t > 1.6) leftBike = null; } invuln = Math.max(0, invuln - dt); shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
  while (nextRow < P.z + 125) { const gap = Math.max(21, speed * 1.05) + Math.random() * 6; const jz = junctionRowZ(nextRow, gap); if (jz !== null) nextRow = jz; spawnRow(nextRow, gap); if (jz !== null) addTurners(nextRow); nextRow += gap; }
  for (const o of obstacles) {
    if (o.dead) continue;
    if (o.turn) turnUpdate(o, dt);
    if (o.dead) continue;
    if (o.vz) o.z += o.vz * dt;
    if (hits(o)) { crash(o); if (mode !== 'play') return; }
    if (!o.passed && o.z + o.d < P.z - 0.4) {
      o.passed = true;
      if (tgt && tgt.hidden <= 0 && (o.type === 'barrier' || o.type === 'okada' || o.type === 'banner') && (P.y > 0.3 || P.slide > 0)) tgt.gap = Math.max(1, tgt.gap - CHASE.hurdle);   // clearing a hurdle gains ground
      if ((o.type === 'danfo' || o.type === 'truck' || o.type === 'okada') && Math.abs(P.x - o.x) < 2.8 && Math.abs(P.x - o.x) > 0.5 && P.y < 0.3) {
        bonus += 50; toast(['Oya o! 😮', 'Close one!', 'Chai! 😅'][rint(3)], 'good'); if (o.type !== 'okada') sfx.horn();
        if (tgt && tgt.hidden <= 0) tgt.gap = Math.max(1, tgt.gap - CHASE.near); if (cop) cop.gap = Math.min(40, cop.gap + 3);
      }
    }
  }
  for (const c of coins) {
    if (c.got) continue;
    if (magnetT > 0 && c.z - P.z < 12 && c.z - P.z > -1 && Math.abs(c.x - P.x) < 6) { c.x += (P.x - c.x) * Math.min(1, dt * 10); c.z += (P.z - c.z) * Math.min(1, dt * 6); c.y += (P.y + 0.9 - c.y) * Math.min(1, dt * 8); }
    if (Math.abs(c.x - P.x) < 1 && Math.abs(c.z - P.z) < 1.1 && c.y > P.y - 0.4 && c.y < P.y + 2.0) {
      c.got = true; naira += coinMul; streak++; sfx.coin(); if (tgt && tgt.hidden <= 0) tgt.gap = Math.max(1, tgt.gap - CHASE.coin); if (cop) cop.gap = Math.min(40, cop.gap + 0.15);
      if (streak === 10) toast('Cash dey flow! 💸', 'cash'); else if (streak === 30) toast('Omo! Money dey land 🤑', 'cash'); else if (streak === 60) toast('You don blow! 🔥', 'cash');
    }
  }
  for (const p of pups) {
    if (p.got) continue;
    if (Math.abs(p.x - P.x) < 1.2 && Math.abs(p.z - P.z) < 1.4) {
      p.got = true; sfx.power();
      if (p.kind === 'magnet') { magnetT = magDur(); toast('JARA MAGNET! 🧲', 'good'); } else if (p.kind === 'shield') { shield = true; toast('ANKARA SHIELD! 🛡️', 'good'); } else { boostT = boostDur(); mountT = 0; rideKind = Math.random() < 0.5 ? 'okada' : 'scooter'; toast(rideKind === 'okada' ? 'OKADA RIDE! 🏍️' : 'LADY-BIKE RIDE! 🛵', 'good'); sfx.horn(); }
    }
  }
  const zn = zoneAt(P.z + 25); if (zn !== lastZone) { if (zn === 'bridge') toast('🌉 Third Mainland Bridge', 'place'); else if (lastZone === 'bridge') toast('📍 Back on the mainland', 'place'); lastZone = zn; }
  while (mileIdx < MILES.length && dist() >= MILES[mileIdx][0]) { toast('📍 ' + MILES[mileIdx][1], 'place'); mileIdx++; }
  obstacles = obstacles.filter(o => !o.dead && o.z + o.d > P.z - 14); coins = coins.filter(c => !c.got && c.z > P.z - 14); pups = pups.filter(p => !p.got && p.z > P.z - 14);
  if (tgt) targetUpdate(dt); if (cop) copUpdate(dt);
  camShift += (P.x * 0.55 - V.camX) * Math.min(1, dt * 6); V.camX += (P.x * 0.55 - V.camX) * Math.min(1, dt * 6);
  V.camZ = P.z - 7.4 - (boostT > 0 ? 1.2 : 0); V.camY = 4.6;
  updateHud();
}
function stepMenu(dt) {   // attract mode behind the menu
  T += dt; P.z += 15 * dt; P.run += dt * 6.5; V.bend += (bendAt(P.z) - V.bend) * Math.min(1, dt * 1.5); V.camX = Math.sin(T * 0.4) * 0.6; V.camZ = P.z - 7.4; V.camY = 4.6;
}
function tryRevive(o, why) {                                                       // 🙏 Second Chance: survive one fatal crash
  if (revives <= 0) return false;
  revives--; invuln = 2.6; shake = 0.4; flash = 0.25; sfx.power();
  for (const ob of obstacles) if (ob.z > P.z - 4 && ob.z < P.z + 55) ob.dead = true;   // clear the road in front of you
  if (cop) cop.gap = Math.max(cop.gap, 22);
  toast('SECOND CHANCE! 🙏', 'good'); return true;
}
function gameOver(o, why) {
  if (tryRevive(o, why)) return;
  mode = 'over'; shake = 0.5; flash = 0.35; sfx.crash(); const myRun = runId;
  const s = score(), d = dist(), isBest = s > best;
  const arrestsAtEnd = OUTFITS[outfit].mode === 'chase' ? `👮 Arrests: ${arrests}` : OUTFITS[outfit].mode === 'hunted' ? `🚨 Stumbles survived: ${stumbles}` : null;
  if (isBest) { best = s; store.set('lagosrush-best', best); }
  totalNaira += naira; store.set('lagosrush-naira', totalNaira);
  $('hud').hidden = true;
  setTimeout(() => {
    if (mode !== 'over' || runId !== myRun) return;
    const caught = why === 'caught';
    $('overTitle').textContent = caught ? 'ARRESTED!' : o && o.type === 'barrier' ? 'ROAD BLOCK!' : 'WAHALA!';
    $('overLine').textContent = caught ? ARREST_LINES[rint(ARREST_LINES.length)] : CRASH_LINES[rint(CRASH_LINES.length)];
    const ex = $('oExtra'); ex.hidden = !(arrestsAtEnd !== null); ex.textContent = arrestsAtEnd === null ? '' : arrestsAtEnd;
    $('oDist').textContent = d + 'm'; $('oNaira').textContent = '₦' + naira; $('oScore').textContent = s; $('oBest').textContent = best; $('newBest').hidden = !isBest;
    $('over').hidden = false; refreshMenu();
  }, 650);
}
function updateHud(force) {
  const d = dist() + 'm', n = '₦' + naira, s = String(score());
  if (force || $('distVal').textContent !== d) $('distVal').textContent = d;
  if (force || $('nairaVal').textContent !== n) $('nairaVal').textContent = n;
  if (force || $('scoreVal').textContent !== s) $('scoreVal').textContent = s;
  const mc = $('missionChip');
  if (tgt) { mc.hidden = false; mc.className = 'mission-chip' + (tgt.hidden > 0 ? '' : tgt.gap < 12 ? ' hot' : tgt.gap > 55 ? ' cold' : ''); mc.textContent = tgt.hidden > 0 ? '👮 Next suspect…' : `🎯 Suspect ${Math.round(tgt.gap)}m  ·  👮 ${arrests}`; }
  else if (cop) { mc.hidden = false; mc.className = 'mission-chip' + (cop.gap < 12 ? ' hot' : ''); mc.textContent = `🚨 Police ${Math.max(0, Math.round(cop.gap))}m`; }
  else mc.hidden = true;
  const pw = [];
  if (boostT > 0) pw.push((rideKind === 'okada' ? '🏍️ ' : '🛵 ') + Math.ceil(boostT) + 's'); if (magnetT > 0) pw.push('🧲 ' + Math.ceil(magnetT) + 's'); if (shield) pw.push('🛡️'); if (coinMul > 1) pw.push('💸×2'); if (revives > 0) pw.push('🙏');
  const html = pw.map(x => `<span class="pw">${x}</span>`).join(''); if ($('powerRow').innerHTML !== html) $('powerRow').innerHTML = html;
}

// ===================== RENDERING =====================
let SUN_X = 0;
function drawSky() {
  const hy = V.hy, grd = g.createLinearGradient(0, 0, 0, hy + 10);
  grd.addColorStop(0, '#2c2052'); grd.addColorStop(0.45, '#9b4a6e'); grd.addColorStop(0.8, '#f08a5a'); grd.addColorStop(1, rgb(FOG));
  g.fillStyle = grd; g.fillRect(0, 0, V.W, hy + 10);
  const sunX = SUN_X = V.W * 0.68 - V.camX * 4, sunY = hy - V.H * 0.06, sr = V.W * 0.13;
  const glow = g.createRadialGradient(sunX, sunY, sr * 0.3, sunX, sunY, sr * 3);
  glow.addColorStop(0, 'rgba(255,230,150,.9)'); glow.addColorStop(0.3, 'rgba(255,170,90,.45)'); glow.addColorStop(1, 'rgba(255,150,80,0)');
  g.fillStyle = glow; g.fillRect(0, 0, V.W, hy + 10);
  g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(sunX, sunY, sr, 0, 7); g.fill();
  // distant skyline (parallax)
  g.fillStyle = 'rgba(70,40,90,.75)';
  for (let i = -2; i < 26; i++) { const w = V.W / 14, h = 18 + rnd(i, 3) * 70, x = i * w - (V.camX * 3 % w) - ((P.z * 0.2) % w) * 0; g.fillRect(x, hy - h, w * 0.8, h + 4); }
  g.fillStyle = 'rgba(95,55,105,.8)';
  for (let i = -2; i < 20; i++) { const w = V.W / 9, h = 10 + rnd(i, 8) * 44, x = i * w - (V.camX * 5 % w); g.fillRect(x, hy - h, w * 0.7, h + 4); }
}
function drawGround() {
  const hy = V.hy, grd = g.createLinearGradient(0, hy, 0, V.H); grd.addColorStop(0, rgb(FOG)); grd.addColorStop(0.18, '#9c6a58'); grd.addColorStop(1, '#4a3340');
  g.fillStyle = grd; g.fillRect(0, hy, V.W, V.H - hy);
  const N = V.near, Fz = V.view, i0 = Math.floor(V.camZ / SEG), i1 = Math.floor((V.camZ + Fz) / SEG);
  // ---- water under the bridge (drawn first; the deck is painted on top of it) ----
  let bridgeSeen = false;
  for (let i = i0; i <= i1; i++) {
    if (zoneAt(i * SEG + SEG / 2) !== 'bridge') continue; bridgeSeen = true;
    const a = Math.max(i * SEG - V.camZ, N), b = Math.max((i + 1) * SEG - V.camZ + 0.4, N + 0.01);
    poly(g, [[-260, -9, a], [260, -9, a], [260, -9, b], [-260, -9, b]], [18, 84, 112], (a + b) * 0.21);   // less haze than the road, so the lagoon stays blue
  }
  if (bridgeSeen) poly(g, [[-3000, -9, Fz], [3000, -9, Fz], [3000, -9, 4000], [-3000, -9, 4000]], [18, 84, 112], Fz * 0.42);   // open water out to the horizon
  if (bridgeSeen) {   // sun glitter on the water + a darker band under the far shore
    g.fillStyle = 'rgba(70,60,90,.55)'; g.fillRect(0, hy - 2, V.W, 7);
    for (let k = 0; k < 60; k++) {
      const u = rnd(k, 41), y = hy + 6 + u * u * V.H * 0.42, x = SUN_X + (rnd(k, 42) - 0.5) * (26 + (y - hy) * 1.2), w = 8 + (y - hy) * 0.28, sh = 0.28 + 0.3 * Math.sin(T * 2.2 + k * 1.7);
      g.fillStyle = `rgba(255,238,190,${Math.max(0.05, sh)})`; g.fillRect(x - w / 2, y, w, 1.5 + (y - hy) * 0.012);
    }
  }
  // ---- pavements: wide on the street, a narrow footway on the bridge; a bus bay is asphalt with road markings ----
  for (let i = i0; i <= i1; i++) {
    const a = Math.max(i * SEG - V.camZ, N), b = Math.max((i + 1) * SEG - V.camZ + 0.3, N + 0.01); if (b <= N) continue;
    if (isJunction(i)) {                                                                                  // side street: asphalt right across the pavement
      const zc = i * SEG + SEG / 2;
      for (const sd of [-1, 1]) {
        poly(g, [[sd * 4.4, 0, a], [sd * 72, 0, a], [sd * 72, 0, b], [sd * 4.4, 0, b]], [66, 64, 74], (a + b) / 2);
        for (let q = 0; q < 9; q++) { const x0 = sd * (8 + q * 6), x1 = sd * (10.6 + q * 6), aa = Math.max(zc - 0.08 - V.camZ, N), bb = Math.max(zc + 0.08 - V.camZ, N + 0.01); if (bb > N) poly(g, [[x0, 0.01, aa], [x1, 0.01, aa], [x1, 0.01, bb], [x0, 0.01, bb]], [235, 225, 190], (aa + bb) / 2); }
      }
      continue;
    }
    const out = zoneAt(i * SEG + SEG / 2) === 'bridge' ? 5.7 : 8.2, col = out === 5.7 ? [168, 162, 150] : [150, 140, 128], mid = (a + b) / 2, bay = bayAt(i);
    for (const sd of [-1, 1]) {
      if (bay === sd) {
        poly(g, [[sd * BAY_X0, 0, a], [sd * BAY_X1, 0, a], [sd * BAY_X1, 0, b], [sd * BAY_X0, 0, b]], [66, 64, 72], mid);                    // the bay itself
        poly(g, [[sd * BAY_X1, 0, a], [sd * out, 0, a], [sd * out, 0, b], [sd * BAY_X1, 0, b]], col, mid);                                  // thin pavement behind it
        const wl = sd * (BAY_X0 + 0.04); poly(g, [[wl - 0.07, 0.01, a], [wl + 0.07, 0.01, a], [wl + 0.07, 0.01, b], [wl - 0.07, 0.01, b]], [240, 240, 235], mid);   // solid white line: no entry
        for (let q = 0; q < 3; q++) { const z0 = i * SEG + 1.5 + q * 4.6, aa = Math.max(z0 - V.camZ, N), bb = Math.max(z0 + 0.35 - V.camZ, N + 0.01); if (bb > N) poly(g, [[sd * 5.0, 0.01, aa], [sd * 7.3, 0.01, aa], [sd * 7.3, 0.01, bb], [sd * 5.0, 0.01, bb]], [225, 222, 210], (aa + bb) / 2); }   // bay bars
      } else {
        poly(g, [[sd * 4.6, 0, a], [sd * out, 0, a], [sd * out, 0, b], [sd * 4.6, 0, b]], col, mid);
      }
    }
  }
  const k0 = Math.floor(V.camZ / 4) * 4;                                                       // kerbs painted yellow & black
  for (let z = k0; z < V.camZ + Fz; z += 4) {
    const a = Math.max(z - V.camZ, N), b = Math.max(z + 4 - V.camZ, N + 0.01); if (b <= N || isJunction(Math.floor((z + 2) / SEG))) continue; const c = (z / 4) % 2 === 0 ? [240, 200, 40] : [35, 35, 40];
    for (const xs of [[-4.7, -4.4], [4.4, 4.7]]) poly(g, [[xs[0], 0.05, a], [xs[1], 0.05, a], [xs[1], 0.05, b], [xs[0], 0.05, b]], c, (a + b) / 2);
  }
  // asphalt drawn in depth slices so fog fades smoothly
  const slices = Math.abs(V.bend) > 0.0002 ? 26 : 14;
  for (let i = 0; i < slices; i++) {
    const a = N + (Fz - N) * Math.pow(i / slices, 1.8), b = N + (Fz - N) * Math.pow((i + 1) / slices, 1.8);
    poly(g, [[-4.4, 0, a], [4.4, 0, a], [4.4, 0, b + 0.5], [-4.4, 0, b + 0.5]], [64, 62, 70], (a + b) / 2);
  }
  // lane dashes
  const start = Math.floor(V.camZ / 6) * 6;
  for (let z = start; z < V.camZ + Fz; z += 6) {
    const a = Math.max(z - V.camZ, N), b = Math.max(z + 2.6 - V.camZ, N + 0.01); if (b <= N || isJunction(Math.floor((z + 1) / SEG))) continue;
    for (const x of [-1.5, 1.5]) poly(g, [[x - 0.07, 0, a], [x + 0.07, 0, a], [x + 0.07, 0, b], [x - 0.07, 0, b]], [235, 225, 190], (a + b) / 2);
  }
  // zebra crossing + stop line at every junction
  for (let i = i0; i <= i1; i++) {
    if (!isJunction(i)) continue; const z0 = i * SEG;
    for (let q = 0; q < 8; q++) { const xa = -4.1 + q * 1.05, a = Math.max(z0 + 1 - V.camZ, N), b = Math.max(z0 + 4.2 - V.camZ, N + 0.01); if (b > N) poly(g, [[xa, 0.02, a], [xa + 0.55, 0.02, a], [xa + 0.55, 0.02, b], [xa, 0.02, b]], [240, 240, 235], (a + b) / 2); }
    const a = Math.max(z0 - 0.5 - V.camZ, N), b = Math.max(z0 - 0.1 - V.camZ, N + 0.01); if (b > N) poly(g, [[-4.4, 0.02, a], [4.4, 0.02, a], [4.4, 0.02, b], [-4.4, 0.02, b]], [240, 240, 235], (a + b) / 2);
  }
}
function drawCoin(c) {
  const dz = c.z - V.camZ; if (dz < V.near) return;
  const s = V.F / dz, x = SX(c.x, dz), y = SY(c.y, dz), w = s * 0.75 * Math.abs(Math.cos(T * 5 + c.z)) + s * 0.12, h = s * 0.42;
  g.fillStyle = fogged([40, 150, 80], dz); g.fillRect(x - w / 2, y - h / 2, w, h);
  g.fillStyle = fogged([150, 235, 175], dz); g.fillRect(x - w / 2 + 2, y - h / 2 + 2, Math.max(1, w - 4), Math.max(1, h - 4));
  if (w > 14) { g.fillStyle = fogged([30, 110, 60], dz); g.font = `800 ${h * 0.7}px Inter, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₦', x, y + 1); }
}
function drawPowerup(p) {
  const dz = p.z - V.camZ; if (dz < V.near) return;
  const s = V.F / dz, x = SX(p.x, dz), y = SY(p.y + 0.25 * Math.sin(T * 4), dz), r = s * 0.55;
  g.fillStyle = 'rgba(255,230,120,.35)'; g.beginPath(); g.arc(x, y, r * 1.4, 0, 7); g.fill();
  g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.font = `${r * 1.25}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.kind === 'magnet' ? '🧲' : p.kind === 'shield' ? '🛡️' : '⚡', x, y + 1);
}
function drawSpeedLines() {
  if (boostT <= 0) return; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
  for (let i = 0; i < 14; i++) { const a = rnd(i, Math.floor(T * 20)) * 6.28, r0 = V.H * 0.25, r1 = V.H * (0.45 + rnd(i, 9) * 0.3); g.beginPath(); g.moveTo(V.cx + Math.cos(a) * r0, V.H * 0.55 + Math.sin(a) * r0); g.lineTo(V.cx + Math.cos(a) * r1, V.H * 0.55 + Math.sin(a) * r1); g.stroke(); }
}
function render() {
  g.save();
  if (shake > 0) g.translate((Math.random() - 0.5) * shake * 26, (Math.random() - 0.5) * shake * 26);
  drawSky(); drawGround();
  const items = [], i0 = Math.floor(V.camZ / SEG) - 1, i1 = Math.floor((V.camZ + V.view) / SEG);
  for (let i = i0; i <= i1; i++) { buildingSegment(i, -1, items); buildingSegment(i, 1, items); }
  for (const o of obstacles) if (!o.dead && o.z - V.camZ < V.view) items.push({ z: o.z + o.d / 2, fn: () => drawObstacle(o) });
  for (const c of coins) if (!c.got && c.z - V.camZ < V.view) items.push({ z: c.z, fn: () => drawCoin(c) });
  for (const p of pups) if (!p.got && p.z - V.camZ < V.view) items.push({ z: p.z, fn: () => drawPowerup(p) });
  if (mode === 'scene' && scene) sceneItems(items);
  else {
    if (mode !== 'menu') items.push({ z: P.z, fn: drawPlayer });          // the dashboard shows the character itself
    if (leftBike) items.push({ z: leftBike.z, fn: drawLeftBike });
    if (tgt && tgt.hidden <= 0) items.push({ z: tgt.z, fn: drawTarget });
    if (cop && cop.gap < 7) items.push({ z: P.z - cop.gap, fn: drawCops });
  }
  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.fn();
  drawSpeedLines();
  if (cop && mode === 'play') {                                       // police lights flicker at the screen edges when they are close
    const k = clamp(1 - cop.gap / 24, 0, 1), flick = Math.floor(T * 6) % 2 === 0;
    if (k > 0) { const gl = g.createLinearGradient(flick ? 0 : V.W, 0, flick ? V.W * 0.45 : V.W * 0.55, 0); gl.addColorStop(0, flick ? `rgba(255,50,60,${0.45 * k})` : `rgba(60,90,255,${0.45 * k})`); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, V.W, V.H); }
  }
  while (LATE.length) LATE.pop()();                                   // speech bubbles are drawn last so nothing covers them
  if (flash > 0) { g.fillStyle = `rgba(255,60,90,${flash * 1.4})`; g.fillRect(0, 0, V.W, V.H); }
  g.restore();
}

// ===================== INPUT & UI =====================
let sw = null;
cv.addEventListener('pointerdown', e => { audio(); sw = { x: e.clientX, y: e.clientY, done: false }; });
cv.addEventListener('pointermove', e => {
  if (!sw || sw.done || mode !== 'play') return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y, th = 26;
  if (Math.abs(dx) < th && Math.abs(dy) < th) return;
  sw.done = true; if (Math.abs(dx) > Math.abs(dy)) changeLane(dx > 0 ? 1 : -1); else if (dy < 0) jump(); else slide();
});
cv.addEventListener('pointerup', () => { if (sw && !sw.done && mode === 'play') jump(); sw = null; });
cv.addEventListener('pointercancel', () => { sw = null; });
document.addEventListener('keydown', e => {
  const k = e.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault();
  if (mode === 'scene' && (k === 'Enter' || k === 'Space' || k === 'Escape')) { skipScene(); return; }
  if (mode === 'menu' && (k === 'Enter' || k === 'Space') && $('shop').hidden) { dashPlay(); return; }
  if (mode === 'over' && (k === 'Enter' || k === 'Space') && !$('over').hidden) { startGame(); return; }
  if (k === 'KeyP' || k === 'Escape') { togglePause(); return; }
  if (k === 'ArrowLeft' || k === 'KeyA') changeLane(-1); else if (k === 'ArrowRight' || k === 'KeyD') changeLane(1);
  else if (k === 'ArrowUp' || k === 'KeyW' || k === 'Space') jump(); else if (k === 'ArrowDown' || k === 'KeyS') slide();
});
function togglePause() {
  if (mode === 'play') { mode = 'pause'; $('pausePanel').hidden = false; } else if (mode === 'pause') { mode = 'play'; $('pausePanel').hidden = true; last = performance.now(); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') togglePause(); });
$('skipBtn').addEventListener('click', skipScene); $('pauseBtn').addEventListener('click', togglePause); $('resumeBtn').addEventListener('click', togglePause);
$('quitBtn').addEventListener('click', () => { mode = 'menu'; reset(); $('pausePanel').hidden = true; $('hud').hidden = true; $('menu').hidden = false; refreshMenu(); });
$('playBtn').addEventListener('click', dashPlay); $('againBtn').addEventListener('click', startGame);
$('menuBtn').addEventListener('click', () => { mode = 'menu'; reset(); $('over').hidden = true; $('menu').hidden = false; refreshMenu(); });
$('soundBtn').addEventListener('click', () => { soundOn = !soundOn; localStorage.setItem('lagosrush-sound', soundOn ? 'on' : 'off'); refreshMenu(); });
$('shareBtn').addEventListener('click', () => {
  const url = location.href.replace(/games\/lagosrush\/.*$/, ''), msg = `🇳🇬 I ran ${dist()}m and grabbed ₦${naira} on LAGOS RUSH! Score: ${score()}. Can you beat me? 🏃🚌 ${url}`;
  if (navigator.share) navigator.share({ text: msg }).catch(() => {}); else window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
});
function refreshMenu() { dashRefresh(); }
// ---- main loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (mode === 'scene') V.bend = 0;
  if (mode === 'play') step(dt); else if (mode === 'scene') stepScene(dt); else if (mode === 'menu' || mode === 'over') stepMenu(dt);
  render(); if (mode === 'menu') dashFrame(now); requestAnimationFrame(frame);
}
window.addEventListener('resize', () => resize(cv, g));
resize(cv, g); reset(); refreshMenu(); requestAnimationFrame(frame);
