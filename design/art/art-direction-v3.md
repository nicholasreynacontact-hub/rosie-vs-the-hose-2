# Rosie vs. the Hose: Art Direction v3 — "Peach Hour"

A **delta on `design/art/art-direction-v2.md`**, not a replacement. v2's pillars, palette table,
build list, budget and do-not list all still stand except where a line below names a value it
replaces. Everything v2 calls working stays untouched: big-shape silhouettes, `bake()` and
instancing, the weak spot's yellow/white/beacon kit, the hose-as-villain pass, the waterer's
apron-and-hat read, the backdrop ridges and water tower, the title and HUD, the sky **sequence**
(blue-ish normal → green as the hose is chewed → purple-and-green BOOGA), the wardrobe system,
and Rosie's identity as a white fluffy Maltese-poodle.

Three things change: the sky and lighting go to sunset, the characters get a softer hand-painted
treatment, and Rosie stands up for BOOGA TIME.

## 1. Why the current build reads monotonous

From `bark-play`, `bark-phone`, `pause-wardrobe`, `bark-booga`:

1. **No value range.** Deck, lawn, hills, hose and sky all sit between roughly 55% and 80%
   luminance. Rosie's cast shadow on the deck is barely a step darker than the lit planks. Nothing
   is dark, so nothing reads as *lit* — the scene looks evenly printed rather than illuminated.
2. **Uniform saturation.** Deck orange, lawn green, hills green, hose green and umbrella coral are
   all near-maximum chroma. With everything shouting there is no accent, and the eye has nowhere
   to rest — the same complaint v2 made about the lawn confetti, but now at the whole-frame scale.
3. **Two hues carry the whole yard.** Warm deck plus green everything-else, with no third note and
   no colour in the shadows. `hemi.groundColor` `#5b3fa6` is the only shadow colour in the build
   and at intensity .38 it never lands.
4. **The ink line does all the shape work.** Interiors are flat fills, so form is communicated
   entirely by the 2.1–2.6 px outline. At play distance in `bark-play` Rosie is a white blob with
   a dark edge; the 16 head curls and 13 body curls contribute nothing.
5. **The cel ramp is too hard.** `RAMP` is 3 bands at 34/72/100 with `NearestFilter`, so every one
   of ~40 fur spheres gets its terminator in the same place and at the same hardness. That one
   repeated hard edge is what makes the fur read as moulded plastic instead of painted fluff.
6. **No depth cue inside the play area.** Fog starts at 1500 and the whole deck is inside it, so
   near and far have identical contrast and crispness — in `bark-booga` the lawn at 32 m is as
   sharp as Rosie's feet. The BOOGA sky changes while the ground lighting barely moves, so the
   "sky is the mood ring" pillar never reaches the surface the player is looking at.

## 2. The sunset sky and the relight

**Normal sky, three stops (replaces `SKY[*][0]` and the `skyU` defaults):**

| Stop | v2 | v3 |
|---|---|---|
| `top` | `#1f4fd0` | **`#3b2f8f`** deep indigo — the dark end of the value range |
| `mid` | `#4f9bf0` | **`#f07a9c`** rose |
| `bot` (horizon) | `#ffc48a` | **`#ffb062`** hot amber |

**Damaged (`SKY[*][1]`, reached by `skyP`) stays green, but drops in value** so green now reads as
*the warm light going sick* rather than a second bright sky: top `#0d5f62`, mid `#45c987`,
bot `#e8ef7a`. Against a rose-and-amber base the green shift is a bigger hue jump than it was
against blue, so the meaning gets clearer, not weaker.

**BOOGA keeps purple and green**, pushed apart so they still separate from an orange horizon:
`sA` `#5a18b8` → **`#4f12c4`**, `sB` `#22d46a` → **`#1fe07a`**, `SKY_BH` `#ff7ad9` → **`#ff3fc8`**.
The stripe geometry, 0.22 rad width, 0.15 rev/s scroll and 0.4 s ramp are unchanged.

**Sun** (`skyU.sunC` / `haloC`): disc `#fff3d2`, halo `#ff9a5a`. Bigger and lower — disc cutoff
`smoothstep(.034,.037,d)` → `smoothstep(.052,.058,d)`, halo `smoothstep(.03,.22,d)` → `(.04,.34)`
at mix .72. In `artSync()` drop the elevation from 12°/4.2° to **7°/3.0°** so it sits on the ridges.

**Lighting.** `sun`: colour `#ff9e63`, intensity 1.25, position `(camTX-1150, 300, camTZ-380)` —
lower than v2's 520 so shadows rake long and low. `fill`: `#6f8fff` at 0.34 (was `#7fd0ff` 0.28),
unchanged position — this is now the cool side of the warm/cool split. `hemi`: `HEMI_S[0]`
`#e08ac0`, `HEMI_G[0]` `#3a2a78`, intensity 0.34. Damaged pair `#7fe0a8` / `#2f5f6f`; BOOGA pair
unchanged. Shadow tint target on screen: `#4a2a6e`. `FOG_A` `#f0a88c` → **`#ff9a74`**, fog near
1500 → **1900** so the deck itself stays clear and only the lawn and fence soften.

**Clouds.** The 8 `cloud3` groups read as white blobs because `cloudM` is `#fff1dc` emissive
`#b98a78` with no underside. Make them painted bands: 5 groups (v2 item 12 already asks for 5),
y-scale .42 → **.22**, x-scale ×1.8, lit material `#ffd0a8` emissive `#ff8f6a`, plus a second
underside slab per group offset `y-14` in `#c2628f` with no emissive. In the dome shader the two
`band()` tints go from `#ff9e7a` at .35 to **`#ff8fb0` at .50**, and add a third band at `e=.168`,
`w=.020` so the horizon has a stack rather than a pair.

## 3. Character treatment: soft, warm, hand-painted

The reference is a *general* aesthetic — rounded naturalism, warm skin and fur, large gentle eyes
with real highlights, soft-edged shading, hand-painted warmth. **No character, creature, prop or
design is taken from any film.** Everything stays original to this game and buildable from
three.js primitives and `ctex()` canvases; no imported art.

**`RAMP` (replaces the 12×1 three-band texture).** 16 texels, `LinearFilter` on both min and mag,
values `[112,112,116,124,142,170,192,206,214,224,234,242,248,252,255,255]` (RGB rows, 48 bytes, so
the 4-byte alignment note in the code still holds). That is two value steps with a ~3-texel soft
transition each, and a shade floor lifted from 87 to 112 so no character goes muddy in the new
lower key. Keep `MeshToonMaterial` — this is still cel shading, just with a painted terminator.

**Ink.** Thinner and warmer, and no longer the main shape cue. `INK.uniforms.th` 2.1 → **1.4**,
`INK_R` (Rosie) 2.6 → **1.8**, colour `#2b1a33` → **`#5a3a46`**. Soften the distance term in the
ink vertex shader from `(.55+d/1300)` to `(.5+d/2000)` so far shapes stop getting rubbery edges.
**Keep ink on:** Rosie, the hose body, `nozHead`, `midHead`, the waterer, and every wardrobe piece
(`dink`). **Drop ink on:** `weak3` (a dark line on the brightest object in the game costs contrast
for nothing — the white ring and core already define it), `treat3`, and the `pot3` pivots. That is
three fewer `ink()` calls and about 20 draw calls banked toward the rest of this list.

**Rosie's eyes** (`dEyes`, currently an `irisM` sphere r11 scaled (.6,1.1,1) with a `.9`-scale
`eyeM` pupil and two glints). Scale 11 → **12**. `irisM` `#5a3418` → **`#9c6336`** warm amber.
`eyeM` `#1a0f14` → **`#2a1a22`** (warm near-black, never pure), pupil scale `.9` → **`.60`** so the
iris is a visible ring, not a hairline. Primary glint radius .42 → **.50** at `(.95,.50,.25)`,
upper-front, catching the sun. Secondary stays .21, moved to `(1,-.45,-.30)`. Add a third:
`MeshBasicMaterial` `#ffd9b0` at opacity .35, radius .28, at `(.92,-.55,.10)` — a bounce-light
crescent on the lower-inner rim. This is the single highest-value change in section 3; eyes carry
the whole impression.

**The waterer's face.** `eyeWM` `#ffffff` → **`#fff3e4`**. Give his pupils the same build as
Rosie's but a different iris so the two characters are not twins: ring `#4a6b7a` cool blue-grey at
r4.6, pupil `#2a1a22` at r2.6, glint 1.8 → **2.4** upper-left plus a 1.0 secondary lower-right.
`skinM` `#e9ae8c` → **`#f0b894`**, `hairM` `#5b3a29` → **`#6b4430`**. Cheek blush `#ff8fa3` at .45
→ `#ff9f8a` at **.32**. Replace the two `hairM` brow boxes with squashed spheres (scale 5,2.2,6) —
on the soft ramp a box brow is the one remaining hard-edged thing on his face.

**Four small additions that sell "painted".**
1. A 128×128 `ctex()` mottle map (soft blobs, 6% contrast, `#ffffff` on `#f0f0f0`) on `furM` and
   `furS` only, repeat 3×3. Costs one texture, kills the flat-fill look at play distance.
2. Three of the 13 body curls and three of the 16 head curls take a material 4% warmer than
   `furM` (`mix(FURC,'#ffd8b0',.12)`) so the fluff has internal variation, not one flat value.
3. Contact shadows get a soft edge: Rosie's blob disc (`CircleGeometry(46)`, `#241538` at .3) takes
   a radial-gradient alpha map built like `beamTex`, colour `#3a2a6e` at .34. Same for the waterer.
4. `wFur()` currently mixes the shade toward `#6f67c6` at .46. Raise to **.54** — a deeper, cooler
   shade side is what reads as painted form once the ink is thin.

## 4. BOOGA TIME: Rosie on her hind legs

Driven by one new float `rearK` (0→1), eased in `render3D` and multiplied into the existing terms
so nothing is replaced.

**Timing.** Rise 0.45 s, ease-out cubic (`u=min(1,u+dt/.45)`, `rearK=1-(1-u)³`). Drop 0.30 s,
ease-in-out. Target is 1 while `booga && !moving && !reduce`, else 0.

**Pose at `rearK=1`.** All offsets are additive to what each part already does.
- **Spine:** `dogP.rotation.z += rearK*0.90` (+x is forward, so this pitches the chest up ~52°).
- **Hip compensation:** `dogP.position.y += rearK*26`, so the back feet stay on the deck as she
  pitches instead of sinking through it.
- **Back legs** (`dLegs[2]`, `dLegs[3]`, x = -20): `rotation.z = lerp(swing, -0.25, rearK)` — they
  tuck a little forward under the hips to take the weight. Swing amplitude scales by `(1-rearK)`.
- **Front legs** (`dLegs[0]`, `dLegs[1]`, x = +18): `rotation.z = lerp(swing, 1.25, rearK)`, then
  add `Math.sin(t*9 + l.ph)*0.35*rearK` so the paws paddle alternately in the air.
- **Head:** `dHead.rotation.z -= rearK*0.75` (net ~+0.15 rad, muzzle level and tipped slightly up,
  not pointing at the sky), plus `dHead.position.y += rearK*4*Math.sin(t*4.8)`.
- **Ears:** flap amplitude ×1.6 and `rotation.z += rearK*0.10` so they swing forward.
- **Tail:** `dTail.rotation.z = rearK*0.50` (lifted as counterweight) and the y-wag amplitude
  .7 → `.7 + .4*rearK`.
- **Blob shadow:** `scale.x *= (1 - .35*rearK)` — the footprint narrows when she is on two feet.

**While standing.** Reuse the existing `dance` terms rather than adding new ones: the ±0.6 rad
`dog.rotation.y` sway drops to **±0.45 at 3 Hz**, the 16-unit `dogP.position.y` hop drops to
**10 units at 4.8 Hz**. Happy-arc eyes already fire on `booga`; tongue visible; `dMouth` open.

**Not breaking the other animations.** `rearK` is a multiplier on additive offsets only, so run,
bite, dash, hurt and the existing dance keep their own curves at `rearK=0`.
- **She cannot run on two legs.** When `R.speed>25` during BOOGA, `rearK` is driven to 0 over
  **0.18 s**; she rises again 0.35 s after she stops. The run cycle is therefore never blended.
- **Bite (`R.biteT`), dash (`R.dash`), chomp (`R.chomp`), hurt (`R.hurt`) and thrash force
  `rearK` to 0 over 0.12 s** and hold it down until the state clears. A standing bite would put her
  mouth 90 units above the weak spot and break the clearest feedback in the game.
- `reduce` (reduced motion) pins `rearK` to 0; the hind-legs pose is motion, not information.

## 5. Readability guardrails under the new palette

The sunset makes the *world* warm, which puts it in the same hue family as three things that must
never be missed. In priority order:

- **Weak spot `#ffd23f` vs the `#ffb062` horizon and `#ff9a74` fog.** Hue separation is now ~20°.
  Keep the colour (it is learned) and buy contrast back through value and motion: `weakBeam`
  opacity .11 → **.14**, `weakRing` to pure `#ffffff` at **.90**, and extend v2's "no amber above
  radius 8 in the play area" rule to the backdrop — no ridge, roof or prop may use `#ffb062` to
  `#ffd23f` above the horizon line.
- **Warnings `#ff2d3c` / `#ffc21a` vs a warm deck and sky.** Shift the red magenta-ward to
  **`#ff0f46`** (`teleRed()`) — still unmistakably danger, now 25° off the sky. The amber fan is
  the worse case: `fanT` fill `#ffc828` → **`#ffe14a` at .30** *plus* a 3 px-equivalent `#2b1a33`
  ink border, so the cue survives on an orange plank. Pulse 6 Hz → 7 Hz. Shapes are unchanged, so
  the cue still never depends on hue alone.
- **The deck is now the biggest risk to Rosie.** `#b8644a` / `#a8583f` / `#d07a55` under an orange
  sky makes one hue fill the frame and flattens the warm/cool split. Push the planks cooler and
  darker: **`#a2574a` / `#8f4a42` / `#bd6a52`**, gaps `#4a2238` → **`#3a1c33`**. The lawn keeps
  v2's greens exactly — it is the only large cool-neutral area left and it is what Rosie's lilac
  shade reads against.
- **Rosie herself** stays the lightest large object; the lilac shade `#b7b2e8` is now *more*
  valuable because it is the one cool note on a warm character. Do not warm it.

**Wardrobe furs** (`FURW` in `src/index.html`, documented in `design/ux/pause-and-wardrobe.md`):
`buttermilk #ffeab0` and `peach #ffd0b8` now sit inside the sunset's own hue band, and
`cocoaswirl #c99a72` is close to the new deck. Do not remove them — they are player choices and
the shade side plus ink still separate her. Two fixes: raise `wFur()`'s shade mix to .54 for all
furs (section 3), and lift `cocoaswirl` to **`#dba97f`** so it clears the darkened planks by a full
value step. `marshmallow`, `lilac`, `skypup` and `storm` are unaffected. Re-shoot the v2 contrast
check (three sky states × lawn and deck × three attack types) and retain it in
`production/qa/evidence/`.

## 6. Build list

1. **MUST — Sky stops.** New `skyU` defaults and `SKY`/`SKY_BH` arrays per section 2. Damaged and
   BOOGA entries updated in the same literal at the top of the `render3D` block.
2. **MUST — Sun and horizon.** `sunC`/`haloC` colours, the two `smoothstep` cutoffs in the dome
   fragment shader, and the 7°/3.0° elevations in `artSync()`.
3. **MUST — Relight.** `sun` `#ff9e63` @1.25 at y=300; `fill` `#6f8fff` @0.34; `hemi` `#e08ac0` /
   `#3a2a78` @0.34 with the damaged pair swapped; `FOG_A` `#ff9a74`, `scene.fog.near` 1900.
4. **MUST — `RAMP` replacement.** 16 texels, `LinearFilter`, the array in section 3. No change to
   `M()` or to any material's construction.
5. **MUST — Ink pass.** `th` 1.4 / `INK_R` 1.8, colour `#5a3a46`, distance term `(.5+d/2000)`, and
   remove `ink(weak3)`, the `treat3` loop and the `pot3` loop from line ~1464.
6. **MUST — Rosie's eyes.** `irisM` `#9c6336`, `eyeM` `#2a1a22`, eye scale 12, pupil .60, the three
   glints at the positions in section 3. Build the third glint from `glintM.clone()` with
   `color #ffd9b0`, `transparent`, `opacity .35`.
7. **MUST — `rearK` and the hind-legs pose.** Section 4 in full: the easing, the six part offsets,
   the suppression rules for run / bite / dash / chomp / hurt / thrash / `reduce`, and the reused
   dance terms at their new amplitudes.
8. **MUST — Deck repaint and warning shift.** The three plank hexes and the gap hex; `teleRed()`
   `#ff0f46`; `fanT` `#ffe14a` @.30 with the ink border; pulse 7 Hz.
9. **MUST — Weak-spot contrast.** `weakBeam` .14, `weakRing` `#ffffff` @.90. No other change to the
   weak-spot kit — it is the one thing in the build that was never the problem.
10. **SHOULD — Clouds as painted bands.** `cloud3` down to 5 groups, y-scale .22, x ×1.8, the two
    `cloudM` materials, and the third `band()` plus the new tint in the dome shader.
11. **SHOULD — The waterer's face.** `eyeWM`, `skinM`, `hairM`, blush, the iris build, and the brow
    boxes replaced with squashed spheres.
12. **SHOULD — Fur mottle and curl variation.** The 128×128 `ctex()` map on `furM`/`furS`, the six
    warm-tinted curls, and `wFur()`'s shade mix at .54 (keep the `FURC`/`FURS` rebuild intact —
    the wet lerp still depends on it).
13. **SHOULD — Soft contact shadows.** Radial-gradient alpha map on Rosie's and the waterer's blob
    discs, `#3a2a6e` @.34, and Rosie's `scale.x` narrowing with `rearK`.
14. **NICE — `cocoaswirl` to `#dba97f`** in `FURW`, with the matching note in
    `design/ux/pause-and-wardrobe.md`.

Budget is unchanged from v2 (620 normal / 700 BOOGA). Item 5 banks about 20 calls; items 10 and 12
spend fewer than that. One new canvas texture (the mottle), within v2's six-texture allowance.
