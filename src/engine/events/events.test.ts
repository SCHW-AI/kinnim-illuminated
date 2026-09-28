import { describe, expect, test } from 'vitest';
import {
  applyEvent,
  EngineError,
  projectScene,
  sceneAt,
  type PlainCaseDef,
  type CaseState,
  type EngineEvent,
} from '..';
import { deepFreeze, stateOf } from '../__fixtures__/cases';

const initial = () =>
  stateOf({
    left: { birds: { a: 'chatas' } },
    right: { birds: { b: 'olah' } },
    side: { kind: 'pile', birds: { c: 'unassigned' } },
  });

describe('mix', () => {
  test('hides the mixed birds from the observers but preserves the truth', () => {
    const before = initial();
    const mixed = applyEvent(before, { type: 'mix', from: ['left', 'right'], into: 'm' });

    expect(mixed.birds).toEqual(before.birds);
    expect(mixed.knowledge).toEqual({ a: 'unknown', b: 'unknown', c: 'known' });

    const revealed = projectScene(applyEvent(mixed, { type: 'reveal', birds: 'all' }));
    expect(revealed.birds.map((bird) => [bird.id, bird.tint])).toEqual([
      ['a', 'chatas'],
      ['b', 'olah'],
      ['c', 'neutral'],
    ]);
  });

  test('into a new container: creates a labelled mixture in place of the sources', () => {
    const next = applyEvent(initial(), {
      type: 'mix',
      from: ['right', 'left'],
      into: 'm',
      label: { en: 'Mixed' },
    });

    expect(Object.keys(next.containers)).toEqual(['m', 'side']);
    expect(next.containers.m).toEqual({
      id: 'm',
      kind: 'mixture',
      label: { en: 'Mixed' },
      birdIds: ['b', 'a'],
    });
  });

  test('into a new container named like an inherited property: creates it as an own entry', () => {
    const next = applyEvent(initial(), { type: 'mix', from: ['left', 'right'], into: 'toString' });

    expect(Object.keys(next.containers)).toEqual(['toString', 'side']);
    expect(next.containers.toString).toEqual({
      id: 'toString',
      kind: 'mixture',
      birdIds: ['a', 'b'],
    });
  });

  test('into one of its sources: keeps that container and its place, as a mixture', () => {
    const next = applyEvent(initial(), { type: 'mix', from: ['side', 'right'], into: 'right' });

    expect(Object.keys(next.containers)).toEqual(['left', 'right']);
    expect(next.containers.right).toEqual({ id: 'right', kind: 'mixture', birdIds: ['c', 'b'] });
  });
});

// Validation rejects `__proto__` as an id; the handlers must still build records
// in which no id can set the prototype and so drop a container.
describe.each(['constructor', '__proto__'])('a container named %j', (id) => {
  const oneStep = (initial: CaseState, event: EngineEvent): PlainCaseDef => ({
    id: 'case',
    title: { en: 'Case' },
    initial,
    steps: [{ id: 'step', events: [event], advance: 'auto' }],
  });
  const containersAt = (caseDef: PlainCaseDef, position: number) =>
    sceneAt(caseDef, position).containers.map((c) => [c.id, c.birdIds]);

  test('created by a mix of only empty sources is kept, and appears in sceneAt', () => {
    const initial = stateOf({ src: { birds: {} }, dest: { birds: { b: 'olah' } } });
    const caseDef = oneStep(initial, { type: 'mix', from: ['src'], into: id });

    expect(containersAt(caseDef, 1)).toEqual([
      [id, []],
      ['dest', ['b']],
    ]);
  });

  test('left empty by a move is kept, and appears in sceneAt', () => {
    const initial = stateOf({ [id]: { birds: { b: 'olah' } }, dest: { birds: {} } });
    const caseDef = oneStep(initial, { type: 'move', bird: 'b', to: 'dest' });

    expect(containersAt(caseDef, 0)).toEqual([
      [id, ['b']],
      ['dest', []],
    ]);
    expect(containersAt(caseDef, 1)).toEqual([
      [id, []],
      ['dest', ['b']],
    ]);
  });
});

test('move takes a bird out of its container and appends it to the target, knowledge unchanged', () => {
  const before = { ...initial(), knowledge: { a: 'known', b: 'known', c: 'unknown' } as const };
  const next = applyEvent(before, { type: 'move', bird: 'c', to: 'left' });

  expect(next.containers.left?.birdIds).toEqual(['a', 'c']);
  expect(next.containers.side?.birdIds).toEqual([]);
  expect(next.knowledge).toEqual(before.knowledge);
});

test('reveal and conceal set knowledge for the listed birds or for all', () => {
  const hidden = applyEvent(initial(), { type: 'conceal', birds: 'all' });
  expect(hidden.knowledge).toEqual({ a: 'unknown', b: 'unknown', c: 'unknown' });

  const oneKnown = applyEvent(hidden, { type: 'reveal', birds: ['b'] });
  expect(oneKnown.knowledge).toEqual({ a: 'unknown', b: 'known', c: 'unknown' });

  const allKnown = applyEvent(oneKnown, { type: 'reveal', birds: 'all' });
  expect(allKnown.knowledge).toEqual({ a: 'known', b: 'known', c: 'known' });

  const oneHidden = applyEvent(allKnown, { type: 'conceal', birds: ['a'] });
  expect(oneHidden.knowledge).toEqual({ a: 'unknown', b: 'known', c: 'known' });
});

test('create adds an empty container after `after`, or at the end, and rejects an existing id', () => {
  const zone = { id: 'z', kind: 'zone', label: { he: 'חטאת' } } as const;

  const placed = applyEvent(initial(), { type: 'create', container: zone, after: 'left' });
  expect(Object.keys(placed.containers)).toEqual(['left', 'z', 'right', 'side']);
  expect(placed.containers.z).toEqual({ ...zone, birdIds: [] });

  const atEnd = applyEvent(initial(), { type: 'create', container: zone });
  expect(Object.keys(atEnd.containers)).toEqual(['left', 'right', 'side', 'z']);

  expect(() =>
    applyEvent(initial(), { type: 'create', container: { id: 'side', kind: 'zone' } }),
  ).toThrow(/create: container "side" already exists/);
});

test('designate changes the truth of the listed birds only, and leaves knowledge alone', () => {
  const before = { ...initial(), knowledge: { a: 'known', b: 'known', c: 'unknown' } as const };
  const next = applyEvent(before, {
    type: 'designate',
    birds: [
      { bird: 'c', designation: 'chatas' },
      { bird: 'b', designation: 'chatas' },
    ],
  });

  expect(next.birds).toEqual({
    a: { id: 'a', designation: 'chatas' },
    b: { id: 'b', designation: 'chatas' },
    c: { id: 'c', designation: 'chatas' },
  });
  expect(next.knowledge).toEqual(before.knowledge);
  expect(projectScene(next).birds.find((b) => b.id === 'c')).toMatchObject({ revealed: false });
});

test.each<EngineEvent>([
  { type: 'mix', from: ['left', 'right'], into: 'm' },
  { type: 'mix', from: ['side', 'left'], into: 'left' },
  { type: 'move', bird: 'a', to: 'side' },
  { type: 'reveal', birds: 'all' },
  { type: 'conceal', birds: ['a'] },
  { type: 'create', container: { id: 'z', kind: 'zone' }, after: 'left' },
  { type: 'designate', birds: [{ bird: 'c', designation: 'olah' }] },
])('$type never mutates its input (deep-frozen)', (event) => {
  const before = deepFreeze(initial());
  const snapshot = structuredClone(before);

  const next = applyEvent(before, event);

  expect(before).toEqual(snapshot);
  expect(next).not.toBe(before);
});

test('an unknown event type throws an EngineError naming it', () => {
  const fly = { type: 'fly', bird: 'a' } as unknown as EngineEvent;
  expect(() => applyEvent(initial(), fly)).toThrow(EngineError);
  expect(() => applyEvent(initial(), fly)).toThrow(/Unknown event type "fly"/);
});

test.each<[EngineEvent, RegExp]>([
  [
    { type: 'mix', from: ['left', 'nowhere'], into: 'm' },
    /mix: container "nowhere" does not exist/,
  ],
  [{ type: 'mix', from: ['left'], into: 'side' }, /mix: container "side" already exists/],
  [{ type: 'mix', from: ['left', 'left'], into: 'm' }, /mix: container "left" is listed twice/],
  [{ type: 'move', bird: 'ghost', to: 'left' }, /move: bird "ghost" does not exist/],
  [{ type: 'move', bird: 'a', to: 'nowhere' }, /move: container "nowhere" does not exist/],
  [{ type: 'reveal', birds: ['ghost'] }, /reveal: bird "ghost" does not exist/],
  [
    { type: 'create', container: { id: 'z', kind: 'zone' }, after: 'nowhere' },
    /create: container "nowhere" does not exist/,
  ],
  [
    { type: 'designate', birds: [{ bird: 'ghost', designation: 'olah' }] },
    /designate: bird "ghost" does not exist/,
  ],
])('a bad reference throws a descriptive EngineError: %j', (event, message) => {
  expect(() => applyEvent(initial(), event)).toThrow(message);
});
