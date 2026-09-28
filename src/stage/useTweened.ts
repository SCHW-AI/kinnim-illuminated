import { animate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

/**
 * Spring used for container frames and the stage height: slightly over-damped
 * (damping ratio 26 / (2 * sqrt(150)) ≈ 1.06), so a box grows or moves without
 * overshoot or wobble.
 */
export const FRAME_SPRING = { type: 'spring', stiffness: 150, damping: 26, mass: 1 } as const;

/**
 * Returns `target`, spring-animated from the previous target whenever it
 * changes. With `instant` it returns `target` unchanged and schedules nothing.
 * Used for shapes whose geometry is drawn from numbers (container boxes, the
 * stage height), where animating the numbers is simpler than morphing paths.
 *
 * `initial`, read only on mount, is where the first animation starts from
 * (e.g. a new box growing out of the boxes it replaces); without it the value
 * starts at `target`.
 */
export function useTweened<T extends Record<string, number>>(
  target: T,
  instant: boolean,
  initial?: T,
): T {
  const key = JSON.stringify(target);
  const [value, setValue] = useState(() => (instant ? target : (initial ?? target)));
  const current = useRef(value);

  useEffect(() => {
    const to = JSON.parse(key) as T;
    const from = current.current;
    if (instant) {
      // Callers remount when `instant` flips, so state never goes stale here.
      current.current = to;
      return;
    }
    const keys = Object.keys(to);
    const start = from as Record<string, number>;
    const end = to as Record<string, number>;
    if (keys.every((k) => start[k] === end[k])) return;
    const controls = animate(0, 1, {
      ...FRAME_SPRING,
      onUpdate: (t) => {
        const next: Record<string, number> = { ...end };
        for (const k of keys) {
          const b = end[k] ?? 0;
          const a = start[k] ?? b;
          next[k] = a + (b - a) * t;
        }
        const nextT = next as T;
        current.current = nextT;
        setValue(nextT);
      },
    });
    return () => controls.stop();
  }, [key, instant]);

  return instant ? target : value;
}
