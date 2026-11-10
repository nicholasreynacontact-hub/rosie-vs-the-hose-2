# The Painted Garden — closing the gap to the reference

A delta on `art-direction-v3.md` and `title-and-expressions.md`. Both still stand: sunset stops, the
relight, `RAMP`, thin warm ink, warm fur, `EXPR`, `rimL`. **Nothing here changes a colour.** Two
passes have already changed palette, lighting and shading and the user says it still feels the same,
so this document is about geometry, density and silhouette instead.

## 1. Why the last two passes did not land

Put `sunset-play.png` next to the reference and the difference is not hue, value or shading — it is
**what is in the frame**.

1. **Every object in our build is a smooth primitive, so every silhouette is an arc.** A bush is
   three spheres; a flower is five squashed spheres; a tree is five spheres on a cylinder. The
   reference's bushes, ferns and flower clumps have ragged, high-frequency edges made of hundreds of
   individual leaf and petal shapes. Edge frequency — not colour — is the first thing the eye uses to
   tell "painted" from "modelled". We have none of it anywhere in the frame.
2. **The yard is empty.** In `sunset-lawn.png` roughly 60% of the screen is unbroken lawn or deck
   with nothing on it. In the reference there is no square inch without planting: flowers at the
   bottom edge, mid-ground borders, ivy on the cottage, a hedge line, trees, haze, sky. Emptiness is
   what makes our yard read as a toy diorama on a table.
3. **No framing.** The reference has out-of-focus leaves breaking the top-left, top-right and
   bottom-right of the frame. That overhang is what says "you are standing inside a garden" rather
   than "you are looking at one."

**The honest constraint, stated plainly:** this is real-time three.js built from untextured spheres,
cones, cylinders and boxes with a toon ramp and ink outlines. The reference is a painting. No palette
work will turn solids into brushwork. **The gap is a technique gap, not a colour gap** — and the
technique that closes most of it is replacing primitive foliage with painted alpha-tested billboards.

**Budget.** 535 of 620 in normal play; 85 calls free. No imported image files — every texture below is
built at runtime through the existing `ctex()` helper. Items are ordered so the first three are the
ones the user will see immediately.

## 2. Build list

### 1. MUST — Painted billboard foliage (the centrepiece)

**What it looks like.** Bushes, flower clumps, ferns, grass tufts and ivy become camera-facing quads
carrying a painted canvas image with a ragged alpha edge, instead of spheres. One plant goes from a
3-arc silhouette to a 40-leaf one. This single change does more than everything else here combined.

**How to build it.** One 1024×1024 `ctex()` atlas, 4×4 cells, painted procedurally: per cell, 30–80
leaf strokes (`quadraticCurveTo` tapered blades, random length/angle from `r2()`), each stroke filled
with a 3-stop vertical gradient so the leaf has its own lit top and shaded base, then 5–12 petal
clusters for the flowering cells. Cells: 4 bush densities, 3 flower clumps, 2 ferns, 3 grass tufts, 2
ivy sheets, 2 soft far-distance bushes (paint these pre-blurred — see item 5).

Geometry is `PlaneGeometry(1,1)`, one `InstancedMesh` per atlas row, `alphaTest: .5`,
`transparent: false` (alpha-test needs no sorting and still writes depth, which keeps Rosie correctly
occluded), `side: DoubleSide`, `MeshToonMaterial` with the atlas as `map` so the existing `RAMP`
still lights it. Y-axis billboarding in a three-line `onBeforeCompile` patch on the instanced matrix
(rotate about world Y toward the camera; never pitch, or the plants lean when the camera tilts).
Per-instance `setColorAt()` tints each plant 10–15% warm or cool so a thousand plants never read as
one colour.

**Replaces.** The 27 fence-line shrub spheres at line 1397, the five-sphere petal rosettes in
`flower()` (line 1484), and the fern/tall foliage inside `pot3` (lines 1504–1506). Pots keep their
ceramic cylinders; only the green goes billboard.

**Cost.** +5 draw calls (5 instanced meshes), −27 for the fence shrubs alone, plus whatever the
`flower()` and pot rosettes return. Net negative. +1 texture (4 MB RGBA — fine on a phone).

### 2. MUST — Framing foliage

**What it looks like.** Two or three large, soft, dark out-of-focus leaf masses overhanging the top
corners and one at the bottom-right, breaking the frame edge. The reference's single most repeatable
compositional trick, and it costs almost nothing.

**How to build it.** Two `PlaneGeometry` quads parented directly to `cam`, at z ≈ −120 (just past
the 10-unit near plane), scaled to overhang the corners. Texture: a 512×512 `ctex()` leaf spray
painted with a 6–10 px canvas `filter:'blur(8px)'` pass so the edges are genuinely soft, tinted dark
(`#2a3a2e` at the lit end — these are backlit, they read as near-black-green). `MeshBasicMaterial`,
`transparent`, `depthTest: false`, `renderOrder` low so they draw first. Add a slow ±0.02 rad sway on
`rotation.z` at 0.3 Hz; pin it under `reduce`.

**Readability.** They must never cross the centre third. Cap coverage at 14% of screen area, and fade
`opacity` to 0 over 0.2 s whenever a telegraph fan or the lasso is active, so they can never hide a
warning. **Cost:** +2.

### 3. MUST — Density: plant the yard

**What it looks like.** The reference is *full*. Ours needs roughly **1,400–1,800 foliage billboards**
in the yard, up from the current ~90 flower dots and 650 cone grass tufts (the cones get replaced by
grass-tuft billboards one for one, so the real addition is about 900 plants).

**Where, as a percentage of the new instances:**

| Zone | Share | Density | Max height |
|---|---|---|---|
| Fence line and back border (z < 160) | 30% | Continuous, no gaps — a deep planted border 90–130 units thick | 180 u |
| Deck edge and front verge (z > DEPTH−180) | 20% | Continuous; this reads as the bottom-of-frame planting | 140 u |
| Prop skirts (every `OBST`, pot, lantern, rock) | 25% | A ring 10–70 units out from each base | 90 u |
| Lawn drifts (the existing 9 flower-drift centres) | 15% | Clumped islands, bare lawn between | 70 u |
| Cottage/shed/dog-house walls — ivy sheets | 10% | Vertical quads flat against the wall | wall height |

**The combat lane stays open.** No planting taller than **55 units** (below Rosie's shoulder) inside a
220-unit radius of any weak-spot or telegraph spawn point, and nothing at all inside 90 units. The
lawn centre keeps the open ground the fight needs — the reference's own lawn is open in the middle
too; it is the *edges* that are full. **Cost:** 0 new calls (instances in the item-1 meshes).

### 4. SHOULD — Painterly surface texture on the large flats

The lawn (line 1367) already has 1,400 painted grass strokes and reads best of anything in the build —
proof the technique works. The deck, the shed, the dog house, the fence and the pots are flat fills.
Give each a small `ctex()` map: 256×256, 200–400 short brush strokes at 6–10% contrast, drifting hue
±8° around the base colour, `repeat` 2–4. The ceramic pots additionally get a vertical gradient wash
so they turn. **Cost:** 0 calls, +2 shared textures (one wood, one ceramic/stucco).

### 5. SHOULD — Depth: haze, value compression, fake depth-of-field

- **Haze cards.** Three camera-facing `PlaneGeometry` slabs at z ≈ −1400, −2600, −4000 world-ward of
  the player, each a `ctex()` vertical gradient from `FOG_A` at 0.30 opacity to transparent, additive.
  Fog alone compresses value linearly; stacked cards give the reference's *banded* recession where
  each depth layer sits visibly in front of the next. **+3 calls.**
- **Value compression.** Raise `scene.fog.near` from 1900 to **1500** now that the near field is full
  of foliage to carry interest. Everything past the fence loses chroma; the yard gains it.
- **Fake DoF without a post pass.** Bake the blur into the texture, not the frame: the two
  "far-distance bush" atlas cells in item 1 are painted through a canvas `blur(6px)` filter, and any
  instance beyond 2,000 units uses only those cells. Framing foliage (item 2) is blurred the same
  way. The result reads as near-sharp/far-soft at zero GPU cost. A real DoF pass is out — it needs a
  depth prepass and a second render target, which this build does not have and should not grow.

### 6. SHOULD — Softer water

Ours is `PointsMaterial` at `size:17` with a hard radial `dotTex` — bright confetti. The reference's
spray is a translucent *sheet* with wisps and a few fat slow bubbles.

- **Sheets.** 2 stretched alpha quads along the jet axis, `ctex()` 256×64 painted as 5–8 tapered
  streaks with a soft inner glow, `AdditiveBlending`, opacity .22, UV scrolled along the jet at the
  jet's own speed. These carry the body of the spray. **+2.**
- **Wisps.** Repaint `dotTex` as an elongated soft comma rather than a circle, drop `size` 17 → 13,
  and lerp the `PC.water` colour toward `#ffffff` at the end of life so droplets dissolve rather than
  pop. 0 calls.
- **Bubbles.** A second `Points` set with a ring texture (bright rim, near-empty centre, one 0.6
  highlight dot), 20–30 live, slow upward drift, 1.5–3 s life. The reference's bubbles are the detail
  that sells "water" over "sparks". **+1.**

### 7. SHOULD — Light through leaves

- **Dapple.** The deck already does this with the additive `PT` overlay at line 1359 — extend the
  pattern to the lawn with a leaf-gobo: 512×512 `ctex()` of soft overlapping leaf-shaped holes,
  additive, opacity .20, UVs scrolled 2 units/s so the pools crawl. **+1.**
- **God rays.** 4 stretched additive quads angled from the sun's screen position, `ctex()` soft
  gradient, opacity .10, in one `InstancedMesh`. Only visible when the camera faces the sun. **+1.**
- **Warm bounce.** No new light — raise `hemi` intensity .34 → .40 once foliage fills the lower frame,
  because every new plant eats light the lawn used to bounce.

### 8. NICE — Camera

The reference sits lower and closer than our chase camera (`ch` 340/420, `cd` 740/860). Moving to
**`ch` 260/330, `cd` 650/780, `ly` 95 → 125** puts the eye at garden-border height, which is what makes
the reference's foreground planting tower over the viewer.

**What it costs.** Less ground visible ahead of Rosie, so telegraph fans are seen later; and a lower
eye means the new border planting occludes more. **Do it last, and only after item 3 ships**, so the
occlusion is measured and not guessed. If the telegraph read-time test fails, keep the current camera
— the framing foliage in item 2 buys most of the same "inside the garden" feeling for free.

## 3. Keeping the game readable in a lusher yard

- **Hue reservation, enforced in the atlas painter.** Flowers may use only lilac, rose-pink, white and
  blue-violet — which is exactly the reference's own flower palette (hydrangea, cosmos, daisy). **No
  foliage asset may contain anything in `#ffb062`–`#ffd23f` (the weak spot) or within 25° of
  `#ff0f46` (the warnings).** This is a hard rule on the `ctex()` palette array, not a review note.
- **Rosie.** Promote `rimL` from SHOULD to **MUST, always on** (it was item 10 of the title doc). With
  a busy mid-ground she needs a lit edge, not just value. She also stays the only near-white mass and
  the only object with ink at 1.8 px; keep foliage un-inked so the ink line now means "character".
- **Weak spot.** Untouched — it was never the problem. Its 90-unit exclusion radius (item 3) plus the
  existing white ring and beam keep it the brightest thing on screen.
- **Telegraphs.** The fan and lasso decals render after foliage with `renderOrder: 10` and
  `depthWrite: false`, and every foliage instance inside an active fan drops to 0.25 opacity through
  one shader uniform for the fan's duration. A warning is never allowed to lose to a flower.
- **Acceptance.** Re-shoot the contrast evidence into `production/qa/evidence/`: three sky states ×
  lawn and deck × three attack types, with the yard at full density, plus one shot per attack type
  showing the telegraph through the thickest border planting.

## 4. What will still not look like the painting

Be straight with the user about this, because no further pass will fix it:

- **Rosie herself stays spheres.** The reference's individual curls, the fur's translucent edge and
  the light passing through her ears are 2D painting. She will get warmer and better lit; she will
  not get fluffier in silhouette.
- **No brushwork that follows form.** Our painted textures are static albedo. A painter varies stroke
  direction and edge hardness with the shape; a tiled map cannot, and a 16-step toon ramp cannot.
- **No lost-and-found edges.** Every object in a real-time scene has a complete, continuous
  silhouette. The reference lets edges dissolve into their background — that requires per-pixel
  control we do not have.
- **No true depth of field, bloom falloff or chromatic warmth in the lens.** Item 5 fakes recession;
  it does not fake a lens.
- **Hard-surface props stay hard.** The cottage, shed, fence and deck will read as clean modelled
  geometry next to painted plants. That contrast is a cost of the technique, and the painterly maps in
  item 4 reduce it rather than remove it.
- **Composition is not ours to control.** The reference is one hand-chosen frame. Ours is a camera the
  player drives, so every frame is a compromise the painter never had to make.

Expect this to land somewhere around "a readable game that is clearly aiming at that painting" — a
much larger step than the last two passes, and still not the painting.

## 5. Budget

| Item | Calls | Textures |
|---|---|---|
| 1 Billboard foliage | +5, −27 (fence shrubs) and more from `flower()`/pots | +1 (1024 atlas) |
| 2 Framing foliage | +2 | +1 (512) |
| 3 Density | 0 | 0 |
| 4 Painterly maps | 0 | +2 (256) |
| 5 Haze and fake DoF | +3 | 0 (in the atlas) |
| 6 Water | +3 | +2 (wisp, bubble) |
| 7 Dapple and rays | +2 | +2 (gobo, ray) |
| 8 Camera | 0 | 0 |

Net **−12 at worst, lower once the pot and bed rosettes go** — landing at or below the current 535
against the 620 ceiling. Eight new canvas textures, roughly 7 MB, all generated at runtime.
