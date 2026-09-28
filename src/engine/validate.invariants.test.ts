/**
 * The replay invariants in `validate.ts`, exercised through a deliberately
 * broken `applyEvent`. With safe ids the real handlers cannot lose a bird or a
 * container, so these tests inject the fault by mocking the events module.
 */

import { afterEach, expect, test, vi } from 'vitest';
import { validateMishnah, type CaseState, type EngineEvent } from '.';
import { mishnahOf, threeBirdCase } from './__fixtures__/cases';

type Fault = (next: CaseState, event: EngineEvent) => CaseState;
const fault = vi.hoisted(() => ({ current: undefined as Fault | undefined }));

vi.mock('./events', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./events')>();
  const applyEvent: typeof actual.applyEvent = (state, event) => {
    const next = actual.applyEvent(state, event);
    return fault.current ? fault.current(next, event) : next;
  };
  return { ...actual, applyEvent };
});

afterEach(() => {
  fault.current = undefined;
});

/** Breaks the three-bird case's `move c to mixed` (steps[1].events[0]) with `breakIt`. */
function brokenMove(breakIt: (next: CaseState) => CaseState): Fault {
  return (next, event) => (event.type === 'move' ? breakIt(next) : next);
}

test('the fixture replays cleanly through the unbroken mock', () => {
  expect(validateMishnah(mishnahOf(1, 2, [threeBirdCase()]))).toEqual([]);
});

test('every event leaves every bird in exactly one container', () => {
  fault.current = brokenMove((next) => ({
    ...next,
    containers: {
      ...next.containers,
      mixed: { ...next.containers.mixed!, birdIds: next.containers.mixed!.birdIds.slice(0, -1) },
    },
  }));

  expect(validateMishnah(mishnahOf(1, 2, [threeBirdCase()]))).toEqual([
    {
      path: 'cases[0].steps[1].events[0]',
      message: 'After this event, bird "c" is not in any container',
    },
  ]);
});

test('no event drops a container it should keep', () => {
  // `move` keeps the container it empties; this broken one drops it.
  fault.current = brokenMove((next) => ({
    ...next,
    containers: Object.fromEntries(Object.entries(next.containers).filter(([id]) => id !== 'side')),
  }));

  expect(validateMishnah(mishnahOf(1, 2, [threeBirdCase()]))).toEqual([
    {
      path: 'cases[0].steps[1].events[0]',
      message: 'After this event, container "side" is missing',
    },
  ]);
});

test("every container's key matches its id after each event", () => {
  fault.current = brokenMove((next) => ({
    ...next,
    containers: { ...next.containers, side: { ...next.containers.side!, id: 'elsewhere' } },
  }));

  expect(validateMishnah(mishnahOf(1, 2, [threeBirdCase()]))).toEqual([
    {
      path: 'cases[0].steps[1].events[0]',
      message: 'After this event, container key "side" holds container id "elsewhere"',
    },
  ]);
});
