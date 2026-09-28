import { expect, test } from 'vitest';
import { isHebrewOnly, splitHebrewRuns } from './hebrew';

const runs = (text: string) => splitHebrewRuns(text).map(({ text, hebrew }) => [text, hebrew]);

test('pure Hebrew is one run, spaces and Hebrew punctuation included', () => {
  expect(runs('קן סתומה')).toEqual([['קן סתומה', true]]);
  expect(runs('ר׳ יהושע בן-חנניה')).toEqual([['ר׳ יהושע בן-חנניה', true]]);
  expect(isHebrewOnly('קן סתומה')).toBe(true);
});

test('pure Latin is one non-Hebrew run', () => {
  expect(runs('One olah')).toEqual([['One olah', false]]);
  expect(isHebrewOnly('One olah')).toBe(false);
});

test('mixed text splits at the runs; spaces and punctuation between runs stay outside them', () => {
  const text = 'קן סתומה + One חטאת: done.';
  const parts = splitHebrewRuns(text);

  expect(parts.map(({ text, hebrew }) => [text, hebrew])).toEqual([
    ['קן סתומה', true],
    [' + One ', false],
    ['חטאת', true],
    [': done.', false],
  ]);
  expect(parts.map((part) => text.slice(part.start, part.start + part.text.length))).toEqual(
    parts.map((part) => part.text),
  );
  expect(isHebrewOnly(text)).toBe(false);
});

test('niqqud and cantillation marks stay inside their run', () => {
  const word = 'בְּרֵאשִׁ֖ית בָּרָ֣א';
  expect(runs(`In ${word}.`)).toEqual([
    ['In ', false],
    [word, true],
    ['.', false],
  ]);
  expect(isHebrewOnly(word)).toBe(true);
});

test('text with neither script is not Hebrew-only', () => {
  expect(runs('1 + 2')).toEqual([['1 + 2', false]]);
  expect(splitHebrewRuns('')).toEqual([]);
  expect(isHebrewOnly('1 + 2')).toBe(false);
});
