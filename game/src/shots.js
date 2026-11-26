// Screenshot mode: ?shot=<name>&seed=<n> places the game in a fixed,
// deterministic scene so the screenshots are real renders of the game code
// in a state the maker chose. The shots are listed in shots.json.
//
//   cover    — mid-flight chase view, rings ahead, HUD lit
//   approach — low over the runway on final approach, gear down
//   ring     — the moment the plane threads a target ring
//   landed   — the landed screen with the score breakdown

import { CONFIG } from './config.js';

export function applyShot(game, params) {
  const shot = params.get('shot');
  if (!shot) return false;
  const seed = Number(params.get('seed') || 1);

  game.seed = seed;
  game.state = 'playing';
  game.sortie = 1;

  if (shot === 'cover') {
    // Mid-flight, two rings already flown, three ahead over the valley.
    game.plane.x = 3400;
    game.plane.alt = 980;
    game.plane.speed = 158;
    game.plane.throttle = 78;
    game.plane.pitch = 3;
    game.plane.fuel = 82;
    game.world.rings[0].state = 'passed';
    game.world.rings[1].state = 'passed';
    game.ringsPassed = 2;
    game.score = 200;
    game.missionText = 'MISSION 1 — FLY THROUGH THE RINGS  (2/5)';
    game.toast = 'RING 2  +100';
    game.toastUntil = 99999;
    game.camAlt = 230;
    return true;
  }

  if (shot === 'approach') {
    // On final: low, slow, gear down, runway filling the view ahead.
    game.plane.x = 9400;
    game.plane.alt = game.world.groundAt(9400) + 120;
    game.plane.speed = 108;
    game.plane.throttle = 42;
    game.plane.pitch = -4;
    game.plane.fuel = 61;
    game.plane.gearDown = true;
    game.plane.flaps = true;
    for (const r of game.world.rings) r.state = 'passed';
    game.ringsPassed = 5;
    game.score = 500;
    game.missionText = 'MISSION 2 — LAND ON RUNWAY 27';
    game.camAlt = 0;
    return true;
  }

  if (shot === 'ring') {
    // Threading ring 3 dead centre: the ring glows around the plane.
    const ring = game.world.rings[2];
    game.plane.x = ring.x;
    game.plane.alt = ring.alt;
    game.plane.speed = 172;
    game.plane.throttle = 84;
    game.plane.pitch = 2;
    game.plane.fuel = 74;
    game.world.rings[0].state = 'passed';
    game.world.rings[1].state = 'passed';
    ring.state = 'passed';
    game.ringsPassed = 3;
    game.score = 300;
    game.missionText = 'MISSION 1 — FLY THROUGH THE RINGS  (3/5)';
    game.toast = 'RING 3  +100';
    game.toastUntil = 99999;
    game.camAlt = ring.alt - 750;
    return true;
  }

  if (shot === 'landed') {
    // Parked on the strip, sortie complete, score breakdown on screen.
    game.state = 'landed';
    game.plane.x = 10550;
    game.plane.alt = CONFIG.RUNWAY_ELEV_FT;
    game.plane.speed = 0;
    game.plane.throttle = 0;
    game.plane.fuel = 96;
    for (const r of game.world.rings) r.state = 'passed';
    game.ringsPassed = 5;
    game.score = 986;
    game.landingBonus = 86;
    game.missionText = 'MISSION 2 — LAND ON RUNWAY 27';
    game.camAlt = 0;
    return true;
  }

  return false;
}
