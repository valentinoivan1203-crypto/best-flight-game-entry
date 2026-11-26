[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057/valentinoivan1203-crypto/best-flight-game-entry/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057/valentinoivan1203-crypto/best-flight-game-entry/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

# RIDGE RUNNER — Valley Ring Flight

A complete, original flight game for [make.fun's best flight game bounty](https://make.fun/bounty/best-flight-game-20261126-0057). It runs in a desktop browser from static files with no network request: open `game/index.html` and fly.

## The game

You fly a little prop plane down a green valley in a chase view, over rolling hills, a river, a town and two mountain ridges, under a dawn sky. The flight has two missions:

1. **Ring run** — thread 5 glowing target rings strung along the valley.
2. **Land on runway 27** — put her down gently on the strip by the town, then refuel and fly the next sortie (with stronger wind).

## Controls

- **↑ / ↓ (or W / S)** — pitch up / down
- **← / → (or A / D)** — throttle down / up
- **SPACE** — flaps (more drag, lower stall speed — for landing)
- **P** — pause · **R** — restart · **M** — mute · **Click** — start / continue

## What makes it a flight game

- **Throttle and turn discipline matter**: climbing bleeds speed, diving gains it; stall below 62 kt (55 kt with flaps) and the nose drops, overspeed above 235 kt strains the airframe.
- **Fuel and damage turn a sortie into decisions**: fuel drains with throttle and a ring gives a little back; landing refuels. Three hits — terrain scrape, hard landing or overspeed — and the sortie ends in a crash.
- **Feel**: the camera follows smoothly, the gear comes down low and slow, landings and crashes read clearly on screen, and the engine hum follows the throttle (synthesized with WebAudio, only after you press a key or click).
- **HUD**: altitude, speed, heading, throttle, fuel, score, rings and damage, plus a mission line and flashing stall / overspeed / low-fuel warnings.

## Files

- `game/` — the playable game (`index.html` + ES modules in `src/`, no library, no network)
- `screenshots/` — 4 real renders of the game's own code (cover, final approach, threading a ring, landed)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes `dossier.json`

## Play it

```sh
node serve.js   # then open http://localhost:8080
```

Built with [make.fun](https://make.fun/r/dehpqxrn) — referral code `dehpqxrn`.
