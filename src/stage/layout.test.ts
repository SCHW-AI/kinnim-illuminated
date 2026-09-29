import { describe, expect, test } from 'vitest';
import {
  conservativeLabelWidth,
  groupGap,
  layoutScene,
  MIN_GROUP_GAP,
  minOf,
  TYPE,
  type BirdLayout,
  type LabelLine,
  type MeasureLabel,
  type Rect,
  type SceneLayout,
} from './layout';
import type { Scene, SceneBird, SceneContainer } from './scene';

const KINDS: SceneContainer['kind'][] = ['kein', 'pile', 'mixture', 'zone', 'loose'];
/**
 * Bird labels of every shape: the engine's (Hebrew only, the widest being
 * unassigned's), none, and a two-line one (the contract still allows `en`).
 */
const LABELS: (SceneBird['label'] | undefined)[] = [
  { he: 'חטאת' },
  undefined,
  { he: 'עולה', en: 'Olah' },
  { he: 'חטאת/עולה' },
  undefined,
];

function makeScene(n: number, containerCount: number, kindOffset = 0): Scene {
  const containers: SceneContainer[] = Array.from({ length: containerCount }, (_, i) => ({
    id: `c${i}`,
    kind: KINDS[(i + kindOffset) % KINDS.length] ?? 'zone',
    label: i % 2 === 0 ? { he: 'קן', en: `Container ${i}` } : undefined,
    birdIds: [],
  }));
  const birds: SceneBird[] = Array.from({ length: n }, (_, i) => {
    const c = containers[i % containerCount]!;
    c.birdIds.push(`b${i}`);
    return {
      id: `b${i}`,
      containerId: c.id,
      tint: 'neutral',
      revealed: true,
      status: 'alive',
      label: LABELS[i % LABELS.length],
    };
  });
  return { containers, birds };
}

function boxesOverlap(a: { x: number; y: number; size: number }, b: typeof a): boolean {
  const eps = 1e-6;
  return (
    Math.abs(a.x - b.x) < (a.size + b.size) / 2 - eps &&
    Math.abs(a.y - b.y) < (a.size + b.size) / 2 - eps
  );
}

/** The width `measure` reports for a bird label: its wider line. */
function measuredBirdLabel(label: NonNullable<SceneBird['label']>, measure: MeasureLabel): number {
  const { heSize, enSize, weight } = TYPE.bird;
  return Math.max(
    label.he ? measure({ text: label.he, lang: 'he', size: heSize, weight }) : 0,
    label.en ? measure({ text: label.en, lang: 'en', size: enSize, weight }) : 0,
  );
}

function assertSound(scene: Scene, layout: SceneLayout, context: string, measure: MeasureLabel) {
  expect(layout.birds, context).toHaveLength(scene.birds.length);
  const rects = new Map(layout.containers.map((c) => [c.id, c.rect]));
  for (const bird of layout.birds) {
    const r = rects.get(bird.containerId)!;
    const half = bird.size / 2;
    const inside =
      bird.x - half >= r.x &&
      bird.x + half <= r.x + r.width &&
      bird.y - half >= r.y &&
      bird.y + half <= r.y + r.height;
    expect(inside, `${context}: ${bird.id} inside ${bird.containerId}`).toBe(true);
  }
  for (let i = 0; i < layout.birds.length; i++) {
    for (let j = i + 1; j < layout.birds.length; j++) {
      const a = layout.birds[i]!;
      const b = layout.birds[j]!;
      expect(boxesOverlap(a, b), `${context}: ${a.id} overlaps ${b.id}`).toBe(false);
    }
  }
  // Every bird label has its own space: inside its container, clear of every
  // other label and of every other bird's glyph.
  const glyph = (b: BirdLayout): Rect => ({
    x: b.x - b.size / 2,
    y: b.y - b.size / 2,
    width: b.size,
    height: b.size,
  });
  const labelled = layout.birds.filter((b) => b.labelBox);
  expect(labelled, context).toHaveLength(scene.birds.filter((b) => b.label).length);
  const sceneBirds = new Map(scene.birds.map((b) => [b.id, b]));
  for (const bird of labelled) {
    const box = bird.labelBox!;
    const r = rects.get(bird.containerId)!;
    // The space reserved is at least what the measurer says the label needs.
    expect(box.width, `${context}: ${bird.id} label width`).toBeGreaterThanOrEqual(
      measuredBirdLabel(sceneBirds.get(bird.id)!.label!, measure),
    );
    expect(contains(r, box), `${context}: ${bird.id} label inside ${bird.containerId}`).toBe(true);
    for (const other of layout.birds) {
      if (other === bird) continue;
      expect(rectsOverlap(box, glyph(other)), `${context}: ${bird.id} label / ${other.id}`).toBe(
        false,
      );
      if (other.labelBox) {
        expect(
          rectsOverlap(box, other.labelBox),
          `${context}: ${bird.id} label / ${other.id} label`,
        ).toBe(false);
      }
    }
  }
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  const eps = 1e-6;
  return (
    a.x < b.x + b.width - eps &&
    b.x < a.x + a.width - eps &&
    a.y < b.y + b.height - eps &&
    b.y < a.y + a.height - eps
  );
}

function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

describe('layoutScene', () => {
  /** A fake measurer, independent of the default, that reports deliberately wide labels. */
  const wide: MeasureLabel = ({ text }) => text.length * 14;

  test.each<[string, MeasureLabel | undefined]>([
    ['the default measurer', undefined],
    ['a fake measurer reporting 14 px per character', wide],
  ])(
    'places 1..40 birds without overlap, each inside its container, with %s',
    (_, measureLabel) => {
      // Every count up to 12 (where grid shapes change most), then a spread to 40.
      for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 20, 24, 25, 31, 36, 40]) {
        for (const width of [375, 720, 1200]) {
          for (const [containerCount, offset] of [
            [1, 0],
            [1, 1],
            [1, 2],
            [1, 3],
            [1, 4],
            [3, 0],
            [7, 1],
          ] as const) {
            const scene = makeScene(n, Math.min(containerCount, n), offset);
            assertSound(
              scene,
              layoutScene(scene, { width, measureLabel }),
              `n=${n} w=${width} c=${containerCount}`,
              measureLabel ?? conservativeLabelWidth,
            );
          }
        }
      }
    },
    // ~1 s alone; a sweep of ~450 layouts that can exceed the 5 s default under full-suite load.
    20_000,
  );

  test('the default measurer never reports less than the widest strings measure in the shipped fonts', () => {
    // Drawn widths measured in Chrome (2026-09-29) with the fonts (Ezra SIL,
    // EB Garamond), sizes, weights (Hebrew 400, and 700, which a canvas draws
    // as a synthetic bold; English italic 400), tracking and halo `SvgLabel`
    // uses: the larger of SVG getComputedTextLength widened to the canvas ink
    // extent, and the canvas advance plus the overhang at the worse end on both
    // sides, plus the 3.5 px halo.
    const measured: [LabelLine, number][] = [
      [{ text: 'WWWWWWWWWW', lang: 'en', size: 11, weight: 400 }, 127.6],
      [{ text: 'MMMMMMMMMM', lang: 'en', size: 11, weight: 400 }, 116.91],
      [{ text: 'WWWWWWWWWW', lang: 'en', size: 12.5, weight: 400 }, 144.7],
      [{ text: '⁄'.repeat(10), lang: 'en', size: 12.5, weight: 400 }, 20.4],
      [{ text: 'WWWWWWWWWW', lang: 'he', size: 13, weight: 400 }, 124.76],
      [{ text: 'MMMMMMMMMM', lang: 'he', size: 16, weight: 700 }, 150.24],
      [{ text: 'ש'.repeat(10), lang: 'he', size: 13, weight: 400 }, 94.28],
      [{ text: 'ש'.repeat(10), lang: 'he', size: 13, weight: 700 }, 96.27],
      [{ text: 'ש'.repeat(21), lang: 'he', size: 16, weight: 700 }, 240.11],
      // Yod triangle (U+05EF), not in Ezra SIL: the widest Hebrew advance.
      [{ text: 'ׯ'.repeat(10), lang: 'he', size: 16, weight: 700 }, 140.5],
      [{ text: 'שָׁ'.repeat(10), lang: 'he', size: 13, weight: 400 }, 94.28],
      [{ text: 'קן סתומה וחטאת מוגדרת', lang: 'he', size: 16, weight: 400 }, 185.06],
      [{ text: 'קן סתומה וחטאת מוגדרת', lang: 'he', size: 16, weight: 700 }, 187.06],
      [{ text: 'חַטָּאת/עוֹלָה', lang: 'he', size: 13, weight: 400 }, 73.45],
      [{ text: 'קִנִּים', lang: 'he', size: 16, weight: 400 }, 35.58],
      // Marks with no base letter: the yetiv (U+059A), the widest overhang, and
      // the shin dot (U+05C1); and the shin dot on ו.
      [{ text: '֚', lang: 'he', size: 11, weight: 700 }, 23.5],
      [{ text: '֚', lang: 'he', size: 12.5, weight: 400 }, 23.5],
      [{ text: 'ׁ', lang: 'he', size: 13, weight: 400 }, 21.5],
      [{ text: 'ׁ', lang: 'he', size: 16, weight: 400 }, 25.5],
      [{ text: 'וׁ', lang: 'he', size: 13, weight: 400 }, 13.88],
    ];
    for (const [line, drawn] of measured)
      expect(conservativeLabelWidth(line), line.text).toBeGreaterThanOrEqual(drawn);
  });

  test('is deterministic', () => {
    const scene = makeScene(23, 5);
    const a = layoutScene(scene, { width: 640 });
    const b = layoutScene(structuredClone(scene), { width: 640 });
    expect(b).toEqual(a);
  });

  // Spreading every bird into `Math.max(...)` once overflowed the call stack here.
  test('lays out a very large container without overflowing the stack', () => {
    const n = 200_000;
    const layout = layoutScene(makeScene(n, 1), { width: 640 });
    expect(layout.birds).toHaveLength(n);
  });

  test('wraps containers into more rows as the width shrinks', () => {
    const scene = makeScene(16, 8);
    const rowsAt = (width: number) => {
      const layout = layoutScene(scene, { width });
      for (const c of layout.containers) {
        expect(c.rect.x).toBeGreaterThanOrEqual(0);
        expect(c.rect.x + c.rect.width).toBeLessThanOrEqual(width);
      }
      return new Set(layout.containers.map((c) => c.row)).size;
    };
    const widths = [1600, 1100, 800, 560, 360];
    const rows = widths.map(rowsAt);
    for (let i = 1; i < rows.length; i++) expect(rows[i]!).toBeGreaterThanOrEqual(rows[i - 1]!);
    expect(rows.at(-1)!).toBeGreaterThan(rows[0]!);
  });

  test('groups are physically divided: boxes (and loose birds) sit at least MIN_GROUP_GAP apart, far more than birds within a box', () => {
    // Clear space between two rectangles (0 when they touch or overlap).
    const clearance = (a: Rect, b: Rect) =>
      Math.max(
        b.x - (a.x + a.width),
        a.x - (b.x + b.width),
        b.y - (a.y + a.height),
        a.y - (b.y + b.height),
      );
    let widestBirdGap = 0;
    for (const width of [320, 375, 720, 1200]) {
      expect(groupGap(width)).toBeGreaterThanOrEqual(MIN_GROUP_GAP);
      for (const [n, containerCount] of [
        [8, 4],
        [16, 8],
        [23, 5],
        [40, 7],
      ] as const) {
        // As the engine labels them, every bird in a group carries the same kind of label.
        const scene = makeScene(n, containerCount);
        const home = new Map(
          scene.containers.flatMap((c, k) => c.birdIds.map((id) => [id, k] as const)),
        );
        for (const b of scene.birds) b.label = LABELS[home.get(b.id)! % LABELS.length];
        const layout = layoutScene(scene, { width });
        const context = `n=${n} c=${containerCount} w=${width}`;
        // A loose group has no box: its rect is its bare bird grid and it has
        // no caption, so the gap below is measured from the birds themselves.
        const loose = layout.containers.filter((c) => c.kind === 'loose');
        if (containerCount >= KINDS.length) expect(loose.length, context).toBeGreaterThan(0);
        for (const c of loose) {
          expect(c.rect, `${context}: ${c.id}`).toEqual(c.grid);
          expect(c.label, `${context}: ${c.id}`).toBeUndefined();
        }
        for (let i = 0; i < layout.containers.length; i++) {
          for (let j = i + 1; j < layout.containers.length; j++) {
            const a = layout.containers[i]!;
            const b = layout.containers[j]!;
            expect(
              clearance(a.rect, b.rect),
              `${context}: ${a.id} / ${b.id}`,
            ).toBeGreaterThanOrEqual(groupGap(width) - 1e-6);
          }
        }
        // Each bird (glyph and label together) and its nearest neighbour in the same box.
        const footprint = (b: BirdLayout): Rect => {
          const g = { x: b.x - b.size / 2, y: b.y - b.size / 2, width: b.size, height: b.size };
          return b.labelBox ? union(g, b.labelBox) : g;
        };
        for (const bird of layout.birds) {
          const gaps = layout.birds
            .filter((o) => o !== bird && o.containerId === bird.containerId)
            .map((o) => clearance(footprint(bird), footprint(o)));
          if (gaps.length)
            widestBirdGap = Math.max(
              widestBirdGap,
              minOf(gaps, (g) => g),
            );
        }
      }
    }
    expect(widestBirdGap).toBeGreaterThan(0);
    expect(MIN_GROUP_GAP).toBeGreaterThanOrEqual(3 * widestBirdGap);
  });
});

function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}
