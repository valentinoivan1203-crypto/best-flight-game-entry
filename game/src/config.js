// RIDGE RUNNER — tuning constants. One place for every number that shapes
// how the plane flies, so the feel can be tuned without touching physics.

export const CONFIG = {
  // Canvas (logical pixels; the page scales it to the window).
  VIEW_W: 1280,
  VIEW_H: 720,

  // World: the valley run is 12 km long; the runway sits near the far end.
  COURSE_LENGTH_M: 12000,
  RUNWAY_START_M: 10000,
  RUNWAY_END_M: 11000,
  RUNWAY_ELEV_FT: 200,

  // Plane screen position (the camera keeps the plane here).
  PLANE_SCREEN_X: 430,
  PX_PER_METER: 0.8,
  FT_TO_PX: 0.16,

  // Flight model (knots, feet, seconds).
  STALL_SPEED_KT: 62,
  FLAPS_STALL_KT: 55,
  MAX_SPEED_KT: 245,
  OVERSPEED_KT: 235,
  DAMAGE_SPEED_KT: 250,
  MIN_PITCH_DEG: -18,
  MAX_PITCH_DEG: 22,
  PITCH_RATE_DEG_S: 55,
  THROTTLE_RATE_PCT_S: 60,
  THRUST_KT_S: 40,
  DRAG_REF_KT: 200,
  CLIMB_BLEED_KT_S: 45,
  FLAPS_DRAG: 0.35,

  // Fuel: 100 units, drained per second; a ring gives a little back.
  FUEL_MAX: 100,
  FUEL_DRAIN_BASE: 0.12,
  FUEL_DRAIN_PER_THROTTLE: 0.004,
  FUEL_RING_BONUS: 4,
  FUEL_LOW_WARN: 20,

  // Rings: five per sortie, scored when the plane crosses one close in height.
  RING_COUNT: 5,
  RING_FIRST_M: 1500,
  RING_SPACING_M: 1500,
  RING_RADIUS_FT: 130,
  RING_VISUAL_PX: 55,

  // Landing: gentle touchdown inside this window counts as a landing.
  LAND_MAX_SINK_FT_S: 9,
  LAND_MIN_SPEED_KT: 70,
  LAND_MAX_SPEED_KT: 150,
  LAND_SCORE: 400,
  LAND_SMOOTH_BONUS: 100,
  RING_SCORE: 100,

  // Damage: three hits and the sortie ends in a crash.
  MAX_DAMAGE: 3,

  // Wind: sortie 1 is calm; later sorties get gustier.
  WIND_BASE_KT: 6,
  WIND_PER_SORTIE_KT: 8,

  // Scoring.
  SCORE_RING: 100,
};

export const COLORS = {
  skyTop: '#1d4e89',
  skyMid: '#6fa8d8',
  skyHorizon: '#f7d9a0',
  sun: '#ffd76a',
  mountainFar: '#7d8fb8',
  mountainNear: '#4d6b52',
  hillLight: '#7fae62',
  hillDark: '#4e8a44',
  ground: '#5d9b4a',
  river: '#5fa8d8',
  runway: '#3a3f46',
  runwayMark: '#f2f2e8',
  houseWall: '#e8c98f',
  houseRoof: '#b5542f',
  planeBody: '#e8722a',
  planeCream: '#f6ead2',
  planeGlass: '#9fd8ef',
  ringNext: '#ffb02e',
  ringDone: '#3ddc74',
  ringMissed: '#8a8f98',
  hudBg: 'rgba(10, 18, 32, 0.72)',
  hudText: '#eaf2ff',
  hudAmber: '#ffb02e',
  hudRed: '#ff5a4e',
  hudGreen: '#3ddc74',
};
