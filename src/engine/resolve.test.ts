import { expect, test } from 'vitest';
import { finalPosition, resolveView, rulingAt, sceneAt, stateAt } from '.';
import { threeBirdCase, twoViewCase } from './__fixtures__/cases';

test('resolveView returns the named view, else the first view, else undefined', () => {
  const caseDef = twoViewCase();

  expect(resolveView(caseDef, 'lenient')?.id).toBe('lenient');
  expect(resolveView(caseDef, 'no-such-view')?.id).toBe('strict');
  expect(resolveView(caseDef)?.id).toBe('strict');
  expect(resolveView(threeBirdCase(), 'lenient')).toBeUndefined();
});

test('switching the view re-derives the ruling and the scene statuses', () => {
  const caseDef = twoViewCase();
  const end = finalPosition(caseDef);
  const statuses = (viewId?: string) =>
    sceneAt(caseDef, end, viewId).birds.map((bird) => bird.status);

  expect(rulingAt(caseDef, stateAt(caseDef, end), 'lenient')?.birds).toEqual({
    a: 'kasher',
    b: 'yamus',
  });
  expect(statuses('strict')).toEqual(['yamus', 'yamus']);
  expect(statuses('lenient')).toEqual(['kasher', 'yamus']);
  expect(statuses('no-such-view')).toEqual(statuses('strict'));
});

test('the ruling shows only at the final position unless a step sets showRuling', () => {
  const caseDef = threeBirdCase();
  const statusesAt = (position: number) =>
    sceneAt(caseDef, position).birds.map((bird) => bird.status);

  expect(statusesAt(2)).toEqual(['alive', 'alive', 'alive']);
  expect(statusesAt(3)).toEqual(['kasher', 'kasher', 'kasher']);

  caseDef.steps[0] = { ...caseDef.steps[0]!, showRuling: true };
  expect(statusesAt(0)).toEqual(['alive', 'alive', 'alive']);
  expect(statusesAt(1)).toEqual(['safek', 'safek', 'kasher']);
});
