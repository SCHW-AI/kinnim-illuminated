import { screen, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { getMishnahText } from './content';
import { renderApp } from './ui/__fixtures__/mishnayos';

// Keep the real (in-progress) content out of these tests; they use fixtures.
vi.mock('./mishnayos', async () => ({ registry: (await import('./engine')).createRegistry({}) }));

test('the navigator lists all 15 mishnayos and marks the illustrated ones', () => {
  renderApp('/');
  const nav = screen.getByRole('navigation', { name: 'Mishnayos of Kinnim' });
  const links = within(nav).getAllByRole('link');
  expect(links).toHaveLength(15);
  const illustrated = links.filter((link) => link.textContent.includes('Illustrated'));
  expect(illustrated.map((link) => link.getAttribute('href'))).toEqual(['/mishnah/1-3']);
  expect(within(nav).getAllByText('not yet illustrated')).toHaveLength(14);
});

test('a mishnah not in the registry shows its Hebrew text and a "not yet illustrated" note', () => {
  renderApp('/mishnah/2-1');
  const text = screen.getByRole('region', { name: 'Text of Kinnim 2:1' });
  const he = getMishnahText('2-1')?.he;
  const hebrew = within(text).getByText(
    (_, el) => el?.getAttribute('lang') === 'he' && el.textContent === he,
  );
  expect(hebrew).toHaveAttribute('dir', 'rtl');
  expect(screen.getByRole('heading', { name: 'Not yet illustrated' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Next/ })).not.toBeInTheDocument();
});

test.each(['/mishnah/9-9', '/mishnah/banana', '/mishnah/1-3/no-such-case', '/mishnah/2-1/a-case'])(
  '%s shows the not-found page',
  (path) => {
    renderApp(path);
    expect(
      screen.getByRole('heading', { name: 'This page is not in the book' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to all mishnayos' })).toHaveAttribute(
      'href',
      '/',
    );
  },
);
