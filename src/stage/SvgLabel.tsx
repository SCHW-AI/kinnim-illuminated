import { splitHebrewRuns } from '../lib/hebrew';
import { EN_TRACKING, LABEL_HALO } from './layout';
import type { RichLabel } from './scene';

interface Metrics {
  heSize: number;
  enSize: number;
  heLine: number;
}

/**
 * A RichLabel as SVG text: Hebrew on the first line (right-to-left, Hadasim
 * CLM), English beneath it (EB Garamond). Centred on `x`; `y` is the first
 * baseline. A parchment halo keeps the text legible over artwork.
 *
 * The English line always has a left-to-right base, even when it starts with a
 * Hebrew word; each Hebrew run in it is an isolated `lang="he"` tspan (its
 * letters are strongly right-to-left, so the run reads right-to-left). The
 * tspan sets no `direction`: Chrome mis-positions an rtl tspan in ltr text.
 */
export function SvgLabel({
  label,
  x,
  y,
  metrics,
  tone = 'var(--kn-ink)',
  weight = 400,
}: {
  label: RichLabel;
  x: number;
  y: number;
  metrics: Metrics;
  tone?: string;
  weight?: number;
}) {
  const halo = {
    stroke: 'var(--kn-parchment)',
    strokeWidth: LABEL_HALO,
    strokeLinejoin: 'round' as const,
    paintOrder: 'stroke' as const,
  };
  const enY = label.he ? y + metrics.heLine - (metrics.heSize - metrics.enSize) * 0.2 : y;
  return (
    <g textAnchor="middle" pointerEvents="none">
      {label.he && (
        <text
          x={x}
          y={y}
          lang="he"
          direction="rtl"
          unicodeBidi="embed"
          fontFamily="var(--font-hebrew)"
          fontSize={metrics.heSize}
          fontWeight={weight}
          style={{ fill: tone, ...halo }}
        >
          {label.he}
        </text>
      )}
      {label.en && (
        <text
          x={x}
          y={enY}
          lang="en"
          direction="ltr"
          unicodeBidi="embed"
          fontFamily="var(--font-latin)"
          fontSize={metrics.enSize}
          fontStyle="italic"
          letterSpacing={`${EN_TRACKING}em`}
          style={{ fill: label.he ? 'var(--kn-ink-soft)' : tone, ...halo }}
        >
          {splitHebrewRuns(label.en).map((part) =>
            part.hebrew ? (
              <tspan key={part.start} lang="he" unicodeBidi="isolate">
                {part.text}
              </tspan>
            ) : (
              part.text
            ),
          )}
        </text>
      )}
    </g>
  );
}
