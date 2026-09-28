/**
 * The Hebrew text of Maseches Kinnim (Torat Emet, public domain), fetched once
 * by `npm run fetch:text` into `mishnah-text.json`.
 */

import data from './mishnah-text.json';

/** One mishnah's text and where it sits in the masechta. */
export interface MishnahText {
  /** "chapter-mishnah", e.g. "1-2"; the same id as a `MishnahDef`. */
  id: string;
  chapter: number;
  mishnah: number;
  /** Vocalized Hebrew. */
  he: string;
}

/** Where the text comes from, for attribution. */
export const textSource: string = data.source;

const all: readonly MishnahText[] = Object.freeze(
  data.chapters.flatMap(({ chapter, mishnayos }) =>
    mishnayos.map(({ mishnah, he }) => ({ id: `${chapter}-${mishnah}`, chapter, mishnah, he })),
  ),
);
const byId = new Map(all.map((text) => [text.id, text]));

/** Every mishnah of Kinnim, in order. */
export function listMishnayos(): readonly MishnahText[] {
  return all;
}

/** The text of the mishnah with this id (e.g. "1-2"), if it exists. */
export function getMishnahText(id: string): MishnahText | undefined {
  return byId.get(id);
}

const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];

/** A number 1–9 as a Hebrew letter numeral (Kinnim needs no more). */
export function hebrewNumeral(n: number): string {
  return LETTERS[n - 1] ?? String(n);
}

/** The Hebrew reference, e.g. "פרק א משנה ב". */
export function hebrewRef(chapter: number, mishnah: number): string {
  return `פרק ${hebrewNumeral(chapter)} משנה ${hebrewNumeral(mishnah)}`;
}
