/**
 * Fixture mishnayos for UI tests. They exercise the page's features only; their
 * cases and "rulings" are arbitrary and make no halachic claim.
 */

import { render } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import App from '../../App';
import {
  createRegistry,
  type BirdStatus,
  type CaseDef,
  type CaseState,
  type MishnahDef,
  type Ruling,
} from '../../engine';
import { RegistryContext } from '../registry';

function state(known: boolean): CaseState {
  const knowledge = known ? 'known' : 'unknown';
  return {
    birds: {
      a: { id: 'a', designation: 'chatas' },
      b: { id: 'b', designation: 'olah' },
      c: { id: 'c', designation: 'olah' },
    },
    containers: {
      left: { id: 'left', kind: 'kein', birdIds: ['a'] },
      right: { id: 'right', kind: 'kein', birdIds: ['b'] },
      side: { id: 'side', kind: 'pile', birdIds: ['c'] },
    },
    knowledge: { a: knowledge, b: knowledge, c: knowledge },
  };
}

/**
 * Three steps (positions 0..3): a CTA step, then two `auto` steps. Two views;
 * the ruling (shown from position 3) differs by view.
 */
const alpha: CaseDef = {
  id: 'alpha',
  title: { en: 'Alpha case', he: 'מקרה א' },
  initial: state(true),
  views: [
    { id: 'strict', label: { en: 'Strict' } },
    { id: 'lenient', label: { en: 'Lenient' } },
  ],
  steps: [
    {
      id: 'mix',
      events: [{ type: 'mix', from: ['left', 'right'], into: 'mixed' }],
      advance: { cta: { en: 'Mix them', he: 'ערבב' } },
    },
    {
      id: 'join',
      events: [{ type: 'move', bird: 'c', to: 'mixed' }],
      advance: 'auto',
    },
    {
      id: 'reveal',
      events: [{ type: 'reveal', birds: 'all' }],
      advance: 'auto',
    },
  ],
  ruling: (_state, viewId): Ruling => ({
    verdict: viewId === 'lenient' ? 'Lenient verdict' : 'Strict verdict',
    birds: { a: viewId === 'lenient' ? 'kasher' : 'yamus', b: 'yamus', c: 'yamus' },
    counts: viewId === 'lenient' ? { kasher: 1, yamus: 2 } : { yamus: 3 },
    reasons: [{ type: 'heading', text: 'Why:' }],
  }),
};

const beta: CaseDef = {
  id: 'beta',
  title: { en: 'Beta case' },
  initial: state(false),
  steps: [
    {
      id: 'reveal',
      events: [{ type: 'reveal', birds: 'all' }],
      advance: 'auto',
    },
  ],
};

/** Two birds, known, each alone in a container. */
function pair(left: 'chatas' | 'olah', right: 'chatas' | 'olah'): CaseState {
  return {
    birds: { a: { id: 'a', designation: left }, b: { id: 'b', designation: right } },
    containers: {
      left: { id: 'left', kind: 'kein', birdIds: ['a'] },
      right: { id: 'right', kind: 'kein', birdIds: ['b'] },
    },
    knowledge: { a: 'known', b: 'known' },
  };
}

/** Every bird alive except those listed. */
const statuses =
  (verdict: string, ruled: Record<string, BirdStatus>) =>
  (state: CaseState): Ruling => ({
    verdict,
    birds: {
      ...Object.fromEntries(Object.keys(state.birds).map((id) => [id, 'alive' as const])),
      ...ruled,
    },
  });

/**
 * Two variants. `plain` (the default): one CTA step to a ruling, then
 * possibilities: `keep` (a CTA step then an auto step, with a nested `swap`)
 * and `drop`. `flip` has its setup reversed, its own title, an auto first step
 * and no possibilities.
 */
const gamma: CaseDef = {
  id: 'gamma',
  title: { en: 'Gamma case' },
  variants: [
    {
      id: 'plain',
      label: { en: 'Plain' },
      initial: pair('chatas', 'olah'),
      steps: [
        {
          id: 'mix',
          events: [{ type: 'mix', from: ['left', 'right'], into: 'mixed' }],
          advance: { cta: { en: 'Blend' } },
        },
      ],
      ruling: statuses('Gamma verdict', { a: 'yamus', b: 'yamus' }),
      possibilities: [
        {
          id: 'keep',
          label: { en: 'Suppose we keep a' },
          steps: [
            {
              id: 'take',
              events: [
                { type: 'create', container: { id: 'out', kind: 'zone' }, after: 'mixed' },
                { type: 'move', bird: 'a', to: 'out' },
              ],
              advance: { cta: { en: 'Take a' } },
            },
            { id: 'show', events: [{ type: 'reveal', birds: ['a'] }], advance: 'auto' },
          ],
          outcome: 'Kept outcome',
          ruling: statuses('kept', { a: 'kasher' }),
          possibilities: [
            {
              id: 'swap',
              label: { en: 'Then swap a' },
              steps: [
                {
                  id: 'swap',
                  events: [{ type: 'designate', birds: [{ bird: 'a', designation: 'olah' }] }],
                  advance: { cta: { en: 'Swap' } },
                },
              ],
              outcome: 'Swapped outcome',
              ruling: statuses('swapped', { a: 'pasul' }),
            },
          ],
        },
        {
          id: 'drop',
          label: { en: 'Suppose we drop b' },
          steps: [
            {
              id: 'drop',
              events: [{ type: 'conceal', birds: 'all' }],
              advance: { cta: { en: 'Drop' } },
            },
          ],
          outcome: 'Dropped outcome',
        },
      ],
    },
    {
      id: 'flip',
      label: { en: 'Flip' },
      title: { en: 'Gamma flipped' },
      initial: pair('olah', 'chatas'),
      steps: [
        {
          id: 'mix',
          events: [{ type: 'mix', from: ['left', 'right'], into: 'mixed' }],
          advance: 'auto',
        },
      ],
      ruling: statuses('Flipped verdict', { a: 'yamus', b: 'yamus' }),
    },
  ],
};

/** An illustrated fixture of Kinnim 1:3 (a real text id, so its text panel renders). */
export const fixtureMishnah: MishnahDef = {
  id: '1-3',
  ref: { chapter: 1, mishnah: 3 },
  cases: [alpha, beta, gamma],
};

export const fixtureRegistry = createRegistry({ './1-3/index.ts': { default: fixtureMishnah } });

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}

/** Stand-ins for the browser's Back and Forward buttons (history POPs). */
function HistoryButtons() {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => void navigate(-1)}>
        Browser back
      </button>
      <button type="button" onClick={() => void navigate(1)}>
        Browser forward
      </button>
    </>
  );
}

/**
 * Renders the app at a path with the fixture registry, plus a probe showing the
 * current URL and buttons standing in for the browser's Back and Forward.
 */
export function renderApp(path: string) {
  return render(
    <RegistryContext value={fixtureRegistry}>
      <MemoryRouter initialEntries={[path]}>
        <App />
        <LocationProbe />
        <HistoryButtons />
      </MemoryRouter>
    </RegistryContext>,
  );
}
