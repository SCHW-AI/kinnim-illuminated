import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { SvgLabel } from './SvgLabel';

test('an English label that starts with Hebrew keeps a left-to-right base', () => {
  const { container } = render(
    <svg>
      <SvgLabel
        label={{ en: 'קן סתומה + One חטאת' }}
        x={0}
        y={0}
        metrics={{ heSize: 16, enSize: 12, heLine: 18 }}
      />
    </svg>,
  );
  const text = container.querySelector('text');
  expect(text).toHaveAttribute('direction', 'ltr');
  expect(text).toHaveAttribute('lang', 'en');
  expect(text?.textContent).toBe('קן סתומה + One חטאת');

  const runs = [...(text?.querySelectorAll('tspan') ?? [])];
  expect(runs.map((t) => t.textContent)).toEqual(['קן סתומה', 'חטאת']);
  for (const run of runs) {
    expect(run).toHaveAttribute('lang', 'he');
    expect(run).toHaveAttribute('unicode-bidi', 'isolate');
  }
});
