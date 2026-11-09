# Rosie vs. the Hose: Art Direction v2

Supersedes the direction in `design/art/art-bible.md` (the draft, "golden-hour toy diorama").
Based on `production/qa/evidence/baseline-{title,play,lawn,booga}.png` and the art pass in
`src/index.html`. Units below are the world units the code already uses (Rosie's head radius is 31).

## 1. Critique of the draft

**Working, keep:** cel shading with ink on characters only; the paper-tag HUD idea; the weak spot
(yellow orb, white ring) is the clearest thing on screen; `bake()` and instancing; the sway on
laundry, baskets and bunting; the dog house and clothesline as story props.

**Why it still reads as plain:**
1. **No value structure.** In `baseline-play` and `baseline-lawn` deck, lawn, hills and sky all sit in
   the same bright mid-tone. Hemisphere 0.5 against sun 0.74 fills every shadow, so "golden hour"
   shows only as a horizon tint. Nothing is dark, so nothing glows; the eight lanterns are invisible.
2. **The backdrop is asset-pack hills.** Cone mountains with cone trees and dozens of tiny houses
   are generic, add high-frequency noise right behind the play area, and offer no landmark.
3. **Rosie's face is lost.** Eyes are radius 5.6 on a radius-31 head and vanish at play distance.
   46 small curls plus 14 inked cone spikes turn the head into a white lump with a black scribble
   on top (`baseline-lawn`, `baseline-booga`). Fur has no shade colour, so she reads as a flat blob.
4. **The villain has no character.** The hose is a plain green tube; its heads are smaller than a
   flower pot. The waterer is a small generic figure whose hat hides his face, and his coral vest
   with yellow stripes uses the same two colours as the attack warnings.
5. **The lawn is confetti.** 1100 same-size tufts and 240 evenly scattered flower dots on one flat
   green give uniform noise with no large shapes and no resting areas; warnings will fight it.
6. **Everything is prop-sized.** Pots, tables, lanterns and the fence are all under Rosie's height
   times two. There is no tall framing, no depth layering, and the white fence is a ruled line
   across the frame. Fog starts at 3400, so the play area has no atmosphere at all.
7. **BOOGA TIME does not land.** In `baseline-booga` the sky is still pale blue-green; only the
   banner and sharks say anything changed. The sun is four concentric pale discs that read as a
   target hidden behind the HUD.
8. **Title and HUD are template UI.** In `baseline-title` the display font has not loaded and the
   title is a fallback sans with a stroke; the card is a wall of text covering the scene, which is
   greyed out behind it. Rosie is not on her own title screen. Touch buttons are flat circles.

## 2. The v2 direction: "Lantern Hour"

The yard at the last warm minute before dusk, built like a wind-up toy set and lit like a stage. A
low amber sun rakes across from the left and throws long violet shadows; the sky above is a deep
storybook blue that curdles to green as the hose is chewed up, and the lanterns, string bulbs and
shed window come on as it does. Characters are chunky, big-headed and big-eyed, in three or four
bold shapes each. The world is darker and richer than the draft so that the white dog, the glowing
weak spot and the warnings are the brightest things in it. Mischievous and cosy, never frightening.
(Alternative considered: "Midday Paper Cut-out", flat pastel with no lighting mood; rejected because
it is the draft's weakness made deliberate.)

**Pillars**
1. **Big shapes, big eyes.** Every character and set piece reads as a silhouette at thumbnail size.
   Three scales only: hero (taller than the waterer), prop, speckle. Fewer, fatter primitives.
2. **Dark frames the glow.** Deep cool shadows and warm light pools. Brightness and saturation are
   spent on what the player needs: Rosie, weak spot, warnings, water. Everything else steps back.
3. **The sky is the mood ring.** Sky, fog, hemisphere light and practical lights move together
   through blue, green and BOOGA purple-green, so the whole yard changes colour with the fight.

## 3. Palette v2

| Use | Hex |
|---|---|
| Sky normal: top / middle / horizon | `#1f4fd0` / `#4f9bf0` / `#ffc48a` |
| Sky damaged (hose near 0): top / middle / horizon | `#0b7a5a` / `#3fcf86` / `#f2f58a` |
| Sky BOOGA: stripe A / stripe B / horizon | `#5a18b8` / `#22d46a` / `#ff7ad9` |
| Sun disc / halo | `#fff0c2` / `#ffb86b` |
| Key light (sun) | `#ffb86b` |
| Fill (cool rim from behind-right) | `#7fd0ff` |
| Ambient sky / ambient ground: normal | `#7f9cf0` / `#5b3fa6` |
| Ambient sky / ambient ground: damaged, BOOGA | `#7fe0a8` / `#3f6f8f`, `#c9a0ff` / `#2a8f6a` |
| Fog: normal / damaged / BOOGA | `#f0a88c` / `#b9e88a` / `#8a4fd6` |
| Shadow tint (on-screen target, set through ambient) | `#3a2a78` |
| Deck planks: lit trio / gaps | `#b8644a` `#a8583f` `#d07a55` / `#4a2238` |
| Lawn: base / mown stripe / clover patch / sunlit tuft | `#3f9a52` / `#55b85a` / `#2c7a4c` / `#9fdc5c` |
| Garden soil / mounds / bed boards | `#4a2f3a` / `#6a4238` / `#8a5a3c` |
| Foliage dark / mid / light; backdrop ridges near to far | `#1f6b4f` `#2f9a55` `#6fd06a`; `#2a7a5e` `#4f8f9a` `#8f9fd0` |
| Fence and whites (never pure white) | `#e9e4f5` |
| Rosie fur: material / shade target / wet | `#fffaf0` / `#b7b2e8` / `#b9dcf5` |
| Rosie face: muzzle / nose / eye / iris / cheek | `#f6ddd0` / `#3a2030` / `#1a0f14` / `#5a3418` / `#ff8fa3` |
| Rosie collar / tag | `#ff4f9a` / `#ffd23f` |
| Hose: body / belly stripe / dark band / worn / tired flash | `#1fa055` / `#7be07a` / `#0f6b45` / `#a9bf52` / `#e4f76a` |
| Hose heads: nozzle metal / pupils / mouth | `#d9793b` / `#e63946` / `#3b0d1c` |
| Weak spot: normal / core / tired / ring | `#ffd23f` / `#fffbe0` / `#ff5d5d` / `#ffffff` |
| Waterer: apron / shirt / jeans / hat / hat band / boots / skin | `#1f8f8a` / `#f4ead2` / `#33507f` / `#e8c66a` / `#7a4fd0` / `#2a6f7f` / `#e9ae8c` |
| Water: jet / core / puddle | `#8fe0ff` / `#ffffff` / `#4aa8f0` |
| Warnings: red / amber / edge | `#ff2d3c` / `#ffc21a` / `#ffffff` |
| Practical lights: lamp / pool / bulb set | `#ffd98a` / `#ffb070` / `#ffd98a` `#ff8fb8` `#8fe0ff` `#b8f28a` |
| UI ink / paper / paper shade | `#241538` / `#fff1d8` / `#f3d9b0` |
| UI accents: Rosie / hose and go / power / dash / bite | `#ff7fa8` / `#22b25a` / `#8b4dff` / `#3d7bff` / `#ff5a4d` |

## 4. Build list for the technical artist

Priority order. All geometry is primitives; all textures come from `ctex()`.

1. **MUST: Relight.** Sun `#ffb86b` intensity 1.15, offset `(camTX-1100, 520, camTZ-380)` so shadows
   run long toward the lower right. Hemisphere `#7f9cf0` / `#5b3fa6` at 0.38. Turn `fill` into a cool
   rim: `#7fd0ff`, 0.28, from `(camTX+700, 420, camTZ-700)`. Change `RAMP` to three bands at
   34%, 72%, 100%. Lerp hemisphere colours to the damaged pair by `skyP` and the BOOGA pair by `boogaK`.
2. **MUST: Sky dome v2.** New stops from the table. In the dome fragment shader add (a) the sun as
   a hard disc plus a soft halo, replacing the four `sunG` circles, placed at 12 degrees elevation
   and left of centre so it clears the HUD; (b) two flat cloud bands near the horizon, tinted
   `#ff9e7a` at 35%; (c) a `booga` uniform that swaps the gradient for diagonal stripes 0.22 rad
   wide in stripe A and B, scrolling at 0.15 rev/s, reaching full strength within 0.4 s. Add one
   `Points` cloud of 70 stars (size 9, `#fff0c2`) whose opacity is `max(skyP*0.6, boogaK)`.
3. **MUST: Atmosphere.** `Fog` near 1500, far 6000, colours from the table (the fence at about 1100
   stays clear, the ridges melt). Pollen from 150 to 90 motes, `#ffd98a`, size 8 to 16. Add 24
   fireflies (`#d8ff7a`, additive, size 14, slow figure-eights) over the garden and hedge, opacity
   tied to `skyP`. Vignette colour to `#1a1040`; grain opacity 0.11 to 0.06.
4. **MUST: Rosie rebuild.** Head radius 31 to 38; body half-length 40 to 34, so the head is about
   60% of her. Replace the 46 head curls with 16 at radius 13 to 17, and the 14 cone spikes with a
   topknot of 5 spheres (radius 16, 13, 12, 10, 9) leaning back. Body curls 24 to 12 at radius 14 to
   18. Eyes radius 9.5, set wide (z plus or minus 14), each with an iris ring and glints of 4 and 2.
   Two brow puffs (radius 5) that tilt: up when a warning is within 200, down on a bite. Nose
   `#3a2030`, radius 6.5. Muzzle as two white puffs with a small `#f6ddd0` centre. Ears radius 12 by
   26, hanging past the jaw. Collar `#ff4f9a`. Eye states: wide (default), happy arcs (scale y 0.35,
   during BOOGA and after a RIP), shut (wet). Add one blob shadow disc under her, radius 46,
   `#241538` at 0.3. Ink width 2.1 to 2.6 on Rosie only. Keep `bake()` on every fur group.
5. **MUST: The hose as a villain.** Tube radius up 25%. Give `hoseM` a 64 by 64 canvas map: body
   colour, a belly stripe 20% wide, a dark band every 64 px; scroll `map.offset.x` toward the weak
   spot at 0.6 per second so the body seems to pump (2.0 while an attack is telegraphed). Nozzle head
   scale 1.6, metal `#d9793b`, eyes radius 9 with radius-4.5 pupils that track Rosie, brows 14 long,
   a hinged lower jaw (half cylinder) that opens during the telegraph. Mid head scale 1.5 with the
   same eyes and a two-tooth grin. Angry and silly, not scary: round teeth, no blood, no gore.
6. **MUST: Weak spot stays king.** Keep `#ffd23f` and the white ring. Add a `#fffbe0` core at half
   radius, two ink tick marks orbiting the ring at 1 rev/s, and a soft additive beacon column (open
   cylinder, radius 12 to 26, height 240, `#ffe070` at 0.14) so it can be found across the lawn.
7. **MUST: The waterer becomes a character.** Head radius 22 to 30; torso height 56 to 44 and pear
   shaped (cylinder 16 top, 22 bottom); legs 60 to 44. Eye whites radius 10, pupils 5, thick brows 12
   long. Round nose radius 6. Hat brim radius 46, tilted back 12 degrees so the face shows, band
   `#7a4fd0`. Replace the coral vest and yellow stripes with a `#1f8f8a` apron over a `#f4ead2` shirt,
   boots `#2a6f7f`. Idle: hat bobs 3 units at 2 Hz; on "EEEK!" the hat jumps 20 and lands.
8. **MUST: Replace the backdrop.** Remove the 18 cone mountains, their houses and cone trees. Add
   three ridge layers, each one baked mesh of 6 to 8 squashed spheres (radius 900 to 1800, y scale
   0.35) at z -1500, -2600 and -4000 in the three ridge colours. Add one landmark on the near ridge,
   right of centre: a toy water tower (tank sphere radius 170 squashed 0.8 on four legs 260 tall, cone
   roof, a pipe running down toward the yard, one window lit `#ffd98a`). Add 7 lollipop poplars
   behind the fence (trunk plus 3 stacked spheres, 320 to 520 tall, foliage dark), one baked mesh.
9. **MUST: Ground repaint.** Lawn texture: base, mown stripes 260 wide in alternating base and
   stripe colour, 7 large clover patches (radius 150 to 320), 20 soft dapples of `#9fdc5c` at 12%.
   Tufts 1100 to 650, scale 0.6 to 2.2, clustered at fence, deck edge and prop bases, with open
   lanes left through the middle. Flower dots 240 to 90, in 9 drifts of 10, radius 7. Deck: the
   plank trio, dark gaps, two nail dots per board end, a wider edge board. Garden: one soil plane
   under all rows with a board border 12 high; vegetables up to radius 16 to 22, 6 pumpkins of
   radius 26 (`#ff8a2a` is too close to amber: use `#e8703a`), 8 bean poles 150 tall.
10. **MUST: Title card and HUD.** Title: card narrowed to 46% width and docked left; the camera
    frames Rosie large on the right with the hose reared up behind her; no grey dim over the scene.
    Logo as stacked words, each letter a span rotated between -4 and 4 degrees, "Rosie" in paper
    white, "the Hose" in hose green, 4 px ink stroke and an 8 px ink drop; font stack must look
    chunky without the web font (add `"Arial Rounded MT Bold"` before `"Trebuchet MS"`). How-to
    text cut to five one-line rows with key caps. HUD meters 18 px tall with 3 px ink, a round CSS
    portrait chip at the left of each (Rosie face, hose head, star), power fill in violet and green
    stripes. Touch buttons: paw and fang glyphs, inner top highlight, 4 px ink.
11. **SHOULD: Practical lights, no real lights.** Lantern pools become radial-gradient discs
    (radius 170, `#ffb070` at 0.22, additive), halos 60. String bulbs cycle the four bulb colours.
    Add a lit window to the shed and a glow inside the dog house door. Scale all of these by
    `0.35 + 0.65*skyP` so they come on as the sky turns. No `PointLight` or `SpotLight` anywhere.
12. **SHOULD: Hero silhouettes.** Apple tree scale 1.6 with a canopy of 5 spheres (radius 110 to
    170) baked, 8 apples of radius 14. Pergola posts 22 to 34 thick with 10 vine spheres up each.
    Shed scale 1.3. Fence pickets vary 78 to 96 in height on a sine, colour `#e9e4f5`, with one
    three-picket gap leaning 8 degrees. Clouds: 5 instead of 8, each baked to one mesh, 1.5 times
    larger, flat bases, emissive `#e58fa0`.
13. **SHOULD: Hit and water VFX.** Bite: 8 flat cone shards (length 40, `#ffffff` and `#ffd23f`)
    bursting for 0.18 s, plus a ring scaling 1 to 3. Dash: 4 dust puffs of radius 10 to 22 fading
    in 0.3 s. Water impact: a flat ring 20 to 90 in 0.35 s, `#8fe0ff`. Jets get the white core at 35%
    of the width. RIP: the confetti uses the bulb colour set only.
14. **SHOULD: BOOGA polish.** Sky creatures get eyes twice the size with glints; lantern pools and
    bulbs alternate stripe A and B at 2.5 Hz; the `.wash` overlay drops from 0.3 to 0.18 and is
    masked to the screen edges with a radial gradient so the centre keeps its contrast.
15. **NICE: Everything breathes.** Poplars and tree sway 2 degrees at 0.4 Hz; sunflower heads turn
    toward Rosie; pots squash to 0.85 and rebound when bumped; the tower window blinks at random.
16. **NICE: Damage dressing.** As `skyP` passes 0.5 and 0.8, toggle on up to 10 pre-built puddle
    decals and 6 flattened tufts near the deck edge so the yard looks fought over.

## 5. Readability and performance guardrails

**Contrast, in priority order**
- Weak spot: the only saturated yellow sphere in the world. No prop, flower or light over radius 8
  may use `#ffd23f` to `#ffc21a` within the play area.
- Warnings: red and amber are reserved for attacks. Each warning shape gets a 3 px-equivalent white
  edge and a 6 Hz pulse; opacity no lower than the draft (0.5 red, 0.32 amber). Shapes stay as they
  are (lines, cones, circles), so the cue never depends on hue alone.
- Rosie: the lightest large object on screen. Ground under her must stay at or below 60% value;
  nothing else large is whiter than `#e9e4f5`. Light pools and dapples stay soft-edged and under
  0.25 opacity so they are never mistaken for a warning.
- Check each of the three sky states on the lawn and on the deck with all three attack types
  showing, and retain the screenshots in `production/qa/evidence/` beside the baselines.

**Budget**
- Draw calls: 620 or fewer in normal play (baseline about 650), 700 peak during BOOGA TIME.
  Savings to bank first: backdrop (item 8) about -110, clouds -43, hedge and mushrooms baked -50,
  lanterns baked to 3 calls each -30. Spend: characters +25, VFX pools +20, set pieces +30.
- Remember that an inked mesh costs two calls and a shadow caster one more. Scenery is never inked;
  only Rosie, the waterer, the hose and its heads, tree trunks, shed and pergola cast shadows.
- Lights: exactly one shadowed directional, one unshadowed directional, one hemisphere. Shadow map
  stays 1024 on phones. No render targets, no post-processing, no new full-screen DOM layers.
- Transparent or additive surfaces covering more than a quarter of the screen: two at most.
- Canvas textures: 512 maximum, six new ones at most.

## 6. Do-not list

- No horror: no gore, jump scares, sharp fangs, glowing red eyes in darkness, or desaturated murk.
- No characters, logos, layouts or signature props taken from any other game. The Roblox titles
  the user named are a mood reference only (chunky, big-eyed, coloured light), not a source.
- Do not let the scene go so dark that Rosie's shade side drops below `#b7b2e8`.
- No red, amber or weak-spot yellow on scenery or costume at any size above radius 8.
- No pure white, pure black or neutral grey; shadows are violet, whites are warm or lilac.
- No outlines on scenery; no thin inked shapes (cones, spikes, wires) on characters.
- No even scatter: speckle goes in clusters and leaves resting space.
- No point lights, post-processing, imported models or image files.
- Do not change the sky sequence (blue, then green with damage, then purple and green with
  chickens, fish and sharks) or Rosie's identity as a white fluffy Maltese-poodle.
