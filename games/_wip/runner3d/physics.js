// Pure physics module — no Three.js or DOM dependency.
// Exposed on window.Physics so game.js can use it, and Node can require it for tests.

const GRAVITY = -28;
const JUMP_VELOCITY = 11;
const MOVE_SPEED = 7;
const PLAYER_HALF = { x: 0.35, y: 0.5, z: 0.35 };
const GROUND_SNAP_EPSILON = 0.05;

// AABB = { minX, maxX, minY, maxY, minZ, maxZ }
function aabbFromBox(pos, half) {
  return {
    minX: pos.x - half.x, maxX: pos.x + half.x,
    minY: pos.y - half.y, maxY: pos.y + half.y,
    minZ: pos.z - half.z, maxZ: pos.z + half.z
  };
}

function aabbOverlap(a, b) {
  return (
    a.minX < b.maxX && a.maxX > b.minX &&
    a.minY < b.maxY && a.maxY > b.minY &&
    a.minZ < b.maxZ && a.maxZ > b.minZ
  );
}

// platforms: array of { pos: {x,y,z}, half: {x,y,z} }
// Returns the highest platform top surface Y at a given (x,z), if the player's
// horizontal extent overlaps that platform, else null.
function groundYAt(playerPos, platforms) {
  let best = null;
  for (const plat of platforms) {
    const b = aabbFromBox(plat.pos, plat.half);
    const withinX = playerPos.x + PLAYER_HALF.x > b.minX && playerPos.x - PLAYER_HALF.x < b.maxX;
    const withinZ = playerPos.z + PLAYER_HALF.z > b.minZ && playerPos.z - PLAYER_HALF.z < b.maxZ;
    if (withinX && withinZ) {
      if (best === null || b.maxY > best) best = b.maxY;
    }
  }
  return best;
}

// Steps player physics by dt seconds.
// state: { pos:{x,y,z}, vel:{x,y,z}, onGround:bool }
// input: { moveX, moveZ (already normalized direction), jumpPressed }
// platforms: array of platform boxes
// Returns new state (does not mutate input state).
function stepPhysics(state, input, platforms, dt) {
  const pos = { ...state.pos };
  const vel = { ...state.vel };
  let onGround = state.onGround;

  // Horizontal movement (direct velocity, arcade-style, no acceleration ramp)
  vel.x = input.moveX * MOVE_SPEED;
  vel.z = input.moveZ * MOVE_SPEED;

  // Jump
  if (input.jumpPressed && onGround) {
    vel.y = JUMP_VELOCITY;
    onGround = false;
  }

  // Gravity
  vel.y += GRAVITY * dt;

  // Integrate horizontal first
  pos.x += vel.x * dt;
  pos.z += vel.z * dt;

  // Integrate vertical
  pos.y += vel.y * dt;

  // Ground collision: find the platform top at this (x,z), snap if falling onto it
  const groundY = groundYAt(pos, platforms);
  if (groundY !== null && pos.y - PLAYER_HALF.y <= groundY + GROUND_SNAP_EPSILON && vel.y <= 0) {
    pos.y = groundY + PLAYER_HALF.y;
    vel.y = 0;
    onGround = true;
  } else if (groundY === null || pos.y - PLAYER_HALF.y > groundY + GROUND_SNAP_EPSILON) {
    onGround = false;
  }

  return { pos, vel, onGround };
}

function isOffMap(pos, fallThreshold) {
  return pos.y < fallThreshold;
}

const Physics = {
  GRAVITY, JUMP_VELOCITY, MOVE_SPEED, PLAYER_HALF,
  aabbFromBox, aabbOverlap, groundYAt, stepPhysics, isOffMap
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Physics;
}
if (typeof window !== 'undefined') {
  window.Physics = Physics;
}
