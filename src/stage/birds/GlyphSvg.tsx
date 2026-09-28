import type { ReactNode } from 'react';
import type { BirdGlyphProps } from './tint';

/** The square <svg> frame every bird glyph draws into (viewBox 0 0 100 100). */
export function GlyphSvg({
  size,
  x,
  y,
  title,
  className,
  style,
  children,
}: Pick<BirdGlyphProps, 'size' | 'x' | 'y' | 'title' | 'className'> & {
  style: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      x={x}
      y={y}
      viewBox="0 0 100 100"
      overflow="visible"
      className={className}
      data-bird-style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {children}
    </svg>
  );
}
