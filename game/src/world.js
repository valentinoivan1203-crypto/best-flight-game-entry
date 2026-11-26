// The valley: terrain height, the winding course heading, the rings, the
// runway and the town. Everything is a pure function of distance and seed,
// so the world is the same every time a seed is used.

import { CONFIG } from './config.js';
import { mulberry32, range, rangeInt } from './random.js';

export function buildWorld(seed, sortie) {
  const rand = mulberry32(seed + sortie * 7919);

  // Rolling hills: a few layered sines plus seeded bumps, flattened near the
  // runway so the strip sits on level ground.
  const bumps = [];
  for (let i = 0; i < 9; i++) {
    bumps.push({ x: range(rand, 0, CONFIG.COURSE_LENGTH_M), h: range(rand, 60, 220), w: range(rand, 700, 1800) });
  }

  function rawGround(x) {
    let h = 320
      + 130 * Math.sin(x / 2400 + 0.7)
      + 80 * Math.sin(x / 900 + 2.1)
      + 45 * Math.sin(x / 340 + 4.4);
    for (const b of bumps) {
      const d = (x - b.x) / b.w;
      if (d > -1 && d < 1) h += b.h * (1 - d * d);
    }
    return h;
  }

  // Blend to the runway elevation as the strip approaches.
  function groundAt(x) {
    const g = rawGround(x);
    const t = smoothstep(9200, 10000, x);
    return g + (CONFIG.RUNWAY_ELEV_FT - g) * t;
  }

  // The valley bends gently; the heading is the course direction at x.
  function headingAt(x) {
    return 90 + 18 * Math.sin(x / 2600) + 6 * Math.sin(x / 700 + 1.3);
  }

  // Rings: five per sortie, at reachable heights above the valley floor,
  // reshuffled each sortie.
  const rings = [];
  for (let i = 0; i < CONFIG.RING_COUNT; i++) {
    const x = CONFIG.RING_FIRST_M + i * CONFIG.RING_SPACING_M;
    rings.push({
      x,
      alt: groundAt(x) + range(rand, 250, 700),
      state: 'pending', // pending | passed | missed
      bobPhase: range(rand, 0, Math.PI * 2),
    });
  }

  // A little town beside the runway, and trees scattered along the valley.
  const houses = [];
  for (let i = 0; i < 14; i++) {
    houses.push({
      x: range(rand, 8800, 9850),
      w: range(rand, 26, 46),
      h: range(rand, 20, 36),
      roof: rand() < 0.5 ? 'tri' : 'flat',
    });
  }
  const trees = [];
  for (let i = 0; i < 90; i++) {
    trees.push({ x: range(rand, 0, CONFIG.COURSE_LENGTH_M), s: range(rand, 0.7, 1.6) });
  }

  // Clouds drift slowly; mountains are two seeded ridgelines.
  const clouds = [];
  for (let i = 0; i < 12; i++) {
    clouds.push({ x: range(rand, 0, CONFIG.COURSE_LENGTH_M * 1.4), y: range(rand, 40, 260), s: range(rand, 0.7, 1.8) });
  }
  const ridgeFar = ridge(rand, 9, 300, 620);
  const ridgeNear = ridge(rand, 11, 180, 420);

  // The river winds across the valley floor around x = 4200..5600.
  const river = { x0: 4100, x1: 5700, w: 90 };

  return {
    seed, sortie,
    groundAt, headingAt,
    rings, houses, trees, clouds, ridgeFar, ridgeNear, river,
    runway: { x0: CONFIG.RUNWAY_START_M, x1: CONFIG.RUNWAY_END_M, elev: CONFIG.RUNWAY_ELEV_FT },
  };
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// A ridgeline: a list of peaks (offset in metres, height in feet) drawn as a
// silhouette. Two ridges at different depths give the parallax.
function ridge(rand, peaks, minH, maxH) {
  const out = [];
  for (let i = 0; i < peaks; i++) {
    out.push({ at: i / (peaks - 1), h: rangeInt(rand, minH, maxH) });
  }
  return out;
}
