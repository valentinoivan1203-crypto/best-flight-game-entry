// Rendering: everything the player sees, drawn in code on one canvas.
// Sky, sun, clouds, two mountain ridges, rolling hills, a river, a town,
// the runway, the glowing rings, the aeroplane, the HUD and the screens.
// No images are loaded anywhere; every pixel is drawn here.

import { CONFIG, COLORS } from './config.js';

const GROUND_Y = Math.round(CONFIG.VIEW_H * 0.82);

// Camera altitude follows the plane so it sits at a steady height on screen.
export function updateCamera(game, dt) {
  const target = Math.max(0, Math.min(1700, game.plane.alt - 750));
  game.camAlt += (target - game.camAlt) * Math.min(1, dt * 2.2);
}

function groundScreenY(game, worldX) {
  return GROUND_Y - (game.world.groundAt(worldX) - game.camAlt) * CONFIG.FT_TO_PX;
}

function planeScreenY(game) {
  return GROUND_Y - (game.plane.alt - game.camAlt) * CONFIG.FT_TO_PX;
}

function worldXAt(game, screenX) {
  const camX = game.plane.x - CONFIG.PLANE_SCREEN_X / CONFIG.PX_PER_METER;
  return camX + screenX / CONFIG.PX_PER_METER;
}

export function draw(ctx, game, time) {
  const { plane, world } = game;
  const W = CONFIG.VIEW_W;
  const H = CONFIG.VIEW_H;
  const camX = plane.x - CONFIG.PLANE_SCREEN_X / CONFIG.PX_PER_METER;

  drawSky(ctx, game, time, W, H, camX);
  drawMountains(ctx, game, W, H, camX);
  drawTerrain(ctx, game, W, H, camX);
  drawRiver(ctx, game, W, H, camX);
  drawTown(ctx, game, W, H, camX);
  drawRunway(ctx, game, W, H, camX);
  drawRings(ctx, game, time, W, H);
  drawPlane(ctx, game, time, W, H);
  drawHud(ctx, game, time, W, H);
  drawScreens(ctx, game, time, W, H);
}

// --- Sky -------------------------------------------------------------------

function drawSky(ctx, game, time, W, H, camX) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(0.55, COLORS.skyMid);
  g.addColorStop(0.78, COLORS.skyHorizon);
  g.addColorStop(1, '#e8c98f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Sun with a warm glow, top right.
  const sx = W - 170;
  const sy = 92;
  const glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 130);
  glow.addColorStop(0, 'rgba(255, 215, 106, 0.9)');
  glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 130, sy - 130, 260, 260);
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(sx, sy, 34, 0, Math.PI * 2);
  ctx.fill();

  // Clouds drift slowly, nearer ones faster (parallax).
  for (const c of game.world.clouds) {
    const cx = (((c.x - camX * 0.25) % (W + 400)) + W + 400) % (W + 400) - 200;
    const cy = c.y * 0.6 + 30;
    const s = c.s;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 58 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 34 * s, cy + 6 * s, 36 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 36 * s, cy + 5 * s, 38 * s, 13 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Mountains ---------------------------------------------------------------

function drawRidge(ctx, ridge, W, H, camX, parallax, color, baseY) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, H);
  const span = W * 2.2;
  for (let sx = -10; sx <= W + 10; sx += 14) {
    const u = (((sx + camX * parallax) % span) + span) % span / span;
    // Ridge heights are feet; scale them down so the peaks sit on the
    // horizon instead of filling the sky.
    const h = ridgeHeight(ridge, u) * 0.35;
    ctx.lineTo(sx, baseY - h);
  }
  ctx.lineTo(W + 10, H);
  ctx.closePath();
  ctx.fill();
}

function ridgeHeight(ridge, u) {
  const f = u * (ridge.length - 1);
  const i = Math.floor(f);
  const j = Math.min(ridge.length - 1, i + 1);
  // Smooth (cosine) interpolation so the ridge reads as mountains, not
  // flat triangles.
  const t = (1 - Math.cos((f - i) * Math.PI)) / 2;
  return ridge[i].h + (ridge[j].h - ridge[i].h) * t;
}

function drawMountains(ctx, game, W, H, camX) {
  drawRidge(ctx, game.world.ridgeFar, W, H, camX * 0.3, 0.3, COLORS.mountainFar, GROUND_Y + 40);
  drawRidge(ctx, game.world.ridgeNear, W, H, camX * 0.5, 0.5, COLORS.mountainNear, GROUND_Y + 60);
}

// --- Terrain, river, town, runway ---------------------------------------------

function drawTerrain(ctx, game, W, H, camX) {
  // Rolling green hills down to the bottom of the screen.
  const g = ctx.createLinearGradient(0, GROUND_Y - 120, 0, H);
  g.addColorStop(0, COLORS.hillLight);
  g.addColorStop(0.5, COLORS.hillDark);
  g.addColorStop(1, '#3c6e35');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-10, H);
  for (let sx = -10; sx <= W + 10; sx += 8) {
    ctx.lineTo(sx, groundScreenY(game, worldXAt(game, sx)));
  }
  ctx.lineTo(W + 10, H);
  ctx.closePath();
  ctx.fill();

  // Darker hill shading: a second pass a little lower.
  ctx.fillStyle = 'rgba(30, 80, 30, 0.25)';
  ctx.beginPath();
  ctx.moveTo(-10, H);
  for (let sx = -10; sx <= W + 10; sx += 8) {
    ctx.lineTo(sx, groundScreenY(game, worldXAt(game, sx)) + 26);
  }
  ctx.lineTo(W + 10, H);
  ctx.closePath();
  ctx.fill();

  // Trees dotted along the hills.
  ctx.fillStyle = '#2c5a28';
  for (const t of game.world.trees) {
    const sx = CONFIG.PLANE_SCREEN_X + (t.x - game.plane.x) * CONFIG.PX_PER_METER;
    if (sx < -20 || sx > W + 20) continue;
    const sy = groundScreenY(game, t.x);
    const s = t.s;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 16 * s);
    ctx.lineTo(sx - 7 * s, sy);
    ctx.lineTo(sx + 7 * s, sy);
    ctx.closePath();
    ctx.fill();
  }
}

function drawRiver(ctx, game, W, H, camX) {
  const r = game.world.river;
  ctx.strokeStyle = COLORS.river;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let sx = -10; sx <= W + 10; sx += 10) {
    const wx = worldXAt(game, sx);
    if (wx < r.x0 || wx > r.x1) continue;
    const wobble = 14 * Math.sin(wx / 420);
    const sy = groundScreenY(game, wx) + 46 + wobble;
    if (sx === -10) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.lineWidth = 16;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawTown(ctx, game, W, H, camX) {
  for (const hs of game.world.houses) {
    const sx = CONFIG.PLANE_SCREEN_X + (hs.x - game.plane.x) * CONFIG.PX_PER_METER;
    if (sx < -60 || sx > W + 60) continue;
    const sy = groundScreenY(game, hs.x);
    ctx.fillStyle = COLORS.houseWall;
    ctx.fillRect(sx, sy - hs.h, hs.w, hs.h);
    ctx.fillStyle = COLORS.houseRoof;
    if (hs.roof === 'tri') {
      ctx.beginPath();
      ctx.moveTo(sx - 3, sy - hs.h);
      ctx.lineTo(sx + hs.w / 2, sy - hs.h - 14);
      ctx.lineTo(sx + hs.w + 3, sy - hs.h);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(sx - 2, sy - hs.h - 6, hs.w + 4, 6);
    }
    // Lit windows.
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(sx + 6, sy - hs.h + 8, 7, 8);
    ctx.fillRect(sx + hs.w - 14, sy - hs.h + 8, 7, 8);
  }
}

function drawRunway(ctx, game, W, H, camX) {
  const rw = game.world.runway;
  const x0 = CONFIG.PLANE_SCREEN_X + (rw.x0 - game.plane.x) * CONFIG.PX_PER_METER;
  const x1 = CONFIG.PLANE_SCREEN_X + (rw.x1 - game.plane.x) * CONFIG.PX_PER_METER;
  if (x1 < -40 || x0 > W + 40) return;
  const y = GROUND_Y - (rw.elev - game.camAlt) * CONFIG.FT_TO_PX;
  const h = 26;
  // Strip.
  ctx.fillStyle = COLORS.runway;
  ctx.fillRect(x0, y, x1 - x0, h);
  // Centreline dashes.
  ctx.fillStyle = COLORS.runwayMark;
  const dashW = 34;
  const gap = 46;
  for (let dx = x0 + 20; dx < x1 - 20; dx += dashW + gap) {
    ctx.fillRect(dx, y + h / 2 - 2, dashW, 4);
  }
  // Threshold bars at both ends.
  for (const tx of [x0 + 8, x1 - 8]) {
    ctx.fillRect(tx - 30, y + 4, 60, 4);
    ctx.fillRect(tx - 30, y + h - 8, 60, 4);
  }
  // Runway number 27, painted on the strip.
  ctx.fillStyle = COLORS.runwayMark;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('27', x0 + 90, y + h / 2);
  // Edge lights.
  for (let dx = x0 + 10; dx < x1; dx += 120) {
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(dx, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // A windsock near the strip.
  const wx = x0 + 140;
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wx, y);
  ctx.lineTo(wx, y - 34);
  ctx.stroke();
  ctx.fillStyle = '#ff7a3c';
  ctx.beginPath();
  ctx.moveTo(wx, y - 34);
  ctx.lineTo(wx + 22, y - 30);
  ctx.lineTo(wx, y - 24);
  ctx.closePath();
  ctx.fill();
}

// --- Rings --------------------------------------------------------------------

function drawRings(ctx, game, time, W, H) {
  for (const ring of game.world.rings) {
    const sx = CONFIG.PLANE_SCREEN_X + (ring.x - game.plane.x) * CONFIG.PX_PER_METER;
    if (sx < -90 || sx > W + 90) continue;
    const bob = Math.sin(time * 1.4 + ring.bobPhase) * 6;
    const sy = GROUND_Y - (ring.alt - game.camAlt) * CONFIG.FT_TO_PX + bob;
    const r = CONFIG.RING_VISUAL_PX;
    const color = ring.state === 'passed' ? COLORS.ringDone
      : ring.state === 'missed' ? COLORS.ringMissed : COLORS.ringNext;
    const pulse = ring.state === 'pending' ? 0.75 + 0.25 * Math.sin(time * 4) : 1;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, r - 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Ring number.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(game.world.rings.indexOf(ring) + 1), sx, sy - r - 14);
  }
}

// --- The aeroplane -------------------------------------------------------------

function drawPlane(ctx, game, time, W, H) {
  const { plane } = game;
  const px = CONFIG.PLANE_SCREEN_X;
  const py = planeScreenY(game);
  const pitchRad = (-plane.pitch * Math.PI) / 180;
  const bankRad = (plane.bank * Math.PI) / 180;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(pitchRad * 0.6 + bankRad * 0.15);

  // Damage smoke puffs.
  if (plane.damage > 0) {
    ctx.fillStyle = 'rgba(60, 60, 60, 0.5)';
    for (let i = 0; i < plane.damage; i++) {
      const ox = -30 - i * 14 - ((time * 40 + i * 30) % 40);
      const oy = -6 + Math.sin(time * 3 + i * 2) * 4;
      ctx.beginPath();
      ctx.arc(ox, oy, 7 + ((time * 10 + i * 13) % 8), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Speed lines when fast.
  if (plane.speed > 180) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const ly = -30 + i * 18 + ((time * 300 + i * 47) % 30);
      ctx.beginPath();
      ctx.moveTo(-70, ly);
      ctx.lineTo(-110, ly);
      ctx.stroke();
    }
  }

  // Tail.
  ctx.fillStyle = COLORS.planeBody;
  ctx.beginPath();
  ctx.moveTo(-34, -2);
  ctx.lineTo(-46, -22);
  ctx.lineTo(-36, -22);
  ctx.lineTo(-24, -4);
  ctx.closePath();
  ctx.fill();
  // Rear stabiliser.
  ctx.fillStyle = COLORS.planeCream;
  ctx.beginPath();
  ctx.moveTo(-32, 2);
  ctx.lineTo(-48, 8);
  ctx.lineTo(-34, 10);
  ctx.closePath();
  ctx.fill();

  // Fuselage.
  ctx.fillStyle = COLORS.planeBody;
  ctx.beginPath();
  ctx.ellipse(0, 0, 38, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cream cheatline.
  ctx.fillStyle = COLORS.planeCream;
  ctx.beginPath();
  ctx.ellipse(2, 2, 34, 5, 0, 0, Math.PI);
  ctx.fill();

  // Main wing (seen edge-on, sweeping back).
  ctx.fillStyle = COLORS.planeCream;
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(10, 16);
  ctx.lineTo(22, 16);
  ctx.lineTo(8, 0);
  ctx.closePath();
  ctx.fill();

  // Cockpit canopy, lit.
  ctx.fillStyle = COLORS.planeGlass;
  ctx.beginPath();
  ctx.ellipse(14, -7, 11, 6, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(17, -9, 4, 2, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Propeller: a spinning disc with a hub.
  const propA = time * 40;
  ctx.strokeStyle = 'rgba(40, 40, 40, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(40, 0, 3, 16, propA, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(40, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // Navigation lights.
  ctx.fillStyle = '#3ddc74';
  ctx.beginPath();
  ctx.arc(8, 14, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5a4e';
  ctx.beginPath();
  ctx.arc(-38, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Landing gear when configured to land.
  if (plane.gearDown) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, 8);
    ctx.lineTo(-14, 20);
    ctx.moveTo(16, 8);
    ctx.lineTo(16, 20);
    ctx.stroke();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-14, 21, 4, 0, Math.PI * 2);
    ctx.arc(16, 21, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// --- HUD ----------------------------------------------------------------------

function hudBox(ctx, x, y, w, label, value, accent) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 52, 8);
  ctx.fill();
  ctx.fillStyle = '#9db4d0';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x + 10, y + 16);
  ctx.fillStyle = accent || COLORS.hudText;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(value, x + 10, y + 40);
}

export function drawHud(ctx, game, time, W, H) {
  const { plane } = game;
  if (game.state === 'title') return;

  const pad = 12;
  let x = pad;
  const y = pad;
  hudBox(ctx, x, y, 128, 'ALTITUDE', `${Math.max(0, Math.round(plane.alt))} ft`, plane.alt < 300 && plane.speed > 60 ? COLORS.hudAmber : COLORS.hudText);
  x += 140;
  hudBox(ctx, x, y, 108, 'SPEED', `${Math.round(plane.speed)} kt`, plane.overspeed ? COLORS.hudRed : plane.stalled ? COLORS.hudRed : COLORS.hudText);
  x += 120;
  hudBox(ctx, x, y, 96, 'HEADING', `${String(Math.round(game.heading)).padStart(3, '0')}°`);
  x += 108;
  hudBox(ctx, x, y, 96, 'THROTTLE', `${Math.round(plane.throttle)}%`);
  x += 108;
  // Fuel gauge.
  ctx.fillStyle = COLORS.hudBg;
  ctx.beginPath();
  ctx.roundRect(x, y, 150, 52, 8);
  ctx.fill();
  ctx.fillStyle = '#9db4d0';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FUEL', x + 10, y + 16);
  const fw = 130 * (plane.fuel / CONFIG.FUEL_MAX);
  ctx.fillStyle = plane.fuel < CONFIG.FUEL_LOW_WARN ? COLORS.hudRed : COLORS.hudGreen;
  ctx.fillRect(x + 10, y + 26, fw, 12);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${Math.round(plane.fuel)}`, x + 10, y + 48);
  x += 162;
  hudBox(ctx, x, y, 118, 'SCORE', String(game.score), COLORS.hudAmber);
  x += 130;
  hudBox(ctx, x, y, 96, 'RINGS', `${game.ringsPassed}/${CONFIG.RING_COUNT}`);
  x += 108;
  // Damage hearts.
  ctx.fillStyle = COLORS.hudBg;
  ctx.beginPath();
  ctx.roundRect(x, y, 96, 52, 8);
  ctx.fill();
  ctx.fillStyle = '#9db4d0';
  ctx.font = '11px sans-serif';
  ctx.fillText('DAMAGE', x + 10, y + 16);
  for (let i = 0; i < CONFIG.MAX_DAMAGE; i++) {
    ctx.fillStyle = i < plane.damage ? COLORS.hudRed : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x + 20 + i * 26, y + 36, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mission line under the HUD.
  ctx.fillStyle = 'rgba(10, 18, 32, 0.55)';
  ctx.beginPath();
  ctx.roundRect(pad, y + 62, 560, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(game.missionText, pad + 12, y + 82);

  // Wind, bottom right.
  ctx.fillStyle = 'rgba(10, 18, 32, 0.55)';
  ctx.beginPath();
  ctx.roundRect(W - 220, H - 44, 208, 32, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`WIND ${Math.round(game.wind)} kt  ·  SORTIE ${game.sortie}`, W - 24, H - 22);

  // Controls hint, bottom left.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '12px sans-serif';
  ctx.fillText('↑↓ pitch · ←→ throttle · SPACE flaps · P pause · R restart · M mute', pad, H - 22);

  // Flashing warnings.
  const warn = [];
  if (plane.stalled) warn.push('STALL — NOSE DOWN, ADD THROTTLE');
  else if (plane.overspeed) warn.push('OVERSPEED — THROTTLE BACK');
  if (plane.fuel < CONFIG.FUEL_LOW_WARN && plane.fuel > 0) warn.push('LOW FUEL — LAND SOON');
  if (plane.engineOut) warn.push('ENGINE OUT — GLIDE TO THE RUNWAY');
  if (warn.length && Math.sin(time * 6) > -0.2) {
    ctx.fillStyle = COLORS.hudRed;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(warn[0], W / 2, 130);
  }

  // Toast message (ring scored, mission updates).
  if (game.toast && game.toastUntil > time) {
    ctx.fillStyle = 'rgba(10, 18, 32, 0.7)';
    const tw = ctx.measureText(game.toast).width + 36;
    ctx.beginPath();
    ctx.roundRect(W / 2 - tw / 2, 160, tw, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.toast, W / 2, 184);
  }
}

// --- Screens -------------------------------------------------------------------

function panel(ctx, W, H, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 14, 26, 0.62)';
  ctx.fillRect(0, 0, W, H);
  const pw = 640;
  const ph = 110 + lines.length * 34;
  const px = (W - pw) / 2;
  const py = (H - ph) / 2;
  ctx.fillStyle = 'rgba(12, 22, 40, 0.92)';
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 14);
  ctx.fill();
  ctx.strokeStyle = accent || '#ffb02e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = accent || '#ffb02e';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, py + 62);
  ctx.fillStyle = '#eaf2ff';
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, py + 108 + i * 34);
  });
}

function drawScreens(ctx, game, time, W, H) {
  if (game.state === 'title') {
    panel(ctx, W, H, 'RIDGE RUNNER', [
      'A valley ring flight — fly the rings, then land on runway 27.',
      '',
      '↑ / ↓  pitch      ← / →  throttle      SPACE  flaps',
      'P  pause      R  restart      M  mute      Click also works',
      '',
      'Stall below 62 kt · overspeed above 235 kt · fuel runs out',
      '3 hits and the sortie is over. Land gently to refuel.',
      '',
      'CLICK OR PRESS ENTER TO FLY',
    ], '#ffb02e');
    return;
  }
  if (game.state === 'paused') {
    panel(ctx, W, H, 'PAUSED', [
      'The valley waits. Press P or click to keep flying.',
      '',
      `Score ${game.score} · Rings ${game.ringsPassed}/${CONFIG.RING_COUNT} · Sortie ${game.sortie}`,
    ], '#9db4d0');
    return;
  }
  if (game.state === 'landed') {
    panel(ctx, W, H, 'LANDED', [
      'Wheels down on runway 27. Sortie complete.',
      '',
      `Rings flown: ${game.ringsPassed}/${CONFIG.RING_COUNT}  ·  Landing +${CONFIG.LAND_SCORE}`,
      `Fuel bonus +${game.landingBonus}  ·  Total score ${game.score}`,
      '',
      'PRESS R OR CLICK FOR THE NEXT SORTIE',
    ], '#3ddc74');
    return;
  }
  if (game.state === 'crashed') {
    panel(ctx, W, H, 'CRASHED', [
      game.crashReason || 'The valley wins this round.',
      '',
      `Score ${game.score} · Rings ${game.ringsPassed}/${CONFIG.RING_COUNT}`,
      `Best score this session: ${game.bestScore}`,
      '',
      'PRESS R OR CLICK TO FLY AGAIN',
    ], '#ff5a4e');
    return;
  }
}
