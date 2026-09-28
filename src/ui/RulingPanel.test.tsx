import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { RulingPanel } from './RulingPanel';

test('count chips show only the number and the Hebrew status, for every status', () => {
  render(
    <RulingPanel
      ruling={{
        verdict: 'All of them',
        birds: {},
        counts: { kasher: 1, pasul: 2, safek: 3, yamus: 4, alive: 5 },
      }}
    />,
  );
  const chips = within(screen.getByRole('list', { name: 'Counts' })).getAllByRole('listitem');
  expect(chips.map((chip) => chip.textContent)).toEqual([
    '1 כשר',
    '2 פסול',
    '3 ספק',
    '4 ימות',
    '5 חי',
  ]);
  for (const chip of chips) {
    expect(chip.textContent).not.toMatch(/[a-z]/i);
    expect(within(chip).getByText(/^[֐-׿]+$/)).toHaveAttribute('lang', 'he');
  }
});
