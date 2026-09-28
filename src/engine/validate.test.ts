import { describe, expect, test } from 'vitest';
import {
  assertValid,
  finalPosition,
  projectScene,
  resolveVariant,
  rulingAt,
  sceneAt,
  stateAt,
  trackFor,
  validateCase,
  validateLink,
  validateMishnah,
  ValidationError,
  type CaseDef,
  type EngineEvent,
  type PlainCaseDef,
  type PossibilityDef,
  type RichLabel,
  type RichText,
  type Ruling,
  type RulingFn,
  type Scene,
  type VariedCaseDef,
} from '.';
import mishnah12 from '../mishnayos/1-2';
import {
  flippedCase,
  forkingCase,
  mishnahOf,
  stateOf,
  threeBirdCase,
  twoViewCase,
} from './__fixtures__/cases';

/** A valid mishnah: cases[0] is the three-bird case, cases[1] the two-view case. */
const valid = () => mishnahOf(1, 2, [threeBirdCase(), twoViewCase()]);
type Def = ReturnType<typeof valid>;

test('a well-formed mishnah has no issues', () => {
  expect(validateMishnah(valid())).toEqual([]);
});

describe('each rule reports its defect at a clear path', () => {
  test.each<[string, (def: Def) => void, string, RegExp]>([
    ['mishnah id must match its ref', (def) => (def.id = '1-3'), 'id', /"1-3" should be "1-2"/],
    [
      'case ids are unique',
      (def) => (def.cases[1]!.id = def.cases[0]!.id),
      'cases[1].id',
      /Duplicate case id "three-birds"/,
    ],
    [
      'step ids are unique',
      (def) => (def.cases[0]!.steps[1]!.id = 'mix'),
      'cases[0].steps[1].id',
      /Duplicate step id "mix"/,
    ],
    [
      'view ids are unique',
      (def) => (def.cases[1]!.views![1]!.id = 'strict'),
      'cases[1].views[1].id',
      /Duplicate view id "strict"/,
    ],
    [
      'record keys match ids',
      (def) => (def.cases[0]!.initial.birds.a!.id = 'z'),
      'cases[0].initial.birds.a.id',
      /does not match its key "a"/,
    ],
    [
      'a bird is in at most one container',
      (def) => def.cases[0]!.initial.containers.right!.birdIds.push('a'),
      'cases[0].initial.containers.right.birdIds[1]',
      /"a" is already in container "left"/,
    ],
    [
      'every bird is in a container',
      (def) => (def.cases[0]!.initial.containers.right!.birdIds = []),
      'cases[0].initial.birds.b',
      /"b" is not in any container/,
    ],
    [
      'containers refer only to existing birds',
      (def) => def.cases[0]!.initial.containers.left!.birdIds.push('ghost'),
      'cases[0].initial.containers.left.birdIds[1]',
      /Unknown bird "ghost"/,
    ],
    [
      'every bird has a knowledge entry',
      (def) => delete def.cases[0]!.initial.knowledge.b,
      'cases[0].initial.knowledge.b',
      /No knowledge entry for bird "b"/,
    ],
    [
      'knowledge has no extra entries',
      (def) => (def.cases[0]!.initial.knowledge.ghost = 'known'),
      'cases[0].initial.knowledge.ghost',
      /unknown bird "ghost"/,
    ],
    [
      "each event's references exist when it applies",
      (def) => (def.cases[0]!.steps[1]!.events = [{ type: 'move', bird: 'c', to: 'left' }]),
      'cases[0].steps[1].events[0]',
      /container "left" does not exist/,
    ],
    [
      'event types are known',
      (def) => (def.cases[0]!.steps[2]!.events = [{ type: 'fly' } as unknown as EngineEvent]),
      'cases[0].steps[2].events[0]',
      /Unknown event type "fly"/,
    ],
    [
      // Each event's runtime shape is checked before it is applied. Before this
      // check, a create without a kind replayed cleanly and crashed the stage.
      'an event has every required field',
      (def) =>
        (def.cases[0]!.steps[2]!.events = [
          { type: 'create', container: { id: 'new' } } as unknown as EngineEvent,
        ]),
      'cases[0].steps[2].events[0].container.kind',
      /^Must be one of kein, pile, mixture, zone, loose, not undefined$/,
    ],
    [
      "an event's enum values are valid",
      (def) =>
        (def.cases[0]!.steps[2]!.events = [
          {
            type: 'designate',
            birds: [{ bird: 'a', designation: 'maybe' }],
          } as unknown as EngineEvent,
        ]),
      'cases[0].steps[2].events[0].birds[0].designation',
      /^Must be one of chatas, olah, unassigned, not "maybe"$/,
    ],
    [
      'an event is an object',
      (def) => (def.cases[0]!.steps[2]!.events = [42 as unknown as EngineEvent]),
      'cases[0].steps[2].events[0]',
      /^An event must be an object with a "type", not number$/,
    ],
    [
      // A hole (`[a, , b]`) is skipped by forEach, so it once went unreported.
      'an authored list has no holes',
      (def) => delete def.cases[0]!.steps[1],
      'cases[0].steps[1]',
      /^Missing entry: the list has a hole here/,
    ],
    [
      "a step's events are a list",
      (def) => (def.cases[0]!.steps[2]!.events = {} as unknown as EngineEvent[]),
      'cases[0].steps[2].events',
      /^"events" must be a list of events, not object$/,
    ],
    [
      // Records list plain-number keys first: "0" created after "mixed" would show first.
      'an id an event introduces is not a plain number',
      (def) =>
        (def.cases[0]!.steps[2]!.events = [
          { type: 'create', container: { id: '0', kind: 'zone' }, after: 'mixed' },
        ]),
      'cases[0].steps[2].events[0].container.id',
      /^id "0" is not allowed: ids must not be plain numbers, because they would reorder the display$/,
    ],
    [
      'an initial-state id is not a plain number',
      (def) => {
        const c = def.cases[1]!;
        c.initial = stateOf({ left: { birds: { a: 'chatas' } }, '7': { birds: { b: 'olah' } } });
      },
      'cases[1].initial.containers.7',
      /^id "7" is not allowed: ids must not be plain numbers/,
    ],
    [
      'the ruling gives every bird a status at the final position, under every view',
      (def) =>
        (def.cases[1]!.ruling = (_s, viewId): Ruling => ({
          verdict: '',
          birds: viewId === 'lenient' ? { a: 'kasher' } : { a: 'yamus', b: 'yamus' },
        })),
      'cases[1].ruling(position 1, view "lenient").birds.b',
      /No status for bird "b" at position 1 under view "lenient"/,
    ],
    [
      'an event cannot name an inherited property as a container',
      (def) => (def.cases[0]!.steps[1]!.events = [{ type: 'move', bird: 'c', to: 'toString' }]),
      'cases[0].steps[1].events[0]',
      /move: container "toString" does not exist/,
    ],
    [
      // An own `__proto__` container: before ids were checked, moving its bird
      // out silently dropped it from the replayed state.
      'initial-state ids are safe',
      (def) => {
        const c = def.cases[1]!;
        c.initial = stateOf({
          left: { birds: { a: 'chatas' } },
          ['__proto__']: { birds: { b: 'olah' } },
        });
        c.steps[0]!.events = [{ type: 'move', bird: 'b', to: 'left' }];
      },
      'cases[1].initial.containers.__proto__',
      /^id "__proto__" is not allowed: ids must start with a letter or digit and contain only letters, digits, "-" or "_"$/,
    ],
    [
      'step ids are safe',
      (def) => (def.cases[0]!.steps[1]!.id = 'join now'),
      'cases[0].steps[1].id',
      /^id "join now" is not allowed: /,
    ],
    [
      // Before ids were checked, this mixture silently vanished from the replayed state.
      'an id an event introduces is safe',
      (def) => {
        const c = def.cases[0]!;
        c.initial.containers.src = { id: 'src', kind: 'pile', birdIds: [] };
        c.steps[0]!.events.unshift({ type: 'mix', from: ['src'], into: '__proto__' });
      },
      'cases[0].steps[0].events[0].into',
      /^id "__proto__" is not allowed: /,
    ],
    [
      'an id an event refers to is safe',
      (def) => (def.cases[0]!.steps[1]!.events = [{ type: 'move', bird: 'c', to: '__proto__' }]),
      'cases[0].steps[1].events[0].to',
      /^id "__proto__" is not allowed: /,
    ],
    [
      'a ruling that throws where it is shown before the end is reported at that position and view',
      (def) => {
        const c = def.cases[0]!;
        c.views = [
          { id: 'x', label: { en: 'X' } },
          { id: 'y', label: { en: 'Y' } },
        ];
        c.steps[1]!.showRuling = true;
        const base = c.ruling!;
        c.ruling = (state, viewId) => {
          if (viewId === 'y' && state.knowledge.a === 'unknown') throw new Error('not yet');
          return base(state, viewId);
        };
      },
      'cases[0].ruling(position 2, view "y")',
      /Throws at position 2 under view "y": not yet/,
    ],
    [
      'the ruling gives every present bird a status at every position it is shown',
      (def) => {
        const c = def.cases[0]!;
        c.steps[1]!.showRuling = true;
        const base = c.ruling!;
        c.ruling = (state, viewId) => {
          const ruling = base(state, viewId);
          if (state.knowledge.a === 'unknown') delete ruling.birds.c;
          return ruling;
        };
      },
      'cases[0].ruling(position 2).birds.c',
      /No status for bird "c" at position 2/,
    ],
    [
      'the ruling gives no status to an absent bird at any position it is shown',
      (def) => {
        const c = def.cases[0]!;
        c.steps[1]!.showRuling = true;
        const base = c.ruling!;
        c.ruling = (state, viewId) => {
          const ruling = base(state, viewId);
          if (state.knowledge.a === 'unknown') ruling.birds.ghost = 'yamus';
          return ruling;
        };
      },
      'cases[0].ruling(position 2).birds.ghost',
      /Status for unknown bird "ghost" at position 2/,
    ],
    [
      // Before statuses were checked, this validated clean and the stage drew no marker.
      "the ruling's statuses are valid at every position it is shown",
      (def) => {
        const c = def.cases[0]!;
        const base = c.ruling!;
        c.ruling = (state, viewId) => {
          const ruling = base(state, viewId);
          return { ...ruling, birds: { ...ruling.birds, a: 'dead' as Ruling['birds'][string] } };
        };
      },
      'cases[0].ruling(position 3).birds.a',
      /^Must be one of alive, kasher, pasul, safek, yamus, not "dead"$/,
    ],
    [
      // Before counts were checked, this validated clean and the ruling panel
      // crashed: "Objects are not valid as a React child".
      "the ruling's counts are non-negative integers at every position it is shown",
      (def) => {
        const c = def.cases[0]!;
        const base = c.ruling!;
        c.ruling = (state, viewId) => ({
          ...base(state, viewId),
          counts: { kasher: 3, pasul: { bad: true } as unknown as number },
        });
      },
      'cases[0].ruling(position 3).counts.pasul',
      /^A count must be a non-negative integer, not object$/,
    ],
  ])('%s', (_rule, breakIt, path, message) => {
    const def = valid();
    breakIt(def);

    const issues = validateMishnah(def);

    expect(issues).toEqual([{ path, message: expect.stringMatching(message) }]);
  });
});

/** A valid mishnah: cases[0] is the forking case (possibilities), cases[1] the flipped case (variants). */
const branching = () => mishnahOf(1, 2, [forkingCase(), flippedCase()]);
type Branching = ReturnType<typeof branching>;
const flipped = (def: Branching) => def.cases[1] as VariedCaseDef;
const forking = (def: Branching) => def.cases[0] as PlainCaseDef;
const take = (def: Branching) => forking(def).possibilities![0]!;

test('a well-formed mishnah with variants and possibilities has no issues', () => {
  expect(validateMishnah(branching())).toEqual([]);
});

describe('variants and possibilities: each defect is reported at a clear path', () => {
  test.each<[string, (def: Branching) => void, string, RegExp]>([
    [
      'every variant is validated, under its own path',
      (def) =>
        (flipped(def).variants[1]!.steps[0]!.events = [{ type: 'move', bird: 'l', to: 'x' }]),
      'cases[1].variants[1].steps[0].events[0]',
      /move: container "x" does not exist/,
    ],
    [
      'variant ids are unique',
      (def) => (flipped(def).variants[1]!.id = 'ab'),
      'cases[1].variants[1].id',
      /Duplicate variant id "ab"/,
    ],
    [
      'a case with variants lists at least one',
      (def) => (flipped(def).variants = []),
      'cases[1].variants',
      /must list at least one/,
    ],
    [
      "a possibility forks within its parent's track",
      (def) => (take(def).from = 7),
      'cases[0].possibilities[0].from',
      /Fork position 7 is not an integer in 0\.\.2/,
    ],
    [
      'possibility ids are unique among siblings',
      (def) => (forking(def).possibilities![1]!.id = 'take'),
      'cases[0].possibilities[1].id',
      /Duplicate possibility id "take"/,
    ],
    [
      'nested possibility ids are safe (no "." in a path segment)',
      (def) => (take(def).possibilities![0]!.id = 'a.b'),
      'cases[0].possibilities[0].possibilities[0].id',
      /^id "a\.b" is not allowed: /,
    ],
    [
      "a possibility's events replay from its fork point: create needs a new id",
      (def) =>
        (take(def).steps[0]!.events[0] = {
          type: 'create',
          container: { id: 'mixed', kind: 'zone' },
        }),
      'cases[0].possibilities[0].steps[0].events[0]',
      /create: container "mixed" already exists/,
    ],
    [
      "a nested possibility's ruling covers every bird at its end",
      (def) =>
        (take(def).possibilities![0]!.ruling = () => ({ verdict: '', birds: { a: 'pasul' } })),
      'cases[0].possibilities[0].possibilities[0].ruling(position 3).birds.b',
      /No status for bird "b" at position 3/,
    ],
  ])('%s', (_rule, breakIt, path, message) => {
    const def = branching();
    breakIt(def);

    expect(validateMishnah(def)).toEqual([{ path, message: expect.stringMatching(message) }]);
  });
});

// Before text was checked, each of these validated clean and then crashed the
// UI or the stage (e.g. `text is not iterable` in the layout's label measure).
describe('every author text the UI or stage renders is well-formed text', () => {
  const label = (value: unknown) => value as RichLabel;
  const text = (value: unknown) => value as RichText;
  test.each<[string, (def: Branching) => void, string, RegExp]>([
    [
      'a container label in the initial state',
      (def) => (forking(def).initial.containers.left!.label = label({ en: { bad: true } })),
      'cases[0].initial.containers.left.label.en',
      /^"en" must be a string, not object$/,
    ],
    [
      'an event label (mix)',
      (def) =>
        (forking(def).steps[0]!.events[0] = {
          type: 'mix',
          from: ['left', 'right'],
          into: 'mixed',
          label: label({ he: 42 }),
        }),
      'cases[0].steps[0].events[0].label.he',
      /^"he" must be a string, not number$/,
    ],
    [
      'an event label (create)',
      (def) =>
        (take(def).steps[0]!.events[0] = {
          type: 'create',
          container: { id: 'out', kind: 'zone', label: label({ en: { bad: true } }) },
          after: 'mixed',
        }),
      'cases[0].possibilities[0].steps[0].events[0].container.label.en',
      /^"en" must be a string, not object$/,
    ],
    [
      'a step CTA',
      (def) => (take(def).steps[0]!.advance = { cta: label({}) }),
      'cases[0].possibilities[0].steps[0].advance.cta',
      /^A label must have "he" or "en" text$/,
    ],
    [
      'a title',
      (def) => (flipped(def).variants[1]!.title = label(['Flipped'])),
      'cases[1].variants[1].title',
      /^A label must be an object with "he" and\/or "en" text, not a list$/,
    ],
    [
      'ruling text, wherever the ruling is shown',
      (def) =>
        (forking(def).ruling = () => ({
          verdict: 'main',
          reasons: text([{ type: 'list', items: ['fine', 7] }]),
          birds: { a: 'yamus', b: 'yamus' },
        })),
      'cases[0].ruling(position 2).reasons[0].items[1]',
      /^Text must be a string or an object with "he" and\/or "en" text, not number$/,
    ],
    [
      'a possibility outcome',
      (def) => (take(def).outcome = text([{ type: 'paragraph', text: { he: 1 } }])),
      'cases[0].possibilities[0].outcome[0].text.he',
      /^"he" must be a string, not number$/,
    ],
    [
      "a case's own projection, at every position it renders",
      (def) =>
        (forking(def).project = (state, ruling) => ({
          ...projectScene(state, ruling),
          ...(state.birds.a?.designation === 'olah' ? { caption: label({ en: 5 }) } : {}),
        })),
      'cases[0].possibilities[0].possibilities[0].project(position 3).caption.en',
      /^"en" must be a string, not number$/,
    ],
  ])('%s', (_where, breakIt, path, message) => {
    const def = branching();
    breakIt(def);

    expect(validateMishnah(def)).toEqual([{ path, message: expect.stringMatching(message) }]);
  });
});

// Before a projection's structure was checked, a Scene with no `birds` list
// validated clean and then crashed the layout, and an unplaced bird silently
// vanished. Each row breaks the Scene only at the nested `swap` possibility's
// end (position 3), where `mixed` holds `b` and `out` holds `a` (birds[0]).
describe("a case's own projection gives a well-formed Scene", () => {
  const at = 'cases[0].possibilities[0].possibilities[0].project(position 3)';
  test.each<[string, (scene: Scene) => void, string, RegExp]>([
    [
      'birds is a list',
      (scene) => ((scene as { birds: unknown }).birds = undefined),
      `${at}.birds`,
      /^"birds" must be a list of birds, not undefined$/,
    ],
    [
      "every bird is in a container's birdIds",
      (scene) => (scene.containers.find((c) => c.id === 'out')!.birdIds = []),
      `${at}.birds[0]`,
      /^Bird "a" is not in any container's birdIds$/,
    ],
    [
      "a bird's containerId names the container that holds it",
      (scene) => (scene.birds[0]!.containerId = 'mixed'),
      `${at}.birds[0].containerId`,
      /^Bird "a" has containerId "mixed" but is in container "out"$/,
    ],
    [
      // `Array(1)` or `[a, , b]`: forEach skipped the hole, and the layout crashed on it.
      'the birds list has no holes',
      (scene) => (scene.birds.length += 1),
      `${at}.birds[2]`,
      /^Missing entry: the list has a hole here/,
    ],
    [
      'bird ids are unique',
      (scene) => scene.birds.push({ ...scene.birds[0]! }),
      `${at}.birds[2].id`,
      /^Duplicate bird id "a" \(first used at birds\[0\]\)$/,
    ],
    [
      "a bird's enum values are valid",
      (scene) => (scene.birds[0]!.tint = 'green' as Scene['birds'][number]['tint']),
      `${at}.birds[0].tint`,
      /^Must be one of chatas, olah, neutral, unknown, not "green"$/,
    ],
  ])('%s', (_rule, breakIt, path, message) => {
    const def = branching();
    forking(def).project = (state, ruling) => {
      const scene = projectScene(state, ruling);
      if (state.birds.a?.designation === 'olah') breakIt(scene);
      return scene;
    };

    expect(validateMishnah(def)).toEqual([{ path, message: expect.stringMatching(message) }]);
  });
});

// An optional field is absent only when it is `undefined`. Before this rule,
// validation skipped a falsy one as absent (so `project: false` validated clean
// and then crashed `sceneAt`) and read `from: null` as the default fork point.
describe('an optional field that is present has its contract type, even when falsy', () => {
  const as = <T>(value: unknown) => value as T;
  test.each<[string, (def: Branching) => void, string, RegExp]>([
    [
      'a callback (project) is a function',
      (def) => (forking(def).project = as(false)),
      'cases[0].project',
      /^Must be a function or left out, not false$/,
    ],
    [
      'a list (possibilities) is a list',
      (def) => (take(def).possibilities = as('x')),
      'cases[0].possibilities[0].possibilities',
      /^Must be a list of possibilities or left out, not "x"$/,
    ],
    [
      'a position (from) is a non-negative integer',
      (def) => (take(def).from = 1.5),
      'cases[0].possibilities[0].from',
      /^Must be a non-negative integer \(a position on the parent track\) or left out, not 1\.5$/,
    ],
    [
      'a position (from) of null is not absent',
      (def) => (take(def).from = as(null)),
      'cases[0].possibilities[0].from',
      /^Must be a non-negative integer \(a position on the parent track\) or left out, not null$/,
    ],
    [
      'a flag (showRuling) is a boolean',
      (def) => (take(def).steps[0]!.showRuling = as('yes')),
      'cases[0].possibilities[0].steps[0].showRuling',
      /^Must be true or false or left out, not "yes"$/,
    ],
  ])('%s', (_rule, breakIt, path, message) => {
    const def = branching();
    breakIt(def);

    expect(validateMishnah(def)).toEqual([{ path, message: expect.stringMatching(message) }]);
  });
});

/** Every possibility path under a list, depth-first. */
const pathsOf = (list: readonly PossibilityDef[] = [], prefix: string[] = []): string[][] =>
  list.flatMap((p) => [[...prefix, p.id], ...pathsOf(p.possibilities, [...prefix, p.id])]);

/** Renders every setup, track, position and view of a case, as the UI does; throws if any throws. */
function renderEverywhere(caseDef: CaseDef) {
  const setups = caseDef.variants
    ? caseDef.variants.map((v) => resolveVariant(caseDef, v.id))
    : [resolveVariant(caseDef)];
  const viewIds = caseDef.views?.length ? caseDef.views.map((v) => v.id) : [undefined];
  for (const setup of setups)
    for (const path of [[], ...pathsOf(setup.possibilities)]) {
      const track = trackFor(setup, path);
      for (let p = 0; p <= finalPosition(track); p++)
        for (const viewId of viewIds) {
          sceneAt(track, p, viewId);
          rulingAt(track, stateAt(track, p), viewId);
        }
    }
}

// The promise validation makes: a plain-literal definition that validates clean
// renders. Each rejected literal validated clean before optional fields were
// type-checked, and then threw "... is not a function" in `sceneAt` / `rulingAt`.
test('every plain-literal case that validates clean renders on every track, at every position, under every view', () => {
  const empty = {
    title: { en: 'Empty' },
    initial: { birds: {}, containers: {}, knowledge: {} },
    steps: [],
  };
  const forkingWithFalseRuling = forkingCase();
  forkingWithFalseRuling.id = 'forking-false-ruling';
  forkingWithFalseRuling.possibilities![0]!.ruling = false as unknown as RulingFn;
  const candidates: CaseDef[] = [
    threeBirdCase(),
    twoViewCase(),
    forkingCase(),
    flippedCase(),
    ...mishnah12.cases,
    { ...empty, id: 'empty' },
    { ...empty, id: 'empty-false-project', project: false } as unknown as CaseDef,
    { ...empty, id: 'empty-false-ruling', ruling: false } as unknown as CaseDef,
    forkingWithFalseRuling,
  ];

  const clean = candidates.filter((caseDef) => validateCase(caseDef).length === 0);
  for (const caseDef of clean) expect(() => renderEverywhere(caseDef), caseDef.id).not.toThrow();
  expect(clean.map((c) => c.id)).toEqual([
    'three-birds',
    'two-views',
    'forking',
    'flipped',
    ...mishnah12.cases.map((c) => c.id),
    'empty',
  ]);
});

test('a malformed definition is reported, never thrown', () => {
  const def = valid();
  (def.cases[0]!.initial as { containers: unknown }).containers = null;
  (def.cases[1] as { steps: unknown }).steps = undefined;

  expect(validateMishnah(def)).toEqual([
    { path: 'cases[0].initial', message: expect.stringMatching(/^Malformed definition: /) },
    { path: 'cases[1].steps', message: expect.stringMatching(/^Malformed definition: /) },
  ]);
});

test("the initial state's container kinds, designations and knowledge values are valid", () => {
  const def = valid();
  const initial = def.cases[0]!.initial as unknown as {
    containers: { left: { kind: string } };
    birds: { b: { designation: string } };
    knowledge: { c: string };
  };
  initial.containers.left.kind = 'basket';
  initial.birds.b.designation = 'maybe';
  initial.knowledge.c = 'perhaps';

  expect(validateMishnah(def)).toEqual([
    {
      path: 'cases[0].initial.birds.b.designation',
      message: expect.stringMatching(/not "maybe"$/),
    },
    {
      path: 'cases[0].initial.containers.left.kind',
      message: expect.stringMatching(/not "basket"$/),
    },
    {
      path: 'cases[0].initial.knowledge.c',
      message: 'Must be one of known, unknown, not "perhaps"',
    },
  ]);
});

/** An object whose every property getter throws `thrown`. */
const throwingGetters = (thrown: unknown) =>
  new Proxy(
    {},
    {
      get() {
        throw thrown;
      },
    },
  );
/** An Error whose `message` getter itself throws. */
const errorWithThrowingMessage = () =>
  Object.defineProperty(new Error(), 'message', {
    get() {
      throw Object.create(null);
    },
  });

test.each<[string, unknown]>([
  ['null', null],
  ['undefined', undefined],
  ['42', 42],
  ['{}', {}],
  // `String()` of a null-prototype object throws, so formatting what was caught must not.
  ['a getter that throws Object.create(null)', throwingGetters(Object.create(null))],
  [
    'a getter that throws an Error whose message getter throws',
    throwingGetters(errorWithThrowingMessage()),
  ],
])('validation reports, never throws, for %s', (_name, input) => {
  const bad = input as unknown as Def;
  const issue = { path: expect.any(String), message: expect.any(String) };

  expect(validateCase(bad as unknown as Def['cases'][number])).toContainEqual(issue);
  expect(validateMishnah(bad)).toContainEqual(issue);
});

test('assertValid throws one ValidationError listing every issue', () => {
  const def = valid();
  def.id = '9-9';
  def.cases[0]!.steps[1]!.id = 'mix';

  expect(() => assertValid(def)).toThrow(ValidationError);
  expect(() => assertValid(def)).toThrow(/- id: .*\n {2}- cases\[0\]\.steps\[1\]\.id: /);
  expect(() => assertValid(valid())).not.toThrow();
});

test('validateLink reports an unknown case, an out-of-range position and an unknown view', () => {
  const def = valid();

  expect(validateLink(def, { caseId: 'two-views', position: 1, viewId: 'lenient' })).toEqual([]);
  expect(validateLink(def, { caseId: 'nope' }).map((issue) => issue.path)).toEqual(['caseId']);
  expect(
    validateLink(def, { caseId: 'two-views', position: 2, viewId: 'rambam' }).map((i) => i.path),
  ).toEqual(['position', 'viewId']);
});

test('validateLink also reports an unknown variant and possibility path, and counts a path position in its own steps', () => {
  const def = branching();

  expect(validateLink(def, { caseId: 'flipped', variantId: 'ba' })).toEqual([]);
  expect(validateLink(def, { caseId: 'forking', path: ['take', 'swap'], position: 1 })).toEqual([]);
  expect(
    validateLink(def, { caseId: 'forking', path: ['take'], position: 2 }).map((i) => i.path),
  ).toEqual(['position']);
  expect(
    validateLink(def, { caseId: 'flipped', variantId: 'zz', path: ['nope'] }).map((i) => i.path),
  ).toEqual(['variantId', 'path[0]']);
});
