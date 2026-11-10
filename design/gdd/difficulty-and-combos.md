# Difficulty Modes, the Living Yard, and Rosie's Combo Moves

Implementation spec. Builds on `design/gdd/fight-upgrade.md` (referred to below as FU) and
`design/loop-audit.md`. Target: `src/index.html`. Every named function already exists
unless marked **new**.

## 1. Overview

Three things. **(1) Easy / Medium / Hard**, chosen on the title card and switchable from a
new pause menu between levels only; Medium is today's balance restated, not retuned — one
`DIFF` table multiplies or replaces every balance value the game reads. **(2) Hard mode's
living yard**: the hose is a free snake from level 1, the straw-hatted person stops being
the attacker and becomes the *escalation engine* — he cranks the reel to wake up to two
extra snakes, and Rosie can interrupt him. **(3) Three combo moves** — **Pounce** (Bite
during a dash), **Shake** (hold Bite after a bite) and **Bark** (tap the BOOGA button) —
plus a **chain** counter that converts acting-without-pause into bite damage and power.
The weak-spot timing fight is untouched: no new move can kill the main hose, and only the
winded weak spot takes real damage.

## 2. Player Fantasy

Easy lets a player who keeps dying actually see hose #4. Hard turns the yard into a thing
that *hunts* — the rope never lies still, a second one wakes up behind you, and the man in
the straw hat is no longer the shooter but the problem you should have barked at thirty
seconds ago. The moves make Rosie read like a dog instead of a cursor: she leaps the last
twenty feet, she sets her teeth and thrashes, she barks and something flinches.

## 3. Detailed Rules

### 3.1 Difficulty modes

`mode ∈ {'easy','med','hard'}`, default `'med'`. A single frozen table `DIFF` holds one
record per mode; `const D=()=>DIFF[mode]` is read at every call site below. **Medium's
column is the value in `src/index.html` today** — a Medium run must be byte-identical in
behaviour to the current build.

| Value | Function touched | Easy | Medium (today) | Hard |
|---|---|---|---|---|
| `hpMax` — Rosie max HP | `resetLevel`, `updRosie`, treats | 150 | 100 | 85 |
| `regenMul` × `max(1,4-L)*1.2` HP/s | `updRosie` | 2.0 | 1.0 | 0.6 |
| `regenWait` — seconds unhit before regen | `updRosie` (`R.safeT>4`) | 2.5 | 4 | 5.0 |
| `dmgMul` × `min(1,.55+.15L)` | `hurt`, `burn`, `updLass` (`lassScale`) | 0.60 | 1.00 | 1.25 |
| `hitCap` — max single hit, fraction of `hpMax` | `hurt`, `burn` | 0.15 | 0.20 | 0.25 |
| `iframe` seconds | `hurt`, `burn`, `freeLass` | 1.4 | 1.0 | 0.8 |
| `windGrantMul` × `WIND_GRANT` | `doBite` | 1.35 | 1.00 | 0.85 |
| `windLenMul` × `max(.9,1.75-.15L)`, floor 0.8 s | `hoseDodge` | 1.30 | 1.00 | 0.85 |
| `leapAdj` + `leapsFor()`, clamp 1–10 | `leapsFor` | −1 | 0 | +1 |
| `atkCdMul` × attack cooldown | `updAttacks` | 1.35 | 1.00 | 0.82 |
| `teleMul` × every telegraph length | `startAttack`, `updLass`, `HOT_WARN` | 1.25 | 1.00 | **1.00** |
| `hotLvl` / `hotCdMul` | `updHot`, `hotCd` | 4 / 1.5 | 2 / 1.0 | 1 / 0.8 |
| `lassoLvl` / `lassoCdMul` | `updLass`, `lassoCd` | 6 / 1.5 | 4 / 1.0 | 2 / 0.8 |
| `dashMax` / `dashRegen` s | `tryDash`, `updRosie`, `hurt`, `hud` | 4 / 1.1 | 3 / 1.6 | 3 / 1.9 |
| `treatEvery` s / `treatHeal` | tick treat block, `updRosie` | 6–9 / 25 | 8–12 / 20 | 11–15 / 15 |
| `powerMax` / `boogaLen` s | `hud`, tick, `startBooga` | 8 / 18 | 10 / 15 | 12 / 12 |
| `unitBase` in `100/(base+4·min(L,5))` | `unitDmg` | 20 | 28 | 34 |
| `secondWind` — one free death-save per level | `hurt`, `burn`, `updLass` | **yes** | no | no |
| `freeSnake` — hose unheld from the start | `resetLevel`, `updHead` | no | no | **yes** |
| `maxSnakes` — ropes alive at once | `updSnakes` (new) | 1 | 1 | **3** |

**Hard HP is lowered, not raised**: 85 HP with 1.25× damage makes a jet 18.8 (22 % of the
bar) and four unanswered attacks lethal, while `hitCap` guarantees no single source can
ever remove more than 21.3. **`teleMul` is 1.00 on Hard by rule** — Hard gets more
threats, more often, from more directions, and *never* a shorter warning than Medium.
Every Hard threat is still ground-telegraphed and still dashable.

**What Easy guarantees.** 150 HP, 0.6× damage, no hit above 22.5, 2.4 HP/s floor regen
after 2.5 s, treats every 6–9 s, 4 dash charges regenerating in 1.1 s, no hot band before
level 4, no lasso before level 6, one leap fewer to win the window and a 30 % longer
window, and **one Second Wind per level**: the first blow that would take `R.hp` to 0
instead leaves 20 HP, grants 2 s of iframes and pops `ROSIE SHAKES IT OFF!`. A player who
only walks, bites and occasionally dashes can finish Easy.

**Where the mode is chosen.**
- **Title card** — three buttons (`#modeEasy/#modeMed/#modeHard`), the current one
  highlighted, last choice persisted to `rosie2-mode`. Each shows that mode's best score.
- **Pause menu** (**new**: `Esc`/`P` on desktop, a `⏸` button in `#controls` on touch;
  `state='paused'` freezes the tick and draws the overlay). The three mode buttons are
  present but **labelled `Applies at Hose #N+1`** and set `pendingMode`; the live fight
  never changes. `resetLevel()` does `mode=pendingMode` as its first statement.
- **Win card** — same three buttons, applied immediately because the next `resetLevel` is
  one click away.

**Switching mid-run.** Nothing changes until the next `resetLevel`. A run tracks
`runMinMode` = the easiest mode used since the last title-card start. `writeBest()` writes
to `rosie2-best-<runMinMode>`, so dropping to Easy at hose 8 banks that run's score under
Easy and can never raise the Hard best. Stars are per mode (`rosie2-stars-<mode>-<N>`) and
unambiguous because a level is always played entirely in one mode.

### 3.2 Hard mode's living yard

**The main hose.** `resetLevel` sets `Hm.grabbed=false` and seeds `E` at the reel end when
`D().freeSnake`. `updHead` already drives a free nozzle and `originOf('head')` already
sources attacks from it — Hard reuses the BOOGA code path for the whole level. The attack
list is the existing head list `['lunge','jet','lunge','bomb','sweep']`, so attacks now
come from a mobile mouth instead of a walking man.

**The weak spot on a moving snake.** Two rules keep the core fight intact:
1. `moveWeak` restricts Hard candidates to `[12, N-14]` — never in the last fourteen
   segments, which whip too fast to bite on purpose.
2. **The coil.** While `J.winded>0`, `updHead` multiplies the head's speed by
   `SNAKE_COIL=0.35` and drops the `d<300` chase term. The earned window is still a
   window; a hose that sprinted away mid-pant would make the whole mode luck.

**The person.** He stays, and he stops being a shooter — he never deals damage in Hard.
He is the **escalation engine**: `Hm.mode='crank'`, a new state in `updHuman`. He walks to
`REEL`, and every `CRANK_CD = 26 s` he cranks for `CRANK_WIND = 3.0 s` with a rising
ratchet sound and `pop('He's cranking the reel!')`. A completed crank spawns one extra
snake. He is **interruptible**: a Bark (§3.3) in cone adds `+6 s` to his timer and shocks
him 3 s; a dash into him knocks him down for 4 s and adds `+6 s`. This is why he must
still exist — he is the one threat in Hard the player can *pre-empt*, and the reason to
leave the hose and cross the yard.

**Extra snakes.** `SN = {x,y,vx,vy,hp,rope[],atkCd,stagger}` in a new `snakes[]` array,
driven by new `updSnakes(dt)` and drawn by a short `TubeGeometry` rebuilt per frame.

- **How many.** `allowed = min(D().maxSnakes-1, floor(level/3) + (phase===3?1:0))`, so 0
  at levels 1–2, 1 from level 3, 2 at level 6+ or in phase 3 of levels 3–5. A crank that
  would exceed `allowed` is wasted (he grumbles) — the cap is never bypassed.
- **Hard cap: 3 ropes alive, ever.** Main hose 91 nodes + 2 × `SN_N = 36` nodes = 163
  nodes of tube rebuilt per frame, vs 91 today. That is the ceiling for mobile; no mode
  and no level raises it.
- **No weak spot, no hose HP.** Extra snakes carry `hp = SN_HP = 30` and are **bitable
  anywhere** (`findBite` returns 1 on any of their segments within mouth range). They
  cannot damage `hoseHP`; the main hose still dies only to the weak spot. Killing one
  bursts it for `score += 40*level` and `power += 1`.
- **How they attack.** One type only — a short `jet` (`len` 380, damage 10) from their own
  head, cadence `rand(3.4, 4.8) * speedK() * D().atkCdMul`.
- **Anti-surround (four rules, all absolute).** (a) At most **one** non-main source may be
  in telegraph at a time. (b) Global spacing: no attack may start within `HARD_SPACING =
  0.8 s` of any other attack starting. (c) Extra snakes never attack while `J.winded>0`,
  while `R.held`, or during a hot band. (d) **Free-arc rule** — if the main head and both
  snakes are all within 260 px of Rosie, the one furthest from her disengages for 2.5 s
  (`stagger`), so she is never enclosed by three bodies.

### 3.3 Rosie's three moves

Chosen for what bite cannot do: **close distance**, **convert a landed bite into greed**,
and **interrupt**. All three use existing inputs in new contexts. No fourth touch button.

**POUNCE — "leap the last twenty feet".**
- **Input**: Bite **while dashing** (`R.dash>0`, the first 0.17 s). Desktop: `Shift`/`K`
  then `Space`/`J`. Touch: tap **Dash**, then tap **Bite** before the dash trail fades —
  `biteBuf` is already buffered 0.2 s, so this is one quick double-tap.
- **Cost**: nothing beyond the dash's 1 stamina. **Cooldown**: shared `DASH_CD` 0.7 s.
- **Effect**: extends the dash to `R.dash=.26` at 1020 px/s (1.6× normal distance, ~265 px)
  and sets `R.pounce=1`. `R.dashT` is preserved, so a Pounce can still Perfect Dodge.
  On contact: the **winded weak spot** → a free bite at step 1 via `doBite`; the weak spot
  **not** winded → `J.streak++` and the normal leap impulse (she baits a leap by jumping at
  it); an **extra snake** → `POUNCE_DMG = 8`; the main hose elsewhere → nothing.
- **Recovery**: 0.18 s `R.recover` on contact, 0.30 s on a whiff. **Counters**: the
  traversal — the audit's largest share of dead time, and the 165 px leap ring.

**SHAKE — "teeth in, now thrash".**
- **Input**: **hold** Bite while `R.biteT>0` (the 0.3 s after a landed non-final bite) and
  the weak spot is still in mouth range. Touch: keep your thumb **down** on the Bite
  button — add `biteHeld` tracking on `biteBtn` `pointerdown`/`pointerup`.
- **Cost**: Rosie is **rooted** — `R.vx=R.vy=0`, movement input ignored, `tryDash` returns
  false, and she gains **no** iframes. Any damage cancels the shake.
- **Effect**: up to `SHAKE_MAX = 1.2 s`, a tick every `SHAKE_T = 0.3 s` (first at 0.3),
  each dealing `unit × SHAKE_TICK (0.5)` and adding `+0.12 s` to `J.winded`, capped at
  `+0.48 s` per window. Reuses `R.thrash` and the existing kill-shake animation.
- **Cooldown**: once per bite step; unavailable after the RIP (step 3). **Recovery**:
  0.25 s. **Counters**: nothing — it is the greed valve, paid for in mobility.

**BARK — "say something about it".**
- **Input**: **tap** `B` / the BOOGA button. **Hold 0.35 s** = BOOGA (when charged). The
  button is labelled `BARK` below full power and `BOOGA!` at full, with "hold" sublabel.
- **Cost**: 1 stamina. **Cooldown**: `BARK_CD = 2.5 s`. **Damage**: 0.
- **Effect**, in a cone of radius `BARK_R = 260 × R.sc`, half-angle 70° around `R.ang`:
  (a) up to **2** attacks still in telegraph (`a.t < a.tele`) whose origin is in the cone
  are **deleted** with `pop('INTERRUPTED!')`; (b) the free head or any extra snake in cone
  is staggered 1.2 s; (c) the person in cone takes `Hm.shock=3` and `+6 s` crank delay;
  (d) if `rope[weak]` is in cone, `J.cd<=0` and Rosie is within `300 × R.sc` of it,
  `J.streak++` with a forced leap. A bark that achieves none of (a)–(d) still costs the
  stamina and 0.3 s recovery.
- **Counters**: wind-ups, crowding, and the leap grind. It is the Hard-mode answer to
  three snakes and the only way to stop the crank at range.

**How the player learns them.** (i) The title card's "How to play" list gains one line per
move, written for the detected scheme (`COARSE` → touch wording). (ii) One-time contextual
pops in any mode, each gated by `rosie2-tip-<id>` in `localStorage`: *Pounce* on the second
dash taken while more than 400 px from the weak spot; *Shake* after the third landed
non-final bite; *Bark* the first time an attack telegraphs within 300 px while
`power < powerMax`. (iii) The Bite button grows a "HOLD" ring during `R.biteT`, and the
BOOGA button reads `BARK` whenever it is not charged — the affordance is on the button.

### 3.4 The chain

The existing `combo` counter becomes the chain (one counter on screen, not two).

- **Increments by 1** on: each landed bite step, each Shake tick, a landed Pounce, an
  effective Bark, a Perfect Dodge, an extra snake killed, a lasso escape by taps.
- Each increment sets `chainT = CHAIN_W = 1.6 s` (refresh, never stack).
- **On screen**: the existing `#comboChip` from chain ≥ 2, reading `CHAIN x N`, with a bar
  draining `chainT` and, at chain ≥ 4, the live bonus (`bite +8 %`).
- **Payoff**: score multiplier unchanged (`1+min(c-1,12)*.2`); **bite and Shake damage ×
  `chainDmg(c)`** (§4.3, up to 1.48); and `power += 1` on every 4th increment. A player
  who chains reaches BOOGA roughly twice as fast.
- **Dropped chain**: `chainT` reaching 0 halves it — `combo = floor(combo/2)` — with
  `pop('chain cooling')` at ≥ 4. Taking damage (`hurt`, `burn`, a lasso tick) also halves
  rather than zeroes it (adopting loop-audit NICE #10). **A dropped chain never costs HP,
  score already banked, or progress** — only the multiplier.

## 4. Formulas

Shared variables: `L` = level (int 1–∞), `mode` ∈ {easy,med,hard}, `D` = `DIFF[mode]`,
`c` = chain count (int 0–∞), `unit` = `unitDmg()`, `phase` ∈ {1,2,3}.

### 4.1 Incoming damage

`dmgTaken = min(base × min(1, .55+.15L) × D.dmgMul × (booga?.5:1), D.hitCap × D.hpMax)`

| Symbol | Type | Range | Description |
|---|---|---|---|
| `base` | int | 4–16 | Raw attack damage (lasso tick 4 … lunge 16) |
| `D.dmgMul` | float | 0.60–1.25 | Mode damage multiplier |
| `D.hitCap` | float | 0.15–0.25 | Fraction of max HP one hit may remove |
| `D.hpMax` | int | 85–150 | Rosie's max HP |
| `dmgTaken` | float | 0–21.3 | HP removed, clamped by `hitCap` |

Bounded both ends: minimum 1.68 (lasso tick, Easy, L1, BOOGA), maximum 21.25 (Hard cap).
**Worked example** — Hard, L6, a 16-damage lunge: `16 × 1.0 × 1.25 = 20.0`, cap
`0.25 × 85 = 21.25`, so 20.0 lands — 23.5 % of the bar. Easy, same lunge: `16 × 1.0 × 0.6
= 9.6`, 6.4 % of 150.

### 4.2 Bite unit and per-level scalers

```
unit(L)     = 100 / (D.unitBase + 4·min(L,5))      // base 20 / 28 / 34
leaps(L)    = clamp(min(9, 1+min(L,3)+(phase-1)+floor(max(0,LCAP-5)/2)) + D.leapAdj, 1, 10)
winded(L)   = max(0.8, max(.9, 1.75-.15L) × D.windLenMul)
atkCd       = (1.25+rand(0,.7)) × speedK() × atkMult() × D.atkCdMul × (booga?.65:1)
regen(L)    = max(1, 4-L) × 1.2 × D.regenMul        // HP/s after D.regenWait unhit
```

`unit` range 1.85 (Hard, L5+) – 4.17 (Easy, L1). Full combos to empty a 100-HP hose at
L5+, weights `[1,1.4,2.4]` summing 4.8: **Easy 8.3, Medium 10.0, Hard 11.3** (plus up to
two extra snakes). **Worked example** — Hard L7: `unit = 100/54 = 1.85`; the three bites
deal 1.85 / 2.59 / 4.44 = 8.9 HP per window; `leaps = min(9,1+3+0+1)+1 = 6` leaps to earn
each one; `winded = max(0.8, 0.9×0.85) = 0.8 s`.

### 4.3 Chain damage bonus

`chainDmg(c) = 1 + CHAIN_STEP × min(max(c-3, 0), 6)`, `CHAIN_STEP = 0.08`

| Symbol | Type | Range | Description |
|---|---|---|---|
| `c` | int | 0–∞ | Current chain count |
| `CHAIN_STEP` | float | 0.08 | Bonus per chain step above 3 |
| `chainDmg` | float | 1.00–1.48 | Multiplier on bite and Shake damage |

Clamped at 1.48 by construction (6 steps max) so a long chain cannot trivialise a level —
at most ~1.5 fewer combos per hose. **Worked example** — Medium L5, chain 9, full window
with two Shakes: `unit = 2.083`; bites `(1 + 1.4 + 2.4) × 1.48 = 7.10`; Shake adds
`4 ticks × 0.5 × 1.48 = 2.96` units over two steps → `(4.8+2.0) × 1.48 × 2.083 = 20.9` HP
from one window against a rooted dog. That is the greed ceiling, and it is paid for with
~2.4 s standing still.

### 4.4 Pounce reach and snake count

`reach = 1020 × 0.26 ≈ 265 px` (vs 760 × 0.30 = 228 px for a plain dash; +16 %, and it
carries a bite). `snakes = min(D.maxSnakes-1, floor(L/3) + (phase===3 ? 1 : 0))` — int,
range 0–2, 0 in Easy/Medium always. Total ropes alive `= 1 + snakes`, maximum **3**.

## 5. Edge Cases

1. **Mode switched while paused mid-fight** — `pendingMode` only; the live fight, Rosie's
   current/max HP, dash pool and power are untouched until `resetLevel`.
2. **Max HP changes between levels** — `resetLevel` sets `R.hp = D().hpMax`. Mid-run Hard→
   Easy therefore heals to 150 at the next hose, never mid-fight.
3. **Mid-run mode switch and best score** — written under `runMinMode` (§3.1). Starting
   from the title card resets `runMinMode` to the selected mode.
4. **Second Wind and a lethal lasso tick** — FU 5.8 already skips a lasso that could kill;
   Second Wind fires only on `hurt`/`burn` and is consumed once per `resetLevel`.
5. **Pounce into the weak spot while it is *not* winded** — no damage, `J.streak++` only.
   Pounce can never bypass the window.
6. **Pounce with 0 stamina** — the dash itself fails, so no Pounce; the Bite press falls
   through to a normal bite attempt.
7. **Shake while a hot band ignites under Rosie** — `burn` cancels the Shake, halves the
   chain, and the window keeps only the extension already granted.
8. **Shake held into the window expiring** — `J.winded<=0` ends the Shake that frame; a
   Shake never keeps a dead window alive.
9. **Shake during a lasso** — impossible; `R.held` suppresses Bite-as-bite (Bite is the
   mash input, FU 3.2). Holding Bite while held counts as one tap, not six.
10. **Bark with power exactly at `powerMax`** — tap barks, hold 0.35 s BOOGAs. A tap never
    spends a banked BOOGA; this is the one input ambiguity and it resolves toward the
    cheaper action.
11. **Bark interrupting an attack already past its telegraph** — not possible; only
    `a.t < a.tele` entries are deleted. Water already in the air still lands.
12. **Bark spam** — `BARK_CD` 2.5 s plus 1 stamina plus 0.3 s recovery; at Hard's 1.9 s
    regen a player can bark at most about once per 2.5 s and is dash-poor if they do.
13. **Crank completing while three ropes are alive** — wasted; `pop('...rusted shut!')`,
    timer resets. The 3-rope cap is never exceeded.
14. **Person knocked down during his wind-up** — the crank is cancelled, not paused, and
    `CRANK_CD` restarts in full.
15. **BOOGA in Hard** — the person already flees in `startBooga`; in Hard he is already
    unheld, so instead his crank timer is set to `BOOGA_LEN + 4 s` and extra snakes are
    staggered 1.5 s at the start of BOOGA. No new snakes during BOOGA.
16. **Extra snake alive when `burst()` fires** — all `snakes[]` burst with the main hose
    and their geometry is disposed in `burst` and `resetLevel`.
17. **Chain at 1 when damage lands** — `floor(1/2) = 0`; no negative counters.
18. **`localStorage` unavailable** — `store` swallows it; mode falls back to `'med'`, tips
    show every session (accepted; they are short).

## 6. Dependencies

`resetLevel` (mode apply, HP, free snake, snake teardown) · `hurt` / `burn` / `updLass`
(damage multiplier, hit cap, iframes, Second Wind, chain halving) · `updRosie` (regen,
max HP, stamina pool, Shake root) · `tryBite` / `doBite` / `findBite` (Pounce bite, Shake,
chain, extra-snake bites) · `tryDash` (Pounce entry, stamina) · `hoseDodge` / `leapsFor`
(leap count, window length, bark-baited leaps) · `moveWeak` (Hard candidate range) ·
`updHead` (coil during the window, stagger) · `updHuman` (new `crank` mode) ·
`updAttacks` / `startAttack` / `originOf` (cadence, spacing, bark deletion, snake jets) ·
`updHot` / `updLass` (start levels, cooldown multipliers) · `startBooga` / `hud` /
`lastHud` (power max, BOOGA length, chain readout, BARK label, pause button) ·
`writeBest` (per-mode keys) · `won` (per-mode star keys, mode buttons) · keydown handler
and `biteBtn`/`dashBtn`/`boogaBtn` (hold tracking, tap-vs-hold) · **new**: `updSnakes`,
`crankTick`, `doBark`, `doShake`, `pauseToggle`.
Art owes: a crank pose and reel highlight, a bark ring VFX, a second rope material at
reduced tube segments. Audio owes: ratchet loop, bark, interrupt thud, shake growl.
**Follow-up**: `design/gdd/fight-upgrade.md` §6 must gain a back-reference to this doc
(bidirectional dependency rule) — I did not edit it, as this run is scoped to one file.

## 7. Tuning Knobs

| Constant | Suggested | Safe range | Effect |
|---|---|---|---|
| `DIFF.easy.dmgMul` | 0.60 | 0.4–0.8 | Easy's core forgiveness |
| `DIFF.hard.dmgMul` | 1.25 | 1.1–1.5 | Above 1.5, Hard kills faster than it telegraphs |
| `DIFF.hard.hpMax` | 85 | 70–100 | Hard's margin for one mistake |
| `D.hitCap` | .15/.20/.25 | 0.12–0.30 | Ceiling on any single hit |
| `D.teleMul` | 1.25/1/1 | ≥1.0 always | **Never below 1.0** — fairness invariant |
| `D.unitBase` | 20/28/34 | 18–40 | Combos per hose (8.3 / 10 / 11.3) |
| `D.atkCdMul` | 1.35/1/.82 | 0.75–1.5 | Attack density |
| `SNAKE_COIL` | 0.35 | 0.2–0.6 | Head speed during the earned window |
| `SN_HP` / `SN_N` | 30 / 36 | 20–50 / 28–48 | Extra snake toughness / node cost |
| `CRANK_CD` / `CRANK_WIND` | 26 s / 3.0 s | 18–40 / 2.0–4.0 | Escalation pace; wind-up must stay ≥2 s |
| `HARD_SPACING` | 0.8 s | 0.6–1.4 | Minimum gap between any two attack starts |
| `POUNCE_DMG` | 8 | 4–12 | Pounce vs extra snakes |
| `SHAKE_T` / `SHAKE_MAX` | 0.3 / 1.2 s | 0.25–0.4 / 0.9–1.8 | Greed window length |
| `SHAKE_TICK` | 0.5 unit | 0.3–0.7 | Shake payoff |
| `SHAKE_EXT` / cap | 0.12 / 0.48 s | 0.08–0.2 / ≤0.6 | Window extension; above 0.6 the audit's fix is undone |
| `BARK_R` / cone | 260 px / 70° | 180–340 / 50–90 | Interrupt reach |
| `BARK_CD` | 2.5 s | 1.8–4.0 | Below 1.8 s, bark replaces dodging |
| `CHAIN_W` | 1.6 s | 1.2–2.5 | How hard the chain is to hold |
| `CHAIN_STEP` / cap | 0.08 / 6 steps | 0.05–0.12 / 4–8 | Chain payoff ceiling (1.48×) |

## 8. Acceptance Criteria

1. A Medium run is behaviourally identical to the pre-change build: same HP, regen, leap
   counts, window lengths, attack cadence, unit damage, treats, dash pool and BOOGA.
2. Title card offers three modes, remembers the last across reloads, and shows a *different*
   best score per mode.
3. Pausing mid-fight and choosing another mode changes nothing on screen; the label reads
   `Applies at Hose #N+1`; the new mode takes effect exactly at the next level start.
4. A run that starts Hard and switches to Easy writes its best under Easy; the Hard best
   is unchanged.
5. Easy: a player who never dashes can clear hose 1 and hose 2. Second Wind fires at most
   once per level and pops `ROSIE SHAKES IT OFF!`.
6. No single hit in any mode exceeds `hitCap × hpMax` — verify with the 16-damage lunge in
   all three modes.
7. Hard level 1: the person holds nothing, the hose head roams and attacks from its own
   mouth, and the person deals zero damage all level.
8. Hard: while `J.winded>0` the head measurably slows (≤35 % speed) and the weak spot stays
   bitable; across 10 windows it is never carried out of reach.
9. Hard: never more than 3 ropes alive; never more than one non-main telegraph at a time;
   never two attack starts within 0.8 s; the free-arc rule fires when three bodies crowd
   within 260 px.
10. Barking the person adds 6 s to the crank and cancels an in-progress wind-up.
11. Pounce: Dash then Bite inside the dash covers ~265 px and, on a winded spot, lands a
    step-1 bite. On a non-winded spot it deals 0 damage and adds one leap.
12. Shake: holding Bite after a landed bite roots Rosie, deals 4 ticks over 1.2 s, extends
    the window by at most 0.48 s, and is cancelled by any damage. Unavailable after a RIP.
13. Bark: tapping `B`/the button below full power interrupts up to 2 telegraphing attacks
    in cone, costs 1 stamina, and does not spend a banked BOOGA. Holding 0.35 s at full
    power starts BOOGA.
14. Chain: the chip appears at 2, reads `CHAIN x N`, drains over 1.6 s, halves (not zeroes)
    on expiry and on damage, grants +1 power every 4th step, and caps bite damage at 1.48×.
15. Touch-only play can perform all three moves with the existing three buttons; no fourth
    button exists.

## 9. Flagged concerns and cut list

1. **Shake partly undoes FU §3.3.** The audit removed the self-extending window on
   purpose; Shake sells a small extension (≤0.48 s) for being rooted and dodgeless. I
   believe that is a *decision* rather than the old formality, but it is the one place
   this doc argues with an approved fix. If you would rather not touch it, cut the
   extension and keep Shake as damage only — the move still works.
2. **Tap-vs-hold on `B`/BOOGA overloads an input FU §3.5 just defined.** It is the only way
   to add Bark without a fourth touch button. Alternative if you dislike it: Bark = Dash +
   Bark... there is none that is cleaner; the honest fallback is a fourth button, which I
   recommend against.
3. **Making `combo` decay changes existing scoring.** Today `combo` only rises and only
   resets on damage; chains will produce lower peak multipliers for slow players and higher
   ones for fast players. Scores are not comparable across this change — consider wiping
   `rosie2-best` once, or keep the old key and start the per-mode keys fresh (my
   preference, and what §3.1 specifies).
4. **Hard mode is close to a second game.** Free snake + crank AI + two extra ropes + a new
   attack source is the largest block here. If the build must shrink: **cut the second
   extra snake first** (`maxSnakes = 2`), then the crank (spawn snakes on phase flips
   instead), then Hard mode's extra snakes entirely — a free-roaming main snake with
   `atkCdMul 0.82` is already a real Hard mode.
5. **I did not spec Dig or the lasso tug-of-war.** Dig needs a second "hold Bite" meaning
   and would collide with Shake on touch; the tug would give the lasso a second escape
   input, which FU §3.2 deliberately refused ("dash does not break the grab"). Both are
   worse than the three above, so they are listed, not specced.
6. **Smallest viable version of this whole doc**: the mode table (§3.1) + Bark + the chain.
   That alone answers "easy/medium/hard" and "more to do than bite" for maybe a third of
   the work; Hard's living yard is the expensive half.
