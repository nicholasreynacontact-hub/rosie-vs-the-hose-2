# Special Moves, Motion Inputs, and Squirrels

Implementation spec. Builds on `design/gdd/fight-upgrade.md` (**FU**) and
`design/gdd/difficulty-and-combos.md` (**DC**). Target: `src/index.html`. Every named function
already exists unless marked **new**.

## 1. Overview

Three things. **(1) A motion reader** (`Mot`, **new**) that turns *flicks* of the existing
`inX`/`inY` stick into discrete direction tokens, buffers them, and matches the tail of the
buffer against patterns that finish on one of the four existing buttons. **(2) Five specials** —
SPIN CYCLE, FLIPPITY-FLOP, DIGGY-DOWN, SQUIRREL CANNON and the chain-gated finisher MEGA BONK —
each 2–3 flicks plus a button, each with a deliberately cartoon animation built from the
existing `dogP`/`dBody`/`dHead`/`dEars`/`dTail`/`dLegs` groups. **(3) Squirrels**: two at a
time, **prey, not a threat** — zero damage, faster than a running dog, they scatter up a post
and chatter, they steal treats, and a caught one is ammunition. The timing fight is untouched:
no special damages a hose that is not winded, and no squirrel spawns during a window.

## 2. Player Fantasy

The dog has *moves* — not contextual tricks the game does for you, things you learn, then pull
off on purpose, then show somebody. Flick-flick-tap and Rosie rears up on two legs like a
cartoon bear and hammers the hose flat; another and she corkscrews into the ground and erupts
underneath it. The chain counter, which until now only multiplied a number, becomes a bar you
fill to earn the right to do the stupidest, best thing in the game. And the yard finally
contains something that is not trying to kill her: a squirrel that is faster than she is, that
knows about the post, and that can be thrown.

## 3. Detailed Rules

### 3.1 The motion reader (`Mot`, new)

State `Mot = {buf:[], dir:-1, dirT:0, hint:'', hintT:0}`; `buf` is a ring of ≤10 `{tok,t}`.
Tokens are numpad digits `8 9 6 3 2 1 4 7` (↑ ↗ → ↘ ↓ ↙ ← ↖), **camera-relative** — `8` is away
from the camera, `2` toward it, regardless of `R.ang` — plus `'B'` (Bite), `'D'` (Dash), `'K'`
(Bark). `'V'` is reserved; no pattern uses BOOGA.

**Reading directions — new `motDir(dt)`, called in the tick beside `readInput`.** `m =
hypot(inX,inY)`; octant `= round(atan2(inY,inX)/(π/4))`. Hysteresis: active at `m >= MOT_IN =
0.55`, neutral at `m <= MOT_OUT = 0.30`, so rim jitter cannot emit tokens.

- **Desktop / keys / physical stick — tap discipline.** A token is pushed **on release** and
  **only if the direction was held `<= MOT_HOLD = 0.22 s`**. This single rule is the accident
  guard: moving anywhere holds a direction for 0.3–3 s and emits nothing; dodging emits nothing.
  You must *flick*.
- **Touch — swipes, decided.** Three tap-releases in a second is not a thing a thumb does. On
  the pad (`moveJoy`, already sampling every `pointermove`), a token is pushed when the stick
  crosses into an octant **`>= 90°` from the last pushed token** while `m >= MOT_IN`, after
  dwelling `MOT_DWELL = 0.09 s`. One continuous swoop — right, down, left — equals three desktop
  flicks; sweeping through 45° neighbours emits nothing.
- **Repeats** need a neutral crossing (`m <= MOT_OUT`) between them. No pattern below uses one.
- **Buttons** reuse the existing buffers: `biteBuf`/`dashBuf` (keydown handler, `biteBtn`/
  `dashBtn` `pointerdown`) and `barkNow`. Each press pushes its token and runs `motMatch()`
  **before** the ordinary action resolves.

**Matching — new `motMatch()`,** longest pattern first, walking backwards from the button token.
A match needs: every direction slot satisfied; each consecutive matched gap `<= MOT_GAP = 0.40 s`;
first-to-last span `<= MOT_WIN(n)` (§4.1); and the move's own gate (stamina, cooldown, chain,
carry) passing. Ties break by declaration order in a new frozen `MOVES` table.

**Forgiveness — four allowances, all numeric.** (1) *Octant leniency*: a diagonal satisfies
either neighbouring cardinal (`3` fits a `6` or a `2` slot), one substitution per pattern.
(2) *Slop*: `MOT_SLOP = 1` unmatched direction record may be skipped between matched slots.
(3) *Early button*: a button token is accepted up to `MOT_BTN = 0.18 s` **before** the last
direction (mash-ahead; `biteBuf` already behaves this way). (4) *No clearing*: `buf` is never
cleared on a failed match, so `← → ← ↓` can still complete `← ↓ + Dash` from the tail.

**Failure is silent and free.** A partial or wrong sequence does nothing — no animation, no
stamina, no cooldown, no lockout, no pop, no sound — and **the button's ordinary action always
still runs**, so a Bite at the end of a fumbled motion is a Bite. Records expire by age.

**Positive-only feedback — new `motHint()`.** When the tail matches all but the last token of an
*available* pattern, `dTag` pulses its emissive, a soft rising tick plays and `drawOverlay`
draws a chip showing the remaining glyph for 0.4 s. It costs nothing, so triggering it by
accident is the feature — it is how players discover moves exist (§3.4).

### 3.2 The five specials

Shared: each requires `state==='play' && !R.held && R.shk<=0 && R.recover<=0`, sets **new**
`R.sp={id,t,phase}` (one at a time, never interruptible, never queued), and roots movement the
way `R.held` does in `updRosie`. **Vulnerable unless a phase says otherwise** — `R.iframe` is
never granted. Animation times are seconds from the move's start, played by a **new**
`poseSpecial(sp)` called from the Rosie pose block in `render3D` (~lines 1606–1612), overriding
the gait pose.

**SPIN CYCLE — `→ ↓ ← + Bark`.** *Omnidirectional Bark.* Ring `SPIN_R = 230 × R.sc`: deletes up
to **3** telegraphing attacks from any origin (Bark does 2 in a 140° cone), staggers every extra
snake and the free head 1.6 s, shocks the person 3 s with `crankT += 6`, deals `SPIN_DMG = 6` to
each extra snake, whips the rope (the `R.thrash` segment loop at 1.4× around `MID`), and **0 to
the main hose, winded or not**. `chain(1,'spin')` if anything landed. Cost 2 stamina, CD
`SPIN_CD = 6 s`, commitment 0.55 s fully vulnerable. **Beats** being surrounded and a wind-up
she cannot turn to face. **Beaten by** anything past its telegraph, the hot band (she spins in
place inside it) and the stamina bill — 2 charges is DC's whole Medium pool.
*Animation*: 0.00–0.10 coil, `dogP.rotation.y=-0.9`, `dBody` squash 1.15/0.85, `dTail.rotation.z
=0.8`. 0.10–0.45 helicopter: `dogP.rotation.y += 4π` eased out, `dogP.rotation.x=-0.35`, all four
`dLegs[i].g.rotation.x=-1.2` (tucked), `dTail.rotation.z=-1.1` (a rotor), `dEars[i].rotation.x=
±0.9` flared, `dTongue.scale=1.5`, a flat dust torus on the ground. 0.45–0.55 wobble to a stop,
`dogP.rotation.z=±0.25` damping, ears flop.

**FLIPPITY-FLOP — `↓ ↑ + Bite`.** *The backflip body slam — the single big hit.* On a **winded**
weak spot within `SLAM_R = 110 × R.sc` of the landing point: `hoseHP -= unit × SLAM_W(3.2) ×
chainDmg()`, the window ends as a RIP (`J.winded=0, J.hits=0, J.streak=0, J.cd=.8`,
`moveWeak()`), `chain(2,'slam')`. Non-winded spot: 0 damage, `J.streak++` (she baits a leap, as
Pounce does). Extra snake `SLAM_SN = 14`; the person is knocked down 4 s with `crankT += 6`.
Cost 1 stamina, CD `SLAM_CD = 5 s`. Commitment 0.85 s: 0.25 s wind-up (rooted, vulnerable),
0.35 s airborne with **new** `R.air=1` — ground rings and the hot band skip her — and 0.25 s
landing recovery (rooted, vulnerable). **Beats** ground rings, the hot band, and a window with
one bite left in it. **Beaten by** the lasso (its ring resolves on her landing point and she
cannot dash) and by a bad read: a whiff is 0.85 s of nothing.
*Animation*: 0.00–0.25 rear back — `dogP.rotation.x: 0→-0.9`, `dLegs[0..1].g.rotation.x=-2.2`
(paws overhead), `dHead.rotation.z=-0.5`, ears up, `dBrows` furrowed, `fovKick=5`. 0.25–0.60
flip — `dogP.rotation.x: -0.9→-7.2` (1⅙ turns backwards), `dog.position.y` on a parabola to 190
and back, legs tucked `-1.6`, ears trailing `+1.2`, 6 `'sparkle'` parts as a motion arc.
0.60–0.70 slam — `dogP.rotation.x=0.35` (belly first), `dogP.scale(1.35,0.65,1.1)`, legs splayed
`rotation.z=±0.9`, `hitStop=0.14`, `shake=0.45`, 18 `'soil'` + 10 `'water'`. 0.70–0.85 scale
eases to 1, `dHead.rotation.y` shakes ±0.4 at 18 Hz.

**DIGGY-DOWN — `← → ↓ + Dash`.** *Out of sight, under the yard.* 0.30 s dig-in (rooted,
**vulnerable**), then `DIG_T = 0.70 s` at `DIG_SP = 900 px/s` steered by live `inX`/`inY` with
**new** `R.under=1`: `hurt`, `burn`, every `attacks` resolution and the hot-band contact loop
skip her, and `pushOut` is skipped so she passes under `OBST`. On emergence: `DIG_DMG = 10` to
extra snakes within `90 × R.sc`, and a free `doBite(weak)` if the **winded** weak spot is within
`90 × R.sc`. Tapping Dash again or hitting a world edge surfaces early. Cost 2 stamina, CD
`DIG_CD = 7 s`, ≤1.30 s total, vulnerable for the first and last 0.30 s. **Beats** distance (DC
calls traversal the biggest loop problem), jets, bombs, the hot band, a crowd. **Beaten by** the
**lasso** — a live ring resolves on her emergence point — and the stamina bill.
*Animation*: 0.00–0.30 `dLegs[0..1].g.rotation.x=±1.4` alternating at 14 Hz,
`dHead.rotation.z=-0.8`, `dogP.rotation.x=0.5`, `dog.position.y: 0→-70`, 20 `'soil'`. At 0.30
`dog.visible=false` and a **new** travelling mound (one flattened sphere, scale 34/8/26, the pot
soil material) follows her, puffing soil every 0.06 s. Emergence over 0.15 s: mound hidden,
`dog.position.y: -70→60` then settle, `dogP.rotation.x=-1.3` (nose to the sky), legs splayed, 16
`'soil'`, `shake=0.25`, `pop('TA-DAAA!')`.

**SQUIRREL CANNON — `→ ← + Bark`, requires `R.carry`.** *The aimed throw.* Launches the carried
squirrel on a 0.35 s arc at the nearest valid target within `SQ_THROW_R = 420 px` in her facing
half-plane; it clamps on and chews once — extra snake `SQ_DMG = 6`; **winded** weak spot
`unit × 1.0 × chainDmg()` plus `J.winded += 0.25` and **no bite step consumed**; person
`Hm.shock=3`, `crankT += 6`; nothing in range, it lands, chatters and flees. `chain(1,'nut')`.
**0 damage to a non-winded hose.** Cost: the squirrel. No cooldown — carrying one is the gate.
0.40 s, vulnerable. A plain **Bite while carrying** throws it at `<=160 px` for `SQ_DMG/2` with
no window extension, so a full mouth never blocks the core verb and the motion is strictly better.
*Animation*: 0.00–0.18 coil — `dogP.rotation.y=-0.8`, `dHead.rotation.z=-0.55`, squirrel group
parented at the muzzle. 0.18–0.25 release — `dogP.rotation.y=+1.4` in 0.07 s,
`dHead.rotation.z=+0.5`, `dTail.rotation.y=1.2` whip, squirrel detaches to a world arc, 6
`'star'`. 0.25–0.40 follow-through, front paw out `-1.0`, tongue lolling.

**MEGA BONK — `↓ → ↑ + Bite`, at `combo >= FIN_CHAIN = 8` on a winded spot. The finisher.**
`hoseHP -= unit × FIN_W(5.6) × chainDmg()` (§4.3) — slightly more than a perfect window,
delivered uninterruptibly. Ends the window as a RIP, `moveWeak()`, `score += 150 × level ×
(1+min(combo-1,12)×0.2)`, `power += 2`, and **spends the chain**: `chainSet(0)`.
`R.iframe = max(R.iframe, 1.0)` covers the airborne second. Cost 1 stamina plus the chain; the
chain *is* the cooldown. 1.40 s: 0.25 s wind-up (vulnerable), 1.00 s invulnerable, 0.15 s
recovery. **Beats** everything, for one second. **Beaten by** its gate — a dropped chain (damage
halves it) takes it away, and it is unavailable the instant the window closes.
*Animation*: 0.00–0.25 she **stands up on her hind legs** — `dogP.rotation.x=-1.25`,
`dog.position.y=+30`, `dLegs[0..1].g.rotation.x=-2.6` (both paws clasped overhead),
`dHead.rotation.z=-0.6`, ears up, `dBrows` furrowed, `dTail.rotation.z=0.9` braced like a
kangaroo, `fovKick=9`, `hitStop=0.12`. 0.25–0.40 **hammer** — `dogP.rotation.x: -1.25→0.5` in
0.15 s, front legs snap to `+1.2`, `dogP.scale(1.3,0.7,1.15)`, `shake=0.5`, 24 `'bit'` + 16
`'water'`, `sfx.rip()`. 0.40–1.25 **helicopter** — teeth in, `dogP.rotation.y += 10π` eased out
over 0.85 s, `dog.position.y` rises to 120, the 15 rope segments around `weak` dragged by the
`R.thrash` loop at 2× force, `dTail.rotation.z=-1.2`, ears pinned, `dTongue.scale=1.6`, a spiral
of `'star'`. 1.25–1.40 release — rope flies (`q.vz=720`), she lands splay-legged,
`geysers.push({i:weak,t:1.4})`, confetti, `pop('MEGA BONK!!',54)`.

### 3.3 Squirrels

**They are prey with a cost if ignored.** Not a hazard: **zero** damage, **no** new damage
source — the hose owns damage. Not easy prey either: they outrun a running dog (§4.4), so
catching one is a *use* for a dash, a Pounce, a Diggy-Down or a Spin Cycle. New `squirrels[]`,
driven by new `updSquirrels(dt)`; **`SQ_MAX = 2` alive at once, ever.**

- **When.** First at `SQ_FIRST = 12 s`, then every `SQ_CD` (§4.4). A spawn is **refused** (timer
  reset, nothing spawns) while `J.winded > 0`, `R.held`, `Hot.ph==='hot'`, `booga` or `R.sp`,
  and the point must be `>= 400 px` from `rope[weak]` and within 200 px of a world edge or an
  `OBST`. They never dilute the earned window.
- **States.** `idle` — nibbles `rand(0.9,1.6) s`, tail flicking, chatters `chk-chk-chk!` every
  ~2 s. `flee` — Rosie within `SQ_ALERT = 260 px`, runs directly away at `SQ_SP`, steering round
  `OBST` via `pushOut`. `post` — **the trick**: on reaching an `OBST` it scampers *up*, sits
  **untouchable** for `SQ_POST`, tail twitching, chattering down at her — and a **Bark** (or a
  Spin Cycle) in cone knocks it off and stuns it 1.2 s, which is where it gets caught. That is
  one squirrel behaviour whose solution is an existing move. `caught` — parented to her muzzle.
- **Catching.** Mouth overlap (`mouthHit`) while it is stunned or cornered within 40 px of a
  world edge; a dash or Pounce contact; a Diggy-Down emergence within 90 px; a Spin Cycle hit.
  On catch: `score += 60 × level`, `chain(2,'squirrel')`, `power += 1`, `R.carry = sq`,
  `pop('GOTCHA!')`.
- **Carrying** lasts `SQ_HOLD = 8 s`, then it wriggles free and flees. Top speed `× 1.12` (she
  is *proud*) and the Cannon is available. **Any damage drops it** — it flees, she loses the
  ammunition and nothing else.
- **The stake.** A squirrel passing within 40 px of a `treats[]` entry **takes the treat** and
  carries it until caught or until the treat's `life` expires; catching it drops the treat at
  her feet. Medium and Hard only — Easy squirrels never steal. That is the whole cost of
  ignoring them: one `treatHeal` (15–25 HP), never HP directly.
- **Primitives**, ~14 each (2 alive ≈ 28, negligible beside DC's 163 rope nodes): body
  `sph r11 (1.3,0.9,1.0)` `#9aa3ab`, belly `sph r8` `#d7dde2`, head `sph r8`, two `cone r2.5 h6`
  ears, a tail of `sph r7/r8/r6` arcing up and over in `#6f7780`, four `cyl r2.5 h9` legs, two
  `sph r1.6` eyes with a glint, `sph r1.8` nose. One shared geometry set cloned twice at init,
  `visible` toggled — no per-frame allocation.

### 3.4 Teaching

**The pause controls-and-combos page must list, in this order:** (1) movement — joystick /
arrows / WASD, one row; (2) the four buttons — BITE (`Space`/`J`), DASH (`Shift`/`K`), BARK
(`B`), BOOGA (`V`) — each as its own colour chip plus key plus one line; (3) the three
contextual moves as sequences, not prose — `DASH → BITE = POUNCE`, `HOLD BITE after a bite =
SHAKE`, `BARK = interrupt`; (4) the five specials, one row each: name (16 px bold), the motion
as arrow glyphs then a colour-matched button chip, one 12 px line of effect — the finisher row
dimmed, reading `UNLOCKS AT CHAIN x8` until `rosie2-seen-finisher` is set; (5) squirrels, two
lines — they are fast, a bark knocks one off a post, a caught one can be thrown.

**At phone width.** Each move is one `grid-template-columns: 1fr auto` row that stacks below
380 px. Motions are **arrow glyphs only, never words**, 28 px with 6 px gaps, max 4 per row.
Nothing is mirrored — arrows are camera-relative and mean what they look like. Each row's
glyphs **animate on a loop**, highlighting one token every 0.4 s then resting 0.8 s: the rhythm
is the hard part of a motion input and a static row does not teach it.

**Discovery in play, without the menu.** (i) The `motHint` chip (§3.1) — a fumbled flick is the
commonest way a player learns a move exists, which is why the hint fires on partials and costs
nothing. (ii) One-time pops gated by `rosie2-tip-<id>` as in DC §3.3: first time `combo` hits 8
→ `MEGA BONK READY  ↓ → ↑ + BITE`; first catch → the Cannon's motion; third hot band survived →
Diggy-Down's. (iii) The chain chip reads `FINISHER!` at `combo >= 8` with its arrow row beneath,
so the reward is visible exactly when it is usable.

## 4. Formulas

Shared: `L` = level (int 1–∞), `D` = `DIFF[mode]`, `c` = `combo`, `unit` = `unitDmg()` (DC §4.2,
1.85–4.17), `chainDmg()` (DC §4.3, 1.00–1.48).

### 4.1 Sequence window

`MOT_WIN(n) = MOT_BASE + MOT_PER × n`, plus the independent per-gap limit `MOT_GAP = 0.40 s`.

| Symbol | Type | Range | Description |
|---|---|---|---|
| `n` | int | 3–4 | Tokens in the pattern, button included |
| `MOT_BASE` | float | 0.30 s | Fixed allowance (reaction + release time) |
| `MOT_PER` | float | 0.22 s | Allowance per token |
| `MOT_GAP` | float | 0.40 s | Max time between two consecutive matched tokens |
| `MOT_WIN` | float | 0.96–1.18 s | Max span, first to last matched token |

Bounded by construction: 0.96 s at `n=3`, 1.18 s at `n=4`. Both ends are usable — the floor is
wider than the ~0.75 s an unpractised player needs for three flicks and a button, and the
ceiling sits below the time a *walking* player spends in one direction, which `MOT_HOLD` already
excludes. **Worked example** — flicks at t = 0.00 `→`, 0.31 `↓`, 0.58 `←`, Bark at 0.69: gaps
0.31 / 0.27 / 0.11 all `<= 0.40`, span 0.69 `<= 1.18`. SPIN CYCLE fires. Move the first flick to
t = −0.55 and that gap (0.55) fails; the Bark is just a Bark.

### 4.2 Special damage to the main hose

`spDmg = unit × W × chainDmg()`

| Symbol | Type | Range | Description |
|---|---|---|---|
| `unit` | float | 1.85–4.17 | `unitDmg()` |
| `W` | float | {0, 1.0, 3.2, 5.6} | Weight: spin / non-winded 0, cannon 1.0, slam 3.2, bonk 5.6 |
| `chainDmg()` | float | 1.00–1.48 | Chain multiplier |
| `spDmg` | float | 0–34.5 | Hose HP removed, of 100 |

`W = 0` whenever the spot is not winded — the floor that keeps FU's timing fight intact. The
34.5 maximum needs Easy + L1 + chain 8 + the finisher, the best case of the most gated move in
the game, and `hoseHP` is already clamped by `Math.max(0, …)`. **Worked example** — Medium L5,
chain 8, FLIPPITY-FLOP: `2.083 × 3.2 × 1.40 = 9.33` HP, against `2.083 × 4.8 × 1.40 = 14.0` for
a perfect three-bite window. The slam is two thirds of a window in one input — a fallback, not
an upgrade.

### 4.3 Finisher

`finDmg = unit × FIN_W × chainDmg()`, `FIN_W = 5.6`; `avail = (c >= FIN_CHAIN) ∧ (J.winded > 0)`.

| Symbol | Type | Range | Description |
|---|---|---|---|
| `FIN_W` | float | 5.6 | Finisher weight (a full window is 4.8) |
| `FIN_CHAIN` | int | 8 | Chain required |
| `finDmg` | float | 14.5–34.5 | Hose HP removed |

Bounded: 14.5 (Hard L5+, `unit` 1.85, `chainDmg` 1.40) to 34.5 (Easy L1). **Worked example** —
Hard L7: `1.85 × 5.6 × 1.40 = 14.5` HP of 100, ≈1.3 windows of damage for a chain of 8 (eight
varied actions inside rolling 1.6 s refreshes). Hard needs 11.3 windows per hose, so two
finishers save ~1.6 of them: a visible reward, not a skip.

### 4.4 Squirrel speed and cadence

```
SQ_SP(mode)    = 330 × (mode==='hard' ? 1.09 : 1)     // Rosie walks 280, carries at 314, dashes 760
SQ_CD(mode)    = rand(min,max): easy 14–20 s | med 18–26 s | hard 22–30 s
SQ_POST(mode)  = easy 2.0 | med 3.0 | hard 4.0 s
SQ_ALIVE(mode) = easy 1 | med 2 | hard 2
```

| Symbol | Type | Range | Description |
|---|---|---|---|
| `SQ_SP` | float | 330–360 px/s | Flee speed |
| `SQ_CD` | float | 14–30 s | Seconds between spawn attempts (refusals reset it) |
| `SQ_POST` | float | 2.0–4.0 s | Untouchable on a post; a Bark ends it early |
| `SQ_ALIVE` | int | 1–2 | Live cap |

All bounded by the table. The invariant: `314 < SQ_SP < 760` — never outrun by a carrying dog,
always closed by a dash. **Worked example** — Medium L4, 60 s of fight: spawns at 12 s, ~34 s,
~56 s, at most 2 alive, each on a post ≤3 s per flee. Ignoring them costs at most one treat
(20 HP) that minute; catching both pays `2 × 60 × 4 = 480` score, 2 power, 4 chain steps and two
Cannons.

## 5. Edge Cases

1. **Special fired while running** — impossible on desktop (`MOT_HOLD`: a held direction emits
   no token); on touch a 45° sweep emits none either (the 90° rule).
2. **Motion completed with the wrong button, or with stamina short** — no match, no partial
   effect, and the button's ordinary action runs. The hint chip having shown is the only "cost".
3. **Two patterns match the same tail** — the longest wins; ties break by `MOVES` order.
4. **A special starts as the window closes** — `J.winded` is read at the *effect* frame, not the
   input frame. A FLIPPITY-FLOP landing 0.05 s late deals 0 and adds `J.streak++`.
5. **Chain drops mid-move** — `chainDmg()` is likewise sampled at the effect frame, so a slam
   wound up at chain 8 and interrupted-by-damage pays 1.00×. No refund, no cancel: **damage
   during a wind-up never cancels a special.**
6. **MEGA BONK input at chain 7** — unavailable, the Bite resolves normally, and the hint chip
   never promised it (gates are checked before hinting).
7. **Damage during an invulnerable phase** — MEGA BONK's second is covered by `R.iframe=1.0`;
   FLIPPITY-FLOP's `R.air` skips ground rings and the hot band only — a jet already in the air
   still lands and cancels nothing.
8. **Diggy-Down under an obstacle** — `pushOut` is skipped while `R.under`; on emergence she is
   pushed out once, displacing her up to `24 × R.sc + r` px.
9. **Diggy-Down surfacing inside a live lasso ring** — she is caught. That is the documented
   counter, not a bug; FU §5.8's "a lasso never lands the killing blow" still applies.
10. **Special during a lasso** — every special is blocked by `R.held`; Bite stays the mash input.
11. **Special during BOOGA** — allowed; `R.sc = 1.5` scales every radius exactly as Bark's is
    already scaled. No special grants or extends BOOGA.
12. **Pause mid-special** — `state==='paused'` freezes `R.sp.t` and it resumes in the same
    phase. Pausing is neither an escape nor a cancel.
13. **Tab blur mid-motion** — the existing `blur` handler clears `keys`; clear `Mot.buf` with
    it so no token survives a blur.
14. **Squirrel caught as the hose bursts** — released in `burst`; `R.carry = null` in `burst`
    and `resetLevel`, geometry hidden, never disposed.
15. **Cannon with no target in range** — it still launches, lands, chatters and flees. Never a
    silent no-op that eats the input.
16. **Squirrel and a knocked-over pot** — `pots` with `fallen` are not valid posts; only `OBST`
    entries are.
17. **Theft at low HP** — a squirrel will not take a treat while `R.hp < 0.25 × D().hpMax`.
    Two squirrels, one treat: first within 40 px takes it, the other reverts to `idle`.
18. **`localStorage` unavailable** — `store` swallows it; the finisher row stays dimmed until
    chain 8 is reached that session and tips re-show. Accepted (DC §5.18 precedent).

## 6. Dependencies

`readInput` / `moveJoy` / keydown+keyup / `biteBtn`,`dashBtn`,`barkBtn` listeners (token source)
· `biteBuf` / `dashBuf` / `barkNow` (button tokens, early-button grace) · `tryBite` / `tryDash`
/ `doBark` (each calls `motMatch()` **before** its own action and returns on a match) · `doBite`
/ `unitDmg` / `chainDmg` / `chain` / `chainSet` (damage, chain spend) · `hoseDodge` / `J` /
`moveWeak` (window gate, RIP, relocation) · `updRosie` (root during `R.sp`, `R.under`/`R.air`
skips, carry speed) · `hurt` / `burn` / `updAttacks` / `updLass` / `updHot` (**all five must
respect `R.under`**; `hurt`, `burn` and `updHot` must respect `R.air`) · `pushOut` / `OBST`
(dig pass-through, squirrel posts) · the `treats` block in the tick (theft) · `updSnakes`
(`SPIN_DMG`, `SLAM_SN`, `DIG_DMG`, `SQ_DMG`) · `updHuman` / `crankT` (spin and slam interrupts)
· `render3D` Rosie pose block (`poseSpecial`, `dog.visible`, the dig mound) · `drawOverlay`
(hint chip, finisher arrows) · `hud` + `lastHud` (the `FINISHER!` state must enter the key
string or the HUD will not repaint) · `resetLevel` / `burst` / `won` / `lose` (clear `R.sp`,
`R.carry`, `squirrels`, `Mot.buf`) · `store` (tips, `rosie2-seen-finisher`) · **new**: `motDir`,
`motMatch`, `motHint`, `MOVES`, `doSpin`, `doSlam`, `doDig`, `doCannon`, `doBonk`,
`poseSpecial`, `updSquirrels`, `spawnSquirrel`, `catchSquirrel`.
**Back-references owed** (bidirectional rule; not edited here, this run is scoped to one file):
`difficulty-and-combos.md` §6 and `fight-upgrade.md` §6 each want a line pointing here. Art
owes the dig mound, the squirrel primitive set, a spin dust torus and the menu arrow glyphs;
audio owes a flick tick, a rising hint tick, a spin whoosh, the bonk impact, a squirrel chatter
and a dig rumble.

## 7. Tuning Knobs

| Constant | Suggested | Safe range | Effect |
|---|---|---|---|
| `MOT_IN` / `MOT_OUT` | 0.55 / 0.30 | 0.45–0.7 / 0.2–0.4 | Hysteresis; keep `IN > OUT + 0.15` |
| `MOT_HOLD` | 0.22 s | 0.15–0.30 | **The accident guard.** Above 0.30 running emits tokens |
| `MOT_GAP` | 0.40 s | 0.30–0.55 | Per-input patience; below 0.30 it feels strict |
| `MOT_BASE` / `MOT_PER` | 0.30 / 0.22 s | 0.2–0.4 / 0.18–0.3 | Whole-sequence window |
| `MOT_SLOP` | 1 | 0–2 | Stray flicks ignored; 2 fires moves nobody intended |
| `MOT_BTN` | 0.18 s | 0.10–0.25 | Early-button grace |
| `MOT_DWELL` | 0.09 s | 0.06–0.14 | Touch octant dwell; below 0.06 a sweep misfires |
| `SPIN_R` / `SPIN_CD` | 230 px / 6 s | 180–300 / 4–9 | Crowd answer reach and frequency |
| `SPIN_DMG` | 6 | 3–10 | Spin vs extra snakes (`SN_HP` 30) |
| `SLAM_W` / `SLAM_CD` | 3.2 / 5 s | 2.4–4.0 / 4–8 | Above 4.0 the slam replaces the bite combo |
| `SLAM_SN` | 14 | 8–20 | Slam vs extra snakes |
| `DIG_T` / `DIG_SP` | 0.70 s / 900 | 0.5–1.0 / 700–1100 | Untargetable travel (≈630 px) |
| `DIG_CD` | 7 s | 5–12 | Below 5 s, digging replaces dodging |
| `SQ_DMG` / `SQ_THROW_R` | 6 / 420 px | 3–10 / 300–520 | Thrown-squirrel bite and reach |
| `FIN_CHAIN` | 8 | 6–12 | How hard the finisher is to earn |
| `FIN_W` | 5.6 | 4.8–7.0 | **Never below 4.8** — a finisher worth less than a clean window is an anti-reward |
| `SQ_SP` | 330 px/s | 300–420 | Must stay `> 314` (carry speed) and `< 760` (dash) |
| `SQ_CD` | 18–26 s | 12–40 | Below 12 s they compete with the hose for attention |
| `SQ_POST` | 3.0 s | 1.5–5.0 | Treed stall; above 5 s it is a chore |
| `SQ_HOLD` | 8 s | 5–15 | Carry time before it wriggles free |
| `SQ_MAX` | 2 | 1–2 | **Hard cap, never above 2** (frame-cost ceiling) |

## 8. Acceptance Criteria

1. **No accidental specials.** A scripted 60 s run that holds each of the 8 directions 0.4 s in
   random order and presses Bite, Dash and Bark 20 times each fires **zero** specials, and every
   press produces its ordinary action.
2. **Every special fires from its motion** on keyboard, on an on-screen joystick swipe, and with
   one stray flick inserted mid-sequence (`MOT_SLOP = 1`).
3. A motion whose span exceeds `MOT_WIN(n)`, or any of whose gaps exceeds 0.40 s, does **not**
   fire; the trailing button's ordinary action runs instead.
4. A diagonal substitutes for a neighbouring cardinal in exactly one slot; two substitutions do
   not match.
5. **Camera-relative:** flicking screen-left pushes token `4` at four different `R.ang` values,
   including with Rosie facing the camera.
6. A failed or partial motion costs 0 stamina, sets no cooldown, plays no animation and prints
   no pop — assert `R.stam`, every `*_CD` and `R.recover` unchanged.
7. The hint chip appears when the tail matches `n-1` tokens of an **available** move and does
   not appear when that move's gate (stamina, chain, carry) fails.
8. **No special damages a non-winded main hose** — fire all five at a non-winded spot;
   `hoseHP` unchanged in all five. FLIPPITY-FLOP adds exactly `+1` to `J.streak`.
9. FLIPPITY-FLOP on a winded spot removes `unit × 3.2 × chainDmg()` and ends the window as a RIP
   (`J.hits === 0`, `moveWeak` called).
10. During FLIPPITY-FLOP's airborne phase a ground ring under her deals 0 and the hot band deals
    0; a jet already in flight still hits.
11. DIGGY-DOWN: `hurt`, `burn` and hot-band contact are no-ops while `R.under`; travel ≤630 px;
    emergence on a winded spot calls `doBite`; emergence inside a live lasso ring is caught.
12. SPIN CYCLE deletes at most 3 telegraphs, staggers every snake within 230 px, deals 0 to the
    main hose, costs exactly 2 stamina, and does nothing at all at `R.stam < 2`.
13. MEGA BONK is unavailable at `combo <= 7` and at `J.winded <= 0`; at `combo >= 8` on a winded
    spot it removes `unit × 5.6 × chainDmg()`, sets `combo` to 0, grants `+2` power and 1.0 s of
    iframes.
14. Only one special runs at a time: a second input mid-special does nothing and does not queue.
15. Squirrels: never more than `SQ_ALIVE` alive; **zero** `hurt`/`burn` calls originate from a
    squirrel across a 5-minute run; none spawns while `J.winded > 0` or within 400 px of
    `rope[weak]`.
16. A squirrel cannot be caught by running (hold max walk speed toward one for 10 s: not
    caught); a dash, Pounce, Diggy-Down emergence or Spin Cycle hit catches a stunned or
    cornered one; a Bark in cone knocks a posted one down and stuns it 1.2 s.
17. Theft: a squirrel within 40 px of a treat takes it on Medium/Hard, never on Easy, never
    while `R.hp < 25 %`; catching it returns the treat to the ground.
18. Taking damage while carrying drops the squirrel, costs no extra HP and halves the chain
    exactly once (the existing `chainDrop`).
19. The pause controls page lists all four buttons with both bindings, the three contextual
    moves, all five specials as arrow rows and the squirrel lines; at a 360 px viewport no row
    overflows horizontally, and the finisher row reads `UNLOCKS AT CHAIN x8` on a save without
    `rosie2-seen-finisher`.

## 9. Flagged concerns and cut order

1. **`MOT_HOLD` is the whole design, and it is a learning cost.** Requiring *flicks* is the only
   accident guard I trust, but a player who holds `←` for half a second then taps `→ + Bite`
   gets nothing and may conclude the move is broken. The hint chip exists for exactly that. If
   playtests show people cannot flick, the alternative is a modifier (hold Bark, then a
   direction pair) — easier to execute, far worse to discover. I recommend flicks plus a
   specific playtest question.
2. **FLIPPITY-FLOP competes with the three-bite window FU §3.3 just re-weighted.** At
   `SLAM_W = 3.2` it is two thirds of a perfect window for one input and no timing. That gap is
   deliberate and it is also the number most likely to be wrong; if slams start replacing bites,
   drop it to 2.4 before touching anything else.
3. **MEGA BONK spending the chain collides with DC's scoring.** The chain feeds the score
   multiplier and a power trickle, so zeroing it costs the player multiplier they earned. I
   chose spend-it so the finisher cannot fire every window; if it reads as a punishment the fix
   is `chainSet(4)`, not a lower `FIN_W`.
4. **Five specials plus three contextual moves is eight things on four buttons** — a fighting
   game's vocabulary on a game whose core is one timing window. Four specials is the honest
   number; I would cut the SQUIRREL CANNON's *motion* first and keep Bite-while-carrying as the
   throw, since that input exists mainly to reach the count.
5. **`R.under` is a new invulnerability state touching five damage paths** (`hurt`, `burn`,
   `updAttacks`, `updLass`, `updHot`). All five must be edited or Diggy-Down is a bug factory.
   If that breadth is unacceptable, **cut Diggy-Down rather than ship it partially** — a dig
   that is invulnerable to three of five sources is worse than no dig.
6. **I did not spec squirrels as enemies.** The request was "dodge or fight"; I made them prey
   with a treat-theft stake, because a second damage source competes with the hose for the
   player's attention and FU's fairness rules (announced, escapable, never lethal) would all
   have to be re-derived for a fast-moving animal. If you want them to bite, that is a different
   doc and it needs a telegraph.
7. **Cut order if the build must shrink.** (a) The Cannon's motion (keep carry + short throw).
   (b) DIGGY-DOWN — biggest surface, five damage paths. (c) Squirrel treat theft (keep the
   catch, the post, the chatter). (d) SPIN CYCLE — Bark already covers 140°. **Keep to the end:
   FLIPPITY-FLOP, MEGA BONK and the motion reader.** Those three are the request — a motion
   input, a ridiculous animation, and a reason to build a chain.
