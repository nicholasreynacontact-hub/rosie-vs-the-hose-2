# UX Spec: Pause & Rosie's Wardrobe

Extends the existing paper-tag UI (`.card`, `.hbtn`, `.chip`, `.how`, `.go`) and the "Lantern Hour"
palette in `design/art/art-direction-v2.md` §2–3. No new visual language: the pause card is another
hand-cut paper tag with a 3 px ink border, 8 px ink drop and a −0.6° rotation, like every other card.

## 1. Pause

### 1.1 The control
- New `<button class="hbtn" id="pauseBtn">Pause</button>` in `.hud .row`, placed **before** `#mute`
  (top row, right end). Reasons: the HUD row is the only pointer-events-auto zone up top, it is the
  farthest screen region from both thumbs (`.pad` bottom-left, `.btns` bottom-right), and it sits in
  the same cluster as the other two non-gameplay buttons, so it inherits a learned mental model.
- **Never** in `.controls`. A pause button beside `.act.bite` would be a 96 px fat-finger hazard
  during a fight. Flagged as a bad idea, not specced.
- Min hit box 44×44 (pad `.hbtn` to `min-height:34px` plus 6 px invisible padding on phone). Label is
  text, not a glyph: `⏸` reads as "stop" to a child and fails screen readers without a label.

### 1.2 Keys
- **Escape** and **P** pause; **Escape**, **P** and the "Back to the yard" button resume.
- Escape is required, but **while `document.fullscreenElement` is set the browser eats Escape to
  leave full screen** — a real conflict we cannot override. Mitigation: P always works, `#pauseBtn`
  always works, and the `fullscreenchange` handler pauses the game whenever full screen exits while
  `state==='play'`, so the escape press still lands the player somewhere safe.
- Auto-pause on `visibilitychange` (hidden) and on `window.blur` (extend the existing blur handler at
  the `keys` reset). Tab-away must never cost health.
- `keydown` must `preventDefault()` on `p` and `escape` only while paused, so the keys cannot scroll
  the overlay.

### 1.3 What freezes
New state value `state='paused'` (set from `'play'` only; `burst`, `won`, `lost` and the title screen
ignore pause). In `frame()`: when paused, skip `elapsed`, every `upd*` call, `hud()`, buffer decay and
particle integration; still call `render3D(0)` and `drawOverlay()` each frame so the preview is live;
set `last=now` so resume cannot produce a jump (the `.05` clamp already helps). Also on entering pause:
clear `biteBuf`, `dashBuf`, `boogaBuf`, `keys`, `joy`, `ptr`, `knob.style.transform` — otherwise a
buffered bite fires 0.2 s into the resume.
Keeps running: CSS animation on the card, the audio context (one-shot `sfx` only; the BOOGA `beat`
loop stops because `boogaT` stops), and the renderer.

### 1.4 Pausing mid-fight (lasso, combo, timing windows)
Pause is allowed at any moment during `play`, including while `R.held` (lassoed) and mid-combo. Taking
that away would punish exactly the players who most need a break. `Lass.t`, `Lass.cd`, `R.iframe`,
combo decay and `elapsed` all simply stop, so nothing is lost or gained by the clock.
The one real exploit is **pause-to-scout**: freezing a frame to study an incoming telegraph. Fix it in
camera, not in rules — on pause the camera eases (0.35 s) to the wardrobe framing (§2.4), which puts
the rope, the weak spot and every live attack out of frame. The player sees Rosie and backdrop, not
the battlefield. **If the camera move is dropped during implementation, pause becomes a free scouting
tool** — flagging this for `ui-programmer` as load-bearing, not polish.
Resume gives `R.iframe = Math.max(R.iframe, 0.4)` — less than `LASSO_MERCY`, un-farmable because each
use costs a menu round trip plus the count-in.

### 1.5 Resume
Count-in, always, when resuming into a live level: three paper tags, `3 · 2 · 1`, 0.35 s each, then
`GO!` (0.25 s) with `sfx.bark()`. Camera eases back during the count; input is ignored until `GO!`.
Reduced-motion (`reduce`) shortens it to a single `GO!` tag at 0.4 s — still a count-in, because
dropping straight into a hose attack is the thing the count-in exists to prevent.

### 1.6 Pause card contents (`#pauseOv .card`, reuses `.ov` + `.card`)

```
eyebrow   THE YARD IS HOLDING STILL
h2        Paused
          [ Back to the yard ]            .go
          [ Rosie's wardrobe ]            .go.paper (secondary: paper fill, ink text)
          How tough is the hose?          label, then 3 reserved segmented paper tags
          [ Start this hose again ]       .go.paper
          [ Back to hose #1 ]             .go.paper
          [ Sound on ] / [ Sound off ]    .hbtn, mirrors #mute
dl.how    Move / Bite / Dash / Booga / Pause   (same markup as #startOv)
```
Order is frequency-first (Fitts's Law + the fact that most pauses end in resume). Destructive items sit
below the wardrobe so a mis-tap on the way to resume cannot reach them.

**Difficulty — reserved only.** Three segmented paper tags under "How tough is the hose?", labels owned
by the modes designer. Behaviour here: changing it mid-level applies **immediately on resume** (a child
who is stuck needs relief now, not next level), and the level records a `diffFloor` = the easiest
setting used during it, which is what stars and score are awarded against. Copy under the control when
it changes mid-level: "Changed mid-hose, so this one scores at the easier setting."

### 1.7 Restart confirmation
No second overlay, no `confirm()`. The pressed button's row expands in place into a confirm strip
(progressive disclosure, keeps context):
- Start this hose again → "Start this hose again? Your best score is safe; this hose's points go back
  to where you started it." → **[ Yes, start it over ]** / **[ Never mind ]**
- Back to hose #1 → "Back to the very first hose? Your stars stay earned. This run's score starts
  fresh." → **[ Yes, back to the start ]** / **[ Never mind ]**
Focus moves to **Never mind**. Escape cancels the strip (does not resume). Confirming calls
`writeBest()` then `resetLevel()` (and `level=1; score=0` for the second), hides `#pauseOv`, and runs
the count-in.

## 2. Wardrobe

### 2.1 Scope, and what is left out
In: fur colour (main, shade derived) and five slots — Collar, Neckerchief, Hat, Sweater, Topknot —
all built from spheres, cylinders, cones, boxes and torii already in use, with `ink()` applied so every
item gets the same heavy outline. Out, deliberately: boots (`dLegs` are baked and animated per leg —
four more animated meshes for a detail hidden by grass), patterns and spots, eye/nose/tongue colour,
body size or breed shape, accessories that change silhouette scale (no capes, no wings), and any
free-form colour wheel. Say it plainly in the UI: this is a wardrobe, not a character creator.

### 2.2 Fur
- `furM.color` and `furS.color` set at runtime (`.set(hex).convertSRGBToLinear()`), which survives
  `bake()` because the bake merges *by* material. **`FURC`, `FURS`, `WHITE` and `FWET` (line ~865) are
  captured constants used by the wet-tint lerp — they must be rebuilt on every fur change or Rosie
  snaps back to cream when wet.** Flagged for `ui-programmer`.
- **Shade is derived, not picked:** `shade = mix(main, '#6f67c6', 0.46)`. One choice instead of two,
  and it makes an unreadable pairing impossible. Default `#fffaf0` → `#b5b1db`, within a hair of the
  shipped `#b7b2e8`.
- Eight swatches, all light-value and none in the hose/lawn green band or the warning red/amber band:
  **Marshmallow** `#fffaf0` (default) · **Buttermilk** `#ffeab0` · **Peach Fuzz** `#ffd0b8` ·
  **Bubblegum Cloud** `#ffc2dc` · **Lilac Puff** `#dcc8ff` · **Sky Pup** `#bfe2ff` ·
  **Cocoa Swirl** `#c99a72` · **Storm Cloud** `#cdd3e6`.

### 2.3 Slots
Each slot is `None` plus the options below; every item takes a colour from the accent set in §2.5.

| Slot | Options | Geometry | Attach |
|---|---|---|---|
| **Collar** | Classic Band (default), Chunky Band, Jingle Collar (+2 small spheres), Ribbon Collar (torus + flat bow), Star Tag (tag becomes a star-ish squashed box) | torus r20 t6 (already there) + `#ffd23f` tag sphere | `dogP`, the existing collar transform |
| **Neckerchief** | Cowpup Kerchief, Sailor Square, Picnic Check (2-tone), Tiny Scarf (long, trails), Bow Tie | one squashed cone + a flattened box point | `dogP`, just under the collar, −0.547 tilt |
| **Hat** | Sun Cap (cylinder + flat brim box), Party Hat (cone + bobble sphere), Bucket Hat (cylinder + torus brim), Flower Crown (torus + 5 petal spheres), Earmuffs (2 spheres + arc torus), Winter Beanie (half-sphere + torus cuff) | listed | `dHead`, above the topknot (+y 46) |
| **Sweater** | Cosy Knit, Stripey Jumper (2-tone band), Puffer Vest (3 stacked squashed spheres), Raincoat (adds a hood half-sphere on `dHead`), Spotty Tee | one sphere scaled 1.06× over `dBody` + two short cylinder leg cuffs on the front `dLegs` | `dBody` / `dLegs[0..1]` |
| **Topknot** | Big Bow (2 squashed spheres + torus knot), Scrunchie (fat torus), Two Pigtails (mirrored pair), Plain Tie (shipped default), Daisy (5 petal spheres) | listed | `dHead`, replaces the existing `tie` torus |

### 2.4 Framing, layout, apply
- **Framing:** pause moves the camera to a three-quarter portrait — Rosie centred at ~55 % frame
  height, hose and attacks off-frame, backdrop ridges behind her. Desktop reuses the `#startOv`
  pattern: card docked left at 46 %, Rosie hero-framed right, **no grey dim** over the scene (art §4
  item 10). Phone: card docked to the bottom ~58 % of the screen, Rosie framed in the top 42 %.
- She idles and does one happy tail wag when a slot changes (`happyT`), so the preview feels alive.
- **Desktop:** slot tabs as a vertical paper-tag rail at the card's left, options as a 4-column grid.
  **Phone:** tabs as a horizontally scrolling row of paper tags at the card top, options as a
  4-column grid of 48 px swatches, grid anchored to the bottom half for thumb reach.
- Swatches are round paper chips with an ink border; the selected one gets a 3 px ink ring **and** a
  small ink tick — never colour alone.
- **Changes apply instantly.** No confirm, no "try on" state; the preview *is* the confirmation.
- Buttons: **[ Back to pause ]** and **[ Put it all back ]** (reset to default, same inline confirm
  pattern as §1.7: "Put Rosie back the way she came? → Yes, plain Rosie / Never mind").
- One standing line under the fur row: "Every colour here keeps Rosie easy to spot in the grass."

### 2.5 Colour restrictions
Off-limits everywhere on Rosie, because the game already uses them as information:
- Warning red `#ff2d3c` and amber `#ffc21a`, plus anything near them at high chroma.
- Weak-spot gold `#ffd23f`, core `#fffbe0`, tired red `#ff5d5d`, the white-gold flash — a gold dog near
  a gold weak spot costs the player the only target-finding cue in the game.
- Hose and lawn greens (`#1fa055`, `#7be07a`, `#3f9a52`, `#55b85a`) — no green on Rosie at all.
- Fur additionally must stay light-valued: nothing darker than the deck planks, or she vanishes at dusk.

Accent set for items (8): **Bubblegum** `#ff4f9a` · **Grape** `#8b4dff` · **Blueberry** `#3d7bff` ·
**Cocoa** `#8a5a3c` · **Cream** `#fff1d8` · **Plum** `#5a2a6b` · **Midnight** `#241538` ·
**Sunset** `#ff8a3d` *(small slots only — collar, neckerchief, topknot; a sweater-sized orange mass sits
too close to the amber telegraphs)*.
**How the picker communicates this: by omission.** Only safe swatches are shown. No locks, no greyed
chips, no warning text, no "that colour is not allowed" — a child should never be told off by a
wardrobe. The single warm line in §2.4 is the whole explanation.

### 2.6 Saving and forward compatibility
One key, `rosie2-look`, through the existing `store` wrapper, written on every change (debounced 300 ms):

```json
{"v":1,"fur":"marshmallow",
 "collar":{"id":"classic","c":"bubblegum"},
 "kerchief":{"id":"none","c":"blueberry"},
 "hat":{"id":"party","c":"grape"},
 "sweater":{"id":"none","c":"cocoa"},
 "topknot":{"id":"bigbow","c":"bubblegum"}}
```
- Unknown or removed `id`/`c` → that slot alone falls back to its default; the rest of the outfit is
  kept. Never discard the whole object, never clear the key.
- Parse failure or missing key → defaults, silently.
- `v` mismatch → run a `MIGRATE[v]` id-rename table, then the per-slot fallback above.
- If a fallback actually fired, show one line on the wardrobe screen that session: "One of Rosie's
  things didn't make it into this version — pick her something new." No modal.

## 3. Keyboard & screen reader
- `#pauseOv` is `role="dialog" aria-modal="true" aria-labelledby="pauseTitle"`. While open, `#hud`,
  `#controls` and `#game` get `inert`; `#gl` stays visible (decorative, already `aria-hidden`).
- Opening: focus → **Back to the yard**. Closing (any route): focus → `#pauseBtn`. Opening the
  wardrobe: focus → the active slot tab. Leaving it: focus → **Rosie's wardrobe**.
- Focus is trapped in the card; Tab wraps.
- Escape ladder, innermost first: confirm strip → wardrobe → resume.
- Slot tabs: `role="tablist"`, roving tabindex, Left/Right (and Up/Down on the desktop rail) move,
  Home/End jump. Swatch grid: roving tabindex with arrow keys, so Tab never walks 40 swatches.
- Each swatch is a `role="radio"` in a named `radiogroup` ("Fur colour", "Hat"), `aria-checked`, and an
  accessible name of the option name only ("Lilac Puff") — colour names carry the meaning, so a
  non-sighted player gets the same list a sighted one does.
- `aria-live="polite"` region announces changes: "Hat: Party Hat, Grape."
- Count-in announces "3, 2, 1, go" through the same live region.
- All text is existing `.card` type scale (≥13 px); nothing in this spec encodes state in colour alone.

## 4. Acceptance criteria
1. `#pauseBtn` is reachable by Tab from the HUD, is ≥44 px on a 390 px-wide viewport, and does not
   overlap `.pad` or `.btns` at any size from 320×568 to 2560×1440.
2. P and Escape both pause from `play`; both resume. In full screen, Escape leaves full screen *and*
   the game is paused afterwards.
3. Pausing for 60 s then resuming: `elapsed`, `R.hp`, `hoseHP`, `power`, `combo`, `Lass.t` all unchanged
   on the first resumed frame; no attack lands during the count-in.
4. Pausing while lassoed and resuming returns the player to the struggle with the same tap count.
5. Holding Bite while pausing does not fire a bite on resume.
6. Paused, the rope, weak spot and any live attack are off-camera; only Rosie and backdrop are visible.
7. Tabbing away from the browser pauses the game automatically.
8. Both restart buttons require a second, differently-labelled confirmation; Escape cancels it.
9. Every wardrobe change is visible on Rosie within one frame, with no overlay reload.
10. Fur change persists through reload, and Rosie's wet tint uses the chosen colour, not `#fffaf0`.
11. Hand-editing `rosie2-look` to `{"v":1,"hat":{"id":"sombrero"}}` loads the default hat and keeps
    every other slot; nothing throws.
12. No swatch anywhere in the picker matches a warning, weak-spot or hose/lawn colour.
13. Screen reader: opening pause announces the dialog name; focus lands on Back to the yard; closing
    returns focus to `#pauseBtn`.
14. Keyboard only, gamepad-less, mouse-less: a player can pause, change every slot, reset, and resume.
15. `prefers-reduced-motion` shortens the count-in and removes the tail wag; nothing else changes.

## 5. Touched ids, classes, functions
`#hud .row` (new `#pauseBtn`), `#mute` (mirrored), new `#pauseOv` using `.ov`/`.card`/`.go`/`.how`,
new `.go.paper` secondary style, `state` ('paused'), `frame()`, `resetLevel()`, `hud()`, the
`keydown`/`blur` handlers, `fullscreenchange`, `store` (new key `rosie2-look`), `furM`, `furS`,
`FURC`/`FURS`/`WHITE`/`FWET`, `collarM`, `dogP`, `dHead`, `dBody`, `dLegs`, the topknot `tie`, `ink()`,
`bake()`, `happyT`, and the camera block in `render3D()`.
