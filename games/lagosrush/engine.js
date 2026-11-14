// engine.js — a tiny software 3D engine on a 2D canvas (perspective projection, shaded boxes, fog).
// No libraries, works offline, and is light enough for cheap phones.
const V = { W: 0, H: 0, F: 400, cx: 0, hy: 0, camX: 0, camY: 4.4, camZ: 0, view: 125, near: 1.3, dpr: 1, bend: 0 };   // bend: the road curves away to one side (far things shift sideways ~ distance²)
const FOG = [255, 190, 130];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mixc = (c, f, t) => [c[0] + (f[0] - c[0]) * t, c[1] + (f[1] - c[1]) * t, c[2] + (f[2] - c[2]) * t];
const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const shade = (c, k) => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];
const fogT = dz => Math.pow(clamp((dz - 26) / (V.view - 26), 0, 1), 1.2);
const fogged = (c, dz) => rgb(mixc(c, FOG, fogT(dz)));
const SX = (x, dz) => V.cx + (x - V.camX + V.bend * dz * dz) * V.F / dz;
const SY = (y, dz) => V.hy + (V.camY - y) * V.F / dz;
const frac = n => n - Math.floor(n);
const rnd = (i, s = 0) => frac(Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453);

function resize(cv, g) {
  V.dpr = Math.min(1.6, window.devicePixelRatio || 1);   // cap: keeps dense phone screens fast
  V.W = window.innerWidth; V.H = window.innerHeight;
  cv.width = Math.round(V.W * V.dpr); cv.height = Math.round(V.H * V.dpr);
  g.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  V.F = Math.min(V.W * 1.1, V.H * 0.74); V.cx = V.W / 2; V.hy = V.H * 0.34;
}
// polygon from world points [x,y,dz] (dz = distance in front of the camera, already >= near)
function poly(g, pts, color, fogDz) {
  g.beginPath();
  for (let i = 0; i < pts.length; i++) { const p = pts[i], x = SX(p[0], p[2]), y = SY(p[1], p[2]); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
  g.closePath(); g.fillStyle = fogged(color, fogDz); g.fill();
}
// Axis-aligned box. (x = centre, y = bottom, z = near face, d = depth). Returns the projected rear/near face rect for decorations.
function box(g, x, y, z, w, h, d, base, o = {}) {
  const z0 = z - V.camZ, z1 = z0 + d;
  if (z1 < V.near) return null;
  const dN = Math.max(z0, V.near), dF = Math.max(z1, V.near + 0.01), mid = (dN + dF) / 2;
  const x0 = x - w / 2, x1 = x + w / 2, y1 = y + h;
  if (V.camY > y1) poly(g, [[x0, y1, dN], [x1, y1, dN], [x1, y1, dF], [x0, y1, dF]], shade(base, o.top || 1.22), mid);
  if (V.camX < x0) poly(g, [[x0, y, dN], [x0, y1, dN], [x0, y1, dF], [x0, y, dF]], shade(base, o.left || 0.62), mid);
  if (V.camX > x1) poly(g, [[x1, y, dN], [x1, y1, dN], [x1, y1, dF], [x1, y, dF]], shade(base, o.right || 0.82), mid);
  let rect = null;
  if (z0 >= V.near) {
    poly(g, [[x0, y, z0], [x1, y, z0], [x1, y1, z0], [x0, y1, z0]], base, z0);
    rect = { l: SX(x0, z0), r: SX(x1, z0), t: SY(y1, z0), b: SY(y, z0), s: V.F / z0, dz: z0 };
  }
  return rect;
}
// coloured band on a side plane (x fixed) between z-range and y-range, used for stripes/windows on vehicle & building sides
function sideBand(g, xPlane, y0, y1, za, zb, color) {
  const a = Math.max(za - V.camZ, V.near), b = Math.max(zb - V.camZ, V.near + 0.01);
  if (b <= a) return;
  poly(g, [[xPlane, y0, a], [xPlane, y1, a], [xPlane, y1, b], [xPlane, y0, b]], color, (a + b) / 2);
}
// flat rectangle on a rect returned by box() — fractions of width/height from the left/top
function onRect(g, r, fx0, fy0, fx1, fy1, color) {
  const w = r.r - r.l, h = r.b - r.t;
  g.fillStyle = fogged(color, r.dz); g.fillRect(r.l + w * fx0, r.t + h * fy0, w * (fx1 - fx0), h * (fy1 - fy0));
}
function textOnRect(g, r, str, fx, fy, sizeFrac, color) {
  const h = r.b - r.t, px = h * sizeFrac; if (px < 5) return;
  g.font = `800 ${px}px Inter, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fogged(color, r.dz);
  g.fillText(str, r.l + (r.r - r.l) * fx, r.t + h * fy);
}
