import { expect, test, vi } from 'vitest';
import { projectScene, sceneAt, sceneProblems, stateAt, type Scene } from '.';
import { stateOf, threeBirdCase } from './__fixtures__/cases';

test('containers keep their record order, kind, label and birds', () => {
  const state = stateOf({
    nest: { kind: 'kein', birds: { a: 'chatas', b: 'olah' } },
    lone: { kind: 'loose', birds: { c: 'olah' } },
  });
  state.containers.nest = { ...state.containers.nest!, label: { he: 'קן' } };

  expect(projectScene(state).containers).toEqual([
    { id: 'nest', kind: 'kein', label: { he: 'קן' }, birdIds: ['a', 'b'] },
    { id: 'lone', kind: 'loose', birdIds: ['c'] },
  ]);
});

test('birds map knowledge to tint, revealed and a Hebrew-only label, and the ruling to status', () => {
  const state = stateOf({ z: { birds: { c: 'chatas', o: 'olah', u: 'unassigned', x: 'chatas' } } });
  state.knowledge.x = 'unknown';

  const scene = projectScene(state, { verdict: '', birds: { c: 'kasher', x: 'yamus' } });

  expect(scene.birds).toEqual([
    {
      id: 'c',
      containerId: 'z',
      tint: 'chatas',
      revealed: true,
      status: 'kasher',
      label: { he: 'חטאת' },
    },
    {
      id: 'o',
      containerId: 'z',
      tint: 'olah',
      revealed: true,
      status: 'alive',
      label: { he: 'עולה' },
    },
    {
      id: 'u',
      containerId: 'z',
      tint: 'neutral',
      revealed: true,
      status: 'alive',
      label: { he: 'חטאת/עולה' },
    },
    { id: 'x', containerId: 'z', tint: 'unknown', revealed: false, status: 'yamus' },
  ]);
});

test('a bird named like an inherited property gets its status only from its own ruling entry', () => {
  const state = stateOf({ z: { birds: { toString: 'chatas' as const } } });

  const scene = projectScene(state, { verdict: '', birds: {} });

  expect(scene.birds.map((bird) => bird.status)).toEqual(['alive']);
});

test('an unknown bird is tinted "unknown" with no label, whatever its designation', () => {
  const state = stateOf({ z: { birds: { c: 'chatas', o: 'olah', u: 'unassigned' } } }, 'unknown');

  const birds = projectScene(state).birds;

  expect(birds.map(({ id, tint, revealed }) => ({ id, tint, revealed }))).toEqual([
    { id: 'c', tint: 'unknown', revealed: false },
    { id: 'o', tint: 'unknown', revealed: false },
    { id: 'u', tint: 'unknown', revealed: false },
  ]);
  for (const bird of birds) expect(bird).not.toHaveProperty('label');
});

test("sceneAt uses the case's own project with the state and the shown ruling", () => {
  const custom: Scene = { containers: [], birds: [], caption: { en: 'custom' } };
  const project = vi.fn(() => custom);
  const caseDef = { ...threeBirdCase(), project };

  expect(sceneAt(caseDef, 1)).toBe(custom);
  expect(project).toHaveBeenLastCalledWith(stateAt(caseDef, 1), undefined);

  sceneAt(caseDef, 3);
  expect(project).toHaveBeenLastCalledWith(
    stateAt(caseDef, 3),
    expect.objectContaining({ birds: { a: 'kasher', b: 'kasher', c: 'kasher' } }),
  );
});

test('the default projection meets the Scene contract at every position', () => {
  const caseDef = threeBirdCase();

  for (const position of [0, 1, 2, 3])
    expect(sceneProblems(sceneAt(caseDef, position))).toEqual([]);
});
