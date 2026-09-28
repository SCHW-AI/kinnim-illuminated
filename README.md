# Kinnim Illuminated

An animated, step-by-step visual guide to Maseches Kinnim. Each mishnah is shown
as a set of cases: birds in their kinnim are mixed, taken and offered on an SVG
stage, step by step up to a ruling, whose possibilities can then be explored.
The first portrayal is Mishnah 1:2; the other mishnayos show their Hebrew text
only.

React 19 + TypeScript on Vite, deployed as a Cloudflare Workers static-assets
site (no Worker script).

**Live site:** <https://kinnim-illuminated.azlotowitz.workers.dev>

## Who made what

The code, design and wording in this version were produced by Claude (Anthropic's
AI model), running in Claude Code as an orchestrator directing AI builder agents,
and reviewed by OpenAI Codex. The project author did not write or review this
code line by line, and has not signed off on its content. The author's part is
limited to:

- **The scenario logic and explanations of the four original cases**, kept word for
  word from the author's earlier site ([docs/legacy-scenarios.md](docs/legacy-scenarios.md)).
- **Feedback and design decisions** given during the build: the stage look (bird
  style, colour plus Hebrew-only labels, outlined groups, calm motion), removing the
  narration panel, the reverse switch, and the Explore-possibilities mode. These are
  recorded in [docs/engine-framework-plan.md](docs/engine-framework-plan.md) under
  "Design iteration 1".

Everything else was written by the AI and has not been reviewed by the author:
all other wording, the portrayal of each case, the possibilities' step design,
button labels, and the reference research in [docs/reference/](docs/reference/).
Treat its halachic content as provisional, and check the halacha against the
sources.

## Commands

```sh
npm install
npm run dev          # local dev server (the stage playground is at /dev/stage)
npm test             # Vitest in watch mode; `npm test -- --run` runs once
npm run fetch:text   # re-fetch the Hebrew text from Sefaria into src/content/mishnah-text.json
npm run deploy:dry   # build + `wrangler deploy --dry-run` (no login needed)
npm run deploy       # build + `wrangler deploy`
```

The gate (also run by CI):

```sh
npm run typecheck && npm run lint && npm test -- --run && npm run build && npm run deploy:dry
```

`npm run preview` serves the production build locally; `npm run format` runs Prettier.

## Architecture

| Folder           | What it holds                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/engine/`    | Pure TypeScript, no React: case state, events, variants, possibility tracks, timelines, projection to a Scene, rulings, validation. |
| `src/stage/`     | The SVG stage: renders a `Scene` (containers, birds, labels) and animates birds by id with Motion.                                  |
| `src/ui/`        | Pages and panels: home, mishnah page, case tabs, variant switch, step controls, ruling, explore mode, rich text.                    |
| `src/theme/`     | Colour tokens (light and dark), fonts and the theme toggle. See [src/theme/README.md](src/theme/README.md).                         |
| `src/content/`   | The Hebrew text of the masechta (Torat Emet, public domain), fetched by `npm run fetch:text`.                                       |
| `src/mishnayos/` | One folder per portrayed mishnah (`<chapter>-<mishnah>/`), discovered at build time.                                                |

Docs:

- [docs/engine-framework-plan.md](docs/engine-framework-plan.md): the build plan and its phases.
- [docs/adding-a-mishnah.md](docs/adding-a-mishnah.md): how to portray a new mishnah.
- [docs/legacy-scenarios.md](docs/legacy-scenarios.md): the original site's scenario logic and text.
- [docs/reference/](docs/reference/): background specs for each mishnah.

## Deploying

The site is deployed to <https://kinnim-illuminated.azlotowitz.workers.dev>. A
deploy needs a Cloudflare login on that account:

```sh
npx wrangler login
npm run deploy
```

`wrangler.jsonc` serves `dist/` with single-page-application fallback, so deep
links such as `/mishnah/1-2/case-c` survive a refresh. `public/_headers` sets
long-lived caching for the hashed files in `/assets/`, revalidation for
everything else, and the security headers (including the Content Security
Policy).
