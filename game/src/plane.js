// The aeroplane: state and the flight model. Speed is knots, altitude is
// feet, pitch is degrees. Throttle and pitch are the only levers; climbing
// bleeds speed, diving gains it, and the stall and overspeed limits make
// throttle and turn discipline matter.

import { CONFIG } from './config.js';

export function createPlane() {
  return {
    x: 0, // metres along the course
    alt: 420, // feet above sea level
    speed: 110, // knots
    pitch: 0, // degrees, positive = nose up
    throttle: 55, // percent
    flaps: false,
    fuel: CONFIG.FUEL_MAX,
    damage: 0,
    verticalSpeed: 0, // feet per second
    groundSpeed: 0,
    stalled: false,
    overspeed: false,
    overspeedTime: 0,
    engineOut: false,
    gearDown: false,
    bank: 0, // visual roll, degrees
  };
}

// One physics step. Returns a list of event names the game should react to:
// 'stall', 'stall-recover', 'overspeed', 'fuel-low', 'fuel-empty'.
export function stepPlane(plane, input, world, dt, time) {
  const events = [];

  // Throttle and pitch from the keys.
  const thrRate = CONFIG.THROTTLE_RATE_PCT_S * dt;
  if (input.throttleUp) plane.throttle = Math.min(100, plane.throttle + thrRate);
  if (input.throttleDown) plane.throttle = Math.max(0, plane.throttle - thrRate);
  const pitchRate = CONFIG.PITCH_RATE_DEG_S * dt;
  if (input.pitchUp) plane.pitch = Math.min(CONFIG.MAX_PITCH_DEG, plane.pitch + pitchRate);
  if (input.pitchDown) plane.pitch = Math.max(CONFIG.MIN_PITCH_DEG, plane.pitch - pitchRate);
  if (input.flapsToggle) {
    plane.flaps = !plane.flaps;
    input.flapsToggle = false;
  }

  // Gentle stability: with no pitch input the nose settles back toward
  // level, so the plane can be flown with taps and lands can be flared.
  if (!input.pitchUp && !input.pitchDown) {
    const level = 15 * dt; // degrees per second toward level flight
    if (plane.pitch > 0) plane.pitch = Math.max(0, plane.pitch - level);
    else if (plane.pitch < 0) plane.pitch = Math.min(0, plane.pitch + level);
  }
  const stallSpeed = plane.flaps ? CONFIG.FLAPS_STALL_KT : CONFIG.STALL_SPEED_KT;
  plane.gearDown = plane.alt < 500 && plane.speed < 150;

  // Engine out when the tanks are dry.
  if (plane.fuel <= 0 && !plane.engineOut) {
    plane.engineOut = true;
    events.push('fuel-empty');
  }
  const throttle = plane.engineOut ? 0 : plane.throttle;

  // Speed: thrust minus drag minus the climb bleed. Diving gives speed back.
  const thrust = (throttle / 100) * CONFIG.THRUST_KT_S;
  const drag = CONFIG.THRUST_KT_S * Math.pow(plane.speed / CONFIG.DRAG_REF_KT, 2)
    * (plane.flaps ? 1 + CONFIG.FLAPS_DRAG : 1);
  const climbBleed = Math.sin((plane.pitch * Math.PI) / 180) * CONFIG.CLIMB_BLEED_KT_S;
  plane.speed += (thrust - drag - climbBleed) * dt;
  if (plane.speed < 30) plane.speed = 30;
  if (plane.speed > 290) plane.speed = 290;

  // Stall: below stall speed the wing stops flying and the nose drops.
  const wasStalled = plane.stalled;
  plane.stalled = plane.speed < stallSpeed && plane.alt > world.groundAt(plane.x) + 5;
  if (plane.stalled && !wasStalled) events.push('stall');
  if (!plane.stalled && wasStalled) events.push('stall-recover');
  if (plane.stalled) {
    plane.pitch = Math.max(CONFIG.MIN_PITCH_DEG, plane.pitch - 40 * dt);
  }

  // Overspeed: too fast for too long strains the airframe.
  const wasOverspeed = plane.overspeed;
  plane.overspeed = plane.speed > CONFIG.OVERSPEED_KT;
  if (plane.overspeed && !wasOverspeed) events.push('overspeed');
  if (plane.speed > CONFIG.DAMAGE_SPEED_KT) {
    plane.overspeedTime += dt;
  } else {
    plane.overspeedTime = 0;
  }

  // Vertical speed from pitch, plus a gust of wind that pushes the plane.
  const speedFtS = plane.speed * 1.68781;
  const wind = CONFIG.WIND_BASE_KT + (world.sortie - 1) * CONFIG.WIND_PER_SORTIE_KT;
  const gust = Math.sin(time * 0.7 + world.seed) * wind * 0.35;
  plane.verticalSpeed = speedFtS * Math.sin((plane.pitch * Math.PI) / 180) + gust;
  plane.alt += plane.verticalSpeed * dt;
  if (plane.alt < 0) plane.alt = 0;

  // Ground speed: airspeed minus the headwind, in metres per second.
  plane.groundSpeed = Math.max(0, plane.speed * 0.51444 - wind * 0.51444 * 0.4);
  plane.x += plane.groundSpeed * dt;

  // Fuel drains with throttle; a dead engine still glides.
  if (!plane.engineOut) {
    plane.fuel -= (CONFIG.FUEL_DRAIN_BASE + throttle * CONFIG.FUEL_DRAIN_PER_THROTTLE) * dt;
    if (plane.fuel <= CONFIG.FUEL_LOW_WARN && plane.fuel + (CONFIG.FUEL_DRAIN_BASE + throttle * CONFIG.FUEL_DRAIN_PER_THROTTLE) * dt > CONFIG.FUEL_LOW_WARN) {
      events.push('fuel-low');
    }
    if (plane.fuel < 0) plane.fuel = 0;
  }

  // Visual bank follows the pitch input so the plane feels alive.
  const targetBank = (input.pitchUp ? -6 : 0) + (input.pitchDown ? 6 : 0);
  plane.bank += (targetBank - plane.bank) * Math.min(1, dt * 6);

  return events;
}

// A soft bounce after a scrape or a hard landing: lose speed, gain a little
// height, and take one point of damage.
export function bounce(plane, hard) {
  plane.alt += hard ? 60 : 35;
  plane.speed = Math.max(40, plane.speed * (hard ? 0.55 : 0.75));
  plane.pitch = Math.min(plane.pitch, 4);
  plane.damage += 1;
}
