# Decision: Rosie becomes a painted figure

After ten passes of rebuilding Rosie as 3D geometry, the user asked the obvious
question — *"why can't she look like the character from the photos?"* — and chose
the answer this document records.

**Rosie is no longer modelled. She is painted art, cut out and animated as a
jointed puppet in the 3D scene.** The world around her becomes the user's painted
garden art by the same route.

## What was traded away, knowingly

The user was shown the cost and accepted it:

- **The six-slot mix-and-match wardrobe is gone.** Collar, neckerchief, hat,
  topknot, coat and boots mixing freely was cheap on a model and is impossible on
  painted art. It becomes **a set of complete painted outfits** — Plain, Sailor,
  Picnic, Winter, Party and so on — picked as whole looks.
- **The 360° drag-to-spin portrait is gone.** There is no model to spin. The
  wardrobe shows her painted views instead.
- **Runtime fur recolour (`wFur()`) is gone or heavily limited.** Her colour is
  painted in.

`design/ux/wardrobe-upgrade.md` is superseded on points 1 and 3 by this decision.
Its point 2 — real icons on the option buttons — survives and gets *easier*: the
icon becomes a crop of the outfit's own painted art.

## Why this needs far less art than it appears

The naive approach is frame-by-frame: every view × every action × every outfit,
which multiplies into hundreds of images and will never stay consistent across AI
generations.

**Instead, each painted view is cut into a jointed puppet** — head, ears, body,
front legs, back legs, tail as separate pieces on a skeleton. One painted image
then yields every animation: run cycles, biting, recoil, dancing, the Booga
hind-legs stand. This is cutout animation, the Paper Mario and South Park method,
and it is what keeps the art budget to a handful of images per outfit rather than
dozens.

It also serves the user's other instruction — *"I want it to look like how
Fortnite characters move, and have it be fluid"* — because a puppet is driven by
the same springs and easing the 3D rig used, at the full frame rate. The existing
animation code largely survives; what changes is what it drives.

## The art, in stages

**Stage 1 — one outfit, end to end.** Plain Rosie only. Prove the pipeline: cut
out, puppet, animate, light her into the scene. Nothing else is generated until
this looks right in motion.

Views needed: three-quarter front, side, back, plus a hind-legs Booga pose.

**Stage 2 — the world.** The empty garden backdrop, the Living Hose boss, the
squirrels, the gardener.

**Stage 3 — outfits.** Each additional outfit is the same views repainted with
the clothes on. Added one at a time, cheapest last.

## Requirements for every generated image

- **Flat solid bright green background.** This is a green screen; it is what makes
  a clean cutout possible. A painted or gradient background cannot be removed
  without tearing the character.
- **No drop shadow** — the game casts its own.
- **No UI, no text, no other characters, no ground.**
- Subject centred and filling the frame; square or portrait; 1024px or larger.
- **Consistency matters more than quality.** The same dog, the same colours, the
  same style across every image. Generating all views in one session, referencing
  the earlier outputs, holds the character together.

## Acceptance

Put a game frame next to the user's character sheet. The question is no longer
*"is this the same character rebuilt"* — she IS the artwork now. The question
becomes **"does she sit in the scene, or look pasted on?"** That is a lighting
and contact-shadow problem, and it is the one real risk of this approach.
