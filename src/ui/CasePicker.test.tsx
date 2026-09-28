import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import type { CaseDef } from '../engine';
import { CasePicker } from './CasePicker';

test('a case title in `en` that starts with Hebrew gets a left-to-right base', () => {
  const cases = [
    { id: 'a', title: { en: 'One חטאת and One עולה' } },
    { id: 'c', title: { en: 'קן סתומה + One חטאת' } },
  ] as unknown as CaseDef[];
  render(<CasePicker cases={cases} value="a" onChange={() => {}} panelId="p" />);

  const tab = screen.getByRole('tab', { name: /One חטאת$/ });
  const kein = within(tab).getByText('קן סתומה');
  const chatas = within(tab).getByText('חטאת');
  for (const run of [kein, chatas]) {
    expect(run).toHaveAttribute('lang', 'he');
    expect(run).toHaveAttribute('dir', 'rtl');
  }
  // Both Hebrew runs sit in one left-to-right isolate, with the English between them.
  const base = kein.parentElement?.closest('[dir]');
  expect(base).toHaveAttribute('dir', 'ltr');
  expect(base).toBe(chatas.parentElement?.closest('[dir]'));
  expect(base?.textContent).toBe('קן סתומה + One חטאת');
  expect(tab.querySelector('[dir="auto"], [dir="rtl"]:not([lang="he"])')).toBeNull();
});
