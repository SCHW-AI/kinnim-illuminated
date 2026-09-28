import { expect, test } from 'vitest';
import {
  EngineError,
  finalPosition,
  possibilityAt,
  resolveVariant,
  sceneAt,
  stateAt,
  trackFor,
  validatePath,
} from '.';
import { flippedCase, forkingCase, threeBirdCase } from './__fixtures__/cases';

test('resolveVariant picks the named variant, falls back to the first, and keeps shared fields', () => {
  const caseDef = flippedCase();
  const [ab, ba] = caseDef.variants;

  const flippedBack = resolveVariant(caseDef, 'ba');
  expect(flippedBack).toMatchObject({ id: 'flipped', variantId: 'ba', title: ba!.title });
  expect(flippedBack.initial).toBe(ba!.initial);
  expect(flippedBack.views).toBe(caseDef.views);

  for (const fallback of [undefined, 'no-such-variant']) {
    const resolved = resolveVariant(caseDef, fallback);
    expect(resolved.variantId).toBe('ab');
    expect(resolved.steps).toBe(ab!.steps);
    // No title of its own: the case's.
    expect(resolved.title).toBe(caseDef.title);
  }

  const plain = threeBirdCase();
  expect(resolveVariant(plain, 'ba')).toBe(plain);
});

test("a nested possibility's track is its parent's track up to `from`, then its own steps", () => {
  const resolved = resolveVariant(forkingCase());
  const [take] = resolved.possibilities!;
  const [swap] = take!.possibilities!;

  const main = trackFor(resolved, []);
  expect(main.steps).toEqual(resolved.steps);
  expect(main.start).toBe(0);

  const takeTrack = trackFor(resolved, ['take']);
  expect(takeTrack.steps).toEqual([resolved.steps[0], ...take!.steps]);
  expect(takeTrack.start).toBe(1);

  // `swap` has no `from`: it forks at the end of its parent's track.
  const swapTrack = trackFor(resolved, ['take', 'swap']);
  expect(swapTrack.initial).toBe(resolved.initial);
  expect(swapTrack.steps).toEqual([...takeTrack.steps, ...swap!.steps]);
  expect(swapTrack.start).toBe(finalPosition(takeTrack));
  expect(stateAt(swapTrack, finalPosition(swapTrack)).birds.a?.designation).toBe('olah');
  expect(possibilityAt(resolved, ['take', 'swap'])).toBe(swap);
});

test("a possibility's own ruling governs at its end; without one every bird stays alive", () => {
  const resolved = resolveVariant(forkingCase());
  const statuses = (path: string[], position?: number) => {
    const track = trackFor(resolved, path);
    return sceneAt(track, position ?? finalPosition(track)).birds.map((b) => [b.id, b.status]);
  };

  expect(statuses([])).toEqual([
    ['a', 'yamus'],
    ['b', 'yamus'],
  ]);
  expect(statuses(['take'])).toEqual([
    ['a', 'kasher'],
    ['b', 'alive'],
  ]);
  // Before its end, even where the main line would rule, nothing is ruled.
  expect(statuses(['take', 'swap'], 2)).toEqual([
    ['a', 'alive'],
    ['b', 'alive'],
  ]);
  expect(statuses(['take', 'swap'])).toEqual([
    ['a', 'pasul'],
    ['b', 'alive'],
  ]);
  expect(statuses(['hide'])).toEqual([
    ['a', 'alive'],
    ['b', 'alive'],
  ]);
});

test('an unknown path is reported by validatePath and thrown by trackFor', () => {
  const resolved = resolveVariant(forkingCase());

  expect(validatePath(resolved, ['take', 'swap'])).toEqual([]);
  expect(validatePath(resolved, ['take', 'nope'])).toEqual([
    { path: 'path[1]', message: 'Case "forking" has no possibility "nope" under "take"' },
  ]);
  expect(() => trackFor(resolved, ['hide', 'swap'])).toThrow(EngineError);
  expect(possibilityAt(resolved, ['nope'])).toBeUndefined();
});
