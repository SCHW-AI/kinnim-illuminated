import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { RichText } from './RichText';

test('renders headings, lists and labels, marking Hebrew runs lang="he"', () => {
  render(
    <RichText
      value={[
        { type: 'heading', text: 'Why 1 חטאת can be brought:' },
        { type: 'list', items: ['חטאת ועולה', 'An olah'] },
        { type: 'paragraph', text: { en: 'Olah', he: 'עולה' } },
      ]}
    />,
  );
  const heading = screen.getByRole('heading', { name: 'Why 1 חטאת can be brought:' });
  expect(within(heading).getByText('חטאת')).toHaveAttribute('lang', 'he');

  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(2);
  expect(items[0]).toHaveAttribute('lang', 'he');
  expect(items[1]).not.toHaveAttribute('lang');

  expect(screen.getByText('עולה')).toHaveAttribute('lang', 'he');
});

test('an English string that starts with Hebrew keeps a left-to-right base', () => {
  const { container } = render(
    <RichText
      value={[
        { type: 'paragraph', text: 'קן סתומה + One חטאת' },
        { type: 'paragraph', text: { en: 'קן סתומה + One עולה' } },
      ]}
    />,
  );
  const paragraphs = [...container.querySelectorAll('p')];
  expect(paragraphs).toHaveLength(2);
  for (const [i, p] of paragraphs.entries()) {
    const he = i === 0 ? 'חטאת' : 'עולה';
    expect(p).toHaveAttribute('dir', 'ltr');
    expect(p).not.toHaveAttribute('lang');
    for (const run of [within(p).getByText('קן סתומה'), within(p).getByText(he)]) {
      expect(run).toHaveAttribute('lang', 'he');
      expect(run).toHaveAttribute('dir', 'rtl');
      // The nearest ancestor that sets a direction is left-to-right.
      expect(run.parentElement?.closest('[dir]')).toHaveAttribute('dir', 'ltr');
    }
  }
});
