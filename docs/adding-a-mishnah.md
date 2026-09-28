# Adding a mishnah

A short guide to portraying a new mishnah of Kinnim. The worked example is
`src/mishnayos/1-2/`, the author's four seed cases (as three cases, two of them
with variants).

## The loop

1. **Pick a mishnah.** The author decides which one comes next.
2. **Read the reference.** `docs/reference/` has the computational spec for
   each mishnah (setups, rulings, test vectors, open questions). It is
   background, not a spec for the portrayal.
3. **Design session with the author.** Agree on the layout (containers and
   labels), the steps and their CTAs, any interactions, and whether the case has
   views (a machlokes). Nothing is portrayed without this.
4. **Grow the engine by need.** If the design needs a new event, stage
   primitive or ruling helper, add it now, with tests, and nothing more.
5. **Author the cases** in `src/mishnayos/<chapter>-<mishnah>/`.
6. **Validate.** Write the mishnah's test (see below) and run the gate:
   `npm run typecheck && npm run lint && npm test -- --run && npm run build`.
7. **Review in the browser** with the author, then iterate.

## Where a mishnah lives

- `src/mishnayos/<chapter>-<mishnah>/index.ts` default-exports a `MishnahDef`.
  `src/mishnayos/index.ts` discovers it with `import.meta.glob`; you do not
  register it by hand.
- The folder name must equal `id` (e.g. `1-2`), and `id` must match `ref`
  (`{ chapter: 1, mishnah: 2 }`).
- The registry validates every mishnah at load and **throws on any issue**, so
  an invalid mishnah breaks the app, not just its page. Always assert
  `validateMishnah(def)` returns `[]` in the mishnah's test.
- Write definitions as plain data: object and array literals, and `ruling` /
  `project` functions that return them. A clean validation guarantees a crash-free
  render only for plain data; non-enumerable properties, getters, proxies and
  prototype tricks are out of contract. A hole in a list (`[a, , b]`) is
  reported.
- Split cases into `cases/*.ts` and keep shared text in one module (as 1:2 does
  with `text.ts`).

The contracts are in `src/engine/scenario.ts`; import everything from
`src/engine` (its `index.ts`), not from files inside it.

## A case

A `CaseDef` is a starting state, a timeline of steps and a ruling:

- `initial: CaseState`: `birds` (the truth: each bird's `designation`),
  `containers` (kind `kein` / `pile` / `mixture` / `zone` / `loose`, an optional label,
  and `birdIds` in order) and `knowledge` (`known` / `unknown` per bird).
- `steps: StepDef[]`: each has an `id`, `events` and
  `advance: 'auto' | { cta }`. There is no narration: the CTA and the stage
  carry each step.
- `ruling(state, viewId?) => Ruling`: `verdict`, `reasons`, optional `counts`,
  and a status for **every** bird (`alive` / `kasher` / `pasul` / `safek` /
  `yamus`). Validation reports any bird without a status, and any status for
  a bird that is not there.
- `variants?`, `possibilities?`: see below.
- `project?`: overrides the default projection onto the stage's `Scene`
  (`src/stage/scene.ts`). Most cases don't need it.

**Positions.** Position 0 is `initial`; position i + 1 is the state after
step i. A step's CTA is the button shown at the position before it.

**Truth vs. knowledge.** Designation is the truth and never changes on a mix.
Knowledge is what the observers see: `mix` makes the merged birds unknown, and
the default projection draws an unknown bird as a colourless "?" with no label.
`reveal` / `conceal` change knowledge only; `designate` changes the truth only.

## Stage labelling

Three standing rules from the author for everything drawn on the stage (UI
chrome such as titles, CTAs, possibility labels and the panels is not affected):

1. **Hebrew only.** Bird labels and container captions carry `he` and no
   transliteration: `{ he: 'חטאת' }`, not `{ he: 'חטאת', en: 'Chatas' }`. The
   default projection already labels birds this way.
2. **A lone bird is not a group.** Put a bird that belongs to no group in a
   container of kind `loose`: the stage draws no outline or caption for it, only
   the bird, still set apart from the other groups. A mix out of it animates as
   from any other container.
3. **Never label the same thing twice.** Caption a container only when the
   caption adds something its birds' labels do not. Twelve birds each labelled
   חטאת need no "חטאות" caption; a kein of two חטאת/עולה birds does gain from
   קן סתומה, and a mixture of unlabelled "?" birds from תערובת. A zone a bird
   is brought into is captioned with what it is brought as, unless the bird
   there is revealed as exactly that. The 1:2 test checks, at every position of
   every track (main lines and possibilities), that no caption repeats the
   label of a bird inside it.

## When the ruling shows

By default the ruling shows only at the final position. Set
`showRuling: true` on a step to show it from the position that step leads to,
onward (the earliest such step wins). Before that, every bird is drawn
`alive`. The ruling function may be called for any position from then on, so
derive it from the state rather than assuming the final one. Validation calls
it at **every** position where it shows, under every view, and reports a
throw or a missing or extra bird status at `ruling(position N, view "v")`.

Validation also replays every event and reports, at that event's path, any
event that leaves a bird in no container or in two.

## Views (machlokes)

Give a case `views: [{ id, label }]` (e.g. `bartenura`, `rambam`). The page
shows a toggle, and the active view's id is passed to `ruling(state, viewId)`.
An unknown or missing view id falls back to the first view. Validation checks
the ruling under every view. The engine's fixture `twoViewCase`
(`src/engine/__fixtures__/cases.ts`) is a minimal example.

## Variants (the reverse switch)

A case whose setup can be flipped (many חטאות + one עולה ⇄ many עולות + one
חטאת) lists `variants` instead of a body of its own. Each `VariantDef` is
complete: `{ id, label, title?, initial, steps, ruling?, possibilities? }`.
The case keeps `id`, `title` (its tab), `views` and `project`, shared by every
variant; TypeScript rejects a case that has both `variants` and its own
`initial` / `steps` / `ruling` / `possibilities`.

- `resolveVariant(caseDef, variantId?)` gives the concrete `ResolvedCase`; an
  unknown or missing id falls back to the first variant. Its title is the
  variant's, else the case's. Every downstream function takes a resolved case.
- The page shows a switch in the case header and records `?variant=`.
  Switching resets to position 0 (replace, no auto-advance); an unknown
  variant is corrected in the URL.
- Validation checks every variant, at `variants[i].…`, and that variant ids
  are safe and unique.

1:2's case (b) (`cases/defined.ts`) and case (c) (`cases/kein-stumah.ts`) are
examples; `flippedCase` is the engine fixture.

## Possibilities (Explore mode)

After the ruling, a case (or variant) can offer hypothetical branches:
`possibilities: PossibilityDef[]`, each
`{ id, label, from?, steps, outcome?, ruling?, possibilities? }`.

**Tracks and paths.** A possibility forks from a position on its parent's
track, `from` (default: the parent's final position). A top-level
possibility's parent is the main line; a nested one's is its parent
possibility's track. `trackFor(resolved, path)` gives the linear `Track` for
a path of ids (`[]` is the main line): the parent track's steps up to `from`,
then the possibility's own steps, with `start` at the fork point. The
timeline, scene and ruling functions (`stateAt`, `sceneAt`, `rulingAt`,
`isRulingShownAt`, …) all take a track, and a resolved case is the track of
its own main line. Check a path with `validatePath`; `possibilityAt` finds
the possibility it names.

**Ruling and outcome.** On a possibility's track its own `ruling` governs, at
its final position (or from its earliest `showRuling` step). Without one,
every bird stays `alive`. `outcome` is shown in the panel once the final
position is reached.

**In the page.** When the main line's ruling shows, "Explore possibilities"
enters explore mode: `?explore=` lists the top-level possibilities, and
`?explore=a.b&step=n` plays the possibility at that dot-joined path, with
`step` counting its own steps from the fork point (0). A breadcrumb
(Ruling › a › b) leads back up, a "נניח / Suppose…" banner sits over the
stage, and the stage card takes the `--kn-hypothetical` outline. Entering,
choosing and going back push history; steps replace. A stale path is
corrected to the main line at its ruling.

**Validation** simulates every path, recursively: `from` within the parent
track, safe and unique ids per level (so no `.`), the events replaying from
the fork point, and the ruling covering exactly the birds present where it
shows. Paths read like `possibilities[0].possibilities[1].steps[0].events[2]`.

**Content rule.** A possibility follows the author's reasoning and adds no
halachic claim: its outcome quotes the author's verbatim text by reference
(1:2 keeps the קן סתומה explanations in `parts` for this), and its label only
restates the supposition. Mark possibilities PROVISIONAL until the author has
reviewed them. `forkingCase` is the engine fixture.

## Adding an event type

1. Add a member to the `EngineEvent` union in `src/engine/scenario.ts`, with a
   doc comment.
2. Write a pure handler `Handler<'your-type'>` in `src/engine/events/<name>.ts`:
   return a new state, never mutate the input, build records with `ownAssign`,
   and throw `EngineError` for a reference that does not exist.
3. List it in `handlers` in `src/engine/events/index.ts`, and declare its
   runtime shape in `eventShapes` (`src/engine/validate.ts`): its required
   fields, the ids it uses, which fields are lists, and its enum values.
   Validation runs this check before applying each event. Both tables have a
   `satisfies { [K in EventType]: … }` clause, so TypeScript rejects a missing
   or misspelt entry.
4. Test it in `src/engine/events/events.test.ts`, and add it to the
   deep-freeze purity table there.

Add an event only when a designed mishnah needs it. The events so far:

| Event       | Shape                                         | Changes                                                             |
| ----------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `mix`       | `{ from, into, label? }`                      | Merges containers; the merged birds become unknown.                 |
| `move`      | `{ bird, to }`                                | One bird changes container.                                         |
| `reveal`    | `{ birds }` (ids or `'all'`)                  | Knowledge: known.                                                   |
| `conceal`   | `{ birds }` (ids or `'all'`)                  | Knowledge: unknown.                                                 |
| `create`    | `{ container: { id, kind, label? }, after? }` | Adds an empty container after `after`, or at the end; new ids only. |
| `designate` | `{ birds: { bird, designation }[] }`          | The truth, e.g. a kein bird fixed as a חטאת. Knowledge unchanged.   |

## Container ids and ordering

- Every id (mishnah, case, variant, possibility, step, view, bird, container,
  and each id an event uses) must start with a letter or digit and contain only
  letters, digits, `-` or `_`, and must not be a plain number such as `'0'` or
  `'12'`; validation rejects anything else, such as `__proto__` or `'1'`.
- Containers display in **record insertion order**. JavaScript lists
  plain-number keys before all others, so a numeric id would reorder the
  display; that is why validation rejects plain numbers (use `'kein'`,
  `'mixture'` or `'kein1'`, not `'1'`).
- `mix` puts a new `into` container where the earliest source was, and removes
  the other sources. An existing `into` must be listed in `from`.
- `move` needs its target to exist already. A container appears only when it
  becomes relevant: `create` it in the step that first uses it (e.g. 1:2's
  "brought" zone, created `after: 'mixture'` at the select step).
- Bird and container ids are the keys the stage animates by: keep them stable
  across steps.

## The author's text is verbatim

The author's explanations (verdicts, reasons, and any other text they write)
are copied **verbatim**: every word, Hebrew letter, arrow and hyphen. Encode
sub-headings as `heading` blocks and bullets as `list` blocks, and add a test
that compares the encoded text with its source (1:2's test parses
`docs/legacy-scenarios.md`). CTAs and labels you write yourself only describe
what happens ("Mix the birds", "Suppose we took the defined חטאת"); they make
no halachic claim of their own.

## Testing a mishnah

One test per behaviour, as in `src/mishnayos/1-2/mishnah-1-2.test.ts`:

- `validateMishnah` returns no issues and the real `registry` lists it;
- each case's (and variant's) ruling at the final position gives the exact
  per-bird statuses and counts;
- each possibility's ruling at its end, and that its outcome is a verbatim
  piece of the author's text;
- before the ruling shows, every bird in `sceneAt` is `alive`;
- after a mix, the mixed birds are unrevealed in `sceneAt`;
- the stage-labelling rules hold on every track at every position;
- the author's text equals its source.
