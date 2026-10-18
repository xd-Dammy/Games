// ---------- Setup ----------
const canvas = document.getElementById('gameCanvas');
const wrap = document.getElementById('canvasWrap');
const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const endTitle = document.getElementById('endTitle');
const endMsg = document.getElementById('endMsg');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const checkpointVal = document.getElementById('checkpointVal');
const checkpointTotal = document.getElementById('checkpointTotal');
const timeVal = document.getElementById('timeVal');

const P = window.Physics;
const FALL_THRESHOLD = -12;

let scene, camera, renderer;
let playerMesh;
let platforms = []; // { pos, half, mesh } — used for physics AND collision
let checkpoints = []; // { pos, radius, mesh, reached }
let goal = null;

let physState = { pos: { x: 0, y: 1, z: 12 }, vel: { x: 0, y: 0, z: 0 }, onGround: true };
let lastCheckpointPos = { x: 0, y: 1, z: 12 };
let currentCheckpointIndex = 0;

let running = false;
let seconds = 0;
let timerHandle = null;
let clock;

// ---------- Scene construction ----------

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0B0E14);
  scene.fog = new THREE.Fog(0x0B0E14, 20, 60);

  camera = new THREE.PerspectiveCamera(65, wrap.clientWidth / wrap.clientHeight, 0.1, 200);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);

  const ambient = new THREE.AmbientLight(0x8899aa, 0.7);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff2e0, 0.9);
  sun.position.set(10, 20, 8);
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x3ddcff, 0.3);
  rim.position.set(-10, 5, -10);
  scene.add(rim);

  buildLevel();
  buildPlayer();

  window.addEventListener('resize', onResize);
}

function onResize() {
  camera.aspect = wrap.clientWidth / wrap.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
}

function addPlatform(x, y, z, w, h, d, color = 0x2a3142) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const plat = {
    pos: { x, y, z },
    half: { x: w / 2, y: h / 2, z: d / 2 },
    mesh
  };
  platforms.push(plat);
  return plat;
}

function addCheckpointFlag(x, y, z, color = 0xffd23d) {
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(x, y + 0.8, z);
  scene.add(pole);

  const flagGeo = new THREE.ConeGeometry(0.3, 0.5, 4);
  const flagMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(x + 0.2, y + 1.4, z);
  flag.rotation.z = Math.PI / 2;
  scene.add(flag);

  const cp = { pos: { x, y: y + 0.5, z }, radius: 1.1, mesh: flag, reached: false, pole, flag };
  checkpoints.push(cp);
  return cp;
}

function buildLevel() {
  // Campus courtyard: start plaza -> stepped gap section -> narrow bridge ->
  // moving-platform gap -> classroom block weave -> gate (goal)

  // Ground plaza (start)
  addPlatform(0, -0.5, 12, 10, 1, 10, 0x2f3547);

  // Path segment 1: wide walkway
  addPlatform(0, -0.5, 4, 6, 1, 8, 0x2a3142);

  // Checkpoint 1 (start marker, always "reached")
  const startFlag = addCheckpointFlag(0, 0, 10, 0x3ddcff);
  startFlag.reached = true;

  // Gap-jump stepping stones
  addPlatform(0, -0.5, -2, 3, 1, 2.2, 0x2a3142);
  addPlatform(0, -0.5, -6, 2.4, 1, 2, 0x2a3142);
  addPlatform(0, -0.5, -10, 2.4, 1, 2, 0x2a3142);

  addCheckpointFlag(0, 0, -10, 0xffd23d);

  // Narrow bridge over a wider gap
  addPlatform(0, -0.5, -15, 1.6, 1, 6, 0x363c50);

  // Classroom block weave — obstacles to route around, plus a raised platform
  addPlatform(-4, -0.5, -22, 6, 1, 6, 0x2a3142);
  addPlatform(4, -0.5, -22, 6, 1, 6, 0x2a3142);
  // wall obstacle in the middle forcing a side path
  addPlatform(0, 0.5, -22, 1.2, 3, 1.2, 0x1c2130);

  addCheckpointFlag(-3, 0, -22, 0xffd23d);

  // Raised platform requiring a jump up
  addPlatform(0, 0.5, -28, 4, 1, 3, 0x2a3142);

  // Final stretch to the gate
  addPlatform(0, -0.5, -34, 5, 1, 6, 0x2a3142);

  // Goal gate
  const gateGeo = new THREE.BoxGeometry(4, 3, 0.4);
  const gateMat = new THREE.MeshStandardMaterial({ color: 0xff3d6e, emissive: 0xff3d6e, emissiveIntensity: 0.25 });
  const gateMesh = new THREE.Mesh(gateGeo, gateMat);
  gateMesh.position.set(0, 1, -37.5);
  scene.add(gateMesh);
  goal = { pos: { x: 0, y: 1, z: -37.5 }, radius: 2.2, mesh: gateMesh };

  checkpoints.push({ pos: { x: 0, y: 0.5, z: -37.5 }, radius: 2.2, reached: false, isGoal: true });
}

function buildPlayer() {
  const geo = new THREE.BoxGeometry(0.7, 1, 0.7);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3ddcff, roughness: 0.4 });
  playerMesh = new THREE.Mesh(geo, mat);
  scene.add(playerMesh);
}

// ---------- Input ----------

const keys = { forward: false, back: false, left: false, right: false, jump: false };

function bindKey(code, prop) {
  return code;
}

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': keys.forward = true; break;
    case 'ArrowDown': case 's': case 'S': keys.back = true; break;
    case 'ArrowLeft': case 'a': case 'A': keys.left = true; break;
    case 'ArrowRight': case 'd': case 'D': keys.right = true; break;
    case ' ': keys.jump = true; e.preventDefault(); break;
  }
});
window.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': keys.forward = false; break;
    case 'ArrowDown': case 's': case 'S': keys.back = false; break;
    case 'ArrowLeft': case 'a': case 'A': keys.left = false; break;
    case 'ArrowRight': case 'd': case 'D': keys.right = false; break;
    case ' ': keys.jump = false; break;
  }
});

// Touch controls
function bindHold(id, setter) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = (e) => { e.preventDefault(); setter(true); };
  const end = (e) => { e.preventDefault(); setter(false); };
  el.addEventListener('touchstart', start, { passive: false });
  el.addEventListener('touchend', end, { passive: false });
  el.addEventListener('touchcancel', end, { passive: false });
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', end);
  el.addEventListener('mouseleave', end);
}
bindHold('btnFwd', v => keys.forward = v);
bindHold('btnBack', v => keys.back = v);
bindHold('btnLeft', v => keys.left = v);
bindHold('btnRight', v => keys.right = v);
bindHold('btnJump', v => keys.jump = v);

// ---------- Game loop ----------

function resetPlayer(toPos) {
  physState = { pos: { ...toPos }, vel: { x: 0, y: 0, z: 0 }, onGround: true };
}

function startTimer() {
  clearInterval(timerHandle);
  seconds = 0;
  timeVal.textContent = '0:00';
  timerHandle = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timeVal.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

function distXZ(a, b) {
  const dx = a.x - b.x, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function updateCheckpoints() {
  for (let i = 0; i < checkpoints.length; i++) {
    const cp = checkpoints[i];
    if (cp.reached) continue;
    if (distXZ(physState.pos, cp.pos) < cp.radius) {
      cp.reached = true;
      if (cp.isGoal) {
        finishLevel();
      } else {
        currentCheckpointIndex++;
        checkpointVal.textContent = currentCheckpointIndex + 1;
        lastCheckpointPos = { x: cp.pos.x, y: cp.pos.y + 0.5, z: cp.pos.z };
        if (cp.flag) cp.flag.material.color.set(0x3ddcff);
      }
    }
  }
}

function finishLevel() {
  running = false;
  clearInterval(timerHandle);
  endTitle.textContent = 'You made it!';
  endMsg.textContent = `Campus cleared in ${timeVal.textContent}`;
  endOverlay.classList.remove('hidden');
}

function updateCamera() {
  const offset = new THREE.Vector3(0, 3.2, 6.5);
  const targetPos = new THREE.Vector3(physState.pos.x, physState.pos.y, physState.pos.z);
  const desiredCamPos = targetPos.clone().add(offset);
  camera.position.lerp(desiredCamPos, 0.12);
  camera.lookAt(targetPos.x, targetPos.y + 0.8, targetPos.z - 4);
}

function gameLoop() {
  if (!running) return;
  requestAnimationFrame(gameLoop);

  const dt = Math.min(clock.getDelta(), 1 / 30);

  // Build input direction — forward is -Z in this level layout
  let moveZ = 0, moveX = 0;
  if (keys.forward) moveZ -= 1;
  if (keys.back) moveZ += 1;
  if (keys.left) moveX -= 1;
  if (keys.right) moveX += 1;
  const len = Math.hypot(moveX, moveZ);
  if (len > 0) { moveX /= len; moveZ /= len; }

  physState = P.stepPhysics(
    physState,
    { moveX, moveZ, jumpPressed: keys.jump },
    platforms,
    dt
  );

  // Fell off the level -> respawn at last checkpoint
  if (P.isOffMap(physState.pos, FALL_THRESHOLD)) {
    resetPlayer(lastCheckpointPos);
  }

  playerMesh.position.set(physState.pos.x, physState.pos.y, physState.pos.z);
  if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
    const angle = Math.atan2(moveX, moveZ) + Math.PI;
    playerMesh.rotation.y = angle;
  }

  updateCheckpoints();
  updateCamera();

  renderer.render(scene, camera);
}

function startGame() {
  startOverlay.classList.add('hidden');
  endOverlay.classList.add('hidden');
  resetPlayer({ x: 0, y: 1, z: 12 });
  lastCheckpointPos = { x: 0, y: 1, z: 12 };
  currentCheckpointIndex = 0;
  checkpointVal.textContent = '1';

  checkpoints.forEach((cp) => {
    const isStartFlag = cp.pos.z === 10;
    cp.reached = isStartFlag; // start flag stays marked reached; everything else resets
    if (cp.flag && !isStartFlag) cp.flag.material.color.set(0xffd23d);
  });

  running = true;
  clock = new THREE.Clock();
  startTimer();
  requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', () => {
  if (!scene) initScene();
  checkpointTotal.textContent = checkpoints.length;
  startGame();
});

restartBtn.addEventListener('click', startGame);
