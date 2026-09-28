/**
 * Hebrew text runs, shared by the stage (SVG labels) and the ui (rich text).
 * Pure; no React.
 */

/** Hebrew letters, niqqud, cantillation and Hebrew punctuation, plus presentation forms. */
const HEBREW = '\u0591-\u05F4\uFB1D-\uFB4F';
/** A run of Hebrew words, with the spaces and Hebrew punctuation between them. */
const HEBREW_RUN = new RegExp(`[${HEBREW}]+(?:[\\s'"\u05F4\u05F3-]+[${HEBREW}]+)*`, 'g');
const HAS_HEBREW = new RegExp(`[${HEBREW}]`);
const HAS_LATIN = /[A-Za-z]/;

/** A piece of a mixed string: a run of Hebrew words, or the text between runs. */
export interface TextRun {
  text: string;
  hebrew: boolean;
  /** Offset of the run in the source string (usable as a stable React key). */
  start: number;
}

/**
 * Splits a string that may mix Hebrew and English into its Hebrew runs and
 * the text between them, in order; joining the runs' text gives the input.
 */
export function splitHebrewRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let last = 0;
  for (const match of text.matchAll(HEBREW_RUN)) {
    const start = match.index;
    if (start > last) runs.push({ text: text.slice(last, start), hebrew: false, start: last });
    runs.push({ text: match[0], hebrew: true, start });
    last = start + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), hebrew: false, start: last });
  return runs;
}

/** Whether a string has Hebrew and no Latin letters (so it reads right-to-left as a whole). */
export function isHebrewOnly(text: string): boolean {
  return HAS_HEBREW.test(text) && !HAS_LATIN.test(text);
}
