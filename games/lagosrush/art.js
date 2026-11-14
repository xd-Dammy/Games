// ===================== art.js — everything you SEE: the runner, danfo, okada, trucks, people and the street =====================
// Built from boxes with the tiny engine in engine.js. Change colours/shapes here without touching the game rules in game.js.

const SKINS = [[120, 78, 52], [150, 100, 70], [105, 68, 46], [170, 120, 86], [90, 58, 40]];
const SHIRTS = [[220, 80, 60], [60, 130, 200], [240, 190, 50], [90, 170, 100], [200, 110, 170], [240, 240, 240], [255, 140, 60]];
const PANTS = [[40, 50, 90], [60, 60, 66], [120, 90, 60], [30, 70, 100]];
const STALL_COLS = [[230, 70, 60], [60, 140, 210], [250, 190, 40], [70, 170, 90], [200, 90, 170]];

// A simple person seen from behind (pedestrians, conductors, okada riders' passengers)
function person(x, y, z, o = {}) {
  const dz = z - V.camZ; if (dz < V.near || dz > 70) return;
  if (dz > 24) {                                                    // far away: just a coloured body + head (much cheaper)
    const k = V.F / dz, sx = SX(x, dz), sy = SY(y, dz), sc = o.s || 1;
    g.fillStyle = fogged(o.pants || PANTS[0], dz); g.fillRect(sx - 0.2 * k * sc, sy - 0.5 * k * sc, 0.4 * k * sc, 0.5 * k * sc);
    g.fillStyle = fogged(o.shirt || SHIRTS[0], dz); g.fillRect(sx - 0.25 * k * sc, sy - 1.05 * k * sc, 0.5 * k * sc, 0.55 * k * sc);
    g.fillStyle = fogged(o.hair || [22, 18, 18], dz); g.fillRect(sx - 0.14 * k * sc, sy - 1.35 * k * sc, 0.28 * k * sc, 0.3 * k * sc);
    return;
  }
  const s = o.s || 1, sh = o.shirt || SHIRTS[0], pa = o.pants || PANTS[0], sk = o.skin || SKINS[0], hr = o.hair || [22, 18, 18];
  box(g, x - 0.11 * s, y, z, 0.17 * s, 0.5 * s, 0.2 * s, pa); box(g, x + 0.11 * s, y, z, 0.17 * s, 0.5 * s, 0.2 * s, pa);
  const ay = o.armsUp ? 0.62 : 0.0;
  box(g, x - 0.3 * s, y + (0.5 + ay) * s, z, 0.12 * s, 0.5 * s, 0.14 * s, sk); box(g, x + 0.3 * s, y + (0.5 + ay) * s, z, 0.12 * s, 0.5 * s, 0.14 * s, sk);
  box(g, x, y + 0.5 * s, z, 0.46 * s, 0.56 * s, 0.24 * s, sh);
  box(g, x, y + 1.06 * s, z, 0.14 * s, 0.07 * s, 0.14 * s, sk);
  box(g, x, y + 1.12 * s, z, 0.27 * s, 0.28 * s, 0.26 * s, hr);
}

// ---------------------------------------------------------------- THE RUNNER
function drawPlayer() {
  if (boostT > 0) { drawRide(); return; }
  const o = OUTFITS[outfit] || OUTFITS[0], dzP = P.z - V.camZ, k = V.F / dzP;
  const gx = SX(P.x, dzP), gy = SY(0, dzP);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(gx, gy, k * 0.6 * (1 - Math.min(0.6, P.y / 4)), k * 0.15, 0, 0, 7); g.fill();
  if (invuln > 0 && Math.floor(T * 14) % 2 === 0) return;
  const x = P.x, z = P.z - 0.3, air = P.y > 0.05, ph = Math.sin(P.run * 3.2);
  const bob = air ? 0 : Math.abs(ph) * 0.07, y0 = P.y + bob;
  const lift1 = air ? 0.4 : Math.max(0, ph) * 0.36, lift2 = air ? 0.16 : Math.max(0, -ph) * 0.36;
  const swing = air ? 0.0 : ph * 0.2;
  if (boostT > 0) { g.fillStyle = 'rgba(255,200,60,.25)'; g.beginPath(); g.ellipse(gx, SY(P.y + 0.95, dzP), k * 1.1, k * 1.25, 0, 0, 7); g.fill(); }
  if (shield) { g.strokeStyle = 'rgba(120,230,255,.85)'; g.lineWidth = 3; g.beginPath(); g.ellipse(gx, SY(P.y + 0.95, dzP), k * 0.95, k * 1.12, 0, 0, 7); g.stroke(); }
  const robe = o.style === 'agbada', hood = o.style === 'hoodie';
  if (P.duck > 0.02) { drawSlidePose(o, x, z, P.duck); return; }                                  // sliding: a smooth lean-back slide
  // legs + sneakers
  box(g, x - 0.2, y0 + lift1, z, 0.3, 0.8, 0.36, o.pants); box(g, x + 0.2, y0 + lift2, z, 0.3, 0.8, 0.36, o.pants);
  const shoe = o.style === 'police' ? [28, 28, 34] : [245, 245, 245];
  box(g, x - 0.2, y0 + lift1, z - 0.04, 0.34, 0.05, 0.52, o.trim); box(g, x + 0.2, y0 + lift2, z - 0.04, 0.34, 0.05, 0.52, o.trim);        // sole first, so the shoe covers it
  box(g, x - 0.2, y0 + lift1 + 0.03, z - 0.04, 0.33, 0.15, 0.5, shoe); box(g, x + 0.2, y0 + lift2 + 0.03, z - 0.04, 0.33, 0.15, 0.5, shoe);
  // arms (short sleeves)
  const aL = (air ? 0.62 : 0) + swing, aR = (air ? 0.62 : 0) - swing, ax = robe ? 0.66 : 0.56;
  box(g, x - ax, y0 + 0.74 + aL, z, 0.2, 0.46, 0.26, o.skin); box(g, x + ax, y0 + 0.74 + aR, z, 0.2, 0.46, 0.26, o.skin);
  box(g, x - ax, y0 + 1.06 + aL, z, 0.23, 0.3, 0.29, robe ? o.shirt : o.shirt); box(g, x + ax, y0 + 1.06 + aR, z, 0.23, 0.3, 0.29, o.shirt);
  // torso — each outfit has its own look from behind
  let r;
  if (robe) {
    r = box(g, x, y0 + 0.46, z - 0.02, 1.0, 1.08, 0.5, o.shirt);
    if (r) { onRect(g, r, 0.43, 0.04, 0.57, 0.96, o.trim); onRect(g, r, 0, 0.9, 1, 1, o.trim); onRect(g, r, 0.18, 0.1, 0.34, 0.2, o.trim); onRect(g, r, 0.66, 0.1, 0.82, 0.2, o.trim); }
  } else {
    r = box(g, x, y0 + 0.8, z, 0.84, 0.74, 0.42, o.shirt);
    if (r && o.style === 'jersey') { onRect(g, r, 0, 0, 1, 0.1, o.trim); onRect(g, r, 0.04, 0.52, 0.96, 0.58, o.trim); textOnRect(g, r, 'XD', 0.5, 0.26, 0.2, o.trim); textOnRect(g, r, '10', 0.5, 0.76, 0.3, o.trim); }
    if (r && o.style === 'ankara') { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if ((a + b) % 2 === 0) onRect(g, r, a / 3, b / 3, (a + 1) / 3, (b + 1) / 3, o.trim); onRect(g, r, 0.45, 0, 0.55, 1, [250, 235, 150]); }
    if (r && hood) { onRect(g, r, 0.3, 0.7, 0.7, 0.95, o.trim); textOnRect(g, r, 'LAGOS', 0.5, 0.42, 0.14, o.trim); }
    if (r && o.style === 'police') { onRect(g, r, 0, 0.62, 1, 0.7, [20, 20, 28]); onRect(g, r, 0.06, 0.08, 0.94, 0.5, [30, 52, 108]); textOnRect(g, r, 'POLICE', 0.5, 0.3, 0.2, [245, 245, 245]); onRect(g, r, 0.42, 0.72, 0.58, 0.86, o.trim); }
    if (r && o.style === 'yahoo') { onRect(g, r, 0.62, 0, 0.7, 1, [40, 40, 46]); textOnRect(g, r, '$$$', 0.36, 0.5, 0.3, o.trim); }
  }
  // head: from behind you mostly see hair; hoodie shows a hood
  box(g, x, y0 + 1.54, z + 0.04, 0.17, 0.08, 0.17, o.skin);
  box(g, x - 0.26, y0 + 1.66, z + 0.06, 0.07, 0.15, 0.1, o.skin); box(g, x + 0.26, y0 + 1.66, z + 0.06, 0.07, 0.15, 0.1, o.skin);
  if (hood) { box(g, x, y0 + 1.5, z - 0.04, 0.66, 0.64, 0.52, o.shirt); box(g, x, y0 + 1.62, z - 0.05, 0.4, 0.3, 0.06, [30, 30, 38]); }
  else if (o.style === 'police') { box(g, x, y0 + 1.6, z + 0.02, 0.48, 0.4, 0.46, o.hair); box(g, x, y0 + 1.84, z, 0.56, 0.2, 0.54, [26, 26, 36]); box(g, x, y0 + 1.84, z - 0.28, 0.2, 0.12, 0.05, o.trim); }
  else if (o.style === 'yahoo') {
    box(g, x, y0 + 1.6, z + 0.02, 0.48, 0.46, 0.46, o.hair); box(g, x, y0 + 1.8, z - 0.02, 0.54, 0.16, 0.5, [210, 40, 50]); box(g, x, y0 + 1.72, z - 0.26, 0.2, 0.1, 0.06, [235, 235, 235]);      // red cap on backwards
    box(g, x - 0.2, y0 + 1.46, z + 0.12, 0.06, 0.22, 0.06, o.trim); box(g, x + 0.2, y0 + 1.46, z + 0.12, 0.06, 0.22, 0.06, o.trim);                                                       // gold chain
    box(g, x - 0.62, y0 + 0.5, z - 0.05, 0.26, 0.34, 0.4, [40, 40, 46]);                                                                                                                   // laptop bag
  }
  else { box(g, x, y0 + 1.6, z + 0.02, 0.48, 0.46, 0.46, o.hair); if (o.style === 'jersey') box(g, x, y0 + 1.72, z - 0.01, 0.5, 0.07, 0.49, o.trim); if (robe) box(g, x, y0 + 1.97, z, 0.5, 0.2, 0.5, o.trim); }
}


// flat colour band on the TOP face of a box that spans x ± w/2 and world z z0..z0+d (fractions along x and z), used for shirt stripes on a lying body
function topBand(x, y, w, z0, d, fx0, fx1, fz0, fz1, color) {
  const a = Math.max(z0 + d * fz0 - V.camZ, V.near), b = Math.max(z0 + d * fz1 - V.camZ, V.near + 0.01); if (b <= a) return;
  const xa = x - w / 2 + w * fx0, xb = x - w / 2 + w * fx1;
  poly(g, [[xa, y, a], [xb, y, a], [xb, y, b], [xa, y, b]], color, (a + b) / 2);
}
// THE SLIDE: every part glides between "running" and "lying back, feet first" with `a` (0..1), so there is no pop.
// Head is nearest the camera, then body, then legs and sneakers pointing down the road.
function drawSlidePose(o, x, z, a) {
  const e = a * a * (3 - 2 * a), L = (u, v) => u + (v - u) * e, yp = P.y, robe = o.style === 'agbada', hood = o.style === 'hoodie';
  const shoe = o.style === 'police' ? [28, 28, 34] : [245, 245, 245];
  // legs (far end) + sneakers
  for (const sx of [-0.2, 0.2]) {
    box(g, x + sx, yp + L(0, 0.1), z + L(0, 0.95), 0.3, L(0.8, 0.3), L(0.36, 0.65), o.pants);
    box(g, x + sx, yp + L(0, 0.1), z + L(-0.04, 1.5), 0.33, L(0.15, 0.26), L(0.5, 0.45), shoe);
    box(g, x + sx, yp + L(0, 0.1), z + L(-0.04, 1.5), 0.34, 0.05, L(0.52, 0.47), o.trim);
  }
  // arms along the body
  for (const sd of [-1, 1]) {
    box(g, x + sd * L(0.56, 0.54), yp + L(0.74, 0.12), z + L(0, 0.15), 0.2, L(0.46, 0.24), L(0.26, 0.8), o.skin);
    box(g, x + sd * L(0.56, 0.54), yp + L(1.06, 0.18), z + L(0, 0.15), 0.23, L(0.3, 0.2), L(0.29, 0.5), o.shirt);
  }
  // torso
  const tw = robe ? L(0.84, 0.9) : 0.84, th = L(0.74, 0.38), ty = yp + L(0.8, 0.14), tz = z + L(0, 0.2), td = L(0.42, 0.75);
  const r = box(g, x, ty, tz, tw, th, td, o.shirt);
  if (e > 0.3) {
    topBand(x, ty + th, tw, tz, td, 0.43, 0.57, 0, 1, o.trim);                                      // centre stripe along the body
    if (o.style === 'police') topBand(x, ty + th, tw, tz, td, 0, 1, 0.78, 0.9, [20, 20, 28]);        // belt
    if (o.style === 'jersey') topBand(x, ty + th, tw, tz, td, 0, 1, 0.08, 0.16, o.trim);
  }
  if (r && e < 0.5) { if (o.style === 'jersey') onRect(g, r, 0, 0, 1, 0.1, o.trim); if (hood) onRect(g, r, 0.3, 0.7, 0.7, 0.95, o.trim); }
  // head (nearest the camera). Hair on top, with the skin of the neck behind it
  const hy = yp + L(1.6, 0.12), hz = z + L(0.02, -0.5);
  box(g, x, hy - 0.06, hz + L(0.02, 0.38), 0.17, 0.08, 0.17, o.skin);
  if (hood) box(g, x, yp + L(1.5, 0.1), hz - 0.02, 0.66, L(0.64, 0.5), 0.52, o.shirt);
  else if (o.style === 'police') { box(g, x, hy, hz, 0.48, 0.46, 0.46, o.hair); box(g, x, hy + L(0.24, 0.36), hz, 0.56, 0.2, 0.54, [26, 26, 36]); }
  else if (o.style === 'yahoo') { box(g, x, hy, hz, 0.48, 0.46, 0.46, o.hair); box(g, x, hy + L(0.2, 0.34), hz, 0.54, 0.16, 0.5, [210, 40, 50]); }
  else { box(g, x, hy, hz, 0.48, 0.46, 0.46, o.hair); if (o.style === 'jersey') box(g, x, hy + L(0.12, 0.3), hz, 0.5, 0.07, 0.49, o.trim); if (robe) box(g, x, hy + L(0.37, 0.4), hz, 0.5, 0.2, 0.5, o.trim); }
}

// ---------------------------------------------------------------- CHARACTER PREVIEW: the same runner seen from the FRONT (used on the dashboard)
function drawFrontFigure(o, t) {
  const bob = Math.sin(t * 3) * 0.025, sk = o.skin, sh = o.shirt, tr = o.trim, pa = o.pants, hr = o.hair, robe = o.style === 'agbada', hood = o.style === 'hoodie', cop = o.style === 'police', yah = o.style === 'yahoo';
  const shoe = cop ? [28, 28, 34] : [245, 245, 245], y0 = bob;
  { const k = V.F / 6.2; g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.ellipse(SX(0, 6.2), SY(0, 6.2), k * 0.8, k * 0.2, 0, 0, 7); g.fill(); }
  // legs + shoes
  box(g, -0.2, 0, 0.1, 0.3, 0.8 + y0, 0.36, pa); box(g, 0.2, 0, 0.1, 0.3, 0.8 + y0, 0.36, pa);
  box(g, -0.2, 0, -0.18, 0.34, 0.17, 0.52, shoe); box(g, 0.2, 0, -0.18, 0.34, 0.17, 0.52, shoe); box(g, -0.2, 0, -0.18, 0.35, 0.05, 0.53, tr); box(g, 0.2, 0, -0.18, 0.35, 0.05, 0.53, tr);
  // hoodie hood sits behind the head
  if (hood) box(g, 0, y0 + 1.5, 0.12, 0.7, 0.62, 0.3, sh);
  // torso
  let r;
  if (robe) {
    r = box(g, 0, y0 + 0.46, 0, 1.0, 1.08, 0.5, sh);
    if (r) { onRect(g, r, 0.36, 0, 0.64, 0.16, sk); onRect(g, r, 0.46, 0.04, 0.54, 0.96, tr); onRect(g, r, 0, 0.9, 1, 1, tr); onRect(g, r, 0.14, 0.2, 0.34, 0.3, tr); onRect(g, r, 0.66, 0.2, 0.86, 0.3, tr); onRect(g, r, 0.16, 0.5, 0.3, 0.56, tr); onRect(g, r, 0.7, 0.5, 0.84, 0.56, tr); }
  } else {
    r = box(g, 0, y0 + 0.8, 0, 0.84, 0.74, 0.42, sh);
    if (r && o.style === 'jersey') { onRect(g, r, 0, 0, 1, 0.1, tr); onRect(g, r, 0.36, 0.1, 0.64, 0.22, sk); onRect(g, r, 0.66, 0.26, 0.84, 0.42, tr); textOnRect(g, r, 'XD', 0.75, 0.34, 0.12, sh); textOnRect(g, r, '10', 0.35, 0.62, 0.34, tr); }
    if (r && o.style === 'ankara') { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if ((a + b) % 2 === 0) onRect(g, r, a / 3, b / 3, (a + 1) / 3, (b + 1) / 3, tr); onRect(g, r, 0.4, 0, 0.6, 0.2, sk); onRect(g, r, 0.47, 0.2, 0.53, 1, [250, 235, 150]); }
    if (r && hood) { onRect(g, r, 0.2, 0.62, 0.8, 0.95, shade(sh, 0.8)); onRect(g, r, 0.38, 0.06, 0.42, 0.45, [240, 240, 240]); onRect(g, r, 0.58, 0.06, 0.62, 0.45, [240, 240, 240]); textOnRect(g, r, 'LAGOS', 0.5, 0.78, 0.13, tr); }
    if (r && cop) { onRect(g, r, 0.38, 0, 0.62, 0.12, sk); onRect(g, r, 0.46, 0.1, 0.54, 0.62, [20, 20, 28]); onRect(g, r, 0.1, 0.3, 0.3, 0.46, tr); onRect(g, r, 0.66, 0.34, 0.9, 0.44, [245, 245, 245]); onRect(g, r, 0, 0.82, 1, 0.94, [20, 20, 26]); onRect(g, r, 0.44, 0.84, 0.56, 0.92, tr); }
    if (r && yah) { onRect(g, r, 0, 0, 0.4, 1, shade(sh, 0.8)); onRect(g, r, 0.6, 0, 1, 1, shade(sh, 0.8)); onRect(g, r, 0.4, 0, 0.6, 1, [30, 30, 38]); textOnRect(g, r, '$$$', 0.5, 0.55, 0.22, tr); onRect(g, r, 0.36, 0.04, 0.64, 0.12, sk); }
  }
  // arms: left hangs, right waves hello
  const ax = robe ? 0.66 : 0.56;
  box(g, -ax, y0 + 0.74, -0.04, 0.2, 0.46, 0.26, sk); box(g, -ax, y0 + 1.06, -0.04, 0.23, 0.3, 0.29, sh);
  { const hx = ax + 0.06 + 0.07 * Math.sin(t * 7); box(g, ax + 0.02, y0 + 1.12, -0.04, 0.23, 0.36, 0.29, sh); box(g, hx, y0 + 1.44, -0.04, 0.2, 0.5, 0.26, sk); }   // right arm raised, hand waving
  if (cop) { box(g, -0.5, y0 + 1.5, -0.02, 0.28, 0.08, 0.34, tr); box(g, 0.5, y0 + 1.5, -0.02, 0.28, 0.08, 0.34, tr); }   // shoulder epaulettes
  if (yah) { box(g, -0.17, y0 + 1.36, -0.22, 0.05, 0.2, 0.04, [255, 210, 60]); box(g, 0.17, y0 + 1.36, -0.22, 0.05, 0.2, 0.04, [255, 210, 60]); box(g, 0, y0 + 1.24, -0.23, 0.16, 0.14, 0.05, [255, 210, 60]); }   // gold chain + pendant
  // head with a face
  box(g, 0, y0 + 1.52, 0.04, 0.18, 0.08, 0.18, sk);
  const h = box(g, 0, y0 + 1.58, 0.0, 0.5, 0.5, 0.46, sk);
  if (h) {
    onRect(g, h, 0.18, 0.4, 0.38, 0.54, [250, 250, 250]); onRect(g, h, 0.62, 0.4, 0.82, 0.54, [250, 250, 250]);
    onRect(g, h, 0.26, 0.42, 0.36, 0.54, [24, 18, 18]); onRect(g, h, 0.64, 0.42, 0.74, 0.54, [24, 18, 18]);
    onRect(g, h, 0.16, 0.3, 0.4, 0.35, hr); onRect(g, h, 0.6, 0.3, 0.84, 0.35, hr);                                 // brows
    onRect(g, h, 0.46, 0.56, 0.54, 0.68, shade(sk, 0.82)); onRect(g, h, 0.34, 0.76, 0.66, 0.83, [92, 36, 32]); onRect(g, h, 0.4, 0.76, 0.6, 0.79, [250, 250, 250]);   // nose, smile
    if (yah) onRect(g, h, 0.12, 0.36, 0.88, 0.56, [18, 18, 24]);                                                     // sunglasses
  }
  // hair / hats
  box(g, 0, y0 + 1.98, 0.02, 0.54, 0.14, 0.5, hr);
  if (hood) { box(g, -0.28, y0 + 1.7, 0.0, 0.07, 0.34, 0.3, sh); box(g, 0.28, y0 + 1.7, 0.0, 0.07, 0.34, 0.3, sh); }
  if (cop) { box(g, 0, y0 + 2.04, 0.0, 0.58, 0.18, 0.54, [26, 26, 36]); const v = box(g, 0, y0 + 2.0, -0.3, 0.46, 0.05, 0.26, [18, 18, 26]); box(g, 0, y0 + 2.1, -0.02, 0.12, 0.1, 0.04, tr); }
  else if (yah) { box(g, 0, y0 + 2.02, 0.0, 0.56, 0.16, 0.5, [210, 40, 50]); box(g, 0, y0 + 2.0, -0.3, 0.46, 0.05, 0.26, [170, 28, 40]); }
  else if (robe) box(g, 0, y0 + 2.08, 0.0, 0.52, 0.22, 0.5, tr);
  else if (o.style === 'jersey') box(g, 0, y0 + 1.98, -0.01, 0.55, 0.06, 0.51, tr);
}

// ---------------------------------------------------------------- VEHICLES SEEN FROM THE SIDE (cross traffic and buses turning into a side street)
function drawSideways(o) {
  const x = o.x, z = o.z, len = o.w, wid = o.d, dir = o.turn || 1, truck = o.type === 'truck', car = o.type === 'car';
  const dz = z - V.camZ; if (dz > V.view) return;
  const seed = o.seed || 0.5, carCols = [[235, 235, 238], [60, 110, 190], [200, 60, 55], [60, 60, 66]], base = truck ? [200, 84, 60] : car ? carCols[Math.floor(seed * 4)] : [247, 198, 28];
  const bh = truck ? 2.6 : car ? 0.95 : 2.45, by = truck ? 0.45 : 0.35;
  box(g, x, 0.12, z + 0.15, len - 0.1, 0.4, wid - 0.3, [30, 30, 36]);                                                     // chassis
  if (truck) box(g, x + dir * (len / 2 - 1.1), 0.3, z + 0.1, 2.2, 2.2, wid - 0.1, [50, 100, 170]);                         // cab at the front end
  const r = box(g, x - (truck ? dir * 1.1 : 0), by, z, truck ? len - 2.2 : len, bh, wid, base);
  if (car) box(g, x - dir * 0.25, by + bh, z + 0.05, len * 0.55, 0.62, wid - 0.15, shade(base, 0.9));                       // cabin
  if (r) {
    if (!truck && !car) {                                                                                               // danfo: windows, black stripe, slogan
      onRect(g, r, 0.04, 0.08, 0.96, 0.38, [78, 112, 145]); for (let q = 1; q < 6; q++) onRect(g, r, q / 6 - 0.008, 0.08, q / 6 + 0.008, 0.38, [235, 185, 20]);
      onRect(g, r, 0, 0.46, 1, 0.58, [25, 25, 30]); textOnRect(g, r, o.slogan || 'FOCUS', 0.5, 0.52, 0.08, [255, 255, 255]);
      onRect(g, r, 0.04, 0.9, 0.96, 1, [35, 35, 40]);
    } else if (truck) { onRect(g, r, 0.05, 0.1, 0.95, 0.5, [215, 100, 72]); textOnRect(g, r, 'NO BE SMALL THING', 0.5, 0.32, 0.1, [255, 235, 200]); }
    const f = dir > 0 ? 0.95 : 0.0, b = dir > 0 ? 0.0 : 0.95;                                                         // head-lights at the front end, tail-lights at the back
    onRect(g, r, f, car ? 0.45 : 0.62, f + 0.05, car ? 0.7 : 0.72, [255, 245, 190]); onRect(g, r, b, car ? 0.45 : 0.62, b + 0.05, car ? 0.7 : 0.72, [225, 40, 40]);
  }
  for (const wx of [-0.3, 0.3]) box(g, x + wx * len, 0, z + 0.15, 0.9, 0.62, wid - 0.4, [22, 22, 26]);                       // wheels
}

// ---------------------------------------------------------------- JUNCTION: a side street opens on both sides, with signals, a street sign and cross traffic
const STREETS = ['ADENIRAN OGUNSANYA ST', 'AWOLOWO ROAD', 'ALLEN AVENUE', 'HERBERT MACAULAY', 'OBA AKRAN AVE', 'ADEOLA ODEKU ST'];
function junctionScene(i, side, items) {
  const z0 = i * SEG, ph0 = rnd(i, 5), name = STREETS[Math.floor(rnd(i, 6 + (side > 0 ? 1 : 0)) * STREETS.length)];
  items.push({ z: z0 + 1, fn: () => {                                                                                  // traffic signal
    const px = side * 4.95, ph = frac(T / 9 + ph0), lit = ph < 0.45 ? 2 : ph < 0.55 ? 1 : 0;
    box(g, px, 0, z0 + 0.8, 0.16, 4.2, 0.16, [60, 60, 70]);
    const r = box(g, px - side * 0.15, 3.3, z0 + 0.7, 0.5, 1.15, 0.35, [28, 28, 34]);
    if (r) { const cols = [[240, 60, 60], [255, 200, 50], [60, 220, 110]]; for (let q = 0; q < 3; q++) onRect(g, r, 0.22, 0.08 + q * 0.3, 0.78, 0.3 + q * 0.3 - 0.04, q === 2 - lit ? cols[q] : shade(cols[q], 0.28)); }
  } });
  items.push({ z: z0 + SEG - 1, fn: () => {                                                                            // street name sign
    const sx = side * 5.7; box(g, sx, 0, z0 + SEG - 1.2, 0.12, 3.2, 0.12, [80, 80, 92]);
    const r = box(g, sx - side * 0.35, 2.55, z0 + SEG - 1.3, 2.3, 0.6, 0.1, [30, 92, 175]);
    if (r) { onRect(g, r, 0.03, 0.1, 0.97, 0.9, [24, 70, 140]); textOnRect(g, r, name, 0.5, 0.5, 0.42, [255, 255, 255]); }
  } });
  for (let l = 0; l < 2; l++) {                                                                                        // cross traffic on the side street
    const inward = l === 0, zz = z0 + (inward ? 2.9 : 9.6), sd = rnd(i * 3 + l, side + 9), kind = sd < 0.5 ? 'danfo' : sd < 0.8 ? 'car' : 'truck';
    const ln = kind === 'truck' ? 8.5 : kind === 'car' ? 3.8 : 5.2, wd = kind === 'truck' ? 2.5 : kind === 'car' ? 1.8 : 2.0;
    items.push({ z: zz + wd / 2, fn: () => {
      const u = frac(T * (inward ? 0.055 : 0.07) + sd * 7 + l * 0.4), x = side * (inward ? 66 - 54 * u : 12 + 54 * u);
      drawSideways({ x, z: zz, w: ln, d: wd, turn: inward ? -side : side, type: kind, seed: sd, slogan: SLOGANS[Math.floor(sd * 99) % SLOGANS.length] });
    } });
  }
}

// ---------------------------------------------------------------- STORY ACTORS: officers, the Yahoo Boy, the police van
const POLICE_SHIRT = [48, 78, 140], ARMY_SHIRT = [78, 104, 62];
function figure(x, y, z, s) {                         // a generic running / standing person seen from behind
  const sc = s.sc || 1, moving = s.run != null, ph = moving ? Math.sin(s.run * 3.2) : 0;
  const bob = moving && !(s.y > 0.05) ? Math.abs(ph) * 0.07 : 0, yy = y + bob + (s.y || 0);
  const l1 = s.y > 0.05 ? 0.4 : (moving ? Math.max(0, ph) * 0.36 : 0), l2 = s.y > 0.05 ? 0.16 : (moving ? Math.max(0, -ph) * 0.36 : 0);
  const sw = s.armsUp ? 0.5 : (moving ? ph * 0.2 : 0);
  const crouch = s.crouch ? 0.45 : 0;
  box(g, x - 0.2, yy + l1, z, 0.3, 0.8 - crouch, 0.36, s.pants); box(g, x + 0.2, yy + l2, z, 0.3, 0.8 - crouch, 0.36, s.pants);
  box(g, x - 0.2, yy + l1, z - 0.04, 0.33, 0.16, 0.5, [245, 245, 245]); box(g, x + 0.2, yy + l2, z - 0.04, 0.33, 0.16, 0.5, [245, 245, 245]);
  const ty = yy + 0.8 - crouch;
  box(g, x - 0.56, ty - 0.06 + sw, z, 0.2, 0.5, 0.26, s.skin); box(g, x + 0.56, ty - 0.06 - sw * 0.6, z, 0.2, 0.5, 0.26, s.skin);
  box(g, x - 0.56, ty + 0.26 + sw, z, 0.23, 0.3, 0.29, s.shirt); box(g, x + 0.56, ty + 0.26 - sw * 0.6, z, 0.23, 0.3, 0.29, s.shirt);
  const r = box(g, x, ty, z, 0.84, 0.74, 0.42, s.shirt);
  if (r) {
    if (s.camo) for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) if ((a * 3 + b * 5) % 3 === 0) onRect(g, r, a / 4, b / 3, (a + 0.7) / 4, (b + 0.6) / 3, [46, 66, 38]);
    if (s.back) textOnRect(g, r, s.back, 0.5, 0.3, 0.2, s.backCol || [245, 245, 245]);
    if (s.belt) onRect(g, r, 0, 0.82, 1, 0.94, [20, 20, 26]);
  }
  box(g, x, ty + 0.74, z + 0.04, 0.17, 0.08, 0.17, s.skin);
  box(g, x - 0.26, ty + 0.86, z + 0.06, 0.07, 0.15, 0.1, s.skin); box(g, x + 0.26, ty + 0.86, z + 0.06, 0.07, 0.15, 0.1, s.skin);
  box(g, x, ty + 0.82, z + 0.02, 0.48, 0.44, 0.46, s.hair);
  if (s.hat === 'cap') { box(g, x, ty + 1.02, z, 0.56, 0.2, 0.54, [26, 26, 36]); box(g, x, ty + 1.02, z - 0.28, 0.2, 0.12, 0.05, [240, 200, 60]); }
  if (s.hat === 'beret') box(g, x, ty + 1.04, z - 0.02, 0.56, 0.12, 0.52, [150, 40, 40]);
  if (s.hat === 'redcap') { box(g, x, ty + 1.0, z - 0.02, 0.54, 0.16, 0.5, [210, 40, 50]); box(g, x, ty + 0.92, z - 0.26, 0.2, 0.1, 0.06, [235, 235, 235]); }
  if (s.chain) { box(g, x - 0.2, ty + 0.68, z + 0.12, 0.06, 0.22, 0.06, [255, 210, 60]); box(g, x + 0.2, ty + 0.68, z + 0.12, 0.06, 0.22, 0.06, [255, 210, 60]); }
  if (s.bag) box(g, x - 0.62, ty - 0.2, z - 0.05, 0.26, 0.34, 0.4, [40, 40, 46]);
  if (s.baton) box(g, x + 0.7, ty - 0.1, z - 0.1, 0.07, 0.6, 0.07, [30, 30, 34]);
  if (s.phone) box(g, x + 0.33, ty + 0.82, z + 0.12, 0.06, 0.22, 0.05, [20, 20, 24]);
}
const officerSpec = (variant, run, extra) => Object.assign({ shirt: variant === 'army' ? ARMY_SHIRT : POLICE_SHIRT, pants: variant === 'army' ? [60, 82, 50] : [28, 28, 38], skin: SKINS[1], hair: [20, 16, 16], hat: variant === 'army' ? 'beret' : 'cap', back: variant === 'army' ? 'ARMY' : 'POLICE', camo: variant === 'army', belt: true, baton: variant !== 'army', run }, extra || {});
const suspectSpec = (run, look, extra) => Object.assign({ shirt: [[130, 50, 190], [235, 170, 40], [40, 160, 150], [210, 60, 90]][look % 4], pants: [30, 30, 40], skin: SKINS[look % 5], hair: [20, 16, 16], hat: 'redcap', chain: true, bag: true, back: '$$$', backCol: [255, 210, 60], run }, extra || {});
function policeVan(x, z, t, lights) {
  const dz = z - V.camZ;
  box(g, x, 0.3, z, 2.3, 1.6, 5.4, [236, 236, 242]);                                                           // body
  box(g, x, 0.9, z, 2.32, 0.38, 5.42, [30, 70, 160]);                                                           // blue stripe
  const r = box(g, x, 0.3, z, 2.3, 1.6, 0.3, [236, 236, 242]);
  box(g, x, 1.9, z + 0.4, 2.0, 0.7, 2.2, [225, 225, 232]);                                                      // cab roof
  if (r) { onRect(g, r, 0.08, 0.12, 0.92, 0.42, [45, 60, 85]); onRect(g, r, 0.0, 0.55, 1, 0.7, [30, 70, 160]); textOnRect(g, r, 'POLICE', 0.5, 0.62, 0.1, [255, 255, 255]); onRect(g, r, 0.05, 0.78, 0.2, 0.9, [225, 40, 40]); onRect(g, r, 0.8, 0.78, 0.95, 0.9, [225, 40, 40]); }
  const on = lights && Math.floor(t * 7) % 2 === 0;                                                             // flashing roof lights
  box(g, x - 0.5, 2.6, z + 0.9, 0.7, 0.22, 0.45, on ? [255, 40, 50] : [110, 20, 25]); box(g, x + 0.5, 2.6, z + 0.9, 0.7, 0.22, 0.45, on ? [60, 90, 255] : [20, 30, 100]);
  box(g, x - 1.0, 0, z + 0.4, 0.28, 0.6, 0.8, [25, 25, 28]); box(g, x + 1.0, 0, z + 0.4, 0.28, 0.6, 0.8, [25, 25, 28]);
  if (lights && dz > V.near) { const k = V.F / dz, sx = SX(x, dz), sy = SY(2.4, dz); const grd = g.createRadialGradient(sx, sy, 2, sx, sy, k * 3.2); grd.addColorStop(0, on ? 'rgba(255,60,70,.55)' : 'rgba(70,100,255,.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(sx - k * 3.2, sy - k * 3.2, k * 6.4, k * 6.4); }
}
// the target the police character is chasing (and the officers chasing the bad guy) while playing
function drawTarget() {
  if (!tgt || tgt.hidden > 0) return; const dz = tgt.z - V.camZ; if (dz < V.near) return;
  figure(tgt.x, 0, tgt.z, suspectSpec(tgt.run, tgt.look, { y: tgt.y, crouch: tgt.slide > 0, armsUp: false }));
}
function drawCops() {
  if (!cop || cop.gap > 7) return; const z = P.z - cop.gap, x = P.x * 0.8;
  figure(x, 0, z, officerSpec(cop.variant, cop.run));
  if (cop.gap < 3.5) figure(x + (P.lane === 0 ? 1.5 : -1.5), 0, z - 1.3, officerSpec(cop.variant === 'army' ? 'army' : 'police', cop.run + 1.5));
}

// ---------------------------------------------------------------- THE RIDE (boost): an okada or a lady-bike carries you
function seatedPassenger(x, y, z, o) {                 // the runner sitting behind the rider, hands on their waist
  box(g, x - 0.34, y + 0.5, z - 0.05, 0.17, 0.42, 0.62, o.pants); box(g, x + 0.34, y + 0.5, z - 0.05, 0.17, 0.42, 0.62, o.pants);
  box(g, x - 0.34, y + 0.46, z - 0.1, 0.19, 0.1, 0.5, [245, 245, 245]); box(g, x + 0.34, y + 0.46, z - 0.1, 0.19, 0.1, 0.5, [245, 245, 245]);
  box(g, x - 0.36, y + 0.95, z + 0.2, 0.11, 0.11, 0.5, o.skin); box(g, x + 0.36, y + 0.95, z + 0.2, 0.11, 0.11, 0.5, o.skin);
  const r = box(g, x, y + 0.66, z, 0.58, 0.7, 0.32, o.shirt);
  if (r && o.style === 'jersey') { onRect(g, r, 0, 0, 1, 0.1, o.trim); textOnRect(g, r, '10', 0.5, 0.55, 0.34, o.trim); }
  if (r && o.style === 'ankara') { onRect(g, r, 0.1, 0.1, 0.5, 0.5, o.trim); onRect(g, r, 0.5, 0.5, 0.9, 0.9, o.trim); }
  if (r && o.style === 'agbada') onRect(g, r, 0.43, 0.05, 0.57, 0.95, o.trim);
  if (r && o.style === 'police') { onRect(g, r, 0.06, 0.1, 0.94, 0.55, [30, 52, 108]); textOnRect(g, r, 'POLICE', 0.5, 0.32, 0.2, [245, 245, 245]); }
  if (r && o.style === 'yahoo') textOnRect(g, r, '$$$', 0.5, 0.5, 0.34, o.trim);
  box(g, x, y + 1.34, z + 0.03, 0.14, 0.08, 0.14, o.skin);
  if (o.style === 'hoodie') box(g, x, y + 1.3, z - 0.02, 0.5, 0.5, 0.4, o.shirt); else box(g, x, y + 1.38, z + 0.03, 0.42, 0.4, 0.4, o.hair);
}
function bikeParts(x, y, bz, kind, o, withPassenger) {
  if (kind === 'okada') {
    box(g, x, y, bz + 1.5, 0.22, 0.64, 0.55, [25, 25, 28]); box(g, x, y + 0.98, bz + 1.5, 0.8, 0.07, 0.07, [190, 190, 196]); box(g, x, y + 0.55, bz + 1.48, 0.06, 0.45, 0.06, [190, 190, 196]);
    box(g, x + 0.3, y + 0.18, bz + 0.3, 0.07, 0.08, 1.0, [175, 175, 182]);
    box(g, x, y + 0.42, bz + 0.5, 0.46, 0.34, 1.1, [190, 40, 40]);
    box(g, x - 0.3, y + 0.5, bz + 0.95, 0.15, 0.42, 0.55, PANTS[0]); box(g, x + 0.3, y + 0.5, bz + 0.95, 0.15, 0.42, 0.55, PANTS[0]);   // rider
    box(g, x - 0.33, y + 0.95, bz + 1.1, 0.11, 0.1, 0.45, SKINS[1]); box(g, x + 0.33, y + 0.95, bz + 1.1, 0.11, 0.1, 0.45, SKINS[1]);
    box(g, x, y + 0.8, bz + 0.9, 0.5, 0.62, 0.3, [235, 120, 30]); box(g, x, y + 1.42, bz + 0.92, 0.12, 0.07, 0.12, SKINS[1]);
    box(g, x, y + 1.38, bz + 0.92, 0.34, 0.36, 0.34, [250, 215, 30]); box(g, x, y + 1.66, bz + 0.92, 0.36, 0.1, 0.36, [40, 40, 44]);
  } else {   // lady-bike: a pink scooter ridden by a woman in an ankara top
    box(g, x, y, bz + 1.4, 0.18, 0.5, 0.46, [25, 25, 28]); box(g, x, y + 0.3, bz + 1.25, 0.52, 0.85, 0.14, [240, 120, 165]);
    box(g, x, y + 0.98, bz + 1.28, 0.7, 0.07, 0.07, [210, 210, 216]);
    box(g, x, y + 0.22, bz + 0.65, 0.56, 0.1, 0.8, [238, 238, 238]);
    box(g, x, y + 0.45, bz + 0.1, 0.52, 0.5, 0.85, [240, 120, 165]); box(g, x, y + 0.7, bz + 0.15, 0.48, 0.16, 0.8, [60, 60, 66]);
    box(g, x, y + 0.42, bz + 1.0, 0.32, 0.42, 0.3, [170, 60, 130]);                                                                       // her skirt
    box(g, x - 0.3, y + 0.92, bz + 1.12, 0.1, 0.1, 0.42, SKINS[2]); box(g, x + 0.3, y + 0.92, bz + 1.12, 0.1, 0.1, 0.42, SKINS[2]);
    box(g, x, y + 0.8, bz + 0.98, 0.46, 0.58, 0.26, [245, 200, 60]);
    box(g, x, y + 1.38, bz + 1.0, 0.12, 0.07, 0.12, SKINS[2]); box(g, x, y + 1.42, bz + 1.0, 0.34, 0.36, 0.34, [250, 250, 252]); box(g, x, y + 1.04, bz + 0.76, 0.12, 0.42, 0.12, [40, 30, 28]);   // helmet + ponytail
  }
  if (withPassenger) seatedPassenger(x, y - 0.1, bz + 0.32, o);
  box(g, x, y + 0.55, bz - 0.05, 0.34, 0.06, 0.55, kind === 'okada' ? [150, 30, 30] : [200, 90, 135]);
  box(g, x, y, bz - 0.12, 0.22, kind === 'okada' ? 0.62 : 0.5, 0.6, [25, 25, 28]); box(g, x, y + 0.6, bz - 0.14, 0.14, 0.07, 0.06, [255, 60, 60]);
}
function drawRide() {
  const o = OUTFITS[outfit] || OUTFITS[0], k = clamp(mountT / 0.4, 0, 1), e = 1 - Math.pow(1 - k, 3), back = -(1 - e) * 7;
  const bz = P.z - 1.1 + back, dzP = bz + 0.9 - V.camZ, f = V.F / dzP, gx = SX(P.x, dzP), gy = SY(0, dzP);
  g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.ellipse(gx, gy, f * 0.75, f * 0.18, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,200,60,.22)'; g.beginPath(); g.ellipse(gx, SY(P.y + 0.8, dzP), f * 1.05, f * 1.15, 0, 0, 7); g.fill();
  const y0 = P.y * 0.6 + Math.abs(Math.sin(T * 20)) * 0.03;
  bikeParts(P.x, y0, bz, rideKind, o, true);
}
function drawLeftBike() {                                    // after the ride the rider speeds off ahead
  if (!leftBike) return; const bz = leftBike.z - 1.1, dz = bz - V.camZ; if (dz < V.near) return;
  bikeParts(leftBike.x, 0.0, bz, leftBike.kind, OUTFITS[outfit] || OUTFITS[0], false);
}

// ---------------------------------------------------------------- VEHICLES & OBSTACLES
function drawDanfo(o) {
  const bz = o.z, ox = o.x, x0 = ox - o.w / 2, x1 = ox + o.w / 2;
  // roof rack + luggage (seen from above/behind)
  const r = box(g, ox, 0.35, bz, o.w, 2.45, o.d, [247, 198, 28], { top: 1.12 });
  box(g, ox, 2.8, bz + 0.5, 1.8, 0.09, 4.2, [40, 40, 46]);
  if (o.seed > 0.3) box(g, ox - 0.35, 2.89, bz + 1.0, 0.9, 0.6, 1.1, [205, 170, 115]); if (o.seed > 0.6) box(g, ox + 0.4, 2.89, bz + 2.4, 0.8, 0.9, 1.0, [165, 70, 55]);
  box(g, ox, 0.1, bz + 0.15, o.w - 0.1, 0.4, o.d - 0.3, [30, 30, 36]);                                   // chassis
  for (const [px, vis] of [[x0, V.camX < x0], [x1, V.camX > x1]]) if (vis) {                           // side stripe, windows, passengers
    sideBand(g, px, 0.95, 1.38, bz, bz + o.d, [25, 25, 30]); sideBand(g, px, 1.62, 2.5, bz + 0.5, bz + o.d - 0.4, [85, 125, 160]);
    for (let q = 0; q < 6; q++) if (rnd(o.seed * 100 + q, 3) < 0.7) sideBand(g, px, 1.85, 2.25, bz + 0.8 + q * 0.75, bz + 1.15 + q * 0.75, [55, 40, 36]);
    for (let q = 0; q < 6; q++) sideBand(g, px, 1.62, 2.5, bz + 0.5 + q * 0.75 + 0.7, bz + 0.5 + q * 0.75 + 0.75, [235, 185, 20]);
  }
  if (r) {
    onRect(g, r, 0.1, 0.05, 0.9, 0.36, [78, 112, 145]); onRect(g, r, 0.48, 0.05, 0.52, 0.36, [235, 185, 20]);     // rear window
    onRect(g, r, 0, 0.44, 1, 0.56, [25, 25, 30]); textOnRect(g, r, o.slogan, 0.5, 0.5, 0.075, [255, 255, 255]);   // black stripe + slogan
    onRect(g, r, 0.08, 0.62, 0.92, 0.9, [236, 186, 22]); onRect(g, r, 0.49, 0.62, 0.51, 0.9, [200, 155, 15]);     // rear door
    onRect(g, r, 0.05, 0.66, 0.2, 0.78, [225, 40, 40]); onRect(g, r, 0.8, 0.66, 0.95, 0.78, [225, 40, 40]);       // tail lights
    onRect(g, r, 0.36, 0.7, 0.64, 0.8, [245, 245, 240]); textOnRect(g, r, 'LAGOS', 0.5, 0.75, 0.05, [20, 20, 25]);  // number plate
    onRect(g, r, 0.04, 0.9, 0.96, 1, [35, 35, 40]);                                                                  // bumper
  }
  // ladder on the back
  const ld = ox + 0.72; box(g, ld - 0.14, 0.4, bz - 0.07, 0.05, 2.4, 0.06, [50, 50, 56]); box(g, ld + 0.14, 0.4, bz - 0.07, 0.05, 2.4, 0.06, [50, 50, 56]);
  for (let q = 0; q < 5; q++) box(g, ld, 0.7 + q * 0.45, bz - 0.09, 0.3, 0.05, 0.05, [50, 50, 56]);
  // the conductor, hanging on the back step
  if (o.seed > 0.3) {
    box(g, ox - 0.45, 0.3, bz - 0.38, 0.8, 0.08, 0.4, [40, 40, 46]);
    person(ox - 0.45, 0.38, bz - 0.28, { s: 1.0, armsUp: true, shirt: o.seed > 0.65 ? [70, 130, 200] : [235, 235, 235], pants: PANTS[1], skin: SKINS[Math.floor(o.seed * 10) % 5] });
  }
}
function drawTruck(o) {
  const bz = o.z, ox = o.x;
  box(g, ox, 0.3, bz + o.d - 2.2, o.w - 0.2, 2.2, 2.2, [50, 100, 170]);                                  // cab (far end)
  const r = box(g, ox, 0.45, bz, o.w, o.h - 0.45, o.d - 2.4, [200, 84, 60]);                              // cargo box
  for (let q = 0; q < 3; q++) box(g, ox - 0.8 + q * 0.8, o.h, bz + 1 + (q % 2) * 0.9, 0.72, 0.62, 1.0, [225, 205, 160]);   // sacks on top
  box(g, ox, 0.2, bz, o.w - 0.1, 0.35, o.d - 2.4, [35, 35, 40]);
  if (r) {
    onRect(g, r, 0, 0.78, 1, 0.84, [40, 40, 44]); onRect(g, r, 0.05, 0.88, 0.2, 0.96, [230, 40, 40]); onRect(g, r, 0.8, 0.88, 0.95, 0.96, [230, 40, 40]);
    onRect(g, r, 0.4, 0.89, 0.6, 0.97, [245, 245, 240]); textOnRect(g, r, 'NO BE SMALL THING', 0.5, 0.36, 0.07, [255, 235, 200]);
    onRect(g, r, 0.07, 0.05, 0.12, 0.74, [160, 55, 40]); onRect(g, r, 0.88, 0.05, 0.93, 0.74, [160, 55, 40]);   // tarp ropes
  }
}
function drawOkada(o) {
  const bz = o.z, ox = o.x, riderCol = [[235, 120, 30], [40, 110, 190], [70, 160, 90]][Math.floor(o.seed * 3)], two = o.seed > 0.55;
  // far → near: front wheel, bars, body, rider, passenger, rear wheel
  box(g, ox, 0, bz + 1.35, 0.2, 0.62, 0.52, [25, 25, 28]);
  box(g, ox, 0.95, bz + 1.4, 0.78, 0.07, 0.07, [190, 190, 196]); box(g, ox, 0.55, bz + 1.38, 0.06, 0.45, 0.06, [190, 190, 196]);
  box(g, ox + 0.3, 0.18, bz + 0.3, 0.07, 0.08, 0.95, [175, 175, 182]);                                    // exhaust
  box(g, ox, 0.42, bz + 0.45, 0.42, 0.3, 1.0, [190, 40, 40]);                                            // body / tank
  box(g, ox - 0.3, 0.45, bz + 0.85, 0.15, 0.4, 0.55, PANTS[0]); box(g, ox + 0.3, 0.45, bz + 0.85, 0.15, 0.4, 0.55, PANTS[0]);   // rider legs
  box(g, ox - 0.33, 0.92, bz + 1.0, 0.11, 0.1, 0.45, SKINS[1]); box(g, ox + 0.33, 0.92, bz + 1.0, 0.11, 0.1, 0.45, SKINS[1]);   // arms to bars
  box(g, ox, 0.58, bz + 0.78, 0.5, 0.55, 0.3, riderCol);                                                  // rider back (jacket)
  box(g, ox, 1.1, bz + 0.8, 0.12, 0.07, 0.12, SKINS[1]); box(g, ox, 1.06, bz + 0.8, 0.3, 0.3, 0.3, [250, 215, 30]); box(g, ox, 1.24, bz + 0.8, 0.32, 0.1, 0.32, [40, 40, 44]);   // helmet
  if (two) { box(g, ox, 0.6, bz + 0.3, 0.48, 0.5, 0.28, SHIRTS[Math.floor(o.seed * 9) % 7]); box(g, ox, 1.08, bz + 0.34, 0.26, 0.26, 0.26, [22, 18, 18]); }
  box(g, ox, 0.55, bz, 0.34, 0.06, 0.55, [150, 30, 30]);                                                  // fender
  box(g, ox, 0, bz, 0.22, 0.62, 0.6, [25, 25, 28]); box(g, ox, 0.62, bz - 0.02, 0.14, 0.07, 0.06, [255, 60, 60]);   // rear wheel + tail light
  if (!two && o.seed > 0.3) box(g, ox, 0.62, bz - 0.04, 0.55, 0.32, 0.4, [205, 170, 110]);                // goods on the rack
}
function drawObstacleBody(o) {
  const bz = o.z;
  if (o.type === 'danfo') drawDanfo(o);
  else if (o.type === 'truck') drawTruck(o);
  else if (o.type === 'okada') drawOkada(o);
  else if (o.type === 'barrier') {
    box(g, o.x - 1.4, 0, bz + 0.1, 0.28, 0.55, 0.28, [255, 120, 30]); box(g, o.x + 1.4, 0, bz + 0.1, 0.28, 0.55, 0.28, [255, 120, 30]);   // cones
    const r = box(g, o.x, 0, bz, o.w, o.h, o.d, [235, 235, 235]);
    if (r) { for (let k = 0; k < 6; k++) if (k % 2 === 0) onRect(g, r, k / 6, 0.12, (k + 1) / 6, 0.88, [220, 50, 40]); }
  } else if (o.type === 'banner') {
    box(g, o.x - 1.45, 0, bz, 0.16, 3.2, 0.2, [70, 70, 80]); box(g, o.x + 1.45, 0, bz, 0.16, 3.2, 0.2, [70, 70, 80]); box(g, o.x, 3.0, bz, 3.0, 0.25, 0.2, [70, 70, 80]);
    const r = box(g, o.x, o.y, bz, o.w, o.h, o.d, [40, 140, 120]);
    if (r) { onRect(g, r, 0.04, 0.12, 0.96, 0.88, [255, 245, 220]); textOnRect(g, r, o.sign, 0.5, 0.5, 0.42, [190, 40, 40]); }
  }
}

function exhaustPuffs(o) {
  const ox = o.x + (o.type === 'truck' ? 0.9 : 0.7);
  for (let k = 0; k < 4; k++) {
    const age = frac(T * 1.2 + k / 4 + o.seed * 3), dz = (o.z - 0.2 - age * 4.2) - V.camZ; if (dz < V.near) continue;
    const size = (0.22 + age * 0.9) * V.F / dz, x = SX(ox + age * 0.5, dz), y = SY(0.35 + age * 1.1, dz);
    g.fillStyle = `rgba(170,170,176,${(0.34 * (1 - age)).toFixed(3)})`; g.fillRect(x - size / 2, y - size / 2, size, size);
  }
}
function drawObstacleInner(o) {
  const moving = o.vz > 0.5 && (o.type === 'danfo' || o.type === 'truck' || o.type === 'okada');
  if (!moving) { drawObstacleBody(o); return; }
  const dz = o.z + o.d / 2 - V.camZ;
  g.save();
  if (dz > V.near) g.translate(0, Math.sin(T * (o.type === 'okada' ? 17 : 11) + o.seed * 20) * 0.04 * V.F / dz);   // suspension bounce
  drawObstacleBody(o);
  g.restore();
  if (o.type !== 'okada') exhaustPuffs(o);
}

function drawObstacle(o) {
  if (o.sideways) { drawSideways(o); return; }
  if (o.turn) {                                                    // a bus waiting at the junction, indicator flashing, about to turn into the side street
    drawObstacleInner(o);
    const dzF = o.z - P.z; if (dzF < 90 && Math.floor(T * 5) % 2 === 0) box(g, o.x + o.turn * (o.w / 2 - 0.1), 0.95, o.z - 0.06, 0.18, 0.18, 0.08, [255, 170, 20]);
    return;
  }
  if (!o.bayFrom) { drawObstacleInner(o); return; }
  const lane = o.x, dzF = o.z - P.z, k = clamp((52 - dzF) / 20, 0, 1), e = k * k * (3 - 2 * k);
  o.x = o.bayFrom + (lane - o.bayFrom) * e;
  try {
    drawObstacleInner(o);
    if (dzF < 72 && k < 1 && Math.floor(T * 6) % 2 === 0) box(g, o.x - Math.sign(o.bayFrom) * 0.95, 0.95, o.z - 0.06, 0.16, 0.16, 0.08, [255, 170, 20]);   // indicator
  } finally { o.x = lane; }
}

// ---------------------------------------------------------------- THE STREET

// ---------------------------------------------------------------- BUS BAY: danfos stop here and the conductors call passengers
const CALLS = ['OSHODI! OSHODI!', 'YABA! YABA! ENTER!', 'IKEJA! ONE MORE!', 'CMS! CMS! CMS!', 'AJAH! WE DEY GO!', 'OYINGBO! OYINGBO!'];
function callBubble(x, y, z, text) {
  const dz = z - V.camZ; if (dz < V.near + 5 || dz > 66) return;
  LATE.push(() => bubbleNow(x, y, z, text));
}
const LATE = [];
function bubbleNow(x, y, z, text) {
  const dz = z - V.camZ; if (dz < V.near + 5) return;
  const k = V.F / dz, py = SY(y + Math.sin(T * 3 + z) * 0.08, dz), fs = clamp(k * 0.3, 9, 19);
  g.font = `800 ${fs}px Inter, sans-serif`; const w = g.measureText(text).width + fs * 0.9, h = fs * 1.6, px = clamp(SX(x, dz), w / 2 + 4, V.W - w / 2 - 4);
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.roundRect(px - w / 2, py - h, w, h, h * 0.35); g.fill();
  g.beginPath(); g.moveTo(px - fs * 0.3, py - 1); g.lineTo(px, py + fs * 0.7); g.lineTo(px + fs * 0.3, py - 1); g.fill();
  g.fillStyle = '#7a1d1d'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, px, py - h / 2 + 1);
}
function bayScene(i, side, items) {
  const z0 = i * SEG, run = Math.floor(i / BAY_RUN), k = i - run * BAY_RUN - BAY_FIRST;
  if (k === 0) {   // bus stop sign and shelter
    const sx = side * 7.4, sz = z0 + 3;
    items.push({ z: sz + 1, fn: () => {
      box(g, sx, 0, sz, 0.12, 3.0, 0.12, [80, 80, 92]); box(g, side * 7.1, 2.7, sz - 0.6, 1.5, 0.1, 3.2, [45, 45, 52]);
      const r = box(g, sx - side * 0.05, 2.05, sz - 0.08, 1.5, 0.75, 0.1, [30, 92, 175]); if (r) { onRect(g, r, 0.04, 0.1, 0.96, 0.9, [24, 70, 140]); textOnRect(g, r, 'BUS STOP', 0.5, 0.5, 0.34, [255, 255, 255]); }
    } });
  }
  if (k === 1 || k === 3) {   // a danfo parked in the bay, door open, conductor shouting
    const sd = rnd(i, 91 + side), bus = { type: 'danfo', x: side * 6.5, z: z0 + 2, w: 2.0, h: 2.8, d: 5.2, seed: sd, slogan: SLOGANS[Math.floor(sd * SLOGANS.length)], vz: 0, y: 0 }, text = CALLS[Math.floor(rnd(i, 92) * CALLS.length)];
    items.push({ z: bus.z + 2.6, fn: () => {
      drawDanfo(bus);
      for (let q = 0; q < 3; q++) person(side * 5.2 - side * (q % 2) * 0.35, 0, bus.z + 1.2 + q * 1.1, { shirt: SHIRTS[Math.floor(rnd(i, 95 + q) * 7)], pants: PANTS[Math.floor(rnd(i, 98 + q) * 4)], skin: SKINS[Math.floor(rnd(i, 101 + q) * 5)] });   // people queueing at the door
      callBubble(bus.x - 0.45, 2.55, bus.z - 0.3, text);
    } });
  }
}

function footBridge(z) {
  box(g, -5.7, 0, z, 0.55, 5.6, 0.55, [118, 118, 128]); box(g, 5.7, 0, z, 0.55, 5.6, 0.55, [118, 118, 128]);
  const r = box(g, 0, 5.2, z - 0.2, 12.8, 0.8, 2.4, [135, 135, 145]);
  if (r) { onRect(g, r, 0.03, 0.12, 0.97, 0.88, [40, 125, 110]); textOnRect(g, r, 'EKO O NI BAJE', 0.5, 0.5, 0.5, [255, 245, 220]); }
  box(g, 0, 6.0, z - 0.2, 12.8, 0.4, 0.15, [210, 60, 50]);
}

// ---------------------------------------------------------------- THIRD MAINLAND BRIDGE (no buildings: just road, parapets, lamps and the lagoon)
function bridgeGantry(z) {
  box(g, -5.9, 0, z, 0.5, 6.6, 0.5, [120, 120, 130]); box(g, 5.9, 0, z, 0.5, 6.6, 0.5, [120, 120, 130]);
  const r = box(g, 0, 6.0, z - 0.1, 12.4, 1.3, 0.5, [40, 100, 90]);
  if (r) { onRect(g, r, 0.02, 0.1, 0.98, 0.9, [30, 80, 72]); textOnRect(g, r, 'THIRD MAINLAND BRIDGE', 0.5, 0.5, 0.5, [255, 255, 255]); }
}
function bridgeSegment(i, side, items) {
  const r = k => rnd(i * 2 + (side > 0 ? 1 : 0), k + 50), z = i * SEG;
  const m = ((z % ZONE_CYCLE) + ZONE_CYCLE) % ZONE_CYCLE;
  // concrete parapet with a steel rail and posts, running the whole length of the bridge
  items.push({ z: z + SEG / 2, fn: () => {
    const x = side * 5.85;
    box(g, x, 0, z, 0.5, 1.05, SEG, [205, 200, 190]);
    box(g, x, 1.05, z, 0.56, 0.1, SEG, [120, 120, 128]);
    for (let q = 0; q < 4; q++) box(g, x, 1.15, z + 0.4 + q * 3.5, 0.14, 0.55, 0.14, [150, 150, 158]);
    box(g, x, 1.65, z, 0.1, 0.08, SEG, [150, 150, 158]);
  } });
  // tall lamp posts with a curved arm over the road, alternating sides
  if (i % 2 === (side > 0 ? 0 : 1)) {
    items.push({ z: z + 3, fn: () => {
      const lx = side * 5.5;
      box(g, lx, 0, z + 3, 0.2, 7, 0.2, [70, 72, 82]);
      box(g, lx - side * 0.9, 6.9, z + 2.95, 1.9, 0.16, 0.3, [70, 72, 82]);
      box(g, lx - side * 1.8, 6.74, z + 2.9, 0.7, 0.16, 0.4, [255, 240, 190]);
    } });
  }
  // the gantry sign at the start of the bridge
  if (side < 0 && m >= BRIDGE_FROM && m < BRIDGE_FROM + SEG) items.push({ z: z + 2, fn: () => bridgeGantry(z + 2) });
  // wooden canoes on the lagoon and low green mangrove islands in the distance (drawn at water level, far below the deck)
  if (r(1) < 0.4) {
    const bx = side * (16 + r(2) * 70), bz = z + r(3) * SEG;
    items.push({ z: bz + 3, fn: () => {
      box(g, bx, -9, bz, 2.0, 0.7, 7.0, [112, 78, 48]); box(g, bx, -8.3, bz + 1.5, 1.6, 0.25, 0.7, [150, 105, 62]);
      box(g, bx, -8.3, bz + 4.5, 0.5, 1.4, 0.5, [235, 120, 40]);                                    // fisherman
    } });
  }
  if (r(4) < 0.18) {
    const ix = side * (60 + r(5) * 110), iz = z + 2;
    items.push({ z: iz + 8, fn: () => { box(g, ix, -9, iz, 26 + r(6) * 18, 4.5 + r(7) * 3, 22, [38, 98, 64]); } });
  }
}

function buildingSegment(i, side, items) {
  const zone = zoneAt(i * SEG + SEG / 2);
  if (zone === 'bridge') { bridgeSegment(i, side, items); return; }
  if (zone === 'ramp') { const lz = i * SEG; if (i % 2 === 0) items.push({ z: lz + 2, fn: () => { const lx = side * 4.9; box(g, lx, 0, lz + 2, 0.18, 4.6, 0.18, [60, 60, 70]); box(g, lx - side * 0.5, 4.4, lz + 1.9, 1.1, 0.16, 0.4, [60, 60, 70]); box(g, lx - side * 0.9, 4.25, lz + 1.95, 0.35, 0.14, 0.3, [255, 236, 170]); } }); return; }
  if (isJunction(i)) { junctionScene(i, side, items); return; }
  const r = k => rnd(i * 2 + (side > 0 ? 1 : 0), k), z = i * SEG;
  const bay = bayAt(i); if (bay === side) bayScene(i, side, items);
  // pedestrians on the pavement
  const walkers = bay === side ? 0 : Math.floor(r(11) * 3);
  for (let k = 0; k < walkers; k++) {
    const wx = side * (5.2 + r(12 + k) * 2.6), wz = z + r(15 + k) * SEG, sk = SKINS[Math.floor(r(30 + k) * 5)];
    items.push({ z: wz, fn: () => person(wx + Math.sin(T * 1.4 + wz) * 0.12, 0, wz, { shirt: SHIRTS[Math.floor(r(33 + k) * 7)], pants: PANTS[Math.floor(r(36 + k) * 4)], skin: sk }) });
  }
  // market stall with a coloured umbrella
  if (r(20) < 0.32 && bay !== side) {
    const sx = side * 6.7, sz = z + r(21) * (SEG - 3), col = STALL_COLS[Math.floor(r(22) * 5)];
    items.push({ z: sz + 1, fn: () => {
      const dzs = sz - V.camZ; if (dzs > 80) return;
      if (dzs > 36) { const k = V.F / dzs, ax = SX(sx, dzs), ay = SY(0, dzs); g.fillStyle = fogged([150, 100, 60], dzs); g.fillRect(ax - 0.85 * k, ay - 0.85 * k, 1.7 * k, 0.85 * k); g.fillStyle = fogged(col, dzs); g.fillRect(ax - 1.1 * k, ay - 2.2 * k, 2.2 * k, 0.3 * k); return; }
      box(g, sx, 0, sz, 1.7, 0.85, 0.9, [150, 100, 60]);
      box(g, sx - 0.45, 0.85, sz + 0.1, 0.35, 0.25, 0.35, [240, 120, 40]); box(g, sx + 0.1, 0.85, sz + 0.1, 0.35, 0.3, 0.35, [90, 170, 90]); box(g, sx + 0.5, 0.85, sz + 0.1, 0.3, 0.2, 0.4, [240, 200, 60]);
      box(g, sx - 0.75, 0, sz + 0.05, 0.07, 2.1, 0.07, [90, 90, 96]); box(g, sx + 0.75, 0, sz + 0.05, 0.07, 2.1, 0.07, [90, 90, 96]);
      box(g, sx, 2.05, sz - 0.4, 2.2, 0.16, 2.1, col);
    } });
  }
  if (i % 17 === 5 && side < 0) items.push({ z: z + 2, fn: () => footBridge(z) });
  if (r(1) < 0.16) {   // gap between buildings: a tree
    const tx = side * (7 + r(2) * 2);
    items.push({ z: z + 5, fn: () => {
      if (r(2) < 0.5) {   // palm
        box(g, tx, 0, z + 5, 0.42, 3.8, 0.42, [112, 82, 52]); const cx = tx, cz = z + 5.2;
        box(g, cx, 3.6, cz - 1.5, 0.5, 0.3, 3.0, [38, 128, 66]); box(g, cx - 1.5, 3.6, cz - 0.25, 3.0, 0.3, 0.5, [38, 128, 66]);
        box(g, cx, 3.85, cz - 1.0, 0.5, 0.3, 2.0, [60, 160, 84]); box(g, cx - 1.0, 3.85, cz - 0.25, 2.0, 0.3, 0.5, [60, 160, 84]);
      } else {            // mango tree
        box(g, tx, 0, z + 5, 0.6, 2.6, 0.6, [100, 74, 48]);
        box(g, tx, 2.2, z + 3.6, 3.4, 1.6, 3.4, [40, 120, 60]); box(g, tx + 0.3, 3.5, z + 4.0, 2.4, 1.3, 2.4, [58, 150, 76]);
      }
    } });
    return;
  }
  const w = 6 + r(2) * 5, h = 9 + r(3) * 22, x = side * (8.3 + w / 2), pal = [[218, 196, 160], [196, 170, 138], [168, 184, 196], [204, 150, 118], [154, 166, 150], [224, 204, 172], [186, 120, 100], [230, 220, 200]];
  const col = pal[Math.floor(r(4) * pal.length)], shop = STALL_COLS[Math.floor(r(5) * 5)];
  items.push({ z: z + SEG / 2, fn: () => {
    box(g, x, 0, z, w, h, SEG - 0.6, col);
    const plane = x - side * w / 2, dzMid = z - V.camZ;
    if (r(21) < 0.5 && dzMid < 90) { box(g, x - side * (w / 2 - 1.1), h, z + 3, 1.4, 1.6, 1.4, [66, 66, 74]); box(g, x - side * (w / 2 - 1.1), h + 1.6, z + 3.5, 0.08, 2.2, 0.08, [90, 90, 96]); }   // roof tank + antenna
    if (dzMid < 62 && dzMid > -SEG) {
      const floors = Math.min(6, Math.floor(h / 3.4));
      sideBand(g, plane, 0, 2.6, z, z + SEG - 0.6, shade(shop, 0.9));
      sideBand(g, plane, 0.2, 1.8, z + 1, z + SEG - 2, [255, 214, 130]);
      sideBand(g, plane, 2.6, 3.3, z, z + SEG - 0.6, [250, 245, 230]);                                      // shop sign board
      for (let f = 1; f <= floors; f += (dzMid > 38 ? 2 : 1)) for (let b = 0; b < 4; b++) {
        const za = z + 0.9 + b * 3.2; if (rnd(i + f * 7 + b * 13, side + 5) < 0.28) continue;
        sideBand(g, plane, f * 3.3 + 0.7, f * 3.3 + 2.3, za, za + 1.7, rnd(i * 3 + f + b, side) < 0.3 ? [255, 214, 130] : [70, 90, 120]);
      }
    }
  } });
  if (r(7) < 0.55 && i % 2 === 0) {   // street lamp
    const lx = side * (bay === side ? 7.85 : 4.9); items.push({ z: z + 2, fn: () => { box(g, lx, 0, z + 2, 0.18, 4.6, 0.18, [60, 60, 70]); box(g, lx - side * 0.5, 4.4, z + 1.9, 1.1, 0.16, 0.4, [60, 60, 70]); box(g, lx - side * 0.9, 4.25, z + 1.95, 0.35, 0.14, 0.3, [255, 236, 170]); } });
  }
}
