import { expectTypeOf, test } from 'vitest';
import type { CaseDef, EngineEvent, MishnahDef, Ruling, Scene } from './scenario';

// A type-level test: `npm run typecheck` (tsc) is what checks it. Nothing here
// asserts at runtime; `expectTypeOf` is a no-op when Vitest runs the file. The
// `expectTypeOf` lines also use each value, so no `@ts-expect-error` below can
// be satisfied by an unused-variable error instead of the rejection it names.
test('a tiny CaseDef compiles against the contracts, and bad values do not', () => {
  const ruling: Ruling = {
    verdict: 'Both are ספיקות',
    birds: { c: 'yamus', o: 'yamus' },
    counts: { yamus: 2 },
    reasons: [
      { type: 'heading', text: 'Why:' },
      { type: 'paragraph', text: { he: 'ספק', en: 'doubt' } },
      { type: 'list', items: ['one', 'two'] },
    ],
  };

  const caseDef = {
    id: 'a',
    title: { en: 'One חטאת and One עולה' },
    initial: {
      birds: {
        c: { id: 'c', designation: 'chatas' },
        o: { id: 'o', designation: 'olah' },
      },
      containers: {
        left: { id: 'left', kind: 'zone', birdIds: ['c'] },
        right: { id: 'right', kind: 'zone', birdIds: ['o'] },
      },
      knowledge: { c: 'known', o: 'known' },
    },
    steps: [
      {
        id: 'mix',
        events: [{ type: 'mix', from: ['left', 'right'], into: 'mixed' }],
        advance: { cta: { en: 'Mix' } },
      },
    ],
    ruling: () => ruling,
    project: (state): Scene => ({
      containers: [{ id: 'mixed', kind: 'mixture', birdIds: Object.keys(state.birds) }],
      birds: Object.keys(state.birds).map((id) => ({
        id,
        containerId: 'mixed',
        tint: 'unknown',
        revealed: false,
        status: 'safek',
      })),
    }),
  } satisfies CaseDef;

  const mishnah: MishnahDef = { id: '1-2', ref: { chapter: 1, mishnah: 2 }, cases: [caseDef] };

  // @ts-expect-error unknown event types are rejected
  const badEvent: EngineEvent = { type: 'fly', bird: 'c' };
  // @ts-expect-error bird statuses are a closed set
  const badRuling: Ruling = { verdict: '', birds: { c: 'maybe' } };

  expectTypeOf(caseDef).toExtend<CaseDef>();
  expectTypeOf(mishnah).toEqualTypeOf<MishnahDef>();
  expectTypeOf(badEvent).toExtend<EngineEvent>();
  expectTypeOf(badRuling).toExtend<Ruling>();
});
