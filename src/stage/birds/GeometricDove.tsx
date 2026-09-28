import { GlyphSvg } from './GlyphSvg';
import { birdColors, type BirdGlyphProps } from './tint';

/** Mirrors the mark to face left and centres it in the box. */
const FACE_LEFT = 'matrix(-1 0 0 1 95 0)';

/**
 * (c) Minimal geometric mark: a lens-shaped body, a circular head, a wedge
 * tail and a crescent wing — compass-and-rule primitives that stay crisp at
 * the smallest sizes.
 */
export function GeometricDove(props: BirdGlyphProps) {
  const { tint, muted } = props;
  const c = birdColors(tint, muted);
  // Tail and wing are shades of the body, so the mark reads the same in both themes.
  const tail = `color-mix(in oklab, ${c.body} 72%, black)`;
  const wing = `color-mix(in oklab, ${c.body} 45%, white)`;
  const gold = muted ? 'color-mix(in oklab, var(--kn-gold) 40%, var(--kn-ash))' : 'var(--kn-gold)';
  return (
    <GlyphSvg {...props} style="geometric">
      <g transform={FACE_LEFT}>
        <g transform="rotate(-14 48 52)">
          <path d="M28 48L2 44L9 60Z" style={{ fill: tail }} />
          <path d="M16 52A36 36 0 0 0 80 52A72 72 0 0 0 16 52Z" style={{ fill: c.body }} />
          <path d="M24 53A26 26 0 0 0 66 57A46 46 0 0 1 24 53Z" style={{ fill: wing }} />
        </g>
        <circle cx="70" cy="34.5" r="10.5" style={{ fill: c.body }} />
        <path d="M79.2 30.6L90 34.6L79.2 38.6Z" style={{ fill: gold }} />
        <circle cx="72.8" cy="32" r="2.7" style={{ fill: 'var(--kn-parchment)' }} />
        <circle cx="73.5" cy="32" r="1.4" style={{ fill: tail }} />
      </g>
    </GlyphSvg>
  );
}
