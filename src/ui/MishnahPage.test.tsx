import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderApp } from './__fixtures__/mishnayos';
import { AUTO_ADVANCE_MS } from './useCasePlayer';

// Keep the real (in-progress) content out of these tests; they use fixtures.
vi.mock('../mishnayos', async () => ({ registry: (await import('../engine')).createRegistry({}) }));

const url = () => screen.getByTestId('location').textContent;
const next = () => screen.getByRole('button', { name: /^Next/ });
const back = () => screen.getByRole('button', { name: 'Back' });
const position = (text: string) => expect(screen.getByText(text)).toBeInTheDocument();
const ruling = () => screen.queryByRole('region', { name: 'Ruling' });

afterEach(() => {
  vi.useRealTimers();
});

describe('mishnah page', () => {
  test('a deep link restores the case, position and view', () => {
    renderApp('/mishnah/1-3/alpha?step=2&view=lenient');
    expect(screen.getByRole('tab', { name: /Alpha case/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    position('Step 2 of 3');
    expect(screen.getByRole('radio', { name: 'Lenient' })).toBeChecked();
    // The CTA and the stage carry each step: there is no narration panel.
    expect(screen.queryByRole('region', { name: 'Narration' })).not.toBeInTheDocument();
  });

  test('invalid step and view values are corrected in the URL', () => {
    renderApp('/mishnah/1-3/alpha?step=99&view=bogus');
    position('Step 3 of 3');
    expect(url()).toBe('/mishnah/1-3/alpha?step=3&view=strict');
  });

  test('Next and Back move the position and update the URL', () => {
    renderApp('/mishnah/1-3/alpha?step=1');
    fireEvent.click(next());
    position('Step 2 of 3');
    expect(url()).toBe('/mishnah/1-3/alpha?step=2');
    fireEvent.click(back());
    position('Step 1 of 3');
    expect(url()).toBe('/mishnah/1-3/alpha?step=1');
  });

  test('a CTA step shows its label and waits for the click', () => {
    vi.useFakeTimers();
    renderApp('/mishnah/1-3/alpha');
    const cta = screen.getByRole('button', { name: /Mix them/ });
    expect(cta).toHaveTextContent('ערבב');
    act(() => vi.advanceTimersByTime(AUTO_ADVANCE_MS * 5));
    position('Start');
    fireEvent.click(cta);
    position('Step 1 of 3');
  });

  test('auto steps play on after forward progression only', () => {
    vi.useFakeTimers();
    renderApp('/mishnah/1-3/alpha?step=1');
    // Deep link: the next step is auto, but nothing plays.
    act(() => vi.advanceTimersByTime(AUTO_ADVANCE_MS * 3));
    position('Step 1 of 3');

    fireEvent.click(back());
    fireEvent.click(screen.getByRole('button', { name: /Mix them/ }));
    position('Step 1 of 3');
    act(() => vi.advanceTimersByTime(AUTO_ADVANCE_MS));
    position('Step 2 of 3');
    act(() => vi.advanceTimersByTime(AUTO_ADVANCE_MS));
    position('Step 3 of 3');

    // Back lands on a position whose next step is auto: it stays put.
    fireEvent.click(back());
    act(() => vi.advanceTimersByTime(AUTO_ADVANCE_MS * 3));
    position('Step 2 of 3');
  });

  test('browser Back then Forward onto a pending auto step does not play it', () => {
    vi.useFakeTimers();
    renderApp('/mishnah/1-3/beta');
    fireEvent.click(screen.getByRole('tab', { name: /Alpha case/ }));
    fireEvent.click(screen.getByRole('button', { name: /Mix them/ }));
    position('Step 1 of 3');

    // Before the auto step plays, go back to the other case, then forward again.
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(url()).toBe('/mishnah/1-3/beta');
    fireEvent.click(screen.getByRole('button', { name: 'Browser forward' }));
    expect(url()).toBe('/mishnah/1-3/alpha?step=1');

    act(() => vi.advanceTimersByTime(AUTO_ADVANCE_MS * 3));
    position('Step 1 of 3');
  });

  test('keyboard: right = next, left = back, End and Home jump; ignored in an input', () => {
    renderApp('/mishnah/1-3/alpha');
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    position('Step 1 of 3');
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    position('Start');
    fireEvent.keyDown(document.body, { key: 'End' });
    position('Step 3 of 3');
    fireEvent.keyDown(document.body, { key: 'Home' });
    position('Start');
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Strict' }), { key: 'ArrowRight' });
    position('Start');
  });

  test('the ruling panel appears only from the position that shows it', () => {
    renderApp('/mishnah/1-3/alpha?step=2');
    expect(ruling()).not.toBeInTheDocument();
    fireEvent.click(next());
    expect(ruling()).toHaveTextContent('Strict verdict');
  });

  test('the view toggle re-derives the ruling', () => {
    renderApp('/mishnah/1-3/alpha?step=3');
    expect(ruling()).toHaveTextContent('Strict verdict');
    fireEvent.click(screen.getByRole('radio', { name: 'Lenient' }));
    expect(ruling()).toHaveTextContent('Lenient verdict');
    expect(url()).toBe('/mishnah/1-3/alpha?step=3&view=lenient');
  });

  test('the case picker switches cases', () => {
    renderApp('/mishnah/1-3/alpha?step=2');
    fireEvent.click(screen.getByRole('tab', { name: 'Beta case' }));
    expect(screen.getByRole('tab', { name: 'Beta case' })).toHaveAttribute('aria-selected', 'true');
    expect(url()).toBe('/mishnah/1-3/beta');
    position('Start');
  });
});

describe('variants', () => {
  const stage = () =>
    screen.getByRole('img', { name: 'Offering stage' }).querySelector('desc')?.textContent;

  test('the variant switch changes the setup and the URL, resets to the start and does not auto-advance', () => {
    vi.useFakeTimers();
    renderApp('/mishnah/1-3/gamma?step=1');
    expect(screen.getByRole('heading', { name: /Gamma case/ })).toBeInTheDocument();
    expect(stage()).toMatch(/^mixture \(mixture, 2 birds\)/);

    fireEvent.click(screen.getByRole('radio', { name: 'Flip' }));
    expect(url()).toBe('/mishnah/1-3/gamma?variant=flip&step=0');
    expect(screen.getByRole('radio', { name: 'Flip' })).toBeChecked();
    // The variant's own title and setup: its first bird is now the עולה.
    expect(screen.getByRole('heading', { name: /Gamma flipped/ })).toBeInTheDocument();
    expect(stage()).toMatch(/^kein \(kein, 1 bird\): עולה: olah/);
    // Its first step is auto, but a switch is not forward progression.
    act(() => vi.advanceTimersByTime(AUTO_ADVANCE_MS * 3));
    position('Start');
  });

  test('an invalid variant is corrected to the first in the URL', () => {
    renderApp('/mishnah/1-3/gamma?variant=bogus&step=1');
    expect(url()).toBe('/mishnah/1-3/gamma?variant=plain&step=1');
    expect(screen.getByRole('radio', { name: 'Plain' })).toBeChecked();
  });
});

describe('explore mode', () => {
  const explore = () => screen.queryByRole('link', { name: /Explore possibilities/ });
  const banner = () => screen.queryByRole('note');
  const crumbs = () => screen.getByRole('navigation', { name: 'Breadcrumb' });
  const outcome = () => screen.queryByRole('region', { name: 'Outcome' });
  const current = () => crumbs().querySelector('[aria-current="page"]');

  test.each([
    ['/mishnah/1-3/gamma?step=0', false],
    ['/mishnah/1-3/gamma?step=1', true],
    ['/mishnah/1-3/gamma?variant=flip&step=1', false],
    ['/mishnah/1-3/alpha?step=3', false],
  ])(
    '%s: the Explore button shows only with the ruling, on a case with possibilities (%s)',
    (path, shown) => {
      renderApp(path);
      expect(explore() !== null).toBe(shown);
    },
  );

  test('choosing a possibility plays it under the banner, with a breadcrumb and its outcome at the end', () => {
    vi.useFakeTimers();
    renderApp('/mishnah/1-3/gamma?step=1');
    fireEvent.click(explore()!);
    expect(url()).toBe('/mishnah/1-3/gamma?explore=');
    expect(banner()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Suppose we keep a' }));
    expect(url()).toBe('/mishnah/1-3/gamma?explore=keep&step=0');
    expect(banner()).toHaveTextContent('נניח/Suppose…');
    expect(within(crumbs()).getByRole('link', { name: 'Ruling' })).toBeInTheDocument();
    expect(current()).toHaveTextContent('Suppose we keep a');
    expect(ruling()).not.toBeInTheDocument();
    position('Start');

    // The same controls: a CTA, then an auto step after forward progression.
    fireEvent.click(screen.getByRole('button', { name: /Take a/ }));
    position('Step 1 of 2');
    expect(outcome()).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(AUTO_ADVANCE_MS));
    position('Step 2 of 2');
    expect(url()).toBe('/mishnah/1-3/gamma?explore=keep&step=2');
    expect(outcome()).toHaveTextContent('Kept outcome');
    expect(
      screen.getByRole('img', { name: 'Offering stage' }).querySelector('desc')?.textContent,
    ).toMatch(/zone \(zone, 1 bird\): חטאת: chatas, kasher/);
  });

  test('a nested possibility, a breadcrumb back up, and Back to the ruling', () => {
    renderApp('/mishnah/1-3/gamma?explore=keep&step=2');
    fireEvent.click(screen.getByRole('link', { name: 'Then swap a' }));
    expect(url()).toBe('/mishnah/1-3/gamma?explore=keep.swap&step=0');
    expect(current()).toHaveTextContent('Then swap a');

    fireEvent.click(within(crumbs()).getByRole('link', { name: 'Suppose we keep a' }));
    expect(url()).toBe('/mishnah/1-3/gamma?explore=keep&step=0');

    fireEvent.click(screen.getByRole('link', { name: /Back to the ruling/ }));
    expect(url()).toBe('/mishnah/1-3/gamma?step=1');
    expect(banner()).not.toBeInTheDocument();
    expect(ruling()).toHaveTextContent('Gamma verdict');
    expect(explore()).toBeInTheDocument();

    // Each was a push: browser Back retraces them.
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(url()).toBe('/mishnah/1-3/gamma?explore=keep&step=0');
  });

  test('a deep link into an explore path restores the possibility and position', () => {
    renderApp('/mishnah/1-3/gamma?explore=keep.swap&step=1');
    expect(banner()).toBeInTheDocument();
    expect(current()).toHaveTextContent('Then swap a');
    position('Step 1 of 1');
    expect(outcome()).toHaveTextContent('Swapped outcome');
  });

  test.each([
    ['/mishnah/1-3/gamma?explore=keep.nope&step=1', '/mishnah/1-3/gamma?step=1'],
    ['/mishnah/1-3/gamma?variant=flip&explore=keep', '/mishnah/1-3/gamma?variant=flip&step=1'],
    ['/mishnah/1-3/alpha?explore=&view=lenient', '/mishnah/1-3/alpha?step=3&view=lenient'],
  ])('a stale explore path %s is corrected to the main line at its ruling', (path, corrected) => {
    renderApp(path);
    expect(url()).toBe(corrected);
    expect(banner()).not.toBeInTheDocument();
    expect(ruling()).toBeInTheDocument();
  });
});
