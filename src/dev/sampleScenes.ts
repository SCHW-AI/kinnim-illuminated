/*
 * Hand-written sample Scenes for the /dev/stage playground. Visual fixtures
 * only: they illustrate the stage primitives and make no halachic claim.
 */
import type { BirdStatus, RichLabel, Scene, SceneBird, SceneContainer } from '../stage/scene';

export const TINTS: SceneBird['tint'][] = ['chatas', 'olah', 'neutral', 'unknown'];
export const STATUSES: BirdStatus[] = ['alive', 'kasher', 'pasul', 'safek', 'yamus'];

/** The word label a revealed bird carries (as the engine's default projection gives it: Hebrew only). */
const BIRD_LABEL: Partial<Record<SceneBird['tint'], RichLabel>> = {
  chatas: { he: 'חטאת' },
  olah: { he: 'עולה' },
  neutral: { he: 'חטאת/עולה' },
};

function bird(
  id: string,
  containerId: string,
  tint: SceneBird['tint'],
  extra: Partial<SceneBird> = {},
): SceneBird {
  const revealed = extra.revealed ?? tint !== 'unknown';
  const label = revealed ? BIRD_LABEL[tint] : undefined;
  return {
    id,
    containerId,
    tint,
    revealed,
    status: 'alive',
    ...(label ? { label } : {}),
    ...extra,
  };
}

/** One of each container kind (a lone, loose bird among them), plus a highlighted and a dimmed kein. */
export const containerKinds: Scene = {
  caption: { en: 'The five container kinds, with emphasis', he: 'סוגי המקומות' },
  containers: [
    { id: 'kein', kind: 'kein', label: { he: 'קן' }, birdIds: ['k1', 'k2'] },
    { id: 'loose', kind: 'loose', birdIds: ['l1'] },
    { id: 'pile', kind: 'pile', label: { en: 'Pile' }, birdIds: ['p1', 'p2', 'p3', 'p4', 'p5'] },
    {
      id: 'mix',
      kind: 'mixture',
      label: { he: 'תערובת' },
      birdIds: ['m1', 'm2', 'm3', 'm4'],
    },
    { id: 'zone', kind: 'zone', label: { en: 'Zone' }, birdIds: ['z1', 'z2', 'z3'] },
    {
      id: 'kein-hi',
      kind: 'kein',
      label: { he: 'קן', en: 'Highlighted' },
      birdIds: ['h1', 'h2'],
      emphasis: 'highlight',
    },
    {
      id: 'kein-dim',
      kind: 'kein',
      label: { he: 'קן', en: 'Dimmed' },
      birdIds: ['d1', 'd2'],
      emphasis: 'dim',
    },
  ],
  birds: [
    bird('k1', 'kein', 'chatas'),
    bird('k2', 'kein', 'olah'),
    bird('l1', 'loose', 'chatas'),
    ...['p1', 'p2', 'p3', 'p4', 'p5'].map((id) => bird(id, 'pile', 'neutral')),
    ...['m1', 'm2', 'm3', 'm4'].map((id) => bird(id, 'mix', 'unknown')),
    bird('z1', 'zone', 'chatas', { status: 'kasher' }),
    bird('z2', 'zone', 'olah', { status: 'pasul' }),
    bird('z3', 'zone', 'neutral', { status: 'yamus' }),
    bird('h1', 'kein-hi', 'chatas', { emphasis: 'highlight' }),
    bird('h2', 'kein-hi', 'olah'),
    bird('d1', 'kein-dim', 'chatas'),
    bird('d2', 'kein-dim', 'olah', { emphasis: 'dim' }),
  ],
};

/**
 * Flight demo: two keinim; then three birds are mixed (their identities are
 * lost to the observer) while one flies off; then a ruling is shown.
 */
export const flightSteps: { title: string; scene: Scene }[] = [
  {
    title: 'Two keinim',
    scene: {
      caption: { en: 'Two separate keinim', he: 'שתי קינים' },
      containers: [
        { id: 'a', kind: 'kein', label: { he: 'קן א׳' }, birdIds: ['a1', 'a2'] },
        { id: 'b', kind: 'kein', label: { he: 'קן ב׳' }, birdIds: ['b1', 'b2'] },
      ],
      birds: [
        bird('a1', 'a', 'chatas'),
        bird('a2', 'a', 'olah'),
        bird('b1', 'b', 'chatas'),
        bird('b2', 'b', 'olah'),
      ],
    },
  },
  {
    title: 'Mixed; one flies off',
    scene: {
      caption: { en: 'Three birds mixed together; one flew away', he: 'נתערבו' },
      containers: [
        {
          id: 'mix',
          kind: 'mixture',
          label: { he: 'תערובת' },
          birdIds: ['b1', 'a1', 'a2'],
          emphasis: 'highlight',
        },
        { id: 'away', kind: 'zone', label: { he: 'פרחה' }, birdIds: ['b2'] },
      ],
      birds: [
        bird('a1', 'mix', 'unknown', { revealed: false }),
        bird('a2', 'mix', 'unknown', { revealed: false }),
        bird('b1', 'mix', 'unknown', { revealed: false }),
        bird('b2', 'away', 'olah'),
      ],
    },
  },
  {
    title: 'Ruling shown',
    scene: {
      caption: { en: 'A sample ruling over the mixture', he: 'דין' },
      containers: [
        {
          id: 'mix',
          kind: 'mixture',
          label: { he: 'תערובת' },
          birdIds: ['b1', 'a1', 'a2'],
        },
        { id: 'away', kind: 'zone', label: { he: 'פרחה' }, birdIds: ['b2'] },
      ],
      birds: [
        bird('a1', 'mix', 'chatas', { revealed: false, status: 'kasher' }),
        bird('a2', 'mix', 'olah', { revealed: false, status: 'safek' }),
        bird('b1', 'mix', 'chatas', { revealed: false, status: 'pasul' }),
        bird('b2', 'away', 'olah', { status: 'yamus' }),
      ],
    },
  },
];

/** Deterministic variety for the density scenes. */
function sample(i: number): Pick<SceneBird, 'tint' | 'status' | 'revealed'> {
  const tint = TINTS[i % 3] ?? 'neutral';
  const status = STATUSES[(i * 7) % 11 === 0 ? 1 : (i * 5) % 13 === 0 ? 2 : 0] ?? 'alive';
  return { tint, status, revealed: true };
}

function keinim(count: number, start = 0): { containers: SceneContainer[]; birds: SceneBird[] } {
  const containers: SceneContainer[] = [];
  const birds: SceneBird[] = [];
  for (let k = 0; k < count; k++) {
    const id = `kein-${start + k}`;
    const pair = [`${id}-c`, `${id}-o`];
    containers.push({
      id,
      kind: 'kein',
      label: { he: `קן ${'אבגדהוזחטי'[k % 10] ?? ''}׳` },
      birdIds: pair,
    });
    birds.push(bird(pair[0]!, id, 'chatas'), bird(pair[1]!, id, 'olah'));
  }
  return { containers, birds };
}

/** Scenes holding 1, 5, 12 and 40 birds. */
export const densityScenes: { count: number; scene: Scene }[] = [
  {
    count: 1,
    scene: {
      caption: { en: 'One bird' },
      // A lone bird is not a group: no box, no caption.
      containers: [{ id: 'z', kind: 'loose', birdIds: ['only'] }],
      birds: [bird('only', 'z', 'chatas', { status: 'kasher' })],
    },
  },
  {
    count: 5,
    scene: {
      caption: { en: 'Five birds' },
      containers: [
        { id: 'k', kind: 'kein', label: { he: 'קן' }, birdIds: ['c', 'o'] },
        { id: 'p', kind: 'pile', label: { en: 'Three more' }, birdIds: ['n1', 'n2', 'n3'] },
      ],
      birds: [
        bird('c', 'k', 'chatas'),
        bird('o', 'k', 'olah'),
        bird('n1', 'p', 'neutral'),
        bird('n2', 'p', 'neutral', { status: 'safek' }),
        bird('n3', 'p', 'unknown', { revealed: false }),
      ],
    },
  },
  {
    count: 12,
    scene: { caption: { en: 'Six keinim: twelve birds' }, ...keinim(6) },
  },
  {
    count: 40,
    scene: (() => {
      const k = keinim(8);
      const ids = Array.from({ length: 24 }, (_, i) => `m${i}`);
      return {
        caption: { en: 'Forty birds: a large mixture and eight keinim' },
        containers: [
          {
            id: 'big',
            kind: 'mixture',
            label: { he: 'תערובת', en: 'Twenty-four mixed' },
            birdIds: ids,
          },
          ...k.containers,
        ],
        birds: [
          ...ids.map((id, i) =>
            bird(id, 'big', sample(i).tint, {
              ...sample(i),
              revealed: i % 4 !== 0,
              tint: i % 4 === 0 ? 'unknown' : sample(i).tint,
            }),
          ),
          ...k.birds,
        ],
      };
    })(),
  },
];
