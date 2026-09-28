import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { BirdStatus, Scene, SceneBird } from './scene';
import { Stage } from './Stage';

function birdEl(container: HTMLElement, id: string): Element {
  const el = container.querySelector(`[data-bird-id="${id}"]`);
  if (!el) throw new Error(`bird ${id} not rendered`);
  return el;
}

function oneBird(bird: Partial<SceneBird>): Scene {
  return {
    containers: [{ id: 'z', kind: 'zone', birdIds: ['b'] }],
    birds: [
      { id: 'b', containerId: 'z', tint: 'chatas', revealed: true, status: 'alive', ...bird },
    ],
  };
}

describe('Stage', () => {
  test('renders exactly the containers and birds in the Scene, named by its caption; a loose container draws only its birds', () => {
    const scene: Scene = {
      caption: { en: 'Two keinim and a mixture', he: 'שתי קינים' },
      containers: [
        { id: 'k1', kind: 'kein', birdIds: ['a', 'b'], label: { he: 'קן א׳' } },
        { id: 'k2', kind: 'kein', birdIds: ['c', 'd'] },
        { id: 'm', kind: 'mixture', birdIds: ['e', 'f', 'g'] },
        { id: 'l', kind: 'loose', birdIds: ['h'], label: { he: 'לבד' } },
      ],
      birds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id, i) => ({
        id,
        containerId: i < 2 ? 'k1' : i < 4 ? 'k2' : i < 7 ? 'm' : 'l',
        tint: i % 2 ? 'olah' : 'chatas',
        revealed: true,
        status: 'alive',
      })),
    };
    const { container } = render(<Stage scene={scene} width={800} />);

    const svg = screen.getByRole('img', { name: 'Two keinim and a mixture / שתי קינים' });
    const containerIds = [...svg.querySelectorAll('[data-container-id]')].map((e) =>
      e.getAttribute('data-container-id'),
    );
    const birdIds = [...svg.querySelectorAll('[data-bird-id]')].map((e) =>
      e.getAttribute('data-bird-id'),
    );
    expect(containerIds).toEqual(['k1', 'k2', 'm', 'l']);
    expect(birdIds.sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(birdEl(container, 'e').getAttribute('data-container-ref')).toBe('m');
    expect(birdEl(container, 'h').getAttribute('data-container-ref')).toBe('l');
    // The loose container has no outline and no caption; a box does have an outline.
    const loose = svg.querySelector('[data-container-id="l"]')!;
    expect(loose.querySelector('rect')).toBeNull();
    expect(loose.textContent).toBe('');
    expect(screen.queryByText('לבד')).toBeNull();
    expect(svg.querySelector('[data-container-id="k2"] rect')).not.toBeNull();

    const label = screen.getByText('קן א׳');
    expect(label).toHaveAttribute('direction', 'rtl');
    expect(label).toHaveAttribute('lang', 'he');
  });

  test.each<[BirdStatus, string, string | null]>([
    ['alive', 'alive', null],
    ['kasher', 'kasher', 'halo'],
    ['pasul', 'pasul', 'strike'],
    ['safek', 'safek', 'safek'],
    ['yamus', 'yamus', 'hourglass'],
  ])('status %s is described and marked', (status, word, marker) => {
    const { container } = render(<Stage scene={oneBird({ status, label: { en: 'Bird A' } })} />);
    const el = birdEl(container, 'b');
    expect(el).toHaveAttribute('data-status', status);
    expect(el.querySelector('title')?.textContent).toMatch(new RegExp(`^Bird A: chatas, ${word}`));
    const markers = [...el.querySelectorAll('[data-marker]')].map((m) =>
      m.getAttribute('data-marker'),
    );
    const statusMarkers = markers.filter((m) =>
      ['halo', 'strike', 'safek', 'hourglass'].includes(m ?? ''),
    );
    expect(statusMarkers).toEqual(marker ? [marker] : []);
  });

  test('an unrevealed bird shows "?" and no emblem; data-tint and title say unknown even if the Scene keeps its true tint', () => {
    const { container } = render(
      <Stage
        scene={{
          containers: [{ id: 'm', kind: 'mixture', birdIds: ['hidden', 'known'] }],
          birds: [
            { id: 'hidden', containerId: 'm', tint: 'chatas', revealed: false, status: 'alive' },
            { id: 'known', containerId: 'm', tint: 'chatas', revealed: true, status: 'alive' },
          ],
        }}
      />,
    );
    const hidden = birdEl(container, 'hidden');
    const known = birdEl(container, 'known');

    expect(hidden).toHaveAttribute('data-revealed', 'false');
    expect(hidden).toHaveAttribute('data-tint', 'unknown');
    expect(hidden.textContent).toContain('?');
    expect(hidden.textContent).not.toContain('ח');
    expect(hidden.querySelector('title')?.textContent).toContain('identity unknown');

    expect(known).toHaveAttribute('data-tint', 'chatas');
    expect(known.textContent).not.toContain('?');
    expect(known.textContent).toContain('ח');
  });

  describe('outside development', () => {
    afterEach(() => vi.unstubAllEnvs());

    test("an unrevealed bird's DOM carries no engine id or designation", () => {
      vi.stubEnv('DEV', false);
      const { container } = render(
        <Stage
          scene={{
            containers: [{ id: 'chatas-pile', kind: 'mixture', birdIds: ['chatas-1', 'olah-1'] }],
            birds: [
              {
                id: 'chatas-1',
                containerId: 'chatas-pile',
                tint: 'unknown',
                revealed: false,
                status: 'safek',
              },
              {
                id: 'olah-1',
                containerId: 'chatas-pile',
                tint: 'unknown',
                revealed: false,
                status: 'safek',
              },
            ],
          }}
        />,
      );

      const birds = [...container.querySelectorAll('[data-revealed="false"]')];
      expect(birds).toHaveLength(2);
      for (const bird of birds) {
        expect(bird.outerHTML).not.toMatch(/chatas|olah/i);
        expect(bird.querySelector('title')?.textContent).toBe(
          'identity unknown (?), safek (in doubt)',
        );
      }
      expect(container.innerHTML).not.toMatch(/chatas-1|olah-1|chatas-pile/);
    });
  });
});
