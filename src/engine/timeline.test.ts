import { expect, test } from 'vitest';
import { buildTimeline, clampPosition, nextStepAt, stateAt, stepAt, type PlainCaseDef } from '.';
import { stateOf, threeBirdCase } from './__fixtures__/cases';

test('buildTimeline has one state per position, each the fold of the steps before it', () => {
  const caseDef = threeBirdCase();
  const { states } = buildTimeline(caseDef);

  expect(states).toHaveLength(caseDef.steps.length + 1);
  expect(states[0]).toBe(caseDef.initial);
  expect(states[1]?.containers.mixed?.birdIds).toEqual(['a', 'b']);
  expect(states[1]?.knowledge).toEqual({ a: 'unknown', b: 'unknown', c: 'known' });
  expect(states[2]?.containers.mixed?.birdIds).toEqual(['a', 'b', 'c']);
  expect(states[3]?.knowledge).toEqual({ a: 'known', b: 'known', c: 'known' });
});

test("a step's events are folded in order", () => {
  const caseDef: PlainCaseDef = {
    id: 'order',
    title: { en: 'Order' },
    initial: stateOf({
      left: { birds: { a: 'chatas' } },
      right: { birds: { b: 'olah', c: 'olah' } },
    }),
    steps: [
      {
        id: 'both',
        events: [
          { type: 'move', bird: 'c', to: 'left' },
          { type: 'mix', from: ['left', 'right'], into: 'm' },
        ],
        advance: 'auto',
      },
    ],
  };

  expect(buildTimeline(caseDef).states[1]?.containers.m?.birdIds).toEqual(['a', 'c', 'b']);
});

test('stepping back to a position equals re-folding up to it', () => {
  const caseDef = threeBirdCase();
  const { states } = buildTimeline(caseDef);

  states.forEach((state, position) => {
    expect(stateAt(caseDef, position)).toEqual(state);
  });
});

test('positions clamp to 0..steps.length; stepAt is the step that led here, nextStepAt the one ahead', () => {
  const caseDef = threeBirdCase();

  expect([-1, 0, 1.7, 3, 99, Number.NaN].map((p) => clampPosition(caseDef, p))).toEqual([
    0, 0, 1, 3, 3, 0,
  ]);
  expect(stepAt(caseDef, 0)).toBeUndefined();
  expect(stepAt(caseDef, 1)?.id).toBe('mix');
  expect(nextStepAt(caseDef, 0)?.id).toBe('mix');
  expect(nextStepAt(caseDef, 3)).toBeUndefined();
});

test('a failing event is reported with its step and event index', () => {
  const caseDef = threeBirdCase();
  caseDef.steps[1] = {
    id: 'bad',
    events: [{ type: 'move', bird: 'c', to: 'left' }],
    advance: 'auto',
  };

  expect(() => buildTimeline(caseDef)).toThrow(
    /steps\[1\]\.events\[0\] \(step "bad"\): move: container "left" does not exist/,
  );
});
