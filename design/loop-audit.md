# Rosie vs. the Hose — Loop Audit

Read against `src/index.html` (lines 181, 274, 296–348, 399–468, 900–974) and
`design/art/art-direction-v2.md` §2. The question: is this satisfying to play, with a
concrete challenge and goal, or is it mindless tapping and sliding?

## 1. The loop as it actually is

**Moment-to-moment (~5–20s).** Rosie closes on the one glowing weak spot. Inside
`165*R.sc` of her mouth the spot leaps sideways (`hoseDodge`), bite-proof in the air,
on a `max(.16, .46-.04*level-.04*(phase-1))`s cadence. After
`1+min(level,3)+(phase-1)` leaps — 2 at L1P1, 6 at L4P3 — it is winded for
`max(.9, 1.75-.15*level)`s. That is the window: up to 3 bites, the third a RIP
finisher at 2x damage. Biting any other segment gives TOO TOUGH and a 0.28s stall;
biting nothing gives "whiff". Meanwhile one attack source fires every
`(1.25–1.95)*speedK` s, every one ground-telegraphed, every one dashable for a
Perfect Dodge. Correction to the brief: **the window is self-extending** — each
non-final bite sets `J.winded = max(J.winded, .6)`, so once bite 1 lands, bites 2 and
3 are effectively free. Also: letting a window expire with zero bites triggers
`spotBurst` (a punish bomb) from level 2 on, and a finisher relocates the spot
260–700px away via `moveWeak`.

**Level (~60–180s).** Empty `hoseHP` 100→0 in bites of `100/(16+4*level)` (finisher
2x). L1 = 5 full combos; L5 = 9; L10 = 14. Phase flips at 66% and 33%; phase 3 grows
a mid-rope second head. `power` +1 per bite and per Perfect Dodge; at `POWER_MAX=10`
BOOGA **fires itself** for 15s (half damage taken, 1.5x size, 1 leap to wind). Rosie
has 100 HP, 1s iframes, incoming damage scaled `min(1, .55+.15*level)` (0.70x at L1),
regen `max(1,4-level)*1.2`/s after 4s unhit, plus +20 treats every 8–12s. `won()`
awards 1 star, +1 for `dmgTaken<35`, +1 for `elapsed < 70+20*level`.

**Session.** `level++`, forever, no end state. Stars are stored per level
(`rosie2-stars-N`); score accumulates across levels and is **never stored or
displayed as a best**.

## 2. Verdict

**It is not mindless tapping — the skeleton is a real boss fight — but the decision
layer on top of that skeleton is currently thin, and the session has no goal.**

The genuinely good part: bait-the-leaps → earn-the-window is a legible, learnable
rhythm with a punish for being out of position (`spotBurst`), and at level 4+ holding
the 165px ring for six leaps while telegraphs land on you is real pressure. The
honest problem is that almost every *choice* inside that rhythm has been removed:

- **Tapping risk — the bite window.** `J.winded = max(J.winded, .6)` per bite plus
  the "BITE!" prompt and three UI pips means the correct play is always: mash bite
  three times. There is no moment where a player weighs the third bite against an
  incoming jet. The combo is a formality, not a decision.
- **Sliding risk — the traversal.** After every RIP, `moveWeak` throws the spot
  260–700px away. That is 1–3s of holding one direction with nothing to decide, five
  to fourteen times per level. This is the single largest share of playtime.
- **Dash is free.** `DASH_CD=.7` with `dashT=.3` means ~43% uptime on a window where
  being hit is *better* than not being hit (no damage, +25 score, +1 power). No
  stamina, no cost to a wasted dash. Dash also zeroes `R.recover`, cancelling the
  TOO TOUGH stall. The dominant strategy is to dash on cooldown always.
- **BOOGA is not a choice.** `doBite`/`hurt` auto-call `startBooga` at 10 power. The
  player's biggest power spike is something that happens *to* them — Submission
  aesthetic where Expression was available for free.
- **Position is inert.** `WORLD=3000` of yard, and location means only "distance to
  spot". Mud, puddles and obstacles are things to avoid; none is a tool.
- **Flat ceiling, rising length.** `speedK` floors at `.45`, the leap count caps at
  level 3, the damage multiplier caps at level 3, the winded floor at ~level 6. Past
  level 6 **the only thing that still scales is hose HP** — levels get longer with no
  new challenge. That is the shape of a game people put down.

L1 is now very safe: 0.70x damage, 1s iframes, 3.6 HP/s regen and treats against a
~2s attack cadence. The easing worked, possibly too well — L1 has close to zero
failure pressure, which also means close to zero stakes.

## 3. The goal problem

Inside a level the goal is perfect: one bar, one weak spot, an arrow with a distance
readout. Minute one is clear.

Across a session there is **no goal at all**. The game gives: "Hose #N" on a button,
three stars per level in localStorage that are never surfaced again, and a score that
is computed, multiplied by a combo up to 3.4x, shown once, and thrown away. It does
not give: an end point, a run total, a visible best, a star collection screen, or any
unlock. Nothing accumulates where the player can see it, so there is no reason to
start hose 5 other than that the button exists. A player in minute one cannot answer
"what am I working toward?" — and that, more than the combat, is why a session ends.

## 4. Prioritised changes

**MUST**

1. **Make the third bite a real decision.** `doBite` — drop
   `J.winded=max(J.winded,.6)` to a shrinking grant: `.42` after bite 1, `.30` after
   bite 2. Re-weight damage so greed pays: `unit*(step===1?1:step===2?1.4:2.4)`. Now
   bite 3 must be timed and is worth skipping when a telegraph overlaps you.
2. **Give dash a cost.** `tryDash`/`updRosie` — 3 charges, one regenerating per 1.6s;
   a Perfect Dodge refunds its charge. Keep `DASH_CD=.7` as the between-dash floor.
   This turns dodging from a reflex into resource management and makes precision pay.
   Add a 3-pip stamina readout beside the power meter in `hud`.
3. **Player-triggered BOOGA.** Remove the `startBooga()` calls in `doBite` and
   `hurt`; hold at `POWER_MAX` with a "BOOGA READY" pulse and spend it on a new key
   (`B` / a third touch button). Biggest autonomy gain per line changed.
4. **Stop scaling hose HP past level 5; scale behaviour instead.** `doBite`:
   `unit = 100/(16+4*Math.min(level,5))`. `hoseDodge`: leap requirement
   `1+min(level,3)+(phase-1)+floor(max(0,level-5)/2)`. `updAttacks`: attack cooldown
   `*max(.7, 1-.04*(level-5))`. Levels stay ~9 combos long and get *harder*, not
   longer.
5. **Make the session goal legible in minute one.** Declare a finite campaign — 8
   hoses — then an endless Yard Mode. Show "Hose 1 of 8" in the `lvl` chip and on the
   start card, a `★ x/24` total on the title card read from the existing
   `rosie2-stars-N` keys, and a distinct final-victory card in `won()`.
6. **Persist the score.** `won()` — `store.set('rosie2-best', max(prev, score))` and
   show "Best" next to Score on the win and title cards. The combo multiplier already
   makes score a skill expression; it currently expresses it into a void.

**SHOULD**

7. **Make the walk a consequence.** `moveWeak` — relocation distance keyed to
   performance: after a full RIP, 200–320px (tempo reward); after a bailed or expired
   window, 500–800px. Bias one treat or knockable pot into the new path. Greed now
   buys pace, and the traversal stops being uniform dead time.
8. **Price the whiff.** `tryBite` — on a TOO TOUGH or whiff while the spot is winded,
   set `J.winded = max(0, J.winded - .25)`. Mashing bite on approach costs window.
   Also make dash cost 2 stamina charges while `R.recover>0` so it is a deliberate
   cancel, not a free one.
9. **Give the yard one tactical use.** `updSprinkler` — a rope segment inside an
   active sprinkler cone takes 1.5x bite damage, with a visible tell; `moveWeak` biases
   the spot *away* from sprinklers so overlap is something the player engineers by
   baiting leaps in that direction. One rule, and position starts mattering.

**NICE**

10. Soften the combo reset — `hurt`: `combo = Math.floor(combo/2)` instead of `0`.
11. Show next level's star thresholds on the win card (`won`): "3 stars: under 1:50,
    under 35 damage", so the next run starts with a stated target.

## 5. What only a human playtest can answer

1. At hose 1, did you ever feel genuinely in danger? If you died anywhere, what
   killed you — an attack you did not see, or one you saw and mistimed?
2. When "BITE!" appeared, was there ever a moment you chose *not* to take the third
   bite? If never, the window is not yet a decision.
3. The walk to the next weak spot — a welcome breather, or dead time? Roughly how
   many seconds before it starts to drag?
4. Did you notice BOOGA TIME beginning, and did it feel like something you earned or
   something that just happened?
5. Did you ever feel dash was a resource you could run out of, or did you just hold
   it down?
6. After clearing hose 2, what did you believe you were playing toward? Say it in one
   sentence.
7. Which hose did you stop at, and was it because it was too hard, too long, or
   because you had stopped being surprised?
8. Did anything in the yard — mud, puddles, pots, sprinklers, the pool — ever change
   where you chose to stand?
