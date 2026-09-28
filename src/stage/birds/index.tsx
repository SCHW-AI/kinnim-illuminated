import type { ComponentType } from 'react';
import { GeometricDove } from './GeometricDove';
import { GildedDove } from './GildedDove';
import { ManuscriptDove } from './ManuscriptDove';
import type { BirdGlyphProps } from './tint';

/** The candidate bird artworks. */
export type BirdStyle = 'gilded' | 'manuscript' | 'geometric';

/** Every bird style, keyed by name. */
export const BIRD_STYLES: Record<BirdStyle, ComponentType<BirdGlyphProps>> = {
  gilded: GildedDove,
  manuscript: ManuscriptDove,
  geometric: GeometricDove,
};

/** Human-readable name for each style (playground). */
export const BIRD_STYLE_NAMES: Record<BirdStyle, string> = {
  gilded: 'Gilded silhouette',
  manuscript: 'Manuscript line-art',
  geometric: 'Geometric mark',
};

/**
 * The default bird style, used by the Stage unless a `birdStyle` prop says
 * otherwise. Change this one constant to switch the whole app.
 */
export const BIRD_STYLE: BirdStyle = 'manuscript';

/** Draws a bird in the given style (default `BIRD_STYLE`). */
export function BirdGlyph({
  birdStyle = BIRD_STYLE,
  ...props
}: BirdGlyphProps & { birdStyle?: BirdStyle }) {
  const Glyph = BIRD_STYLES[birdStyle];
  return <Glyph {...props} />;
}

export { GeometricDove, GildedDove, ManuscriptDove };
export { birdColors } from './tint';
export type { BirdColors, BirdGlyphProps, BirdTint } from './tint';
