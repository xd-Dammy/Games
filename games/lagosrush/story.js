// ===================== story.js — the short "plays" that run before a story character's run starts =====================
// A scene is a little animated play built from the same boxes as the game, with comic-style speech bubbles.
// Every scene ENDS exactly where the run begins (runner at z = 0 in lane 2, camera in the normal chase position), so there is no jump cut.
const sE = u => u * u * (3 - 2 * u);                       // ease in-out
const sSeg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);  // 0..1 progress of t between a and b
const sLerp = (a, b, u) => a + (b - a) * u;
let scene = null, sceneT = 0, sceneDone = null;
const say = (x, y, z, text) => LATE.push(() => bubbleNow(x, y, z, text));

const SCENES = {
  // ---- Officer Bala spots a Yahoo Boy talking on his phone on the street ----
  yahoo_chase: {
    dur: 5.8,
    init() { this.s = { yx: 2.5, yz: 12, yy: 0, yrun: 0, whistled: false, phoneZ: 0, phoneY: 0 }; },
    update(t, dt) {
      const s = this.s, run = sSeg(t, 2.6, 5.8);
      // the officer (you): stands on the pavement, then sprints onto the road
      const cu = run * run; P.x = sLerp(-6.2, 0, sE(sSeg(t, 2.6, 5.4))); P.z = sLerp(-16, 0, cu); P.lane = 1; P.y = 0; P.vy = 0; P.slide = 0;
      if (run > 0) P.run += dt * 6.5;
      // the suspect: strolling and chatting, then startled, drops the phone and bolts
      const sprint = sSeg(t, 2.95, 5.8); s.yx = sLerp(2.5, 0, sE(sSeg(t, 2.95, 4.8)));
      s.yz = t < 2.6 ? 12 + t * 1.4 : t < 2.95 ? 12 + 2.6 * 1.4 : sLerp(15.64, 28, sprint * sprint);
      s.yy = t > 2.6 && t < 2.95 ? 0.6 * Math.sin(Math.PI * (t - 2.6) / 0.35) : 0;
      s.yrun += dt * (t < 2.6 ? 2.2 : t < 2.95 ? 0 : 6.5);
      if (t > 2.6) { s.phoneZ = 15.7; s.phoneY = Math.max(0, 1.7 - 12 * (t - 2.6) * (t - 2.6)); }
      if (t >= 2.0 && !s.whistled) { s.whistled = true; sfx.whistle(); }
      const w = sE(sSeg(t, 2.4, 5.6));                      // camera glides into the normal chase view
      V.camX = sLerp(-4.0, P.x * 0.55, w); V.camY = sLerp(3.0, 4.6, w); V.camZ = sLerp(-24, P.z - 7.4, w);
    },
    items(t, items) {
      const s = this.s; items.push({ z: P.z, fn: drawPlayer });
      items.push({ z: s.yz, fn: () => figure(s.yx, 0, s.yz, suspectSpec(s.yrun, 0, { y: s.yy, phone: t < 2.6 })) });
      if (t > 2.6) items.push({ z: s.phoneZ, fn: () => box(g, 2.75, s.phoneY, s.phoneZ, 0.1, 0.03, 0.2, [20, 20, 24]) });
    },
    bubbles(t) {
      const s = this.s;
      if (t > 0.3 && t < 2.2) say(s.yx, 2.6, s.yz, 'Oga, the money don enter! 💸');
      if (t > 2.0 && t < 3.6) say(P.x, 2.8, P.z, 'STOP! POLICE!');
      if (t > 2.75 && t < 4.1) say(s.yx, 2.7, s.yz, 'Ah ah! Police!');
      if (t > 3.9 && t < 5.4) say(P.x, 2.8, P.z, 'Come back here!');
    },
  },

  // ---- Slim Jay counts his "business" money when a police van screeches in ----
  getaway: {
    dur: 6.0,
    init() { this.s = { vz: -72, lights: false, ox: 1.4, oz: -28, orun: null, sirenT: 0, screeched: false }; },
    update(t, dt) {
      const s = this.s, run = sSeg(t, 3.0, 6.0);
      P.x = sLerp(-6.2, 0, sE(sSeg(t, 3.0, 5.0))); P.z = sLerp(-22, 0, run * run); P.lane = 1; P.slide = 0; P.vy = 0;
      P.y = t > 2.6 && t < 2.95 ? 0.6 * Math.sin(Math.PI * (t - 2.6) / 0.35) : 0;
      if (run > 0) P.run += dt * 6.5;
      s.lights = t > 0.8; s.vz = sLerp(-72, -28, sE(sSeg(t, 0.8, 2.3)));
      s.sirenT -= dt; if (t > 0.8 && t < 3.6 && s.sirenT <= 0) { sfx.siren(); s.sirenT = 0.42; }
      if (t > 2.2 && !s.screeched) { s.screeched = true; beep(900, 180, 450, 'sawtooth', 0.12); }
      const ou = sSeg(t, 3.2, 6.0); s.oz = sLerp(-28, -14, ou * ou); s.ox = sLerp(1.4, 0, sE(sSeg(t, 3.2, 5.0))); s.orun = ou > 0 ? (s.orun || 0) + dt * 6.5 : null;
      const w = sE(sSeg(t, 3.0, 6.0));
      V.camX = sLerp(0.8, P.x * 0.55, w); V.camY = sLerp(3.3, 4.6, w); V.camZ = sLerp(-33, P.z - 7.4, w);
    },
    items(t, items) {
      const s = this.s; items.push({ z: P.z, fn: drawPlayer });
      items.push({ z: s.vz + 2.7, fn: () => policeVan(3.1, s.vz, t, s.lights) });
      if (t > 2.4) items.push({ z: s.oz, fn: () => figure(s.ox, 0, s.oz, officerSpec('police', s.orun, { armsUp: t < 3.2 })) });
    },
    bubbles(t) {
      const s = this.s;
      if (t > 0.3 && t < 2.1) say(P.x, 2.9, P.z, 'Money don land! 💰');
      if (t > 2.5 && t < 4.0) say(s.ox, 2.8, s.oz, 'STOP! POLICE!');
      if (t > 2.7 && t < 4.1) say(P.x, 3.0, P.z, 'Chai! Na police!');
      if (t > 4.4 && t < 5.8) say(s.ox, 2.8, s.oz, 'Oya, come back!');
    },
  },
};

function startScene(name, done) {
  scene = SCENES[name]; sceneT = 0; sceneDone = done; scene.init(); scene.update(0, 0);
  $('skipBtn').hidden = false; $('hud').hidden = true;
}
function stepScene(dt) { sceneT += dt; scene.update(sceneT, dt); if (sceneT >= scene.dur) finishScene(); }
function sceneItems(items) { scene.items(sceneT, items); scene.bubbles(sceneT); }
function finishScene() {
  if (!scene) return; scene.update(scene.dur, 0); $('skipBtn').hidden = true;
  const d = sceneDone; scene = null; sceneDone = null; if (d) d();
}
function skipScene() { if (scene) { sceneT = scene.dur; finishScene(); } }
