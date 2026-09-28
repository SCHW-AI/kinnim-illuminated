import { act, render } from '@testing-library/react';
import { afterAll, expect, test, vi } from 'vitest';

// Motion reads the frame clock when it loads, so fake it before the imports.
vi.hoisted(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
});
afterAll(() => vi.useRealTimers());

import { layoutScene } from './layout';
import type { Scene, SceneBird } from './scene';
import { Stage } from './Stage';

const bird = (id: string, containerId: string): SceneBird => ({
  id,
  containerId,
  tint: 'chatas',
  revealed: true,
  status: 'alive',
});

// Bird `x` starts on the second row of a kein and is sent to a zone beside it,
// so its flight changes both x and y.
const home: Scene = {
  containers: [
    { id: 'kein', kind: 'kein', birdIds: ['p', 'q', 'r', 'x'] },
    { id: 'zone', kind: 'zone', birdIds: [] },
  ],
  birds: [bird('p', 'kein'), bird('q', 'kein'), bird('r', 'kein'), bird('x', 'kein')],
};
const away: Scene = {
  containers: [
    { id: 'kein', kind: 'kein', birdIds: ['p', 'q', 'r'] },
    { id: 'zone', kind: 'zone', birdIds: ['x'] },
  ],
  birds: [bird('p', 'kein'), bird('q', 'kein'), bird('r', 'kein'), bird('x', 'zone')],
};

const WIDTH = 700;
type Point = { x: number; y: number };

function position(container: HTMLElement): Point {
  const transform = (container.querySelector('[data-bird-id="x"]') as SVGElement).style.transform;
  const x = /translateX\((-?[\d.]+)px\)/.exec(transform)?.[1];
  const y = /translateY\((-?[\d.]+)px\)/.exec(transform)?.[1];
  return { x: Number(x ?? 0), y: Number(y ?? 0) };
}

const frame = () => act(() => vi.advanceTimersByTimeAsync(16));

/** Whether `p` lies strictly between `a` and `b` on every axis on which they differ. */
function strictlyBetween(p: Point, a: Point, b: Point): boolean {
  return (['x', 'y'] as const).every(
    (axis) =>
      a[axis] === b[axis] ||
      (Math.min(a[axis], b[axis]) < p[axis] && p[axis] < Math.max(a[axis], b[axis])),
  );
}

test('a bird redirected mid-flight flies straight to its new slot from where it is, never away from it', async () => {
  const target = layoutScene(home, { width: WIDTH }).birds.find((b) => b.id === 'x')!;
  const away_ = layoutScene(away, { width: WIDTH }).birds.find((b) => b.id === 'x')!;
  expect(away_.x).not.toBe(target.x);
  expect(away_.y).not.toBe(target.y);

  const { container, rerender } = render(<Stage scene={home} width={WIDTH} />);
  rerender(<Stage scene={away} width={WIDTH} />);
  const outbound: Point[] = [];
  for (let t = 0; t < 150; t += 16) {
    await frame();
    outbound.push(position(container));
  }
  // The bird is really flying out, not jumping: some sample lies strictly
  // between its home slot and the first target.
  expect(
    outbound.some((p) => strictlyBetween(p, target, away_)),
    `outbound ${JSON.stringify(outbound)}`,
  ).toBe(true);
  // Back, mid-flight.
  rerender(<Stage scene={home} width={WIDTH} />);
  const start = position(container);
  expect(start).not.toEqual({ x: target.x, y: target.y });

  const samples = [start];
  for (let t = 0; t < 1000; t += 16) {
    await frame();
    samples.push(position(container));
  }

  const toward = (axis: 'x' | 'y') => Math.sign(target[axis] - start[axis]);
  const span = Math.hypot(target.x - start.x, target.y - start.y);
  samples.forEach((p, i) => {
    const context = `sample ${i}: (${p.x}, ${p.y})`;
    // Distance from the straight line start -> target.
    const offLine =
      Math.abs((p.x - start.x) * (target.y - start.y) - (p.y - start.y) * (target.x - start.x)) /
      span;
    expect(offLine, context).toBeLessThan(0.5);
    if (i === 0) return;
    const prev = samples[i - 1]!;
    for (const axis of ['x', 'y'] as const)
      expect((p[axis] - prev[axis]) * toward(axis), `${context} ${axis}`).toBeGreaterThanOrEqual(
        -1e-6,
      );
  });
  // The return is a flight too: some sample lies strictly between the redirect point and the target.
  expect(
    samples.some((p) => strictlyBetween(p, start, target)),
    'a return sample strictly between the redirect point and the target',
  ).toBe(true);
  expect(samples.at(-1)).toEqual({ x: target.x, y: target.y });
});
