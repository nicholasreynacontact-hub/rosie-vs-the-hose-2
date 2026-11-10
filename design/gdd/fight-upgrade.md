# Fight Upgrade — Hot Hose, Lasso Grab, and the Endless Curve

Implementation spec. Source of reasoning: `design/loop-audit.md`. Target: `src/index.html`.
Every named function below already exists; this document says what changes inside it.

## 1. Overview

Seven changes to the hose fight. Two new hose abilities — a **hot band** (a stretch of
rope heats, hurts on contact, announced first) and a **lasso grab** (a telegraphed loop
pins Rosie until the player mashes free) — plus five loop fixes from the audit: the
three-bite window stops self-extending and re-weights toward the third bite; dash costs
stamina charges that Perfect Dodge refunds; BOOGA TIME becomes player-triggered on a
dedicated input; hose-HP growth caps at level 5 and difficulty moves into behaviour so
the endless run gets *harder* rather than *longer*; and best score persists to
`localStorage`. Fairness rules are absolute: every new threat is announced before it can
hurt, always escapable, and cannot kill a player who reacts correctly.

## 2. Player Fantasy

The yard stops being a flat corridor to the next glowing spot. The hose now *denies
space* (the hot band) and *denies agency* (the lasso), so standing somewhere becomes a
choice and being grabbed becomes a story — Rosie thrashing, the player hammering the
button, the rope snapping off her. BOOGA TIME changes from something that happens to the
player into something they save up and unleash, and the third bite becomes the moment
where greed and an incoming jet are weighed against each other.

## 3. Detailed Rules

### 3.1 Hot hose — a band, not the whole hose

A **stretch of segments** heats, not the whole rope. Reasons: the whole hose heating is a
blanket hazard with no positional decision in it, it would often enclose the weak spot,
and the hose is drawn as one `TubeGeometry` with one material (`hoseM`, line 862) so a
whole-hose tint is already spoken for by winded-yellow and BOOGA-purple. A band gives the
player somewhere to *be*.

State on a new global `Hot = {ph:'off', t:0, c:45, cd:HOT_FIRST}` — `ph` ∈
`off|warn|hot|cool`, `c` = centre segment index.

- **Selection** (`updHot`, new, called from the tick beside `updSprinkler`): pick `c`
  uniformly from `[10, N-10]` subject to `|c - weak| >= HOT_W + 6`. Reject-and-retry 12
  times; if no candidate, skip this activation and reset `cd`.
- **Warning — `warn`, `HOT_WARN` = 1.2 s.** Harmless. The band's segments get an
  **amber** dotted outline overlay and amber embers, plus the existing `sfx.warn()` and a
  rising hiss. Amber is already the game's "something is coming" colour (the `!`
  telegraph, the sprinkler warm-up ring) so this needs no new vocabulary.
- **Hot — `HOT_LEN` seconds** (level-scaled, §4). Dangerous. Ember-orange to white-hot,
  `#ff7a1a → #fff1c0`, animated at 6 Hz with a heat shimmer and continuous ember
  particles. **Not red.** Red is spoken for twice over — attack ground rings, and the
  winded weak spot (`#ff5d5d`, line 872), which is the one thing the player *must* touch.
  A red "do not touch" band next to a red "touch me now" spot is a direct contradiction;
  white-hot reads as hotter than red anyway and collides with nothing. The pop text still
  says `RED HOT!` so the player's mental model matches the request. See §9.1.
- **Cooling — `HOT_COOL` = 0.6 s.** Harmless, fading to green.
- **Contact.** Each frame in `hot`, for `i` in `[c-HOT_W, c+HOT_W]` with
  `rope[i].z <= 46`: if `dist(Rosie, rope[i]) < 52*R.sc`, call new `burn(10, kx, ky)`
  where `(kx,ky)` points from the nearest hot segment to Rosie. **Single hit with
  invulnerability frames**, not damage over time: `burn` reuses `hurt`'s `R.iframe = 1`,
  so the practical worst case for a player standing in the band is 10 damage per second
  — identical in effect to a DOT, but it reuses one code path, one yelp, one knockback,
  and the existing combo rule.
- **`burn` differs from `hurt` in exactly one way: it does not grant a Perfect Dodge.**
  A static hazard that refunds a stamina charge for brushing it is a stamina farm.
  `R.iframe` still blocks it. Dash does not make Rosie fireproof.
- **Weak-spot guarantee (no softlock).** Two independent guards: selection keeps the band
  ≥13 segments from `weak`, and the contact loop **skips any `i` with `|i - weak| <= 3`**
  (one wider than `findBite`'s `weak±2`). If `moveWeak` relocates the spot into a live
  band, `updHot` forces `Hot.ph = 'cool'` on the same frame. The weak spot is never
  unreachable.
- **Biting a hot non-weak segment** (`tryBite`, `findBite` returns 2): `burn(8,…)` in
  addition to the existing `TOO TOUGH!` pop and 0.28 s `R.recover`. Teeth on a hot hose
  should sting.

### 3.2 Lasso grab

State: `Lass = {ph:'off', t:0, x:0, y:0, taps:0, cd:LASSO_FIRST, mercy:0, sinceWin:1}`.

- **Telegraph — `LASSO_TELE` = 0.9 × `speedK()`.** The nozzle head (`nozHead`) rears and
  opens its jaw, a coiled loop forms at the head, and a **red ground ring** of radius
  `LASSO_R` expands at `(R.x + R.vx*0.35, R.y + R.vy*0.35)`. Red is correct here — this
  *is* an attack, and it uses the existing attack-telegraph language unchanged.
  `sfx.warn()` plus a rope whoosh.
- **Catch — deterministic, not chance.** At `t >= LASSO_TELE`, if
  `dist(Rosie, ring) < LASSO_R` it catches. No random roll: a hit the player cannot
  predict is not a hit they can learn. **Dashable** — if `R.dashT > 0` at resolution it
  routes through `hurt(0,…)` for a normal Perfect Dodge (score, power, stamina refund);
  if `R.dash > 0` she slips out mid-dash. Both are the same timing the player already
  trained on every other attack.
- **Gating.** Never fires while `J.winded > 0` (it must not steal the earned bite
  window), never while `booga`, never while another `attacks` entry from the same source
  is live, and never while `Lass.mercy > 0`.
- **Held — `ph = 'held'`.** `R.held = true`. In `updRosie`, when `R.held`: input is
  ignored, `R.vx = R.vy = 0`, dash and bite-as-attack are suppressed (`tryDash` and
  `tryBite` return false immediately). Camera pushes in 12 % and biases toward the
  midpoint of Rosie and the rope head. Rope segments near the head are pulled toward
  Rosie each frame so the line visibly tightens. `R.thrash` is driven continuously.
  **The hose does not attack while it holds her**: `updAttacks` skips its spawn block and
  clamps `attackCd = max(attackCd, 0.8)`. Only the lasso deals damage during a grab.
- **Damage while held.** `LASSO_TICK` = 4 damage every `LASSO_TICK_T` = 0.9 s, first tick
  at 0.9 s, not at 0. A player who starts mashing immediately takes **zero**.
- **Escape — `LASSO_TAPS` = 6 taps on the existing Bite input** (Bite button, `Space`,
  `J`). No decay. Reusing Bite is right: it is already the hands-on-the-hose verb, it is
  the button the thumb is nearest, and introducing a fourth touch target during the one
  moment the player is panicking is a bad trade. The prompt reads **`MASH BITE!`** (or
  the bound key on desktop) above a ring of 6 pips that fill per tap — the same pip
  language as the existing three-bite readout.
- **Dash does not break the grab.** If one input frees her the mechanic has no texture,
  and `dashBuf` is already buffered, so held players would escape by accident.
- **Hard timeout — `LASSO_MAX` = 4.0 s.** She is thrown free regardless of taps, taking
  one `LASSO_TOSS` = 6 damage toss. This is the accessibility floor: a player who cannot
  mash at all still gets out, for ≤ 22 damage total (4 ticks + toss).
- **Mercy rule.** On any escape: `R.iframe = max(R.iframe, 0.8)`,
  `Lass.mercy = LASSO_MERCY` = 8 s, `Lass.cd = LASSO_CD(level)`, `Lass.sinceWin = 0`, and
  the rope head retreats for 1.0 s. A second lasso cannot fire until `sinceWin >= 1`,
  i.e. the player has reached one weak-spot window in between. **Chain-grabbing is
  structurally impossible.**
- **Audio/visual.** Rising pitch per tap, `sfx.yelp()` per damage tick, `sfx.rip()` plus
  a sparkle burst and `pop('FREE!')` on break, screen-shake 0.25 on catch and on break.

### 3.3 The three-bite window (`doBite`, `tryBite`, `hoseDodge`)

- `doBite`: replace `J.winded = Math.max(J.winded, .6)` with a shrinking grant —
  `0.42` after bite 1, `0.30` after bite 2. The window no longer extends itself.
- `doBite`: damage becomes `unit * (step===1 ? 1 : step===2 ? 1.4 : 2.4)` (was `1/1/2`).
  A full combo is worth 4.8 units, bailing after two is worth 2.4 — exactly half. Greed
  pays double and is now a timed risk.
- `tryBite`: on `TOO TOUGH` or whiff while `J.winded > 0`, `J.winded = max(0, J.winded - .25)`.
  Mashing on approach costs window.

### 3.4 Dash stamina (`tryDash`, `updRosie`, `hurt`, `hud`)

- Add `R.stam = 3`, `R.stamT = 0`. `tryDash` requires `R.dashCd <= 0` **and**
  `R.stam >= cost`, where `cost = R.recover > 0 ? 2 : 1` (cancelling the `TOO TOUGH`
  stall is deliberate, not free). On success, `R.stam -= cost`.
- `updRosie`: `R.stamT += dt`; while `R.stam < DASH_MAX` and `R.stamT >= DASH_REGEN`,
  `R.stam++`, `R.stamT -= DASH_REGEN`.
- `hurt`: inside the Perfect Dodge branch, `R.stam = min(DASH_MAX, R.stam + 1)` — the
  dash that lands perfectly is free. Precision now pays in resource.
- `DASH_CD` stays `.7` as the between-dash floor. `resetLevel` sets `stam:3, stamT:0`.
- `hud`: 3 pips beside the power meter, filled/empty, dim when `R.stam === 0`.

### 3.5 Player-triggered BOOGA (`doBite`, `hurt`, `startBooga`, `hud`, key handler)

- Delete both `if(power>=POWER_MAX)startBooga();` calls (lines 338 and 346). Power banks
  at `POWER_MAX` and stays there.
- **Desktop key `B`**; **touch: a third button `boogaBtn`** in `#controls`, placed above
  Bite, `disabled`-styled until ready. Both set `boogaBuf = .2`, consumed in the tick:
  `if(boogaBuf>0 && !booga && power>=POWER_MAX && state==='play') startBooga();`.
- HUD when ready: label `BOOGA READY` pulsing, bar at 100 % with an animated sheen, the
  touch button bright and bouncing. During BOOGA the bar drains as the timer (already
  built, line 927). `lastHud`'s key string must gain `R.stam` and the ready flag or the
  HUD will not repaint.
- Power above 10 is **discarded** while banked. A second stored charge would let a player
  hold two BOOGAs into one phase and skip it; not recommended.

### 3.6 Endless curve (`doBite`, `hoseDodge`, `updAttacks`, `updHot`, lasso)

Hose HP stops scaling at level 5. All other scalers have an explicit floor or cap and
**every one of them reaches it by level 12**; from level 12 the game is a fixed hardest
state and the only remaining variable is the player. See §4.3 for the table.

### 3.7 Best score (`won`, `lose`, title card)

`rosie2-best` in `localStorage` beside the existing `rosie2-stars-N` keys, via the
existing `store` helper (line 194). Written in **both** `won()` and `lose()` — a best run
that ends in death should still count, or the number lies. Shown as `Best` next to
`Score` on the win card, the lose card and the title card.

## 4. Formulas

### 4.1 Bite damage

`dmg(step, level) = unit(level) × w(step)`, `unit(level) = 100 / (16 + 4 × min(level, 5))`

| Symbol | Type | Range | Description |
|---|---|---|---|
| `step` | int | 1–3 | Bite index within one winded window |
| `level` | int | 1–∞ | Current hose number |
| `w(step)` | float | {1, 1.4, 2.4} | Per-bite weight |
| `unit` | float | 1.389–2.5 | Hose HP removed by a weight-1 bite |
| `dmg` | float | 1.389–6.0 | Hose HP removed, unbounded above only by `w` |

Output is bounded: `unit` is maximal at level 1 (2.5) and floors at level 5+ (1.389);
`dmg` therefore spans 1.389 (step 1, L5+) to 6.0 (step 3, L1). `hoseHP` is already
clamped by `Math.max(0, …)`. **Worked example** — level 7, full combo:
`unit = 100/36 = 1.389`; bites deal 1.389, 1.944, 3.333 = 6.67 HP; a 100-HP hose needs
**15 full combos**… which is why §4.3 caps leap growth rather than adding HP. At level 5,
`100 / (1.389×4.8) = 15.0` combos — see §9.2, this is the one number I want changed.

### 4.2 Dash stamina

`stam(t) = clamp(stam₀ − Σcost + Σrefund + floor(t_idle / DASH_REGEN), 0, DASH_MAX)`

| Symbol | Type | Range | Description |
|---|---|---|---|
| `DASH_MAX` | int | 3 | Charge cap |
| `DASH_REGEN` | float | 1.6 s | Seconds per regenerated charge |
| `cost` | int | 1 or 2 | 2 when `R.recover > 0` (stall cancel), else 1 |
| `refund` | int | 0 or 1 | 1 per Perfect Dodge |
| `stam` | int | 0–3 | Charges available |

Clamped at both ends by construction. **Worked example** — three panic dashes in 1 s
leaves `stam = 0` and a 4.8 s wait to full; three dashes that each Perfect Dodge leave
`stam = 3` and the player never notices the system exists. That asymmetry is the point.

### 4.3 Per-level difficulty

```
leaps(L)      = min(9, 1 + min(L,3) + (phase-1) + floor(max(0, L-5) / 2))
atkMult(L)    = max(.70, 1 - .04 * max(0, L-5))        // multiplies attackCd
unit(L)       = 100 / (16 + 4 * min(L,5))
dmgScale(L)   = min(1, .55 + .15*L)                     // unchanged
HOT_CD(L)     = max(6.5, 13 - .6*L)   ± rand(0,1.5)     // L>=2 only
HOT_LEN(L)    = min(4.5, 2.6 + .16*L)
HOT_W(L)      = min(9, 6 + floor(L/4))                  // segments either side
LASSO_CD(L)   = max(9, 19 - .9*L)     ± rand(0,2)       // L>=3 only
speedK        = max(.45, ([1.3,1.08,.9][phase-1] - .09*(L-1)) * (booga?.75:1))   // unchanged
```

| L | leaps (P1) | atkMult | unit | hot every / for | lasso every | dmgScale |
|---|---|---|---|---|---|---|
| 1 | 2 | 1.00 | 2.50 | — | — | 0.70 |
| 2 | 3 | 1.00 | 2.08 | 11.8 / 2.92 | — | 0.85 |
| 3 | 4 | 1.00 | 1.79 | 11.2 / 3.08 | 16.3 | 1.00 |
| 4 | 4 | 1.00 | 1.56 | 10.6 / 3.24 | 15.4 | 1.00 |
| 5 | 4 | 1.00 | 1.39 | 10.0 / 3.40 | 14.5 | 1.00 |
| 6 | 4 | 0.96 | 1.39 | 9.4 / 3.56 | 13.6 | 1.00 |
| 7 | 5 | 0.92 | 1.39 | 8.8 / 3.72 | 12.7 | 1.00 |
| 8 | 5 | 0.88 | 1.39 | 8.2 / 3.88 | 11.8 | 1.00 |
| 9 | 6 | 0.84 | 1.39 | 7.6 / 4.04 | 10.9 | 1.00 |
| 10 | 6 | 0.80 | 1.39 | 7.0 / 4.20 | 10.0 | 1.00 |
| 11 | 7 | 0.76 | 1.39 | 6.5 / 4.36 | 9.1 | 1.00 |
| 12 | 7 | 0.72 | 1.39 | 6.5 / 4.50 | 9.0 | 1.00 |

**What stops it becoming impossible.** Every row above hits its floor by L12 and never
moves again. Unchanged counterweights: HP regen floors at `max(1, 4-L) × 1.2` = 1.2 HP/s,
treats stay +20 every 8–12 s and never scale, `R.iframe = 1 s` never shrinks, and the hot
and lasso mercy rules in §3.1–3.2 are level-independent. A level-40 hose is exactly a
level-12 hose.

### 4.4 Best score

`best = max(parseInt(store.get('rosie2-best') || '0', 10), score)`, written on `won()`
and `lose()`. Unbounded above; `score` is already a non-negative integer.

## 5. Edge Cases

1. **Hot band selected over the weak spot** — rejected at selection (≥13 segments away);
   if `moveWeak` moves the spot in afterwards, the band force-cools that frame.
2. **Hot band under the player at the instant it ignites** — the 1.2 s amber warn phase
   is harmless and runs first, every time. No ignition without a warning.
3. **Hot contact during iframes** — blocked; `burn` respects `R.iframe`.
4. **Hot band + BOOGA** — `booga` halves damage in `hurt`; `burn` must apply the same
   `(booga?.5:1)`. BOOGA's 1.5× body scale widens the contact radius via `52*R.sc`, which
   is correct: a bigger dog brushes more hose.
5. **Phase flip / `burst()` / `won()` / `lose()` while hot** — `Hot.ph = 'off'`,
   particles cleared, in `resetLevel` and `burst`.
6. **Lasso resolves on the same frame as a `bomb` landing** — the grab suppresses all
   other sources but an already-airborne attack still lands; iframes make the overlap at
   most one hit. Acceptable.
7. **Lasso resolves as the window opens** — gated off while `J.winded > 0`; a lasso
   already in telegraph when the hose goes winded is **cancelled**, ring removed.
8. **Lasso while `R.hp` is low** — worst-case grab damage is 22 and the first 0.9 s is
   free. A grab cannot kill a player above 22 HP who mashes, and cannot kill a player
   above 6 HP who mashes immediately. If `R.hp <= LASSO_TICK + LASSO_TOSS` when a lasso
   would resolve, **skip it** and set `cd`. The lasso never lands the killing blow.
9. **Tab blur while held** — the existing `blur` handler clears `keys`; the `LASSO_MAX`
   timeout still runs on the next tick, so she frees herself. Not a trap.
10. **`boogaBtn` pressed at `power < POWER_MAX`** — no-op, no sound, no penalty.
11. **BOOGA triggered mid-grab** — `startBooga` already scatters attacks and flees the
    human; add an explicit lasso release with no toss damage. BOOGA should break a grab.
12. **Stamina at 0 with an attack incoming** — intended. This is the cost. The 3-pip
    readout must be visible enough that the player saw it coming.
13. **`localStorage` unavailable** — `store` already swallows the throw; best shows 0.
14. **Level 1** — no hot band, no lasso, 0.70× damage. The audit's "L1 has no stakes"
    note is real, but L1 is the tutorial for three new systems; leave it safe.

## 6. Dependencies

`hoseDodge` / `J` (window state) · `doBite` / `tryBite` / `findBite` (bite path) ·
`tryDash` / `updRosie` / `R` (movement, stamina) · `hurt` + new `burn` (damage, iframes,
Perfect Dodge) · `updAttacks` / `startAttack` / `originOf` (attack scheduling, suppressed
during grabs) · `startBooga` / `endBooga` / `POWER_MAX` / `BOOGA_LEN` · `updRope` /
`render3D` hose block (band overlay mesh) · `drawOverlay` (warn outline, `MASH BITE!`
prompt, pips) · `hud` + `lastHud` key · `moveWeak` (band exclusion) · `resetLevel` /
`burst` / `won` / `lose` (state teardown) · `store` · `#controls` markup (third button) ·
keydown handler (`B`). Art direction owes a hot-band material and an ember particle;
audio owes a hiss loop, a rope whoosh, a per-tap rising tick and a burn sizzle.

**Implementation note the programmer will hit immediately:** the hose is a single
`TubeGeometry` with a single material, rebuilt every frame (line 861), so it cannot be
tinted per-segment. Draw the band as a **separate short `TubeGeometry`** over
`rope[c-HOT_W … c+HOT_W]`, additively blended, rebuilt only on phase change — not as a
vertex-colour pass on `hose3`.

## 7. Tuning Knobs

| Constant | Suggested | Safe range | Effect |
|---|---|---|---|
| `HOT_FIRST` | 14 s | 8–25 | Delay before the first band of a level |
| `HOT_W` | 6 (+1 per 4 levels, cap 9) | 4–12 | Band half-width in segments |
| `HOT_WARN` | 1.2 s | 0.9–2.0 | Below 0.9 it stops being fair |
| `HOT_LEN` | 2.6 + .16·L, cap 4.5 | 2.0–6.0 | Dangerous duration |
| `HOT_COOL` | 0.6 s | 0.3–1.0 | Harmless fade |
| `HOT_DMG` | 10 | 6–16 | Contact hit (per iframe second) |
| `HOT_BITE_DMG` | 8 | 0–12 | Biting a hot segment |
| `HOT_RAD` | 52 × `R.sc` | 40–70 | Contact radius |
| `LASSO_FIRST` | 22 s | 12–40 | Delay before the first grab of a level |
| `LASSO_TELE` | 0.9 × `speedK()` | 0.7–1.3 | Below 0.7 it is unreactable |
| `LASSO_R` | 95 × `R.sc` | 70–130 | Catch radius |
| `LASSO_TAPS` | 6 | 4–10 | Above 10 it is a chore, not a struggle |
| `LASSO_TICK` / `_T` | 4 / 0.9 s | 2–7 / 0.6–1.2 | Grab damage pressure |
| `LASSO_MAX` | 4.0 s | 3.0–6.0 | Auto-release — the accessibility floor |
| `LASSO_TOSS` | 6 | 0–10 | Auto-release damage |
| `LASSO_MERCY` | 8 s | 5–15 | Post-escape immunity to re-grab |
| `BITE_W` | `[1, 1.4, 2.4]` | sum 4–6 | Greed payoff |
| `WIND_GRANT` | `[.42, .30]` | .20–.55 | Window extension per bite |
| `WHIFF_COST` | 0.25 s | 0.1–0.4 | Price of mashing on approach |
| `DASH_MAX` | 3 | 2–5 | Stamina pool |
| `DASH_REGEN` | 1.6 s | 1.0–2.5 | Charge regeneration |
| `DASH_CANCEL_COST` | 2 | 1–3 | Cost to cancel `R.recover` |
| `HP_CAP_LEVEL` | 5 | 3–8 | Where `unit` stops growing |

## 8. Acceptance Criteria

1. Starting level 2 and waiting: a band of hose glows **amber** for ≈1.2 s before any
   damage is possible. Standing in the amber band deals 0 damage.
2. Standing in the band once it is white-hot deals 10 damage, once, then nothing for 1 s.
3. Dashing through a hot band deals damage and shows **no** `PERFECT DODGE!` and no
   stamina refund.
4. Across 10 consecutive hot activations, the weak spot is never inside the band and is
   always bitable. Forcing `moveWeak` into a live band cools it on that frame.
5. Level 3+: a red ground ring and a reared nozzle precede every grab. Dashing on the
   ring at resolution yields `PERFECT DODGE!` and no grab.
6. While held: input moves nothing, no attack other than the lasso lands, the prompt
   reads `MASH BITE!`, and 6 Bite presses free Rosie.
7. Being held without touching anything releases Rosie within 4.0 s, total damage ≤ 22.
8. Mashing from the instant of capture takes **0** damage.
9. After an escape, no second grab until a weak-spot window has been reached and ≥8 s
   have passed. Attempt 20 grabs in a row; zero chains.
10. A player at ≤10 HP is never grabbed.
11. One bite on a winded spot grants ≤0.42 s, a second ≤0.30 s; the pip prompt expires
    mid-combo if the player hesitates. Hose damage 1 : 1.4 : 2.4 across the three bites.
12. Whiffing during a window visibly shortens it by 0.25 s.
13. Three dashes in quick succession empty the pips; the fourth does nothing; a Perfect
    Dodge refills one pip immediately.
14. Reaching 10 power does **not** start BOOGA. `BOOGA READY` shows, `B` and the third
    touch button each start it, and the button is inert below 10 power.
15. `unit` is identical at levels 5 and 20; leap count, attack cadence, hot frequency and
    lasso frequency all match §4.3 at levels 1, 6 and 12, and are identical at 12 and 20.
16. Finishing a level writes `rosie2-best`; dying also writes it; the number shows on the
    title, win and lose cards and never decreases.

## 9. Flagged concerns

1. **"Red" hot hose, deliberately overruled.** Red already means *incoming attack* (ground
   rings, the `!`) and *bite this now* (the winded spot, `#ff5d5d`). A third red meaning
   "touching this hurts" would make the winded spot ambiguous at exactly the moment the
   player must commit to touching it. I spec ember-orange→white-hot and keep the word
   "RED HOT" in the pop text. If you want literal red, the winded weak spot has to change
   colour first — say so and I will respec it as a pair.
2. **Bite count per level is too high and the audit's "~9 combos" is wrong.** With the new
   weights, a level-5+ hose takes `100/(1.389×4.8) = 15` full combos. That is 15 traversals
   per level — the exact dead-time problem the audit flags in item 7. I recommend
   `HP_CAP_LEVEL = 5` **and** raising the divisor base from 16 to 28
   (`unit = 100/(28 + 4·min(L,5))`), giving `unit = 2.08` and **10 combos** at L5+. I have
   not put that in §4 because it changes a number the audit stated; it needs your call.
3. **Two new threats at once.** Hot hose and lasso both land in the level-2–3 window,
   along with the stamina pool and the BOOGA button. That is four new things a returning
   player meets in two levels. Consider staging: stamina + BOOGA button from level 1, hot
   band from 2, lasso from 4 (not 3).
4. **`burn` ignoring Perfect Dodge is a rule exception** and the only place in the game
   where dashing does not save you. It is correct (static hazard, anti-farm) but it will
   read as a bug to a player in the first 30 seconds unless the band's "wall, not attack"
   look is unmistakable. Worth a specific playtest question.
