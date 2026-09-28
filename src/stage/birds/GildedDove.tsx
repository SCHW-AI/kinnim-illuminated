import { useId } from 'react';
import {
  DOVE_BEAK,
  DOVE_BODY,
  DOVE_EYE,
  DOVE_FACE_LEFT,
  DOVE_FEATHERS,
  DOVE_WING,
} from './dovePaths';
import { GlyphSvg } from './GlyphSvg';
import { birdColors, strokeUnits, type BirdGlyphProps } from './tint';

/**
 * (b) Gilded silhouette: a solid body in the tint, a burnished gold-leaf wing
 * and a hairline of gold around the whole figure, like a painted miniature.
 */
export function GildedDove(props: BirdGlyphProps) {
  const { tint, size, muted } = props;
  const c = birdColors(tint, muted);
  const gradId = `kn-gild-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const edge = strokeUnits(0.9, size, 1.4);
  const fine = strokeUnits(0.7, size, 1.1);
  const gold = muted
    ? {
        a: 'color-mix(in oklab, var(--kn-gold-bright) 40%, var(--kn-ash))',
        b: 'color-mix(in oklab, var(--kn-gold) 40%, var(--kn-ash))',
        c: 'color-mix(in oklab, var(--kn-gold-deep) 40%, var(--kn-ash))',
      }
    : { a: 'var(--kn-gold-bright)', b: 'var(--kn-gold)', c: 'var(--kn-gold-deep)' };
  return (
    <GlyphSvg {...props} style="gilded">
      <defs>
        <linearGradient id={gradId} x1="0.2" y1="0" x2="0.75" y2="1">
          <stop offset="0" style={{ stopColor: gold.a }} />
          <stop offset="0.45" style={{ stopColor: gold.b }} />
          <stop offset="0.7" style={{ stopColor: gold.a }} />
          <stop offset="1" style={{ stopColor: gold.c }} />
        </linearGradient>
      </defs>
      <g transform={DOVE_FACE_LEFT} strokeLinecap="round" strokeLinejoin="round">
        <path d={DOVE_BODY} style={{ fill: c.body, stroke: gold.c }} strokeWidth={edge} />
        <path
          d="M66.8 24.6C68.8 22 72.2 21.1 75.6 21.9"
          fill="none"
          style={{ stroke: gold.a }}
          strokeWidth={fine}
          opacity={0.9}
        />
        <path
          d={DOVE_WING}
          fill={`url(#${gradId})`}
          style={{ stroke: gold.c }}
          strokeWidth={edge}
        />
        {size >= 40 &&
          DOVE_FEATHERS.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              style={{ stroke: gold.c }}
              strokeWidth={fine}
              opacity={0.7}
            />
          ))}
        <path d={DOVE_BEAK} style={{ fill: gold.b, stroke: gold.c }} strokeWidth={fine} />
        <circle
          cx={DOVE_EYE.cx}
          cy={DOVE_EYE.cy}
          r={2.9}
          style={{ fill: 'var(--kn-parchment)', stroke: gold.c }}
          strokeWidth={fine * 0.8}
        />
        <circle cx={DOVE_EYE.cx + 0.3} cy={DOVE_EYE.cy} r={1.5} style={{ fill: 'var(--kn-ink)' }} />
      </g>
    </GlyphSvg>
  );
}
