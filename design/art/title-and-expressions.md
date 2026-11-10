# Title Screen, Rosie's Face & Expression System — a delta on art-direction-v3

Scope: the home screen panel, Rosie's fur and face, and her expressions. **v3 stands everywhere else**
— sunset stops, the relight, `RAMP`, the thin warm ink, `rearK`, the guardrails. Only lines named here change.

The reference sheet is the user's own AI-generated artwork of their own dog — the same dog Rosie is
based on — so it is a **direct target for how Rosie should look**, not just a mood board. Two limits
hold: the name on the sheet is not hers (she is **Rosie** everywhere), and this is a sunset boss
fight, so we take the warmth and craft and leave the sleepy pacing.

## 1. Rosie's fur: warm cream with a warm shadow

**The single biggest gap.** The reference fur is warm cream lit, **warm putty-beige in shadow**, with a
rim of light along the top and curls grouped in clusters. Ours is near-white lit with a **cool mauve**
shade side, which is why she reads grey-lilac at play distance in `sunset-play.png`.

| Token | Now | Target |
|---|---|---|
| `FURC` (lit) | `#fffaf0` | **`#fff3dd`** — warm cream, not paper white |
| `FURS` (shade) | `#c3aed6` lilac | **`#c7ae9c`** warm putty |
| `wFur()` mix | `mix(hex,'#7d5fa8',.50)` | **`mix(hex,'#8a6456',.48)`** — same value depth, warm hue |
| rim (new) | — | **`#ffe6c0`** on `rimL` only |

**This contradicts v3 §5**, which says the lilac shade is "the one cool note on a warm character — do
not warm it." That rule existed to keep Rosie off the warm deck. The reference's answer is better:
separation comes from **value and rim, not hue**. Three things pay it back — v3 already pushed the
planks cooler and darker (`#a2574a`), the shade mix stays at .48 so the value step is unchanged, and
`rimL` (item 7) puts a hard light edge along her top silhouette. **Trade-off flagged for
`creative-director`:** if the post-change contrast shoot fails on the deck, the fix is a deeper
`FURS` (`#b89c88`), not a return to lilac. The wet lerp to `FWET` and the `FURW` wardrobe set are
untouched; `wFur()` keeps rebuilding both colours.

**Curl clusters.** The reference's fluff is clusters of 3–5 curls of differing size, not an even
scatter. In the head loop (line ~1234) and the body loop, replace the uniform `11+(i*3%4)` radius with
clustered radii **9–14** in groups of three around five seed directions. v3's six warm-tinted curls
stay. All of it is inside `bake()` — zero new draw calls.

## 2. Rosie's face

Primitives only; nothing imported. Where the reference is clearly better:

- **Eyes rounder and larger.** `dEyes` radius 12 → **13**, scale `(.6,1.1,1)` → **`(.62,1.0,1.06)`**.
  The reference eye is a round dark bead, not our vertical ellipse.
- **Darker and more liquid.** Reference eyes read dark brown with the amber only on the lit rim.
  `irisM` `#9c6336` → **`#7a4a24`**; pupil scale `.60` → **`.74`**, so the iris is the warm rim the
  reference shows, not v3's wide ring. `eyeM` stays `#2a1a22`.
- **Highlights.** Keep v3's three glints, but mirror the primary per eye (`z = s*.30`) so both
  catch the *same* light: primary radius .50 → **.54** at `(.95,.52,s*.30)`, secondary .21 at
  `(1,-.45,-s*.30)`, bounce crescent unchanged. One shared source is what makes the pair read alive.
- **Nose smaller and warm brown.** `noseM` → **`#7a4e42`**, radius 6.5 → **6.0**, scale
  `(.85,.8,1.15)` → **`(.8,.72,1.1)`**; its glint 1.5 → **1.8**, kept upper-left.
- **Muzzle.** `peachM` patch scale `(1,.9,1.2)` → **`(1,.85,1.4)`** — the reference's muzzle is short
  and wide, and the warm patch around the nose is what keeps the lower face from going flat.
- **Ears hang lower and read as clusters.** Per ear add a third `furS` sphere, r10 at `y −62`, and
  widen the existing lower ball 12 → **14**. The ears then frame the face and fall below the muzzle
  line, as in every pose on the sheet. +2 meshes, both inside `bake(e,furS)` — **0 draw calls**.
- **Brows smaller.** `dBrows` scale `(4.5,4.5,9)` → **`(4,3.6,8.5)`**; they are tufts, not shelves.
- **Blush lower, wider, coral.** `#ff8fa3` @.5 → **`#ff9f8a`**, base opacity **.18**, position
  `y −6` → **−9**, scale `(.4,.7,1)` → **`(.4,.62,1.25)`**. **Clone the material** — line 1244 shares
  one `MB()`, and section 3 animates opacity per frame.

## 3. The expression system

The sheet's strongest idea, and now followable literally. Nothing new is modelled: `dEyes`, `dBrows`,
`dEars`, `dMouth`, `dTongue`, `dBlush` and the nose already cover it.

**One vector, never a crossfade.** `EXPR` is a table of **ten floats**: `eyeY`, `eyeX`, `pupS`,
`pupY`, `pupOut`, `brow`, `ear`, `mouth` (0 shut → 1 wide), `tongue`, `blush`. The face is a single
`cur[10]` lerped toward `tgt[10]`. Because every expression is the same vector, **any interpolation
between two of them is itself a valid face** — she can never be caught half-in-one-pose, which a
two-pose crossfade cannot promise.

| Name | Eyes | Pupil | Brow | Ears | Mouth / tongue | Blush | Game state |
|---|---|---|---|---|---|---|---|
| `bright` | y 1.00, x 1.00 | centred, .74 | 0 level | neutral flap | shut, tongue in | .18 | **idle** |
| `panting` | y .80 | down −.06 | +.10 | back `z −.08` | open .55, tongue out, bobs 6 Hz | .30 | **running** |
| `determined` | y .62 | up +.10, **.62** | **−.55** | back `z −.14` | open .70, tongue in | .14 | **biting / chomp / thrash** |
| `startled` | y **1.22**, x 1.10 | up +.05, **.52** | **+.60**, raised 5 | flat out `x ±.55` | small round .35, tongue in | **.35** | **being lassoed**, any telegraph <200 u |
| `dizzy` | y .42 | **out ±.18** | −.30 outer | drooped `x ±.05` | open .40, tongue out, 2 u low | **.55** | **taking damage**; held on **losing** |
| `fierce` | y .70 | centred, **.58** | **−.75** | back `z −.18` | open .85, tongue out | .20 | **BOOGA TIME** |
| `delighted` | y **.35** (closed happy arcs) | hidden by the squash | +.35 | perked `z +.14` | wide .95, tongue out ×1.25 | .45 | **winning a level** |

Three of these are read straight off the sheet's expression row: `delighted` is its tongue-out smile
(closed arcs, big tongue, hot blush), `startled` is its wide-eyed pose — **including the blush, which
stays on**; ours previously dropped it to zero, which was wrong — and the sheet's sleepy face is the
closed-arc shape `delighted` reuses, so no eighth entry is needed.

`fierce` replaces v3's "happy-arc eyes fire on `booga`" (line 1685, `happy=booga||happyT>0`). Arcs read
cosy; BOOGA is the power state. It keeps the round eye and the blush, so she reads *tiny dog with
enormous attitude*, never aggressive.

**Selection and blending.** One priority ladder per frame, highest wins: `dizzy` > `startled` >
`determined` > `delighted` > `fierce` > `panting` (`R.speed>25`) > `bright`. Blend with
`1-Math.exp(-dt/τ)`: **τ = 0.12 s default**, **0.04 s entering** `dizzy`, `startled`, `determined` (a
lagging reaction reads as a bug), **0.18 s leaving** `delighted`. A **0.25 s minimum hold** on every
expression but `dizzy`, which always pre-empts, so a flickering state cannot strobe her face. The
3.7 s blink (`shut`) stays a multiplier **on top of** `eyeY`, not an eighth expression. `reduce`
keeps every expression at a flat τ 0.12 s.

## 4. The title and home screen

**What the reference does better than `sunset-title.png`:** it inverts the value relationship (deep
blue-violet ground, warm cream type — the *letters* are the light, where our cream `--paper` slab is
the brightest object on screen); it has one focal point, where our card stacks six competing blocks
and a nine-row `dl.how` grey texture; its type is one warm family, where our cream + `--sun` +
`--go-g` lockup puts the darkest mass on *the villain's* name; its motifs are sparse and tonal; and
its fur has the rim and warm shadow section 1 now adopts.

**Stays:** card docks left, Rosie right; the `.logo` is live text in three `.w` spans with per-letter
rotations; eyebrow, difficulty segment, `.go` button, `aria-label`. HUD, pause and results cards keep
`--paper` — **this repaint is scoped to `#startOv .card` only.**

| Token | Hex | Use |
|---|---|---|
| `--t-panel` / `--t-panel2` | `#2b2152` / `#3a2b68` | panel fill, vertical gradient |
| `--t-edge` | `#19102e` | 3 px border + `0 8px 0` drop |
| `--t-cream` / `--t-body` | `#ffeeda` / `#e8d4bc` | headline / paragraph text |
| `--t-amber` | `#ffb062` | eyebrow, `vs.`, `kbd` — the v3 horizon hex, so UI and sky agree |
| `--t-hose` | `#2fd98a` | "the Hose" only; `--go-g` goes muddy on a dark ground |

Behind the lockup, the reference's lamp glow: radial `#ff9a5a` @.22, 260 px — the panel's value anchor.

**Type.** Same font stack and rotations. "Rosie" → `--t-cream`, the brightest text on screen; stroke
recolours to `--t-edge` and drops 4 → **3 px**; shadow `0 8px` → **`0 5px`**; "the Hose" takes
`--t-hose` one size step down (clamp cap 51 → **46 px**), so hierarchy is Rosie > the Hose > vs.
**Web-font failure is a hard requirement:** live text, never an image; `--display` keeps its Arial
Rounded / Trebuchet fallbacks; `.logo .w` keeps `white-space:nowrap` and gains `max-width:100%`.
Acceptance — font blocked in devtools, at 360 px and 1920 px: three lines, inside the card, no
horizontal scroll. Screenshot both.

**Motifs — two.** **Paw prints** (`--t-cream` @.07, three, 20–28 px, rotated −14°/+9°/−3°, behind the
text) and **sparkles** (four-point, `#ffd9b0` @.35, max four, 3 s offset twinkle, off under
`prefers-reduced-motion`). No bone, no hearts — both signal cosy collect-and-nap. The sparkle shape is
reserved for section 5.

**Framing and light.** In the `state==='title'` branch (~line 1647): `ch` 250/300 → **215/265**,
`cd` 450/560 → **400/500**, `ly` 130/190 → **150/205** (head and chest, not feet), `hx` factor `.46` →
**`.52`** wide. Add **`rimL`**, a non-shadow `DirectionalLight` `#ffd0a8` @0.9 at
`(camTX+900, 420, camTZ+520)`. That back-left rim is the reference's fur trick and costs zero draw
calls. **Background quiet, not empty:** `scene.fog.near` 1900 → **900** at title so fence, bunting and
trees sink into `#ff9a74`; bunting and critters hidden; sun disc framed right of centre behind her as
the rim's visible source. Her title face is `bright`, blinking.

## 5. Gameplay-art touches worth taking — four

1. **The warm rim in play, not just title.** On the v3 deck Rosie's value contrast is weakest exactly
   where she fights, and the thinned 1.8 px `INK_R` gave up silhouette. The rim buys it back, and it
   is what makes section 1's warm shade safe.
2. **Sparkles as the reward vocabulary.** Four-point `#ffd9b0` on bite-connect, weak-spot break and
   treat pickup, pooled through `updParts`. The danger kit is red/amber *shapes*; reward now has its
   own shape and hue, so the two never trade on hue alone. Asset: `vfx_sparkle_4point_small.png`.
3. **Blush as a damage readout.** Drive `dBlush` opacity from `.18 + .5*(1-R.hp/R.hpMax)`, under the
   per-expression value. Her face carries the health bar — a glance tells you how she is doing.
4. **Paw-print ground stamps on dash and pounce.** `#ffeeda` @.25, fading 0.6 s, max 8, one
   `InstancedMesh`. The sheet's own motif, reading as her territory, on a busy deck. One draw call.

The pixel-art row, the bone, the hearts, the minimap frame and the storefront strip stay behind —
cosy-exploration furniture.

## 6. Build list

1. **MUST — Fur repaint.** `FURC` `#fff3dd`, `FURS` `#c7ae9c`, `wFur()` → `mix(hex,'#8a6456',.48)`.
   Keep the `FURC`/`FURS` rebuild intact; the `FWET` lerp depends on it.
2. **MUST — Face geometry and materials.** Section 2 in full: `dEyes` 13 at `(.62,1.0,1.06)`,
   `irisM` `#7a4a24`, pupil .74, the mirrored primary glint, `noseM` `#7a4e42` at r6.0, the muzzle
   patch, the third ear sphere and the widened lower ball, `dBrows`, and the cloned `dBlush`.
3. **MUST — `EXPR` table and blend loop.** The ten floats, the ladder, the τ values and the 0.25 s
   hold, replacing the ad-hoc `shut`/`happy`/`browS` logic at line 1685. `browS` stays as the brow
   channel's backing float.
4. **MUST — BOOGA goes `fierce`.** Remove `booga` from the `happy` term; route it through the ladder.
5. **MUST — `rimL`,** `#ffd0a8` @0.9, non-shadow. Title first, then always-on (item 10).
6. **MUST — Title panel repaint and logo recolour.** The seven `--t-*` vars scoped to
   `#startOv .card`; "Rosie" `--t-cream`, `.w2 i` `--t-amber`, `.w3 i` `--t-hose`, stroke 3 px,
   shadow `0 5px`, `.w3` cap 46 px.
7. **MUST — Font-failure proof.** `max-width:100%` on `.logo .w`; retain both screenshots (360 px,
   1920 px, font blocked) in `production/qa/evidence/`.
8. **MUST — Title camera and quiet background.** `ch`/`cd`/`ly`/`hx`, `fog.near` 900, bunting and
   critters hidden at title.
9. **MUST — Contrast re-shoot.** Warm fur against three sky states × lawn and deck × three attack
   types, retained in `production/qa/evidence/`. This gates item 1: if it fails, `FURS` deepens to
   `#b89c88` — it does not go back to lilac.
10. **SHOULD — `rimL` extended to play,** after item 9 passes.
11. **SHOULD — Curl clusters and panel motifs.** Clustered radii 9–14 in the head and body loops; the
    three paw prints and four sparkles on the panel.
12. **SHOULD — Blush-as-damage.** `.18 + .5*(1-R.hp/R.hpMax)` multiplied into the expression `blush`.
13. **NICE — Sparkle rewards and paw stamps.** `updParts` emitter; one `InstancedMesh` of 8 paw quads
    from `R.dash` and pounce landings.

**Budget.** 535 of 620 in normal play. Items 1, 3, 4, 12 reuse existing meshes (0). Item 2's two ear
spheres are inside `bake(e,furS)` (0). Items 5 and 10 are lights (0). Items 6–8 and the panel motifs
are CSS (0). Item 13 is **+1**. Net **+1**, landing at **536**. One new texture, the sparkle sprite.

**Open item for `ux-designer`, not decided here:** the nine-row `dl.how` is the title's hierarchy
problem. The visual recommendation is four rows visible (Move, Bite, Dash, Booga) with the rest behind
a disclosure — but the disclosure pattern is interaction design, so it goes to `ux-designer` as a note.
