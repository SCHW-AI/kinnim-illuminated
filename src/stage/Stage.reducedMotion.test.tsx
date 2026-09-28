import { act, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { layoutScene } from './layout';
import type { Scene } from './scene';
import { Stage } from './Stage';

// A controllable `prefers-reduced-motion` media query. Both listener APIs feed
// one set, so every consumer (ours or Motion's) hears a change.
let reduced = true;
const listeners = new Set<() => void>();
window.matchMedia = ((query: string) => ({
  get matches() {
    return query.includes('reduced-motion') && reduced;
  },
  media: query,
  onchange: null,
  addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
  removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  addListener: (listener: () => void) => listeners.add(listener),
  removeListener: (listener: () => void) => listeners.delete(listener),
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

/** Sets the reader's preference and dispatches the media query's change event. */
function setReducedMotion(next: boolean) {
  reduced = next;
  act(() => listeners.forEach((listener) => listener()));
}

afterEach(() => vi.restoreAllMocks());

const before: Scene = {
  containers: [
    { id: 'a', kind: 'kein', birdIds: ['x', 'y'] },
    { id: 'b', kind: 'zone', birdIds: [] },
  ],
  birds: [
    { id: 'x', containerId: 'a', tint: 'chatas', revealed: true, status: 'alive' },
    { id: 'y', containerId: 'a', tint: 'olah', revealed: true, status: 'alive' },
  ],
};

const after: Scene = {
  containers: [
    { id: 'a', kind: 'kein', birdIds: ['y'] },
    { id: 'b', kind: 'zone', birdIds: ['x'] },
  ],
  birds: [
    { id: 'x', containerId: 'b', tint: 'unknown', revealed: false, status: 'alive' },
    { id: 'y', containerId: 'a', tint: 'olah', revealed: true, status: 'alive' },
  ],
};

test('with reduced motion a moved bird and its containers jump straight to their new places', () => {
  setReducedMotion(true);
  const { container, rerender } = render(<Stage scene={before} width={700} />);
  const raf = vi.spyOn(window, 'requestAnimationFrame');

  rerender(<Stage scene={after} width={700} />);

  const target = layoutScene(after, { width: 700 });
  const x = target.birds.find((b) => b.id === 'x')!;
  const zone = target.containers.find((c) => c.id === 'b')!;
  const bird = container.querySelector('[data-bird-id="x"]')!;
  expect(bird.getAttribute('transform')).toBe(`translate(${x.x} ${x.y})`);
  expect(container.querySelector('[data-container-id="b"]')!.getAttribute('transform')).toBe(
    `translate(${Math.round(zone.rect.x * 10) / 10} ${Math.round(zone.rect.y * 10) / 10})`,
  );
  expect(raf).not.toHaveBeenCalled();
});

test('turning reduced motion on after mount makes the next scene change instant', () => {
  setReducedMotion(false);
  const { container, rerender } = render(<Stage scene={before} width={700} />);
  setReducedMotion(true);
  const raf = vi.spyOn(window, 'requestAnimationFrame');

  rerender(<Stage scene={after} width={700} />);

  const x = layoutScene(after, { width: 700 }).birds.find((b) => b.id === 'x')!;
  expect(container.querySelector('[data-bird-id="x"]')!.getAttribute('transform')).toBe(
    `translate(${x.x} ${x.y})`,
  );
  expect(raf).not.toHaveBeenCalled();
});
