# Kinnim Illuminated: Engine Framework Plan

## Goal
A polished React + TypeScript app, deployable to Cloudflare, with a generic, tested scenario engine. The engine plays a mishnah's cases step by step on an animated SVG stage. It ships with exactly one seeded mishnah (1:2): the author's four existing cases, keeping the author's logic and explanatory text but with a new portrayal. Every other mishnah is added later, one at a time, in design sessions with the author.

> **Status: framework built plus design iteration 1 (2026-09-28). The final gate passes: clean install, 215 tests, build and deploy dry-run. The adversarial review took 8 Codex rounds and ended RELEASABLE. Not yet committed or deployed.**

## Gut rebuild
This is a gut job. The old site was vibe-coded. The author wrote only two things in it, and those are the only things preserved:

1. **Scenario logic.** Which cases exist, their setups, the events, and the rulings with their reasoning:
   - 1 chatas + 1 olah mixed → both ספיקות, all die;
   - many chata'os + 1 olah → all die (living things are not בטל);
   - קן סתומה + a defined chatas → 1 chatas may be brought, 2 die;
   - the mirror case with a defined olah.
2. **Explanatory text, verbatim.** Each case's result title and full explanation, including the "Why 1 חטאת can be brought / Why we cannot bring…" reasoning.

**Everything else is discarded and is not a reference:**
- UI copy (headings, button labels such as "Mix Birds", menu text);
- layouts and grids;
- animations and timings;
- styling;
- the bird PNG;
- file structure and code.

The new portrayal of the four cases is designed fresh. Git history keeps the old site if it is ever needed.

## Principles
- **Framework, not content.** No mishnah is portrayed unless the author has designed it in a design session. The reference research in `docs/reference/` is background, not a spec.
- **Grow the engine by need.** A new event type, stage primitive, interaction or ruling helper is added when the mishnah being built requires it, with tests, and not before.
- **Truth vs. knowledge.** The engine always knows each bird's real identity. The stage shows what the observers know (e.g. a "?" after mixing). A reveal can show the truth or the worst case.
- **Rulings are pluggable.** Each case supplies its own `ruling(state, views)`. A general solver (checking every possible identity, or a minimum cover) is a later, opt-in helper. Research shows 2:3 departs from pure logic because of a rabbinic decree, so a per-mishnah ruling must always remain possible.
- **Machlokes as a first-class concept.** A case may declare *views* (e.g. Bartenura / Rambam). Rulings and narration receive the active view, and the page shows a toggle.

## Stack (decided with the author)
- **SVG stage** (decided). Birds, containers and later the mizbe'ach are SVG elements rendered as React components and animated with Motion. Canvas was rejected: it gives worse accessibility, clicking and testing, and Kinnim never needs thousands of sprites. A decorative Canvas layer behind the SVG can be added later if needed.
- Vite + React 19 + TypeScript (strict).
- React Router for deep links, e.g. `/mishnah/1-2/case-b?step=3&view=rambam`.
- Motion (Framer Motion) for animation.
- Tailwind v4 with CSS-variable design tokens.
- Vitest + Testing Library for tests.
- ESLint + Prettier.
- Cloudflare Workers static assets (`wrangler.jsonc`, `assets.directory = ./dist`, SPA not-found handling). Workers static assets is the current recommended successor to Pages.

## Architecture

```
src/
  engine/            pure TS, no React: the testable core
    model.ts         Bird, Container, Owner, Designation, Knowledge, CaseState
    events/          event registry: each event = { type, apply(state, e) → state }
    timeline.ts      steps → state[] by folding events (enables back/forward/scrub)
    scenario.ts      MishnahDef, CaseDef, StepDef, ViewDef, Ruling types + validation
    registry.ts      discovers src/mishnayos/*/index.ts (import.meta.glob)
  stage/             SVG rendering: consumes a Scene, knows nothing of halacha
    scene.ts         Scene = containers + birds with visual props (the stage's only input)
    project.ts       default CaseState + Ruling → Scene projection (cases may override)
    layout.ts        slot packing inside containers; container arrangement; no magic px
    Bird.tsx, Container.tsx, Stage.tsx
  ui/                app shell and panels
    MishnahPage, CasePicker, StepControls, NarrationPanel, RulingPanel,
    MishnahTextPanel (Hebrew RTL + English), ViewToggle, Navigator
  theme/             tokens (light/dark), fonts, bird artwork
  content/
    mishnah-text.json   Hebrew (Torat Emet, public domain) for all of Kinnim, fetched once by a script
  mishnayos/
    1-2/index.ts     the only seeded mishnah: the author's four cases
                     (more folders added in design sessions)
```

**Core contracts** (the builder may refine names, not shape):
- `CaseDef = { id, title, initial: CaseState, steps: StepDef[], views?: ViewDef[], ruling?: (state, view) => Ruling, project?: (state, ruling) => Scene }`
- `StepDef = { events: Event[], narration: RichText | (view) => RichText, advance: 'auto' | { cta: string } }`
- `Ruling = { verdict: RichText, birds: Record<BirdId, 'kasher' | 'pasul' | 'safek' | 'yamus'>, counts?, reasons: RichText[] }`
- `Scene = { containers: SceneContainer[], birds: SceneBird[] }`. Each `SceneBird` carries id, container, label, `revealed`, status and emphasis. Motion animates by bird id, so an event that changes a bird's container becomes a flight automatically.

**Initial event set:** the minimum the four seed cases need: `mix` (merge containers; identities become unknown to observers), `move` (a bird changes container), and `reveal` / `conceal` (knowledge changes). Every halachic event (offer above/below, fly, designate, die, …) is added per mishnah.

## Phases (build order, not releases)

### Phase 1: Scaffold and test harness
- **Before deleting anything,** extract the preserved material from HEAD into `docs/legacy-scenarios.md`: for each of the four cases, the setup, events and ruling logic, plus the result title and explanation copied **verbatim**, Hebrew included. Nothing else goes in.
- Then delete the entire old site: `index.html`, `scenarios/`, `js/`, `css/`, `images/`.
- Set up the Vite/React/TS/Tailwind/Vitest/ESLint project, `wrangler.jsonc`, and npm scripts.
- Add a minimal GitHub Actions workflow that runs the gate.

**Done when:**
- `npm run dev` serves a placeholder shell.
- The gate passes with one trivial test.
- `npx wrangler deploy --dry-run` succeeds.
- `docs/legacy-scenarios.md` exists, and the author can check it against the old pages.
- The old files are gone.

### Phase 2: Engine core (`src/engine`) · may run in parallel with Phase 3
Covers the model, the event registry with `mix`/`reveal`/`conceal`, the timeline fold, scenario types, validation, and the registry.

**Done when** tests prove:
- Folding steps yields the correct state at every index.
- Stepping back equals re-folding.
- `mix` hides identities from observers but preserves the truth.
- Unknown event types and malformed cases fail validation with clear messages.
- The registry discovers mishnah folders.
- A view switch re-derives the ruling.

No React imports under `engine/`, enforced by a lint rule.

### Phase 3: Stage and visual system (`src/stage`, `src/theme`) · parallel with Phase 2
**Scope:**
- Design tokens: an "illuminated manuscript" direction of parchment, ink and gold leaf, with a clear chatas/olah colour pair; light and dark.
- Fonts: Hebrew (Ezra SIL, by SIL International) and Latin serif (EB Garamond).
- A new tintable SVG bird. Two or three candidate styles are shown side by side in the playground for the author to choose from; the old PNG is not a reference.
- `Bird`, `Container`, a layout engine, and Motion transitions keyed by bird id.
- Visual states: labelled, `?` (safek), kasher glow, pasul/yamus dim.
- A dev-only `/dev/stage` playground that renders sample Scenes, so the author can react to primitives in isolation.

**Stage input:** only the `Scene` type from this plan (the orchestrator pins it before launch), so the stage has no dependency on Phase 2 internals.

**Done when:**
- Tests show that the rendered bird and container counts and each status's visual marker match the Scene.
- Layout places N birds without overlap for N = 1..40.
- Reduced-motion preference is respected.
- The playground renders in both themes.

### Phase 4: App shell
**Scope:**
- Navigator of all Kinnim mishnayos. Unbuilt ones show the Hebrew text and a "not yet illustrated" marker.
- Mishnah page: text panel, case picker, stage, step controls (next/back/replay, keyboard ←/→), narration, ruling panel, and view toggle.
- Deep links.
- Responsive layout down to 360 px; RTL-correct Hebrew.
- Fetch script for `mishnah-text.json`.

**Done when** tests show:
- Navigating by URL restores case, step and view.
- The controls advance and rewind the timeline.
- The CTA step waits for a click.
- Unbuilt mishnayos render the text only.

### Phase 5: Seed Mishnah 1:2 (the author's four cases)
- Encode the four cases from `docs/legacy-scenarios.md` as `CaseDef`s under `src/mishnayos/1-2/`:
  - setups and events per the preserved logic;
  - a hand-written `ruling()` per case;
  - result titles and explanations verbatim.
- The portrayal (layout, steps, CTA wording, motion) is new, built from the framework primitives. It is marked **provisional**; the author reviews and redesigns it in the first design session.
- Framework features the seed doesn't use (e.g. views) are covered by test fixtures under `src/engine/__fixtures__/`, not by a demo page.

**Done when:**
- Each case's ruling test passes (e.g. stumah + chatas → exactly 1 kasher below, the other 2 die).
- A test asserts that each case's explanation text equals the text in `docs/legacy-scenarios.md`.
- `docs/adding-a-mishnah.md` describes the iterative loop: pick a mishnah → read the reference → design session with the author → add the events and primitives it needs, with tests → author the case → review in browser.

### Phase 6: Deploy readiness
- `npm run deploy` (build + `wrangler deploy`).
- Asset caching headers.
- A README.

**Done when:**
- The dry-run deploy passes.
- The actual first deploy is done **by the author or with explicit approval**, since it needs a Cloudflare login.

## Standing gate (after every phase)
```
npm run typecheck && npm run lint && npm test -- --run && npm run build
```

## Final gate
1. Clean install (`rm -rf node_modules && npm ci`) and a full gate run.
2. Browser check by the orchestrator of the four 1:2 cases and the navigator at desktop and 375 px, in light and dark, including the reduced-motion path.
3. Adversarial review loop (Codex) until RELEASABLE. It hunts for:
   - timeline/state bugs;
   - truth vs. knowledge leaks;
   - animation keyed wrong;
   - RTL issues;
   - test bloat and weak assertions.
4. Route checklist: `/`, `/mishnah/:id`, `/mishnah/:id/:case`, query params, `/dev/stage` (dev only), SPA deep-link refresh on the Workers config.
5. Scope check: nothing outside the repo is changed, no old-site files remain, and no mishnah other than 1:2 has a portrayal (the rest have only their Hebrew text in `mishnah-text.json`).

## First iteration after approval
Review the provisional portrayal of 1:2 together. Then the author picks the next mishnah (likely 1:1 or the rest of 1:2). A design session decides:
- its layout and steps;
- which interactions it needs;
- which new events and primitives to add.

Then it is built with tests.

## Explicitly deferred (built when a mishnah needs it, with the author)
- The mizbe'ach and chut hasikra component.
- Owners and colour-coding by owner.
- Flight events.
- Above/below offering events.
- The general solver and the minimum-cover solver.
- Drag / slider interactions.
- An adversary "worst case" reveal.
- Species.
- Remedies ledger.

## Design iteration 1: decisions by the author (2026-09-28)

**Stage look**
- Birds use the manuscript line-art style. Each bird is coloured by its designation and has a Hebrew-only word label (חטאת / עולה). Colour gives quick recognition; the label removes ambiguity. Unrevealed birds show a grey "?" and no label.
- Stage labels are Hebrew only, with no transliterations.
- Groups are box outlines with no fills, baskets or backgrounds. Groups are kept physically apart. A lone bird is not a group: it gets no box and no caption.
- A container never repeats its birds' labels. A group gets a caption only when it adds information.
- Motion is calm: birds glide straight to their new place, with no hop, arc or overshoot.

**Page**
- The narration panel is removed. The CTA buttons and the stage carry each step.
- A container appears only when it becomes relevant, e.g. the "brought" zone appears at the step where a bird is brought. This needs a new `create` event.

**Variants (reverse switch)**
- A case can have variants: the same case with its setup flipped, e.g. many חטאות + one עולה ⇄ many עולות + one חטאת. The case shows a switch, and the URL records the variant.
- 1:2 cases c and d merge into one case with a חטאת ⇄ עולה switch. Mishnah 1:2 then has 3 tabs.

**Possibilities (Explore mode)**
- After the ruling, an "Explore possibilities" mode lets the viewer play hypothetical branches on the stage. For example: suppose we took a bird from the קן סתומה → bringing it as a חטאת makes its partner an עולה → try a second חטאת → now a חטאת is mixed with an עולה → all die.
- A possibility is a branch that forks from a point in the case's timeline. Branches can nest. Each branch has its own steps, and may have its own outcome and ruling.
- A `designate` event shows a bird's designation being fixed (e.g. by the kohen's act).
- The author's explanation stays verbatim in the ruling panel. Possibilities are added alongside it; they do not replace it.
- While a possibility plays, the stage shows a "נניח / Suppose…" banner and a distinct outline tint. A breadcrumb shows the path, and there is a way back to the ruling.
- The possibilities authored for 1:2 must follow the author's own reasoning (the "Why…" bullets) and add no new halachic claims.
