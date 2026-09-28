import type { SceneBird } from '../scene';

/** The tint a bird is drawn in (the Scene's `tint`). */
export type BirdTint = SceneBird['tint'];

/** The three colours a glyph paints with. */
export interface BirdColors {
  /** Main body colour. */
  body: string;
  /** Pale fill (wash) used by line-art styles. */
  wash: string;
  /** Outline / detail colour. */
  line: string;
}

/**
 * CSS colour values for a tint, read from the theme tokens. `muted` blends
 * the colours toward ash (used for pasul / yamus birds) while keeping a trace
 * of the hue so the bird is still recognisable.
 */
export function birdColors(tint: BirdTint, muted = false): BirdColors {
  const base: BirdColors = {
    body: `var(--kn-${tint})`,
    wash: `var(--kn-${tint}-wash)`,
    line: `var(--kn-${tint}-line)`,
  };
  if (!muted) return base;
  const mix = (c: string, pct: number) => `color-mix(in oklab, ${c} ${pct}%, var(--kn-ash))`;
  return { body: mix(base.body, 30), wash: mix(base.wash, 40), line: mix(base.line, 45) };
}

/** Props shared by every bird glyph. */
export interface BirdGlyphProps {
  /** Which colour to draw the bird in. */
  tint: BirdTint;
  /** Rendered width and height in px (the glyph is square). */
  size: number;
  /** Blend the colours toward ash. */
  muted?: boolean;
  /** Position when nested inside another <svg>. */
  x?: number;
  y?: number;
  /** Accessible name; without it the glyph is decorative (aria-hidden). */
  title?: string;
  className?: string;
}

/** Converts a desired on-screen stroke width (px) to glyph units (viewBox 100). */
export function strokeUnits(px: number, size: number, min: number): number {
  return Math.max(min, (px * 100) / Math.max(size, 1));
}
