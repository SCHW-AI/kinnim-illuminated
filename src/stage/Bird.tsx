import { animate, motion, useMotionValue } from 'motion/react';
import { useLayoutEffect, type ReactNode } from 'react';
import { BIRD_STYLE, BirdGlyph, type BirdStyle } from './birds';
import { exposeDebugIds } from './debugIds';
import { describeBird } from './describe';
import type { BirdLayout } from './layout';
import { TYPE } from './layout';
import type { SceneBird } from './scene';
import { SvgLabel } from './SvgLabel';

/**
 * A bird's flight: one progress value eased from 0 to 1, calm at both ends and
 * never overshooting (see `FlyingGroup`).
 */
const BIRD_FLIGHT = { duration: 0.55, ease: 'easeInOut' } as const;

/** Small roundel carrying the offering's initial, so chatas / olah never rely on colour alone. */
function TintEmblem({ tint, r }: { tint: 'chatas' | 'olah'; r: number }) {
  const common = {
    stroke: 'var(--kn-parchment)',
    strokeWidth: Math.max(1.2, r * 0.18),
  };
  return (
    <g data-emblem={tint}>
      {tint === 'chatas' ? (
        // Lozenge for chatas.
        <path
          d={`M0 ${-r * 1.18}L${r * 1.18} 0L0 ${r * 1.18}L${-r * 1.18} 0Z`}
          style={{ fill: 'var(--kn-chatas)', ...common }}
          strokeLinejoin="round"
        />
      ) : (
        // Roundel for olah.
        <circle r={r} style={{ fill: 'var(--kn-olah)', ...common }} />
      )}
      <text
        y={r * 0.36}
        textAnchor="middle"
        lang="he"
        fontFamily="var(--font-hebrew)"
        fontWeight={700}
        fontSize={r * 1.15}
        style={{ fill: 'var(--kn-parchment)' }}
      >
        {tint === 'chatas' ? 'ח' : 'ע'}
      </text>
    </g>
  );
}

/** Gold nimbus behind a kasher bird. */
function Halo({ s }: { s: number }) {
  const r = s * 0.5;
  const dots = 16;
  return (
    <g data-marker="halo" pointerEvents="none">
      <circle r={r * 1.16} style={{ fill: 'var(--kn-gold-bright)' }} opacity={0.12} />
      <circle r={r * 1.02} style={{ fill: 'var(--kn-gold-bright)' }} opacity={0.18} />
      <circle
        r={r}
        fill="none"
        style={{ stroke: 'var(--kn-gold)' }}
        strokeWidth={Math.max(1.4, s * 0.03)}
      />
      {Array.from({ length: dots }, (_, i) => {
        const a = (i / dots) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={Math.cos(a) * r * 1.12}
            cy={Math.sin(a) * r * 1.12}
            r={Math.max(0.9, s * 0.018)}
            style={{ fill: 'var(--kn-gold)' }}
          />
        );
      })}
    </g>
  );
}

/** A small circular badge at a corner of the bird. */
function Badge({
  x,
  y,
  r,
  fill,
  marker,
  children,
}: {
  x: number;
  y: number;
  r: number;
  fill: string;
  marker: string;
  children: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y})`} data-marker={marker}>
      <circle
        r={r}
        style={{ fill, stroke: 'var(--kn-parchment)' }}
        strokeWidth={Math.max(1.4, r * 0.2)}
      />
      {children}
    </g>
  );
}

/** Everything drawn for one bird, centred on (0, 0). */
export function BirdArt({
  bird,
  size,
  birdStyle = BIRD_STYLE,
}: {
  bird: SceneBird;
  size: number;
  birdStyle?: BirdStyle;
}) {
  const s = size;
  const shownTint = bird.revealed ? bird.tint : 'unknown';
  const muted = bird.status === 'pasul' || bird.status === 'yamus';
  const badgeR = Math.max(7, s * 0.15);
  const emblemR = Math.max(6.5, s * 0.13);
  // Yamus fades the bird itself; its marker stays crisp. Emphasis 'dim' fades everything.
  const glyphOpacity = bird.status === 'yamus' ? 0.7 : 1;
  const opacity = bird.emphasis === 'dim' ? 0.4 : 1;
  const scale = bird.emphasis === 'highlight' ? 1.08 : 1;

  return (
    <g opacity={opacity}>
      {bird.emphasis === 'highlight' && (
        <circle
          r={s * 0.6}
          fill="none"
          data-marker="highlight"
          style={{ stroke: 'var(--kn-ink-soft)' }}
          strokeWidth={1.3}
          strokeDasharray="1 4.5"
          strokeLinecap="round"
        />
      )}
      {bird.status === 'kasher' && <Halo s={s} />}
      <g transform={scale === 1 ? undefined : `scale(${scale})`} opacity={glyphOpacity}>
        <BirdGlyph
          birdStyle={birdStyle}
          tint={shownTint}
          size={s}
          muted={muted}
          x={-s / 2}
          y={-s / 2}
        />
      </g>

      {/* The word label names a labelled bird; the emblem stands in when there is none. */}
      {bird.revealed && !bird.label && (shownTint === 'chatas' || shownTint === 'olah') && (
        <g transform={`translate(${s * 0.36} ${s * 0.3})`}>
          <TintEmblem tint={shownTint} r={emblemR} />
        </g>
      )}

      {/**
       * The "?" ring. Its stroke takes `bird.tint`, which is the true tint only
       * when a case's own `project` deliberately keeps it beneath the "?"; the
       * default projection gives every unknown bird tint `unknown` (see
       * `SceneBird.revealed` in scene.ts).
       */}
      {!bird.revealed && (
        <g transform={`translate(${s * 0.02} ${s * 0.1})`} data-marker="unrevealed">
          <circle
            r={s * 0.2}
            style={{
              fill: 'var(--kn-parchment)',
              stroke: bird.tint === 'unknown' ? 'var(--kn-ink-soft)' : `var(--kn-${bird.tint})`,
            }}
            strokeWidth={bird.tint === 'unknown' ? 1.2 : 2.4}
          />
          <text
            y={s * 0.095}
            textAnchor="middle"
            fontFamily="var(--font-latin)"
            fontWeight={600}
            fontSize={s * 0.3}
            style={{ fill: 'var(--kn-ink)' }}
          >
            ?
          </text>
        </g>
      )}

      {bird.status === 'pasul' && (
        <g data-marker="strike" strokeLinecap="round" pointerEvents="none">
          <line
            x1={-s * 0.42}
            y1={-s * 0.3}
            x2={s * 0.42}
            y2={s * 0.3}
            style={{ stroke: 'var(--kn-parchment)' }}
            strokeWidth={Math.max(5, s * 0.1)}
          />
          <line
            x1={-s * 0.42}
            y1={-s * 0.3}
            x2={s * 0.42}
            y2={s * 0.3}
            style={{ stroke: 'var(--kn-pasul)' }}
            strokeWidth={Math.max(2.2, s * 0.045)}
          />
        </g>
      )}

      {bird.status === 'safek' && (
        <Badge x={s * 0.38} y={-s * 0.36} r={badgeR} fill="var(--kn-safek)" marker="safek">
          <text
            y={badgeR * 0.42}
            textAnchor="middle"
            fontFamily="var(--font-latin)"
            fontWeight={600}
            fontSize={badgeR * 1.35}
            style={{ fill: 'var(--kn-parchment)' }}
          >
            ?
          </text>
        </Badge>
      )}

      {bird.status === 'yamus' && (
        <Badge x={s * 0.38} y={-s * 0.36} r={badgeR} fill="var(--kn-yamus)" marker="hourglass">
          <path
            d={`M${-badgeR * 0.42} ${-badgeR * 0.55}H${badgeR * 0.42}L${-badgeR * 0.42} ${badgeR * 0.55}H${badgeR * 0.42}Z`}
            fill="none"
            style={{ stroke: 'var(--kn-parchment)' }}
            strokeWidth={Math.max(1.1, badgeR * 0.16)}
            strokeLinejoin="round"
          />
        </Badge>
      )}
    </g>
  );
}

/**
 * A revealed chatas or olah bird's label is inked in its offering's colour, so
 * the word and the bird read together; everything else is plain ink.
 */
function labelTone(bird: SceneBird): string {
  return bird.revealed && (bird.tint === 'chatas' || bird.tint === 'olah')
    ? `var(--kn-${bird.tint}-line)`
    : 'var(--kn-ink)';
}

/**
 * Positions a bird; when its slot moves it glides there in a straight line.
 * Each flight runs one progress value (`BIRD_FLIGHT`) from wherever the bird
 * is now to its new slot, and x and y are both read off that line, so the
 * path never curves. A bird redirected mid-flight starts a new flight from
 * the point it has reached, from rest: it never carries on past it. A layout
 * effect, so the old flight stops in the same commit, not a frame later.
 */
function FlyingGroup({
  x,
  y,
  children,
  ...rest
}: { x: number; y: number; children: ReactNode } & Record<`data-${string}`, string>) {
  const mx = useMotionValue(x);
  const my = useMotionValue(y);

  useLayoutEffect(() => {
    const start = { x: mx.get(), y: my.get() };
    if (start.x === x && start.y === y) return;
    const flight = animate(0, 1, {
      ...BIRD_FLIGHT,
      onUpdate: (progress) => {
        mx.set(start.x + (x - start.x) * progress);
        my.set(start.y + (y - start.y) * progress);
      },
    });
    return () => flight.stop();
  }, [x, y, mx, my]);

  return (
    <motion.g style={{ x: mx, y: my }} {...rest}>
      {children}
    </motion.g>
  );
}

/** One bird on the stage: positioned, animated (unless `instant`), labelled and titled. */
export function StageBird({
  bird,
  layout,
  birdStyle,
  instant,
}: {
  bird: SceneBird;
  layout: BirdLayout;
  birdStyle?: BirdStyle;
  instant: boolean;
}) {
  // Only what the observers may know: engine ids stay out of production DOM
  // (see `exposeDebugIds`), and the title describes only the label and status.
  const attrs = {
    ...(exposeDebugIds()
      ? { 'data-bird-id': bird.id, 'data-container-ref': layout.containerId }
      : {}),
    'data-status': bird.status,
    'data-revealed': String(bird.revealed),
    'data-tint': bird.revealed ? bird.tint : 'unknown',
  };
  const body = (
    <>
      <title>{describeBird(bird)}</title>
      <BirdArt bird={bird} size={layout.size} birdStyle={birdStyle} />
      {bird.label && (
        <SvgLabel
          label={bird.label}
          x={0}
          y={layout.size / 2 + (bird.label.he ? TYPE.bird.heSize : TYPE.bird.enSize)}
          metrics={TYPE.bird}
          tone={labelTone(bird)}
          weight={TYPE.bird.weight}
        />
      )}
    </>
  );

  if (instant) {
    return (
      <g transform={`translate(${layout.x} ${layout.y})`} {...attrs}>
        {body}
      </g>
    );
  }
  return (
    <FlyingGroup x={layout.x} y={layout.y} {...attrs}>
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.35 }}
      >
        {body}
      </motion.g>
    </FlyingGroup>
  );
}
