# Wardrobe: real garments, real icons, a real view of her

Three requests from the user, all about the same screen.

> *"Things like the Sailor Square, the scarf or the Picnic Check are more just
> concepts than actual real customization items — when I click on them they don't
> really look like what they're supposed to be. I wanted the icons on the buttons
> themselves so it depicts what they look like, and I need them to look more
> realistic and not just like blobs."*

> *"When she's in the frame where you're customizing her outfit, I want to be able
> to swipe and have like a full 360 view if I want to, and at least just be able to
> see her full body."*

## 1. The garments are not what their names say

The complaint is accurate and the code confirms it. Every non-bowtie neckerchief
is the *same cone* (`G_K4`) with boxes stuck on:

- **Sailor Square** — the cone plus one box. No sailor collar, no square.
- **Picnic Check** — the cone plus two cream boxes. **There is no check pattern.**
- **Tiny Scarf** — the cone plus a box hanging down.

So the names are promises the geometry never kept. The fix is two-part, and the
second part matters more than the first:

**Geometry: make the silhouette specific.** A sailor collar is a flat square bib
over the shoulders with a V at the front, not a cone. A scarf is a wrapped band
with two tails of different lengths. A bow tie already works — it is the one that
reads, because its silhouette is distinctive.

**Texture: this is what actually sells the name.** The project paints every
surface at runtime with `ctex()`, and no garment uses it. A check pattern is a
texture, not geometry — "Picnic Check" can never read as a check until something
paints squares on it. Per item:

| Item | Texture it needs |
|---|---|
| Picnic Check | Red-and-white gingham, two-tone woven squares |
| Sailor Square | Navy ground with two white stripes parallel to the hem |
| Tiny Scarf | Knitted ribbing, visible stitch rows, a fringed hem |
| Cowpup Kerchief | Bandana paisley, or a simple dotted print |
| Party Hat | Diagonal stripes |
| Bucket Hat | Canvas weave with a stitched brim seam |
| Winter Beanie | Knit rib, a fold line at the brim |
| Flower Crown | Distinct petal shapes, not a lumpy ring |

**Apply the same judgement to every slot**, not only the ones the user named. The
test for each: *cover the label — can you tell which item this is?*

Accent colour must keep working: the painted pattern tints with the chosen accent
rather than replacing it, so a Picnic Check in Blueberry is a blue gingham.

## 2. Icons on the buttons

Each option button currently shows a flat colour dot and a name, which tells the
player nothing about the difference between "Ribbon Collar" and "Jingle Collar".

Put the garment itself on the button. The wardrobe already builds every item in
3D through each slot's `make(id, material)`, so the honest route is to render each
one to a small thumbnail once and use it as the button's image — then the icon is
always exactly what the item is, with no second set of hand-drawn art to keep in
sync. Re-render on accent-colour change so the icon follows the colour.

Fallbacks if offscreen rendering proves unworkable: draw each icon with `ctex()`
as a small 2D glyph of the garment. Flat colour dots are not an acceptable
outcome either way.

The "None" option still needs a clear icon of its own — an empty slot mark, not a
blank button.

## 3. The portrait: full body and a 360 swipe

The pause camera currently eases to a portrait framing that crops her. Two fixes:

- **Frame her whole body** by default, standing, with room around her. The player
  is dressing a dog; they need to see the dog, including the boots and the tail.
- **Drag or swipe to orbit.** Horizontal drag spins her a full 360° so every
  angle is visible — the back of a scarf and the tail matter. Release leaves her
  where she was dragged to; a slow idle turn may resume after a few seconds of no
  input, but must never fight the player's drag.
- Works with mouse drag and touch. Vertical drag does nothing; do not let the
  player tip her over or see under the floor.
- The orbit is a camera move only. It must not alter her pose, her position, any
  gameplay state, or the paused world behind her.

## Acceptance

- Cover the labels in the wardrobe: each item is identifiable from its icon alone.
- Pick Picnic Check: it is a visible check pattern on her, not a plain shape.
- Drag her in the portrait: she turns smoothly through a full circle, her whole
  body is in frame throughout, and nothing in the paused game advances.
