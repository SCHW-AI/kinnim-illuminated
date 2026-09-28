import {
  DOVE_BEAK,
  DOVE_BODY,
  DOVE_FACE_LEFT,
  DOVE_EYE,
  DOVE_FEATHERS,
  DOVE_LEGS,
  DOVE_WING,
} from './dovePaths';
import { GlyphSvg } from './GlyphSvg';
import { birdColors, strokeUnits, type BirdGlyphProps } from './tint';

/**
 * (a) Manuscript line-art dove: an inked outline over a pale wash, the wing
 * laid in with the full tint, fine feather hatching and drawn legs, like a
 * marginal drawing in a codex.
 */
export function ManuscriptDove(props: BirdGlyphProps) {
  const { tint, size, muted } = props;
  const c = birdColors(tint, muted);
  const outline = strokeUnits(1.2, size, 2.1);
  const fine = strokeUnits(0.8, size, 1.3);
  return (
    <GlyphSvg {...props} style="manuscript">
      <g transform={DOVE_FACE_LEFT} strokeLinecap="round" strokeLinejoin="round">
        <path d={DOVE_LEGS} fill="none" style={{ stroke: c.line }} strokeWidth={outline * 0.9} />
        <path d={DOVE_BODY} style={{ fill: c.wash, stroke: c.line }} strokeWidth={outline} />
        <path d={DOVE_WING} style={{ fill: c.body, stroke: c.line }} strokeWidth={outline * 0.9} />
        {size >= 40 &&
          DOVE_FEATHERS.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              style={{ stroke: c.wash }}
              strokeWidth={fine}
              opacity={0.85}
            />
          ))}
        <path d={DOVE_BEAK} style={{ fill: c.line, stroke: c.line }} strokeWidth={fine * 0.8} />
        <circle cx={DOVE_EYE.cx} cy={DOVE_EYE.cy} r={2.1} style={{ fill: c.line }} />
      </g>
    </GlyphSvg>
  );
}
