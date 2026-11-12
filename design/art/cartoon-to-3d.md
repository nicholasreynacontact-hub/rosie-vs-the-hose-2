# The target, stated plainly: cartoon-to-3D, not painterly

The user, after eight passes that each changed colour, content, lighting and motion
without closing the gap:

> *"I want the art style to be more like how Fortnite turns characters like Rick and
> Morty or Family Guy into 3d."*

This supersedes the brushwork reading of the **Surfaces** row in
`not-an-ad-game.md`. That row said *texture, grain, brush marks*. It was the wrong
inference from the user's painted reference images: those images are **concept art**,
showing what the character IS, not the rendering technique the game should use.

The reference is now unambiguous and it is a well-understood production style.

## What that treatment actually does

Fortnite's licensed-cartoon skins take a 2D drawn character and rebuild it in 3D
without making it realistic. Six concrete properties:

1. **Proportions come from the drawing, exactly.** Peter Griffin's 3D model keeps the
   oval head, the chin, the eye spacing. Nothing is "corrected" toward anatomy or
   toward generic-cute. The drawing is the spec sheet.
2. **The face is drawn on, not built.** Eyes and mouth are flat shapes on a smooth
   surface — not spheres set into sockets. This is the single biggest difference
   between a cartoon-in-3D and a generic 3D avatar.
3. **Surfaces are matte.** Almost no specular, no gloss, no gradient sheen. A flat
   base colour with a soft shadow side.
4. **Shading is cel-like and soft.** One lit side, one shadow side, a soft
   terminator, and shadow that stays in the object's own hue rather than going grey.
   The light does not sculpt every curve — it separates big forms.
5. **Hair and fur are shaped into one continuous surface.** Shaggy becomes curl
   forms cut into a single smooth coat, not a pile of separate balls with visible
   seams between them. Never strand fuzz, never alpha fur cards.
6. **The silhouette is bold and readable at thumbnail size,** with deliberate
   irregularity — notches, tufts, asymmetry — rather than a stack of arcs. The
   silhouette is irregular; the surface inside it is smooth.

## Why the user likes this style, in their words

> *"I love that style and think it looks seamless and smooth and like a drawing
> but 3d without looking corny."*

Three constraints fall out of that sentence, and they are the tie-breakers when
any instruction above is ambiguous:

- **Seamless and smooth.** Clean continuous surfaces. Visible intersections
  between lumps of geometry are the failure mode, not the technique.
- **Like a drawing but 3D.** Crisp flat features on a smooth surface. This is why
  the drawn-on face matters more than any other single change.
- **Not corny.** Corny means toy-like, bobbleheaded, goofy-bright, shiny vinyl.
  Fidelity to the character sheet is the defence: the sheet is not corny, so
  copying its proportions accurately rather than exaggerating them keeps the
  result out of that territory.

## Where the build was guilty

| Property | The build before this pass |
|---|---|
| Proportions | Generic cute-3D-dog, not the character sheet |
| Face | Geometry: spheres for eyes, set into the head |
| Surfaces | Flat-coloured but gradient-shaded, slightly glossy |
| Shading | Lights sculpting every curve — the "3D avatar" tell |
| Fur | Smooth spheres |
| Silhouette | A stack of arcs, as diagnosed in `painted-garden.md` |

## What is NOT wanted

- Painterly brushwork on every surface. Cancelled by this ruling.
- Realistic fur, strand fuzz or alpha fur cards.
- Ink outlines. Already removed, stays removed.
- Anything glossy, bevelled or plastic-highlighted.

## The test

Put the character next to the user's character sheet. The question is not *"is it
appealing"* but **"is this the same character, rebuilt, or a different dog that
happens to share a colour?"** Proportion by proportion: head-to-body ratio, muzzle
size and placement, eye size and spacing, ear mass, leg length, tail shape.
