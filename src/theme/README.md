# Theme — palette and type

> **Provisional — author to review.** Every value here is a first proposal for the
> "illuminated manuscript" direction in `docs/engine-framework-plan.md`.

Tokens live in `tokens.css` as `--kn-*` custom properties and are exposed to
Tailwind v4 through `@theme inline` (e.g. `bg-parchment`, `text-ink`,
`border-gold`, `fill-chatas`, `text-kasher`). They switch automatically:

- dark when the OS prefers dark, unless `<html data-theme="light">`;
- dark whenever `<html data-theme="dark">`.

`useTheme()` / `<ThemeToggle />` (in `src/theme`) cycle **system → light → dark**
and persist the choice in `localStorage` (`kn-theme`). The `dark:` Tailwind
variant follows the same rule.

## Palette

| Role           | Token                              | Light                 | Dark                  | Notes                                         |
| -------------- | ---------------------------------- | --------------------- | --------------------- | --------------------------------------------- |
| Surface        | `--kn-parchment`                   | `#f3ead6`             | `#17120c`             | Vellum by day, lamp-lit night vellum by night |
| Panel          | `--kn-parchment-deep`              | `#e8dabb`             | `#221a11`             | Cards (never inside stage boxes)              |
| Rule / edge    | `--kn-parchment-edge`              | `#d3bd8f`             | `#463722`             | Borders, rules                                |
| Text           | `--kn-ink`                         | `#2b2016`             | `#efe3c9`             | Iron-gall ink                                 |
| Secondary text | `--kn-ink-soft`                    | `#5a4834`             | `#c9b895`             |                                               |
| Faint text     | `--kn-ink-faint`                   | `#8c7a62`             | `#8f8068`             | Captions, dotted outlines                     |
| Gold leaf      | `--kn-gold`                        | `#b58a2e`             | `#d5af57`             | Halo, frames, accents                         |
| Gold highlight | `--kn-gold-bright`                 | `#e0bd5c`             | `#f2d88a`             |                                               |
| Gold shadow    | `--kn-gold-deep`                   | `#7d5b16`             | `#9c7829`             | Gold text on parchment                        |
| **Chatas**     | `--kn-chatas`                      | `#b8361f`             | `#e56a4c`             | Minium (vermilion)                            |
|                | `--kn-chatas-wash` / `-line`       | `#eba28e` / `#6b190d` | `#86321f` / `#ffbba7` | Wash = the bird's body; line = its label ink  |
| **Olah**       | `--kn-olah`                        | `#2c4d9c`             | `#7896e3`             | Lapis / ultramarine                           |
|                | `--kn-olah-wash` / `-line`         | `#a9bbe9` / `#15275a` | `#2f4a8e` / `#cad7ff` | Wash = the bird's body; line = its label ink  |
| Neutral bird   | `--kn-neutral` (+`-wash`, `-line`) | `#a08b6c`             | `#b3a488`             | Natural dove taupe: undesignated              |
| Unknown bird   | `--kn-unknown` (+`-wash`, `-line`) | `#8a8e95`             | `#999da5`             | Colourless slate: gives nothing away          |
| Desaturation   | `--kn-ash`                         | `#a39c92`             | `#6c665e`             | Pasul / yamus birds blend toward it           |
| Kasher         | `--kn-kasher`                      | `#2f7a52`             | `#63c08d`             | Verdigris (text / UI)                         |
| Pasul          | `--kn-pasul`                       | `#7d2a26`             | `#e5826f`             | Oxblood strike                                |
| Safek          | `--kn-safek`                       | `#a8691a`             | `#e6a74c`             | Ochre "?" badge                               |
| Yamus          | `--kn-yamus`                       | `#5f5a55`             | `#a59f97`             | Ash hourglass badge                           |
| Hypothetical   | `--kn-hypothetical`                | `#276670`             | `#72c2cc`             | Explore mode: stage-card outline, banner      |
| Focus ring     | `--kn-focus`                       | `#1d5bd6`             | `#8fb3ff`             | `:focus-visible` outline                      |

Tailwind names: `parchment`, `parchment-deep`, `parchment-edge`, `ink`,
`ink-soft`, `ink-faint`, `gold`, `gold-bright`, `gold-deep`, `box-kein`,
`box-pile`, `box-mixture`, `box-zone`, `chatas`, `chatas-wash`, `chatas-line`, `olah`, `olah-wash`,
`olah-line`, `bird-neutral(-wash|-line)`, `bird-unknown(-wash|-line)`, `ash`,
`kasher`, `pasul`, `safek`, `yamus`, `hypothetical`, `focus`.

## Container outlines (provisional)

> **Provisional — author to confirm.** Proposed after the author's feedback that
> groups should be "box outlines and colors", physically divided, with no baskets
> or backgrounds.

Every container is a plain rectangular box (corner radius 6 px) drawn on the
stage's own background. Boxes have **no fill, texture or gradient**; the kind is
carried only by the outline's colour and line style:

| Kind      | Token                                | Light     | Dark      | Line                                            |
| --------- | ------------------------------------ | --------- | --------- | ----------------------------------------------- |
| `kein`    | `--kn-box-kein` (= `--kn-ink-soft`)  | `#5a4834` | `#c9b895` | Solid, 1.75 px                                  |
| `pile`    | `--kn-box-pile` (= `--kn-ink-faint`) | `#8c7a62` | `#8f8068` | Solid, 1 px (thinner and fainter)               |
| `mixture` | `--kn-box-mixture`                   | `#7b3f86` | `#c79bd3` | Double: 1.25 px outer + 0.9 px inner, 3.5 px in |
| `zone`    | `--kn-box-zone` (= `--kn-gold`)      | `#b58a2e` | `#d5af57` | Dashed `7 5`, 1.5 px                            |
| `loose`   | —                                    |           |           | None: no outline, caption or emphasis           |
| highlight | `--kn-box-highlight` (= `--kn-gold`) | `#b58a2e` | `#d5af57` | Extra solid 2.5 px outline, 5 px outside        |
| dim       | —                                    |           |           | Outline and caption at 40 % opacity             |

- **Mixture purple** is folium, the manuscript pigment between minium (chatas) and
  lapis (olah), so a mixture reads as "the two merged" without any fill. It is
  never the only cue: the double line marks a mixture even in greyscale or with a
  colour-vision deficiency.
- **A lone bird is not a group.** A `loose` container draws nothing of its own:
  its birds stand on the stage in the same slot packing, level with the bottom row
  of birds in the boxes beside them, still a group gap from every box.
- Captions sit **under** each box (never over the birds). Boxes in a row stand on a
  shared baseline so captions line up. A box is captioned only when the caption
  adds something the bird labels do not (see `docs/adding-a-mishnah.md`, "Stage
  labelling").
- **Spacing** (see `src/stage/layout.ts`): boxes are at least `GROUP_GAP` = 40 px
  apart (`MIN_GROUP_GAP` = 32 px on stages narrower than 560 px); birds inside a
  box are only `BIRD_GAP` = 6 px apart, with `BOX_PADDING` = 14 px inside every box.
  Separate groups are unmistakably separate; one group reads as one unit.

## Bird colour and labels

- The bird itself is tinted by designation: its body is the offering's `*-wash`,
  its wing the full `--kn-chatas` / `--kn-olah`. The washes were deepened for this
  pass so the colour reads at a glance.
- Every labelled bird's word label, Hebrew only (חטאת, עולה, or חטאת/עולה for an
  undesignated bird), is drawn under it; chatas and olah labels are inked in
  `--kn-chatas-line` / `--kn-olah-line`. The layout reserves room for each label
  in the bird's slot, so labels never overlap.
- The ח lozenge / ע roundel emblem is drawn only for a revealed chatas / olah bird
  **without** a label: the word takes its place, so there is no duplicate cue.
- An unrevealed bird stays grey with the "?" disc and carries no label.

## Page background

The stage has no background of its own. The page behind it (`src/index.css`,
`body`) still has the vellum vignette and a faint fibre grain; the stage card is
the shared `.kn-card` panel. Neither is inside a box. If these read as "different
backgrounds", they are the next thing to flatten.

## Why these colours

- **Chatas = minium red, olah = lapis blue.** These are the two pigments that
  rubricate medieval manuscripts: red and blue initials, one after the other. So the
  pair belongs to the period and is easy to tell apart.
- **Colour-vision deficiencies.** Red against blue survives protanopia and
  deuteranopia, where it becomes ochre/brown against blue, and tritanopia, where it
  becomes red against teal. In the light theme they also differ in lightness
  (chatas about L 47 %, olah about L 36 %), so they separate in greyscale too.
- **Never colour alone.** Every revealed bird carries its **word label** (חטאת,
  עולה, חטאת/עולה). A revealed chatas or olah with no label falls back to a
  **lozenge with ח** or a **roundel with ע**, whose shapes tell them apart even
  where the letter is too small to read. Status markers are shapes as well:
  a gold nimbus (kasher), a diagonal strike (pasul), a "?" badge (safek) and an
  hourglass badge (yamus). An unrevealed bird is grey and carries a large "?" disc.
- **Neutral vs unknown.** An undesignated bird is a warm natural dove taupe. An
  unknown bird is a cool, colourless slate, so it "gives nothing away".
- **Dark theme** keeps the same hues, lifted in lightness, on a deep brown-black
  "night vellum". Gold is warmer and brighter there, so halos glow.
- **Status colours** are for text and badges. Kasher is verdigris green rather than
  gold, so the gold halo stays a shape cue and a ruling can still read green in
  text.

## Type

- **EB Garamond** (Latin) is the body and UI face. Italic is used for captions.
- **Frank Ruhl Libre** (Hebrew) is applied to `:lang(he)` and `[dir=rtl]`, and
  sized up 6 % outside SVG to sit with Garamond's x-height. The Latin stack also
  falls back to Frank Ruhl Libre, so stray Hebrew renders correctly.
- Only the `latin` / `hebrew` subsets are loaded (weights 400/500/600 and
  400 italic for Garamond; 400/500/700 for Frank Ruhl Libre).

## Open questions for the author

1. Is minium/lapis the right chatas/olah pairing, or is another convention preferred?
2. Are ח / ע the right emblems, or should they be words or other marks?
3. Should Hebrew-first pages flow the stage right-to-left (`<Stage direction="rtl">`)?
4. ~~Which bird style should be the default?~~ **Manuscript line-art**, per the author.
   The gilded and geometric doves stay in `/dev/stage` for comparison only.
5. Is the container outline scheme above right, in particular folium purple with a
   double line for a mixture, and a dashed gold zone?

## Explore mode (hypothetical)

> **Provisional — author to confirm.**

While a possibility ("Suppose…") plays, the UI marks the stage as hypothetical
with `--kn-hypothetical`, a woad teal that no bird tint, box outline or status
uses:

- the stage **card** (not the stage: the stage stays halacha-agnostic) takes a
  1 px teal outline, doubled inside;
- a dashed teal pill, "נניח / Suppose…", sits over the stage;
- the Possibilities panel carries a double teal top rule, and the outcome a teal
  side rule; the "Explore possibilities" button is outlined in teal.

Contrast on the page background: about 5.4 : 1 (light) and 9 : 1 (dark).
