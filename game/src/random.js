// Seeded random numbers (mulberry32). The valley, the town and the rings are
// built from a seed, so a screenshot taken with ?seed=1 always shows the
// same valley, and a new sortie can reshuffle with a new seed.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Range helper: rand(lo, hi) returns a float in [lo, hi).
export function range(rand, lo, hi) {
  return lo + rand() * (hi - lo);
}

// Integer range helper.
export function rangeInt(rand, lo, hi) {
  return Math.floor(range(rand, lo, hi + 1));
}

// Pick one item from an array.
export function pick(rand, items) {
  return items[Math.floor(rand() * items.length)];
}
