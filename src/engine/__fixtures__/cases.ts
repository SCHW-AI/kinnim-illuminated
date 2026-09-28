/**
 * Small, non-halachic fixture cases for engine tests. They exercise framework
 * features only; their "rulings" are arbitrary and make no halachic claim.
 */

import type {
  BirdId,
  CaseDef,
  CaseState,
  ContainerId,
  ContainerKind,
  Designation,
  Knowledge,
  MishnahDef,
  PlainCaseDef,
  VariantDef,
  VariedCaseDef,
} from '../scenario';
import { ownAssign } from '../records';

/**
 * Builds a consistent state from `{ container: { kind?, birds: { id: designation } } }`.
 * Every id becomes an own entry, even `__proto__` (given as a computed key).
 */
export function stateOf(
  spec: Record<ContainerId, { kind?: ContainerKind; birds: Record<BirdId, Designation> }>,
  knowledge: Knowledge = 'known',
): CaseState {
  const state: CaseState = { birds: {}, containers: {}, knowledge: {} };
  for (const [containerId, { kind = 'zone', birds }] of Object.entries(spec)) {
    ownAssign(state.containers, containerId, {
      id: containerId,
      kind,
      birdIds: Object.keys(birds),
    });
    for (const [id, designation] of Object.entries(birds)) {
      ownAssign(state.birds, id, { id, designation });
      ownAssign(state.knowledge, id, knowledge);
    }
  }
  return state;
}

/** Recursively freezes a value so any mutation throws in strict mode. */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/**
 * Three birds in three containers: mix two, move the third in, reveal all.
 * Ruling: unknown birds are `safek`, known birds `kasher`.
 */
export function threeBirdCase(): PlainCaseDef {
  return {
    id: 'three-birds',
    title: { en: 'Three birds' },
    initial: stateOf({
      left: { birds: { a: 'chatas' } },
      right: { birds: { b: 'olah' } },
      side: { kind: 'pile', birds: { c: 'unassigned' } },
    }),
    steps: [
      {
        id: 'mix',
        events: [{ type: 'mix', from: ['left', 'right'], into: 'mixed', label: { en: 'Mixed' } }],
        advance: { cta: { en: 'Mix' } },
      },
      { id: 'join', events: [{ type: 'move', bird: 'c', to: 'mixed' }], advance: 'auto' },
      { id: 'reveal', events: [{ type: 'reveal', birds: 'all' }], advance: 'auto' },
    ],
    ruling: (state) => ({
      verdict: 'fixture',
      birds: Object.fromEntries(
        Object.keys(state.birds).map((id) => [
          id,
          state.knowledge[id] === 'known' ? 'kasher' : 'safek',
        ]),
      ),
    }),
  };
}

/** Two birds mixed, with two views whose rulings differ: `strict` kills both, `lenient` allows `a`. */
export function twoViewCase(): PlainCaseDef {
  return {
    id: 'two-views',
    title: { en: 'Two views' },
    initial: stateOf({ left: { birds: { a: 'chatas' } }, right: { birds: { b: 'olah' } } }),
    views: [
      { id: 'strict', label: { en: 'Strict' } },
      { id: 'lenient', label: { en: 'Lenient' } },
    ],
    steps: [
      {
        id: 'mix',
        events: [{ type: 'mix', from: ['left', 'right'], into: 'mixed' }],
        advance: 'auto',
      },
    ],
    ruling: (_state, viewId) => ({
      verdict: viewId ?? 'none',
      birds: { a: viewId === 'lenient' ? 'kasher' : 'yamus', b: 'yamus' },
    }),
  };
}

/** A mishnah wrapping the given cases, with an id that matches its ref. */
export function mishnahOf<C extends CaseDef>(
  chapter: number,
  mishnah: number,
  cases: C[],
): MishnahDef & { cases: C[] } {
  return { id: `${chapter}-${mishnah}`, ref: { chapter, mishnah }, cases };
}

/**
 * Two birds mixed, then revealed, with possibilities (positions: main line 0..2):
 * - `take` forks after the mix (from 1): a zone `out` is created and `a` moved
 *   into it; its ruling makes `a` kasher. Nested in it, `swap` forks at its end
 *   and designates `a` an olah; its ruling makes `a` pasul.
 * - `hide` forks at the main line's end and conceals every bird; it has no ruling.
 */
export function forkingCase(): PlainCaseDef {
  return {
    id: 'forking',
    title: { en: 'Forking' },
    initial: stateOf({ left: { birds: { a: 'chatas' } }, right: { birds: { b: 'olah' } } }),
    steps: [
      {
        id: 'mix',
        events: [{ type: 'mix', from: ['left', 'right'], into: 'mixed' }],
        advance: 'auto',
      },
      { id: 'reveal', events: [{ type: 'reveal', birds: 'all' }], advance: 'auto' },
    ],
    ruling: () => ({ verdict: 'main', birds: { a: 'yamus', b: 'yamus' } }),
    possibilities: [
      {
        id: 'take',
        label: { en: 'Take a' },
        from: 1,
        steps: [
          {
            id: 'take',
            events: [
              { type: 'create', container: { id: 'out', kind: 'zone' }, after: 'mixed' },
              { type: 'move', bird: 'a', to: 'out' },
            ],
            advance: { cta: { en: 'Take' } },
          },
        ],
        outcome: 'taken',
        ruling: () => ({ verdict: 'take', birds: { a: 'kasher', b: 'alive' } }),
        possibilities: [
          {
            id: 'swap',
            label: { en: 'Swap a' },
            steps: [
              {
                id: 'swap',
                events: [
                  { type: 'designate', birds: [{ bird: 'a', designation: 'olah' }] },
                  { type: 'reveal', birds: ['a'] },
                ],
                advance: 'auto',
              },
            ],
            ruling: () => ({ verdict: 'swap', birds: { a: 'pasul', b: 'alive' } }),
          },
        ],
      },
      {
        id: 'hide',
        label: { en: 'Hide all' },
        steps: [{ id: 'hide', events: [{ type: 'conceal', birds: 'all' }], advance: 'auto' }],
      },
    ],
  };
}

/**
 * One case with two variants, its setup flipped: `ab` has the chatas on the
 * left, `ba` on the right (with its own title). Shared views; each variant's
 * ruling names its left-hand bird kasher.
 */
export function flippedCase(): VariedCaseDef {
  const variant = (id: 'ab' | 'ba', left: Designation, right: Designation): VariantDef => ({
    id,
    label: { en: id.toUpperCase() },
    ...(id === 'ba' ? { title: { en: 'Flipped (BA)' } } : {}),
    initial: stateOf({ left: { birds: { l: left } }, right: { birds: { r: right } } }),
    steps: [
      { id: 'mix', events: [{ type: 'mix', from: ['left', 'right'], into: 'm' }], advance: 'auto' },
    ],
    ruling: () => ({ verdict: id, birds: { l: 'kasher', r: 'yamus' } }),
  });
  return {
    id: 'flipped',
    title: { en: 'Flipped' },
    views: [{ id: 'only', label: { en: 'Only' } }],
    variants: [variant('ab', 'chatas', 'olah'), variant('ba', 'olah', 'chatas')],
  };
}
