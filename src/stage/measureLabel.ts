import { EN_TRACKING, LABEL_HALO, type MeasureLabel } from './layout';

/**
 * A `MeasureLabel` from the browser's own text metrics: canvas `measureText`
 * in the fonts `SvgLabel` draws with (the page's `--font-hebrew` and
 * `--font-latin` stacks), cached per font and text. It adds the English
 * line's tracking, the ink's overhang past its advance (at the worse end, on
 * both sides, since the line is centred) and the halo.
 *
 * Undefined where there is no canvas text measurement (jsdom, SSR); the layout
 * then uses its conservative default. Create a new one once web fonts finish
 * loading: a measurement taken before they load is of a fallback font.
 */
export function createCanvasMeasurer(): MeasureLabel | undefined {
  if (typeof OffscreenCanvas === 'undefined' || typeof document === 'undefined') return undefined;
  const ctx = new OffscreenCanvas(1, 1).getContext('2d');
  if (!ctx) return undefined;
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  const root = getComputedStyle(document.documentElement);
  const family = {
    he: root.getPropertyValue('--font-hebrew').trim() || 'serif',
    en: root.getPropertyValue('--font-latin').trim() || 'serif',
  };
  const cache = new Map<string, number>();
  return ({ text, lang, size, weight }) => {
    const font = `${lang === 'en' ? 'italic ' : ''}${weight} ${size}px ${family[lang]}`;
    const key = `${font}\n${text}`;
    let width = cache.get(key);
    if (width === undefined) {
      ctx.font = font;
      const m = ctx.measureText(text);
      const tracking = lang === 'en' ? [...text].length * EN_TRACKING * size : 0;
      const overhang = Math.max(0, m.actualBoundingBoxLeft, m.actualBoundingBoxRight - m.width);
      width = m.width + tracking + 2 * overhang + LABEL_HALO;
      cache.set(key, width);
    }
    return width;
  };
}
