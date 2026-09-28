import { exposeDebugIds } from './debugIds';
import type { ContainerLayout, Rect } from './layout';
import { TYPE } from './layout';
import type { SceneContainer } from './scene';
import { SvgLabel } from './SvgLabel';
import { useTweened } from './useTweened';

/*
 * Containers are plain box outlines on the stage background: no fills,
 * textures or gradients. The kind is carried by the outline's colour and line
 * style (see src/theme/README.md, "Container outlines"):
 *
 *   kein     solid ink outline            --kn-box-kein
 *   pile     thinner, fainter solid line  --kn-box-pile
 *   mixture  double line in "mixed" hue   --kn-box-mixture
 *   zone     dashed gold outline          --kn-box-zone
 *   loose    nothing: no outline, caption or emphasis; its birds just stand
 *            on the stage
 *
 * `emphasis: 'highlight'` adds a heavier gold outline just outside the box;
 * `emphasis: 'dim'` fades the outline and caption.
 */

/** Corner radius of every box. */
export const BOX_RADIUS = 6;
/** How far the highlight outline sits outside the box. */
const HIGHLIGHT_OFFSET = 5;
/** Inset of a mixture's second line. */
const MIXTURE_INSET = 3.5;

interface OutlineStyle {
  stroke: string;
  width: number;
  dash?: string;
}

/** Outline colour, weight and line style for each container kind. */
export const OUTLINES: Record<Exclude<SceneContainer['kind'], 'loose'>, OutlineStyle> = {
  kein: { stroke: 'var(--kn-box-kein)', width: 1.75 },
  pile: { stroke: 'var(--kn-box-pile)', width: 1 },
  mixture: { stroke: 'var(--kn-box-mixture)', width: 1.25 },
  zone: { stroke: 'var(--kn-box-zone)', width: 1.5, dash: '7 5' },
};

/** A type alias (not an interface) so it satisfies `Record<string, number>`. */
type Geometry = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** First caption baseline, relative to the box. */
  ly: number;
};

const f = (n: number) => Math.round(n * 10) / 10;

function Box({
  w,
  h,
  inset = 0,
  style,
  marker,
}: {
  w: number;
  h: number;
  inset?: number;
  style: OutlineStyle;
  marker?: string;
}) {
  return (
    <rect
      x={f(inset)}
      y={f(inset)}
      width={f(Math.max(0, w - 2 * inset))}
      height={f(Math.max(0, h - 2 * inset))}
      rx={Math.max(0, BOX_RADIUS - inset)}
      fill="none"
      data-marker={marker}
      style={{ stroke: style.stroke }}
      strokeWidth={style.width}
      strokeDasharray={style.dash}
    />
  );
}

/** Frame geometry for a box, relative to its own caption offset. */
function geometry(rect: Rect, layout: ContainerLayout): Geometry {
  return {
    x: rect.x,
    y: rect.y,
    w: rect.width,
    h: rect.height,
    ly: layout.label ? layout.label.y - layout.rect.y - layout.rect.height + rect.height : 0,
  };
}

/**
 * One container: its outline (by kind), emphasis and caption; nothing for a
 * `loose` container. Animates size and position. `from` is where a
 * newly-appearing box grows from (e.g. the boxes whose birds are merging into
 * it); it is read only on mount.
 */
export function StageContainer({
  container,
  layout,
  instant,
  from,
}: {
  container: SceneContainer;
  layout: ContainerLayout;
  instant: boolean;
  from?: Rect;
}) {
  const target = geometry(layout.rect, layout);
  const g = useTweened<Geometry>(target, instant, from ? geometry(from, layout) : undefined);
  if (container.kind === 'loose') {
    // Not a group: only its birds are drawn (see `StageBird`).
    return (
      <g
        data-container-id={exposeDebugIds() ? container.id : undefined}
        data-kind={container.kind}
      />
    );
  }
  const emphasis = container.emphasis ?? 'none';
  const outline = OUTLINES[container.kind];

  return (
    <g
      transform={`translate(${f(g.x)} ${f(g.y)})`}
      data-container-id={exposeDebugIds() ? container.id : undefined}
      data-kind={container.kind}
      data-emphasis={emphasis}
      opacity={emphasis === 'dim' ? 0.4 : 1}
    >
      {emphasis === 'highlight' && (
        <Box
          w={g.w}
          h={g.h}
          inset={-HIGHLIGHT_OFFSET}
          marker="highlight"
          style={{ stroke: 'var(--kn-box-highlight)', width: 2.5 }}
        />
      )}
      <Box w={g.w} h={g.h} style={outline} />
      {container.kind === 'mixture' && (
        <Box w={g.w} h={g.h} inset={MIXTURE_INSET} style={{ ...outline, width: 0.9 }} />
      )}
      {container.label && (
        <SvgLabel
          label={container.label}
          x={g.w / 2}
          y={g.ly}
          metrics={TYPE.container}
          weight={TYPE.container.weight}
        />
      )}
    </g>
  );
}
