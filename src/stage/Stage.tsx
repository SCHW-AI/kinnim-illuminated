import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion';
import { StageBird } from './Bird';
import type { BirdStyle } from './birds';
import { StageContainer } from './Container';
import { describeScene, summarizeScene } from './describe';
import {
  layoutScene,
  maxOf,
  minOf,
  type MeasureLabel,
  type Rect,
  type SceneLayout,
} from './layout';
import { createCanvasMeasurer, loadLabelFonts } from './measureLabel';
import type { Scene } from './scene';
import { useTweened } from './useTweened';

/** Layout width used until (or where) the element cannot be measured (tests, SSR). */
const FALLBACK_WIDTH = 720;

export interface StageProps {
  /** What to draw. */
  scene: Scene;
  /**
   * Fixed layout width in px. When omitted the stage measures its own width
   * and re-lays out on resize. The SVG always fills its parent's width.
   */
  width?: number;
  /** Bird artwork; defaults to `BIRD_STYLE`. */
  birdStyle?: BirdStyle;
  /** Flow of containers and birds. Default `ltr`. */
  direction?: 'ltr' | 'rtl';
  className?: string;
}

function useMeasuredWidth(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled]);
  return [ref, width] as const;
}

/**
 * The browser's label measurer (see `createCanvasMeasurer`), replaced by a
 * fresh one whenever web fonts finish loading, so labels are laid out in the
 * fonts they are drawn in. Undefined without canvas (jsdom).
 */
function useLabelMeasurer(): MeasureLabel | undefined {
  const [measure, setMeasure] = useState(createCanvasMeasurer);
  useEffect(() => {
    const fonts = typeof document === 'undefined' ? undefined : document.fonts;
    if (!fonts) return;
    let live = true;
    const refresh = () => {
      if (live) setMeasure(() => createCanvasMeasurer());
    };
    // `ready` covers fonts that loaded between the first measurement and now;
    // `loadLabelFonts` makes sure Hadasim CLM loads even before any Hebrew is drawn.
    void fonts.ready.then(refresh);
    void loadLabelFonts()?.then(refresh, () => undefined);
    fonts.addEventListener('loadingdone', refresh);
    return () => {
      live = false;
      fonts.removeEventListener('loadingdone', refresh);
    };
  }, []);
  return measure;
}

/**
 * Renders a Scene as an animated SVG. Birds are keyed by id, so a bird whose
 * container changes between two Scenes flies to its new slot. Honours the
 * reader's reduced-motion preference, even when it changes after mount, by
 * placing everything instantly.
 */
export function Stage({ scene, width, birdStyle, direction, className = '' }: StageProps) {
  const [ref, measured] = useMeasuredWidth(width === undefined);
  const layoutWidth = width ?? measured ?? FALLBACK_WIDTH;
  const reduced = usePrefersReducedMotion();
  const measureLabel = useLabelMeasurer();
  // Remount (rather than animate) when the first real measurement arrives or the
  // motion preference flips, so nothing tweens from a provisional or stale frame.
  const phase = `${reduced ? 'still' : 'moving'}-${width !== undefined || measured !== null ? 'sized' : 'provisional'}`;

  return (
    <div ref={ref} className={`kn-stage w-full ${className}`}>
      <StageSvg
        key={phase}
        scene={scene}
        width={layoutWidth}
        birdStyle={birdStyle}
        direction={direction}
        measureLabel={measureLabel}
        instant={reduced}
      />
    </div>
  );
}

/** The smallest rectangle covering every rect given. */
function union(rects: Rect[]): Rect {
  const x0 = minOf(rects, (r) => r.x);
  const y0 = minOf(rects, (r) => r.y);
  const x1 = maxOf(rects, (r) => r.x + r.width);
  const y1 = maxOf(rects, (r) => r.y + r.height);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * Where each container that is new in `next` grows from: the union of the
 * boxes its birds were in (so a mixture grows out of the boxes merging into
 * it), or, when none of its birds were on the stage, a smaller box at its own
 * centre.
 */
function growOrigins(prev: SceneLayout | null, next: SceneLayout): Map<string, Rect> {
  const origins = new Map<string, Rect>();
  if (!prev) return origins;
  const prevRects = new Map(prev.containers.map((c) => [c.id, c.rect]));
  const prevHome = new Map(prev.birds.map((b) => [b.id, b.containerId]));
  for (const c of next.containers) {
    if (prevRects.has(c.id)) continue;
    const sources = new Set(
      next.birds.filter((b) => b.containerId === c.id).map((b) => prevHome.get(b.id)),
    );
    const rects = [...sources].flatMap((id) => {
      const r = id === undefined ? undefined : prevRects.get(id);
      return r ? [r] : [];
    });
    const { x, y, width, height } = c.rect;
    origins.set(
      c.id,
      rects.length
        ? union(rects)
        : { x: x + width * 0.2, y: y + height * 0.2, width: width * 0.6, height: height * 0.6 },
    );
  }
  return origins;
}

function StageSvg({
  scene,
  width,
  birdStyle,
  direction,
  measureLabel,
  instant,
}: {
  scene: Scene;
  width: number;
  birdStyle?: BirdStyle;
  direction?: 'ltr' | 'rtl';
  measureLabel?: MeasureLabel;
  instant: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const layout = useMemo(
    () => layoutScene(scene, { width, direction, measureLabel }),
    [scene, width, direction, measureLabel],
  );
  // The previous layout, so a new box can grow out of the boxes it replaces.
  const [track, setTrack] = useState<{ layout: SceneLayout; prev: SceneLayout | null }>({
    layout,
    prev: null,
  });
  if (track.layout !== layout) setTrack({ layout, prev: track.layout });
  const origins = instant ? new Map<string, Rect>() : growOrigins(track.prev, layout);
  const { h } = useTweened({ h: layout.height }, instant);
  const containersById = new Map(scene.containers.map((c) => [c.id, c]));
  const birdsById = new Map(scene.birds.map((b) => [b.id, b]));
  const titleId = `kn-stage-title-${uid}`;
  const descId = `kn-stage-desc-${uid}`;

  const birds = layout.birds.flatMap((bl) => {
    const bird = birdsById.get(bl.id);
    return bird
      ? [<StageBird key={bl.id} bird={bird} layout={bl} birdStyle={birdStyle} instant={instant} />]
      : [];
  });

  const containers = layout.containers.flatMap((cl) => {
    const c = containersById.get(cl.id);
    if (!c) return [];
    const box = (
      <StageContainer
        key={cl.id}
        container={c}
        layout={cl}
        instant={instant}
        from={origins.get(cl.id)}
      />
    );
    return [
      instant ? (
        box
      ) : (
        <motion.g
          key={cl.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {box}
        </motion.g>
      ),
    ];
  });

  return (
    <svg
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descId}
      viewBox={`0 0 ${layout.width} ${Math.round(Math.max(h, 1))}`}
      width="100%"
      style={{ display: 'block', height: 'auto', overflow: 'visible' }}
    >
      <title id={titleId}>{describeScene(scene)}</title>
      <desc id={descId}>{summarizeScene(scene)}</desc>
      <g data-layer="containers">
        {instant ? containers : <AnimatePresence initial={false}>{containers}</AnimatePresence>}
      </g>
      <g data-layer="birds">
        {instant ? birds : <AnimatePresence initial={false}>{birds}</AnimatePresence>}
      </g>
    </svg>
  );
}
