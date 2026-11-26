// RIDGE RUNNER — the game loop and state machine.
// States: title → playing ⇄ paused → landed / crashed → (next sortie).
// The loop steps physics, checks rings, terrain and the runway, scores the
// sortie and hands every frame to the renderer. window.__game exposes the
// live state so automated tests can drive the game with real keys.

import { CONFIG } from './config.js';
import { buildWorld } from './world.js';
import { createPlane, stepPlane, bounce } from './plane.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { draw, updateCamera } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = CONFIG.VIEW_W * dpr;
  canvas.height = CONFIG.VIEW_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 1);

const game = {
  seed,
  state: 'title', // title | playing | paused | landed | crashed
  sortie: 1,
  score: 0,
  bestScore: 0,
  ringsPassed: 0,
  missionText: 'MISSION 1 — FLY THROUGH THE RINGS  (0/5)',
  toast: '',
  toastUntil: 0,
  landingBonus: 0,
  crashReason: '',
  time: 0,
  camAlt: 0,
  heading: 90,
  wind: CONFIG.WIND_BASE_KT,
  plane: createPlane(),
  world: buildWorld(seed, 1),
  input: createInput(),
  audio: createAudio(),
  shotMode: false,
  lastWarn: 0,
};

// Screenshot mode: a fixed scene for a real render of the game code.
game.shotMode = applyShot(game, params);
if (game.shotMode) {
  game.state = params.get('shot') === 'landed' ? 'landed' : 'playing';
  // In shot mode the scene is frozen: no physics, one clean frame per tick.
  game.frozen = true;
}

window.__game = game;

// The plane starts above the valley floor, never inside a hill.
function placePlaneAtStart() {
  game.plane.alt = game.world.groundAt(0) + 250;
  game.plane.pitch = 0;
}
// Not in screenshot mode: the shot sets its own altitude.
if (!game.shotMode) placePlaneAtStart();

function showToast(text, seconds) {
  game.toast = text;
  game.toastUntil = game.time + seconds;
}

function nextSortie() {
  game.sortie += 1;
  game.world = buildWorld(game.seed, game.sortie);
  game.plane = createPlane();
  game.plane.fuel = CONFIG.FUEL_MAX;
  placePlaneAtStart();
  game.ringsPassed = 0;
  game.missionText = 'MISSION 1 — FLY THROUGH THE RINGS  (0/5)';
  game.wind = CONFIG.WIND_BASE_KT + (game.sortie - 1) * CONFIG.WIND_PER_SORTIE_KT;
  game.state = 'playing';
  game.camAlt = 0;
  showToast(`SORTIE ${game.sortie} — WIND ${Math.round(game.wind)} KT`, 3);
}

function startFlying() {
  if (game.state === 'title') {
    game.state = 'playing';
    game.audio.ensure();
    game.audio.click();
  }
}

function crash(reason) {
  if (game.state !== 'playing') return;
  game.state = 'crashed';
  game.crashReason = reason;
  game.bestScore = Math.max(game.bestScore, game.score);
  game.audio.crash();
  game.audio.setEngine(0, 0, false);
}

function land() {
  const plane = game.plane;
  game.state = 'landed';
  game.landingBonus = Math.round(plane.fuel);
  game.score += CONFIG.LAND_SCORE + game.landingBonus;
  if (plane.verticalSpeed > -5) game.score += CONFIG.LAND_SMOOTH_BONUS;
  game.bestScore = Math.max(game.bestScore, game.score);
  game.audio.thud();
  game.audio.setEngine(0, 0, false);
}

function checkRings() {
  const plane = game.plane;
  for (const ring of game.world.rings) {
    if (ring.state !== 'pending') continue;
    if (plane.x < ring.x - 40 || plane.x > ring.x + 40) continue;
    if (Math.abs(plane.alt - ring.alt) <= CONFIG.RING_RADIUS_FT) {
      ring.state = 'passed';
      game.ringsPassed += 1;
      game.score += CONFIG.SCORE_RING;
      plane.fuel = Math.min(CONFIG.FUEL_MAX, plane.fuel + CONFIG.FUEL_RING_BONUS);
      game.audio.chime();
      showToast(`RING ${game.ringsPassed}  +${CONFIG.SCORE_RING}`, 2);
      if (game.ringsPassed === CONFIG.RING_COUNT) {
        game.missionText = 'MISSION 2 — LAND ON RUNWAY 27';
        showToast('ALL RINGS FLOWN — LAND ON RUNWAY 27', 3);
      } else {
        game.missionText = `MISSION 1 — FLY THROUGH THE RINGS  (${game.ringsPassed}/${CONFIG.RING_COUNT})`;
      }
    } else {
      ring.state = 'missed';
      showToast(`RING MISSED — KEEP FLYING`, 2);
    }
  }
}

function checkGround() {
  const plane = game.plane;
  const ground = game.world.groundAt(plane.x);
  const onRunway = plane.x >= game.world.runway.x0 && plane.x <= game.world.runway.x1;
  if (plane.alt > ground + 1) return;
  plane.alt = ground;

  if (onRunway) {
    const sink = -plane.verticalSpeed;
    if (sink <= CONFIG.LAND_MAX_SINK_FT_S && plane.speed >= CONFIG.LAND_MIN_SPEED_KT && plane.speed <= CONFIG.LAND_MAX_SPEED_KT) {
      land();
      return;
    }
    // A hard or fast touchdown: damage and a bounce, not yet a crash.
    if (plane.damage + 1 >= CONFIG.MAX_DAMAGE) {
      crash(sink > CONFIG.LAND_MAX_SINK_FT_S ? 'Hard landing on runway 27 — the gear gave way.' : 'Touchdown far too fast for runway 27.');
      return;
    }
    bounce(plane, sink > CONFIG.LAND_MAX_SINK_FT_S);
    game.audio.thud();
    showToast('HARD LANDING — DAMAGE!', 2);
    return;
  }

  // Terrain, not runway: a gentle scrape costs damage, a hard hit ends it.
  const sink = -plane.verticalSpeed;
  if (sink > 12 || plane.speed < 55) {
    crash('Terrain strike in the valley — the ridge wins this round.');
    return;
  }
  if (plane.damage + 1 >= CONFIG.MAX_DAMAGE) {
    crash('Third scrape on the valley floor — the plane is done.');
    return;
  }
  bounce(plane, false);
  game.audio.thud();
  showToast('TERRAIN SCRAPE — DAMAGE!', 2);
}

function step(dt) {
  game.time += dt;
  const { input, plane, audio } = game;

  // One-shot actions.
  if (input.muteToggle) {
    input.muteToggle = false;
    const muted = audio.toggleMute();
    showToast(muted ? 'SOUND OFF' : 'SOUND ON', 1.5);
  }
  if (input.restart) {
    input.restart = false;
    restartGame();
    return;
  }
  if (input.pauseToggle) {
    input.pauseToggle = false;
    if (game.state === 'playing') {
      game.state = 'paused';
      audio.setEngine(0, 0, false);
    } else if (game.state === 'paused') {
      game.state = 'playing';
    }
    return;
  }
  if (input.confirm) {
    input.confirm = false;
    if (game.state === 'title') startFlying();
    else if (game.state === 'landed') nextSortie();
    else if (game.state === 'crashed') restartGame();
    return;
  }
  if (input.click) {
    const c = input.click;
    input.click = null;
    audio.ensure();
    if (game.state === 'title') startFlying();
    else if (game.state === 'landed') nextSortie();
    else if (game.state === 'crashed') restartGame();
    else if (game.state === 'paused') game.state = 'playing';
    return;
  }

  if (game.state !== 'playing') return;

  // Audio follows the first gesture.
  if (input.interacted) audio.ensure();

  const events = stepPlane(plane, input, game.world, dt, game.time);
  for (const ev of events) {
    if (ev === 'stall' && game.time - game.lastWarn > 1) {
      game.lastWarn = game.time;
      audio.warn();
    }
    if (ev === 'overspeed' && game.time - game.lastWarn > 1) {
      game.lastWarn = game.time;
      audio.warn();
    }
    if (ev === 'fuel-low') showToast('LOW FUEL — LAND SOON', 3);
    if (ev === 'fuel-empty') showToast('ENGINE OUT — GLIDE TO THE RUNWAY', 4);
  }

  // Overspeed held too long strains the airframe.
  if (plane.overspeedTime > 2) {
    plane.overspeedTime = 0;
    if (plane.damage + 1 >= CONFIG.MAX_DAMAGE) {
      crash('Overspeed tore the airframe apart.');
      return;
    }
    plane.damage += 1;
    showToast('OVERSPEED DAMAGE!', 2);
  }

  game.heading = game.world.headingAt(plane.x);
  checkRings();
  checkGround();
  if (game.state !== 'playing') return;

  // Ran past the runway without landing: circle back for another approach.
  if (plane.x > CONFIG.RUNWAY_END_M + 400) {
    plane.x = CONFIG.RUNWAY_START_M - 1500;
    showToast('PAST THE RUNWAY — TURN BACK AND LAND', 3);
  }

  audio.setEngine(plane.engineOut ? 0 : plane.throttle, plane.speed, true);
}

function restartGame() {
  game.sortie = 1;
  game.score = 0;
  game.ringsPassed = 0;
  game.missionText = 'MISSION 1 — FLY THROUGH THE RINGS  (0/5)';
  game.wind = CONFIG.WIND_BASE_KT;
  game.world = buildWorld(game.seed, 1);
  game.plane = createPlane();
  placePlaneAtStart();
  game.state = 'playing';
  game.camAlt = 0;
  game.crashReason = '';
  game.audio.ensure();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) step(dt);
  updateCamera(game, dt);
  draw(ctx, game, game.time);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
