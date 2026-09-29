/*
 * Pure layout for a Scene: container boxes in wrapping rows, separated by
 * generous whitespace, and birds packed closely into an even grid inside each
 * box. No DOM, no randomness: the same Scene and options always give the same
 * layout.
 */
import type { RichLabel, Scene, SceneContainer } from './scene';

/**
 * The largest `value(item)`, or `start` when that is larger (`-Infinity` by
 * default, like `Math.max()` of nothing). A loop, not `Math.max(...list)`,
 * whose spread overflows the call stack for a very long list.
 */
export function maxOf<T>(
  items: readonly T[],
  value: (item: T) => number,
  start = -Infinity,
): number {
  let max = start;
  for (const item of items) max = Math.max(max, value(item));
  return max;
}

/** The smallest `value(item)`, or `start` when that is smaller; see `maxOf`. */
export function minOf<T>(
  items: readonly T[],
  value: (item: T) => number,
  start = Infinity,
): number {
  let min = start;
  for (const item of items) min = Math.min(min, value(item));
  return min;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutOptions {
  /** Available width in px (the SVG viewBox width). */
  width: number;
  /** Flow of containers and of birds within a container. Default `ltr`. */
  direction?: 'ltr' | 'rtl';
  /** Bird glyph size in px. Default depends on `width`. */
  birdSize?: number;
  /**
   * Measures a label line as drawn. Default `conservativeLabelWidth`, an upper
   * bound that needs no fonts; the browser stage passes real text metrics.
   * Every label box is exactly as wide as this reports.
   */
  measureLabel?: MeasureLabel;
}

/** One line of a label, as `SvgLabel` draws it. */
export interface LabelLine {
  text: string;
  /**
   * `he`: the Hebrew line (`--font-hebrew`, upright). `en`: the English line
   * (`--font-latin`, italic, tracked by `EN_TRACKING`).
   */
  lang: 'he' | 'en';
  /** Font size in px. */
  size: number;
  weight: number;
}

/**
 * The width in px a label line needs when drawn centred: its advance, tracking
 * and ink overhang, plus its halo. Must be deterministic.
 */
export type MeasureLabel = (line: LabelLine) => number;

/** Where a label's lines go: `x` is the centre, `y` the first line's baseline. */
export interface LabelPlacement {
  x: number;
  y: number;
}

export interface ContainerLayout {
  id: string;
  kind: SceneContainer['kind'];
  /**
   * The container's box: its outline is drawn on this rectangle. A `loose`
   * container has no outline or padding: its rect is exactly its bird grid.
   */
  rect: Rect;
  /** The bird grid inside the frame. */
  grid: Rect;
  cols: number;
  rows: number;
  cell: { width: number; height: number };
  /** Placement of the container's caption (under the box), when it has one. Never for `loose`. */
  label?: LabelPlacement;
  /** Which wrapped row of the stage the container sits in (0-based). */
  row: number;
}

export interface BirdLayout {
  id: string;
  containerId: string;
  /** Centre of the bird glyph. */
  x: number;
  y: number;
  /** Glyph width and height. */
  size: number;
  /** Placement of the bird's label, when it has one. */
  label?: LabelPlacement;
  /** The space reserved for the bird's label (as wide as `measureLabel` reports), when it has one. */
  labelBox?: Rect;
}

export interface SceneLayout {
  width: number;
  height: number;
  birdSize: number;
  containers: ContainerLayout[];
  birds: BirdLayout[];
}

/** Type metrics shared by the layout and the renderer. */
export const TYPE = {
  container: { heSize: 16, enSize: 12.5, heLine: 19, enLine: 15, weight: 400 },
  bird: { heSize: 13, enSize: 11, heLine: 15, enLine: 13, weight: 400 },
} as const;

/** Width of the parchment halo stroked around label text (half of it falls outside the glyphs). */
export const LABEL_HALO = 3.5;
/** Letter spacing of a label's English line, in em. */
export const EN_TRACKING = 0.02;

/**
 * Upper bounds on one character's advance, in em, for every font in the label
 * stacks (`--font-hebrew`: Ezra SIL, then EB Garamond; `--font-latin`; and
 * their fallbacks). The Hebrew line is upright at 400 or 700 (labels use 400;
 * Ezra SIL has one weight and the page never fakes a bold, but a canvas does,
 * so 700 is measured as the wider case); the English line is italic 400.
 * Measured in Chrome (2026-09-29) with canvas `measureText` over every
 * assigned code point in each range, and every combining mark alone and on
 * every Hebrew letter, at 100 px and at the label sizes (11, 12.5, 13, 16 px),
 * then rounded up:
 * - `hebrew`, U+0590-U+05FF: widest ׯ (U+05EF, which Ezra SIL lacks: a
 *   fallback glyph) 0.844 em; Ezra's letters up to ש 0.698 em.
 *   A combining mark adds at most 0.052 em to its base (dagesh on ז).
 * - `latin`, U+0000-U+00FF: widest italic W 1.067 em (upright W 0.986 in a
 *   Hebrew line, where Latin letters fall through to EB Garamond).
 * - `other`, anything else sampled (Latin Extended, punctuation, currency,
 *   letterlike, arrows, maths, geometric shapes, Hebrew presentation forms):
 *   widest Ǆ (U+01C4, a fallback glyph, in a Hebrew line at 700) 1.389 em.
 */
export const MAX_ADVANCE_EM = { hebrew: 0.85, latin: 1.08, other: 1.4 } as const;
/**
 * Upper bound, in em, on how far a line's ink reaches past its advance at
 * either end (measured as above). A centred line can overhang this much at
 * each end. Widest outside the marks: italic ⁄ (U+2044) 0.456 em at 12.5 px;
 * letters up to italic ƴ (U+01B4, a fallback glyph) 0.37 em. A mark reaches
 * further but brings its own 0.85 em count, which covers the excess: the
 * yetiv (U+059A) alone draws 0.909 em past its zero advance at 11 px (0.8 em
 * unbolded), within its 0.85 plus both ends' 0.5; on a letter a mark reaches
 * at most 0.481 em (the shin dot on י).
 */
export const MAX_OVERHANG_EM = 0.5;

/**
 * The default `MeasureLabel`: an upper bound on a line's drawn width in the
 * shipped fonts that needs no font metrics. Each character counts at its
 * range's `MAX_ADVANCE_EM`; tracking, `MAX_OVERHANG_EM` at each end and the
 * halo are added.
 */
export const conservativeLabelWidth: MeasureLabel = ({ text, lang, size }) => {
  if (!text) return 0;
  let em = 0;
  let count = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    em +=
      code <= 0xff
        ? MAX_ADVANCE_EM.latin
        : code >= 0x590 && code <= 0x5ff
          ? MAX_ADVANCE_EM.hebrew
          : MAX_ADVANCE_EM.other;
    count++;
  }
  const tracking = lang === 'en' ? count * EN_TRACKING : 0;
  return (em + tracking + 2 * MAX_OVERHANG_EM) * size + LABEL_HALO;
};

/** Space between the stage edge and the outermost boxes. */
export const STAGE_MARGIN = 10;
/**
 * Clear space between container boxes, across and down, on a wide stage.
 * Groups are separated by this much whitespace so separate groups are
 * unmistakably separate; birds inside one box sit only `BIRD_GAP` apart.
 */
export const GROUP_GAP = 40;
/** The smallest clear space between any two boxes (narrow stages). */
export const MIN_GROUP_GAP = 32;
/** Stage width below which boxes use `MIN_GROUP_GAP`. */
const NARROW = 560;

/** Clear space between boxes for a stage width. */
export function groupGap(width: number): number {
  return width >= NARROW ? GROUP_GAP : MIN_GROUP_GAP;
}
/** Clear space between neighbouring birds inside one box (unlabelled birds). */
export const BIRD_GAP = 6;
/** Inner padding from a box's outline to its bird grid, the same for every kind and side. */
export const BOX_PADDING = 14;
/** Space from a box's bottom edge to the top of its caption. */
export const CAPTION_GAP = 10;

/** Preferred width : height of a container's bird grid. */
const TARGET_ASPECT = 1.8;

/** Default glyph size for a stage width. */
export function defaultBirdSize(width: number): number {
  if (width >= 640) return 64;
  if (width >= 420) return 54;
  return 46;
}

function labelHeight(label: RichLabel | undefined, m: { heLine: number; enLine: number }): number {
  if (!label) return 0;
  return (label.he ? m.heLine : 0) + (label.en ? m.enLine : 0);
}

/** The width a label needs: its wider line, as `measure` reports it. */
function labelWidth(
  label: RichLabel | undefined,
  m: { heSize: number; enSize: number; weight: number },
  measure: MeasureLabel,
): number {
  if (!label) return 0;
  const line = (text: string | undefined, lang: 'he' | 'en', size: number) =>
    text ? measure({ text, lang, size, weight: m.weight }) : 0;
  return Math.max(line(label.he, 'he', m.heSize), line(label.en, 'en', m.enSize));
}

/**
 * Chooses a column count for `n` birds: few empty slots and a grid a little
 * wider than tall, never more columns than fit.
 */
function chooseCols(n: number, maxCols: number, cellW: number, cellH: number): number {
  if (n <= 1) return 1;
  let best = 1;
  let bestScore = Infinity;
  for (let c = 1; c <= Math.min(n, maxCols); c++) {
    const rows = Math.ceil(n / c);
    const empty = c * rows - n;
    const aspect = (c * cellW) / (rows * cellH);
    const score = empty * 0.6 + Math.abs(Math.log(aspect / TARGET_ASPECT));
    if (score < bestScore - 1e-9) {
      best = c;
      bestScore = score;
    }
  }
  return best;
}

interface Measured {
  container: SceneContainer;
  /** The caption drawn under the box (never for `loose`). */
  caption: RichLabel | undefined;
  /** Padding between the box and its grid: `BOX_PADDING`, or 0 for `loose`. */
  pad: number;
  birdIds: string[];
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  /** The box (outline) size. */
  boxW: number;
  boxH: number;
  /** Height of the caption block under the box (0 without a label). */
  captionH: number;
  /** Width the container claims in its row: the box, or its caption if wider. */
  width: number;
  gridW: number;
}

/** Greedy wrap: fill each row until the next container would exceed `limit`. */
function wrapRows<T extends { width: number }>(items: T[], limit: number, gap: number): T[][] {
  const rows: T[][] = [];
  let current: T[] = [];
  let used = 0;
  for (const m of items) {
    const need = current.length ? used + gap + m.width : m.width;
    if (current.length && need > limit) {
      rows.push(current);
      current = [m];
      used = m.width;
    } else {
      current.push(m);
      used = need;
    }
  }
  if (current.length) rows.push(current);
  return rows;
}

/**
 * Lays out a Scene for the given width. Pure, and deterministic for a given
 * `measureLabel`.
 *
 * Every container is a box sized tightly around its bird grid (`BOX_PADDING`
 * on every side, birds `BIRD_GAP` apart), with its caption centred under the
 * box. A `loose` container is its bare grid: no padding and no caption. Boxes
 * flow in centred, wrapping rows, standing on a shared baseline, with
 * `groupGap(width)` (never less than `MIN_GROUP_GAP`) of clear space between
 * any two of them.
 */
export function layoutScene(scene: Scene, options: LayoutOptions): SceneLayout {
  const width = Math.max(1, options.width);
  const rtl = options.direction === 'rtl';
  const S = options.birdSize ?? defaultBirdSize(width);
  const avail = Math.max(1, width - 2 * STAGE_MARGIN);
  const gap = groupGap(width);
  const birdsById = new Map(scene.birds.map((b) => [b.id, b]));
  const measure = options.measureLabel ?? conservativeLabelWidth;

  const measured: Measured[] = scene.containers.map((container) => {
    const loose = container.kind === 'loose';
    const pad = loose ? 0 : BOX_PADDING;
    const caption = loose ? undefined : container.label;
    const birdIds = container.birdIds.filter((id) => birdsById.has(id));
    const birds = birdIds.map((id) => birdsById.get(id)!);
    const hasHe = birds.some((b) => b.label?.he);
    const hasEn = birds.some((b) => b.label?.en);
    const widestLabel = maxOf(birds, (b) => labelWidth(b.label, TYPE.bird, measure), 0);
    // Every slot is wide enough for the widest bird label, so labels never collide.
    const cellW = Math.max(S + BIRD_GAP, widestLabel + BIRD_GAP);
    const cellH =
      S +
      BIRD_GAP +
      (hasHe ? TYPE.bird.heLine : 0) +
      (hasEn ? TYPE.bird.enLine : 0) +
      (hasHe || hasEn ? 2 : 0);
    const maxCols = Math.max(1, Math.floor((avail - 2 * pad) / cellW));
    const n = birdIds.length;
    const cols = chooseCols(n, maxCols, cellW, cellH);
    const rows = Math.max(1, Math.ceil(n / cols));
    const gridW = cols * cellW;
    const boxW = gridW + 2 * pad;
    const boxH = rows * cellH + 2 * pad;
    const labelH = labelHeight(caption, TYPE.container);
    const captionH = labelH ? CAPTION_GAP + labelH : 0;
    const captionW = Math.min(avail, labelWidth(caption, TYPE.container, measure) + 8);
    return {
      container,
      caption,
      pad,
      birdIds,
      cols,
      rows,
      cellW,
      cellH,
      boxW,
      boxH,
      captionH,
      // A caption may overhang its box by a quarter of the gap on each side,
      // so neighbouring captions stay at least half a gap apart.
      width: Math.max(boxW, captionW - gap / 2),
      gridW,
    };
  });

  // Wrap greedily to find how many rows are needed, then rebalance: the
  // narrowest row width that still needs no more rows (no lonely last row).
  const greedyRows = wrapRows(measured, avail, gap);
  let rowsOf = greedyRows;
  if (greedyRows.length > 1) {
    let lo = maxOf(measured, (m) => m.width);
    let hi = avail;
    for (let i = 0; i < 24 && hi - lo > 0.5; i++) {
      const mid = (lo + hi) / 2;
      if (wrapRows(measured, mid, gap).length <= greedyRows.length) hi = mid;
      else lo = mid;
    }
    rowsOf = wrapRows(measured, hi, gap);
  }

  const containers: ContainerLayout[] = [];
  const birds: BirdLayout[] = [];
  let y = STAGE_MARGIN;

  rowsOf.forEach((row, rowIndex) => {
    // Boxes in a row stand on a shared baseline, so their captions line up.
    // Loose birds stand on the same floor as the bottom row of birds in the
    // boxes beside them: their grid sits `BOX_PADDING` above the baseline.
    const sink = row.some((m) => m.pad) ? BOX_PADDING : 0;
    const boxBand = maxOf(row, (m) => m.boxH + (m.pad ? 0 : sink));
    const rowH = boxBand + maxOf(row, (m) => m.captionH);
    const total = row.reduce((s, m) => s + m.width, 0) + gap * (row.length - 1);
    let cursor = STAGE_MARGIN + (avail - total) / 2;
    for (const m of row) {
      const slotX = rtl ? width - cursor - m.width : cursor;
      cursor += m.width + gap;
      const rect: Rect = {
        x: slotX + (m.width - m.boxW) / 2,
        y: y + boxBand - m.boxH - (m.pad ? 0 : sink),
        width: m.boxW,
        height: m.boxH,
      };
      const grid: Rect = {
        x: rect.x + m.pad,
        y: rect.y + m.pad,
        width: m.gridW,
        height: m.rows * m.cellH,
      };
      const label = m.caption
        ? {
            x: rect.x + rect.width / 2,
            y:
              rect.y +
              rect.height +
              CAPTION_GAP +
              (m.caption.he ? TYPE.container.heSize : TYPE.container.enSize) -
              2,
          }
        : undefined;
      containers.push({
        id: m.container.id,
        kind: m.container.kind,
        rect,
        grid,
        cols: m.cols,
        rows: m.rows,
        cell: { width: m.cellW, height: m.cellH },
        label,
        row: rowIndex,
      });

      const n = m.birdIds.length;
      m.birdIds.forEach((id, i) => {
        const r = Math.floor(i / m.cols);
        const c = i % m.cols;
        const inRow = Math.min(m.cols, n - r * m.cols);
        const offset = ((m.cols - inRow) * m.cellW) / 2;
        const slot = rtl ? inRow - 1 - c : c;
        const cx = grid.x + offset + (slot + 0.5) * m.cellW;
        const cy = grid.y + r * m.cellH + BIRD_GAP / 2 + S / 2;
        const bird = birdsById.get(id)!;
        const labelW = labelWidth(bird.label, TYPE.bird, measure);
        birds.push({
          id,
          containerId: m.container.id,
          x: cx,
          y: cy,
          size: S,
          label: bird.label
            ? { x: cx, y: cy + S / 2 + (bird.label.he ? TYPE.bird.heSize : TYPE.bird.enSize) }
            : undefined,
          labelBox: bird.label
            ? {
                x: cx - labelW / 2,
                y: cy + S / 2 + 1,
                width: labelW,
                height: labelHeight(bird.label, TYPE.bird),
              }
            : undefined,
        });
      });
    }
    y += rowH + gap;
  });

  const height = rowsOf.length ? y - gap + STAGE_MARGIN : 2 * STAGE_MARGIN + S;
  return { width, height, birdSize: S, containers, birds };
}
