# The Living Hose & Giant Dance Mode — a delta on art-direction-v3

Source: the user's own AI-made concept art of their dog and this game, adopted as direction. The name
on the art is not hers — she is **Rosie** everywhere. `art-direction-v3.md` (sunset, `RAMP`, ink,
`rearK`), `title-and-expressions.md` (fur, face, `EXPR`) and `painted-garden.md` (foliage, density)
all still stand. Nothing here changes a foliage rule or a palette already set in v3.

**Budget:** 535 of 620 in normal play. This doc spends **+12**, landing at **547**. No image files —
every texture is `ctex()` at runtime.

## 1. The Living Hose

### 1.1 The dragon head (`nozHead`)

Keep the group, the 1.6 scale, `nozEyes`, `nozJaw` and `trackEyes()` — only the meshes inside change,
so the aiming, jaw-drop telegraph and eye tracking keep working untouched.

| Part | Build | Lit / shade hex |
|---|---|---|
| Skull | the existing r8 ×26 barrel cylinder, scaled `(1,.78,.92)`, plus a wedge snout cone r6 len 20 forward | `#7f9a8c` / `#4e635a` |
| Brow ridge | one squashed box 16×4×18 at `(4,14,0)`, tilted `x −.18` | `#5e7368` |
| Horns | 2 cones r3.5 len 26 from `(−2,16,±8)`, swept back `z +1.1`, `y ±.35`; 2 smaller r2 len 14 behind them | `#4a4258`, tips `#b9a9c9` |
| Lower jaw | `nozJaw` unchanged in rig; its half-cylinder re-skinned, mouth interior added | jaw `#7f9a8c`, interior `#5a1026` |
| Fangs | 4 cones r2.2 len 9 (2 upper at `x 14`, 2 lower on `nozJaw`) — **rounded tips, scale `y .9`**, per the v2 do-not list | `#f4efe2` |
| Throat/belly plates | 3 stacked squashed spheres under the jaw | `#dfd6c4` |
| Eyes | `angryEyes()` unchanged at `(2,11,9)` — white `#ffffff`, pupil `#e63946`, brow `#3b0d1c` | — |

**The eyes do not glow.** The concept's eyes are hot magenta lamps; that is exactly the hue the BOOGA
tint uses and it sits 20° off the warning red. Emissive eyes on a head that moves across the whole
yard would be a second bright point competing with `weak3`. The head reads menacing through
silhouette — horns, brow, jaw — not through light. This is the first thing I am refusing from the
concept, and it is the right refusal.

### 1.2 The body, and how the four states survive

`hose3` is **one `TubeGeometry` with one material** (line 2006–2007), so nothing can be tinted per
segment. `hoseM.color` is the state channel and must stay the state channel:

- healthy `HOSE_G #28cd6d` → chewed, lerped to `HOSE_W #a9bf52`
- winded/bitable: flashing `HOSE_Y #e4f76a` at 20 rad/s — **unchanged, this is the bite cue**
- BOOGA: `HOSE_P #b5179e` at 10 rad/s
- the hot band is its own sleeve (`hot3`, `HOT_A/E/H/C`) — **do not touch it**

The concept's pale coiled body therefore arrives through the **multiply map, not the colour**. Repaint
`hoseTex` (64×64, already `repeat` `N*SEG/64`): pale belly band `#f2ece2` across 26–39 px (widen from
the current `#e6e6a8` stripe), dorsal scale rows as 7 overlapping chevrons `#9a9aa2` on `#c8c8c8`,
two hairline cracks `#6e6e78`. Because it multiplies, every one of the four state colours still shows
through at full strength — green still reads green, the winded flash still flashes.

**The glowing energy is an `emissiveMap`, not a mesh.** Second 64×64 `ctex`, black except a 3 px seam
running the tube's length with 5 blobs per tile; set `hoseM.emissiveMap` and scroll its `offset.x`
with the existing `hoseTex` line at 2008. Drive `hoseM.emissive` per state: healthy `#0e5a33`,
chewed `#2a5a1e`, winded **`#6a7a12`** (dim — never compete with the yellow flash), BOOGA `#7a0f66`.
Zero draw calls, zero meshes.

**Magenta is a BOOGA word, not a boss word.** In the concept the hose glows magenta all the time. If
we do that, the BOOGA tint stops meaning anything and the seam sits 20° from `#ff0f46`. So the seam is
green-cyan in normal play and only goes magenta during BOOGA and phase 3. Second refusal, same reason.

### 1.3 Brass fittings

4 collars max, as one `InstancedMesh` of a 12-sided cylinder (r10.5, len 13), positioned each frame on
`rope[]` at i = 6, 24, 42, N−9 with the tube's local tangent. Lit `#c9962f`, `metalness .6`,
`roughness .35`, **no emissive**, ink off. `#c9962f` is a full value step below the weak spot's
`#ffd23f`, which is how it stays legal under v3's amber reservation — brass is the one amber-family
thing allowed in the play area and it earns that by being dark and metal. If the contrast re-shoot
shows a collar reading as a weak spot at distance, the fix is `#a87c22`, not a wider ring. **+1 call.**

### 1.4 The other heads

- **`midHead`** becomes a second, smaller dragon head: the same kit at `.7` scale, slate `#6b8a7c`,
  one pair of horns, 2 fangs. Still phase 3 + grabbed only. Its `midEyes`/`trackEyes` call is unchanged.
- **The two `SN_MESH` snakes stay headless.** They are silhouette and threat-count; two more heads
  cost 2 calls and put four tracking faces on screen at once, which is where menace turns to noise.
- **The white gloved hands** are charming and off-critical-path: 2 baked groups (palm sphere + 4 stub
  fingers, `#fdfbf6`, ink on) parented near `rope[MID±6]`, visible only with `midHead`. **NICE, +2.**

### 1.5 The weak spot is untouched

Not one value in the `weak3` / `weakGlow` / `weakRing` / `weakCore` / `weakTickG` / `weakBeam` kit
changes. Two new guardrails protect it from everything above: the body `emissive` drops to **40%**
within 260 units of `rope[weak]`, and no new boss part may carry `emissive` at all.

## 2. GIANT DANCE MODE

**Rename, UI only.** "BOOGA TIME" → **GIANT DANCE MODE** in `powLbl` (`'BOOGA!'` → `'DANCING!'`,
`'BOOGA READY'` → `'DANCE READY'`), `boogaChip`'s span, the `boogaBtn` face ("Booga" → "Dance") and
its two `title` strings, and the big banner ("IT'S BOOGA TIME!" → "GIANT DANCE MODE!"). **Code
identifiers stay** — `booga`, `boogaK`, `boogaT`, `boogaBtn`, `startBooga`, `bLen()`. Renaming them is
not an art decision and buys nothing a player can see.

**Size, visual-only.** New eased float `danceS` (0→1, rise 0.5 s ease-out, fall 0.3 s), multiplied into
**`dogP.scale`** — `dogP.scale.multiplyScalar(1+.30*danceS)` after line 1981's dash squash. It is
`dogP`, not `dog`, and not `R.sc`: `R.sc` feeds collision and camera, so growing it would be a
gameplay change I do not own. 1.30× plus the `rearK` rear-up already reads as "huge" against a
knee-high hose.

**Halo.** One camera-facing `CircleGeometry(74,24)` `dHalo` above the head at `y 196`, `ctex()` 128×128
soft ring (inner `#ffe6c0` at .55 → outer transparent), `AdditiveBlending`, `depthWrite:false`,
opacity `.42*danceS`, slow `rotation.z` at 0.4 rev/s. **+1.**

**Iridescent ribbons.** One pre-built `TubeGeometry` helix (3 turns, r 62, height 240, radius 4,
16 tubular × 5 radial) parented to `dogP`, spinning `rotation.y` at 0.6 rev/s and scrolling a 256×8
`ctex()` gradient along its length. **+1, one texture.**

The rainbow has two holes in it. The gradient stops are `#7de8ff · #9b8cff · #ff8fd0 · #a8ff9b ·
#7de8ff` — **no stop inside `#ffb062`–`#ffd23f`, none within 25° of `#ff0f46`**, the same hue
reservation `painted-garden.md` §3 puts on the foliage atlas. An unfiltered spectrum ribbon orbiting
Rosie would put weak-spot amber and warning red into her silhouette several times a second.

**Sparkle trails.** Already built: `updCritters` emits `type:'sparkle'` at `dt*10` during booga
(line 1872). Raise to `dt*22`, emit on a ring `r 70*danceS` around her rather than a box, and restrict
`hue` to the two existing bands (265–295, 130–160) — they are already outside the reserved hues. **0.**

**Tail.** `dTail.scale.x = 1+.55*danceS` and the existing wag amplitude `(.7+.4*rearK)` rises to
`(.7+.4*rearK+.3*danceS)`. The ribbon's lowest turn passes behind the tail, which is what sells the
streaming read. **0.**

**Start and end.** `danceS` rises with the existing white `$('wash')` flash (line 1963, already
`boogaK*.3`); peak it to `.45` for 0.12 s on entry. Exit: ribbons and halo fade over 0.3 s, Rosie
shrinks over 0.3 s. `reduce` pins `danceS` to 0 and hides halo and ribbons — scale is motion, not
information, same rule `rearK` already follows.

**Readability.** Halo and ribbon opacity multiply by **0.35** whenever any telegraph is within 260
units of Rosie or a lasso is live (reuse the `warn` boolean already computed at line 1986), and both
take `renderOrder 1` — below `weakCore`'s 2 — with `depthWrite:false`, so they can never draw over the
weak spot. **Cost: +2 calls, +2 textures.**

## 3. The HUD

Everything below keeps `rFill`, `hFill`, `pFill`, `lvl`, `score`, `comboChip`, `phaseLbl`, `powLbl`,
`mRosie`, `mFoe`, `mView` working with their current JS. `hud()` changes by two lines.

**Portraits.** `.port.rosie` / `.port.foe` / `.port.star` already exist as 24 px round CSS gradient
discs. Replace the gradients with a painted canvas: one `portrait(kind)` painter, 96×96 via the same
`ctex()` canvas path, assigned once at boot as `el.style.backgroundImage='url('+c.toDataURL()+')'`.
Keep the 3 px `--ui-ink` border and `0 3px 0` shadow — the frame is what makes them read as portraits.
- **Rosie:** head-and-ears three-quarter, `#fff3dd` lit / `#c7ae9c` shade (the §1 fur hexes), two
  `#2a1a22` eye beads with a `#fffaf0` glint, `#7a4e42` nose, `#ff9f8a` blush, on a `#3a2b68` ground.
- **Foe:** the dragon head in profile — `#7f9a8c` skull, `#4a4258` horn, one `#e63946` eye, `#f4efe2`
  fang, on `#19102e`.
- **Star:** unchanged (`#ffd23f` clip-path star).
- **Badge icon (new):** 20 px, Rosie's dancing silhouette `#ffeeda` on `#9b5de5`.

**Hearts.** `#rFill` stays, keeps its `style.width` percentage and its three colour steps. The change
is CSS only: `.meter.hp .bar` gets `mask-image` of a 3-heart SVG data URI (`mask-size:100% 100%`), so
the fill drains left-to-right *through* heart shapes. Partial health reads as a partly-drained heart,
which is strictly more information than the concept's whole-hearts-only row. Hearts are
`height:19px`, 4 px apart. Browsers without `mask-image` fall back to today's bar — no JS branch.

**Boss name.** `phaseLbl` text becomes `'The Living Hose'` / `'The Living Hose · Phase N'`
(line 2102). The `.meter small` pill keeps its ink background and −2° rotation; drop its
`letter-spacing` to `.04em` and allow `white-space:nowrap`.

**Mode badge.** `#boogaChip` becomes the labelled badge: badge icon + two-line label `GIANT DANCE /
MODE` at 10 px, `--pow` ground, `#ffeeda` text, shown on `bk` as today and also while `booga` is live
(one condition change in `hud()`). It sits at the row's end so it never pushes `lvl`/`score`.

**390 px.** The meters row at 390 is the risk. Order and allocation: **row 1** Level · Score · combo ·
map (flex `1 1 104px`) · the three `.hbtn`s; **row 2** Rosie portrait 24 + hearts 72 | foe portrait 24
+ name pill + `hFill` bar flex; **row 3** star 24 + `pFill` + stam pips + mode badge. Extend the
existing `@media (max-width:520px)` block: `.port` 21 px, hearts `height:16px`, name pill 9 px and
shortened to `'Living Hose'`, mode badge to a single line `GIANT DANCE`. Nothing wraps; nothing
overlaps the 3D.

## 4. Squirrel reactions

There are **no squirrels in the build today** — `crit3`/`spawnCritter` are sky creatures (chicken,
fish, shark). Add `'squirrel'` as a fourth type in the same function, using the same
group → `ink(g)` → `crit3` pattern, with two differences: it spawns on the ground at the yard edge
(`y 0`, 600–1400 units out, outside the 220-unit combat lane `painted-garden.md` §2.3 reserves) and it
does not fly. Body from the existing primitives: `#b9743c` body sphere `(1.1,.9,.9)`, head r11,
`#e8c49a` belly, a cone-and-sphere plume tail, `#2a1a22` nose.

**Star-struck eyes:** two flat `PlaneGeometry(9,9)` quads carrying the existing four-point sparkle
texture (`vfx_sparkle_4point_small`, already specced in `title-and-expressions.md` §5.2) in `#ffd9b0`,
`MeshBasicMaterial`, spinning `rotation.z` at 1.2 rev/s. **Tumbling:** `rotation.z += 5*dt` plus the
existing `y0 + sin(ph*3)*18` bob, repurposed as a ground hop. Trigger on weak-spot break and on
GIANT DANCE MODE entry, 3 live max, 2.5 s life, no shadows. One `bake()`d group + ink each.
**+6 calls at the cap**, and they only exist during reactions.

## 5. Mood: sunset or the concept's dusk

> **RULING (user, 2026-11-10): stay daytime.** The concept art's dusk is not adopted.
> Do not repaint the yard to night, and do not ramp the light darker as the hose takes
> damage — the sky still shifts toward green with `skyP`, but overall brightness stays
> put. Lantern and windmill remain NICE and must not imply nightfall. Anything below
> that reads as a move toward dusk is out of scope.

**Recommendation: do not repaint to dusk. Let the fight walk there instead.**

The concept is a single painted frame at dusk; v3's entire readability guardrail set — the amber weak
spot against `#ffb062`, the magenta-ward `#ff0f46`, the `#ffe14a` fan with its ink border, the darkened
planks — is calibrated against the sunset. A global dusk repaint would genuinely *help* the glowing
elements (more value headroom under every emissive) and would *hurt* three things: the toon ramp's
terminator loses the raking warm key that makes the fur read as fur, `title-and-expressions.md`'s warm
cream fur loses the light it was chosen for, and the ink line at `#5a3a46` disappears into a dark
ground. That is a re-derivation of four documents to buy one screenshot.

The cheap version of the same idea already exists. `skyP` ramps the sky as the hose is chewed; extend
it so the *light* ramps too — `sun` intensity 1.25 → **0.95** and `hemi` `HEMI_G[1]` toward
**`#1e2a4a`** at `skyP = 1`. The yard dusks as the fight goes badly, which is the sky-as-mood-ring
pillar reaching the ground, and it costs two lerps. Take three concept cues outright, all NICE:
the **cottage lantern** lit (`emissive #ffb062`, existing mesh, 0 calls), the **deep blue-green
planting shade** (`painted-garden.md`'s per-instance `setColorAt` cool tint pushed to −18% on the
border zone only, 0 calls), and the **windmill silhouette** on the ridge line (+1).

## 6. Build list

1. **MUST — The dragon head.** §1.1 inside `nozHead`; `nozEyes`, `nozJaw`, `trackEyes()` untouched.
   Re-`ink(nozHead)`. Biggest visible change in the doc. **0 net.**
2. **MUST — Giant Dance Mode transformation.** `danceS`, `dogP.scale`, `dHalo`, the ribbon helix, the
   tail terms, the `reduce` pin and the `warn` dimming. §2. **+2.**
3. **MUST — Hearts, portraits, boss name.** The `portrait()` painter, `.port` backgrounds, the
   `.meter.hp .bar` heart mask, `phaseLbl` → `'The Living Hose'`. `rFill`/`hFill` JS unchanged. **0.**
4. **MUST — Body skin and energy.** `hoseTex` repaint + the `emissiveMap` and the four `hoseM.emissive`
   states, scrolled on the existing line 2008. `hoseM.color` state logic untouched. **0.**
5. **MUST — The rename.** `powLbl`, `boogaChip`, `boogaBtn` face and titles, the banner. Identifiers
   stay. **0.**
6. **MUST — Weak-spot guardrails.** The 260-unit `emissive` dim, the no-emissive rule on boss parts,
   ribbon/halo `renderOrder 1` and the reserved-hue stops. **0.**
7. **SHOULD — Brass collars.** The 4-instance `InstancedMesh` on `rope[]`, §1.3, plus the `#a87c22`
   fallback. **+1.**
8. **SHOULD — Mode badge and the 390 px layout.** `boogaChip` as the labelled badge, the badge icon,
   the extended `@media (max-width:520px)` block. **0.**
9. **SHOULD — `midHead` as the second dragon head.** `.7` scale kit; `midEyes` unchanged. **0.**
10. **SHOULD — Squirrel reactions.** The `'squirrel'` branch in `spawnCritter`, the sparkle eyes, the
    tumble, the 3-live cap and the combat-lane exclusion. **+6 at cap.**
11. **SHOULD — Dusk on the `skyP` ramp.** `sun` 0.95 and `HEMI_G[1]` `#1e2a4a` at `skyP = 1`. **0.**
12. **NICE — Lantern, cool border planting, windmill.** §5. **+1.**
13. **NICE — The gloved hands.** 2 baked groups with `midHead`. **+2.**
14. **MUST (gate) — Evidence.** Retain in `production/qa/evidence/`: the dragon head at three body
    states beside a live weak spot; Giant Dance Mode at full `danceS` with a telegraph active; the HUD
    at 390 px and 1280 px. Item 7 does not close until the brass-vs-weak-spot shot passes.

**Total +12 → 547 of 620** (NICE items included; **540** without). Four new textures: the body
emissive seam, the halo ring, the ribbon gradient, and the portrait canvases.
