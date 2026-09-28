/**
 * The author's words for Mishnah 1:2, VERBATIM from docs/legacy-scenarios.md:
 * each case's name, result title (the ruling's verdict) and explanation (the
 * ruling's reasons). Do not edit, paraphrase or add to this text; the test in
 * `mishnah-1-2.test.ts` checks it against the doc word for word. Only the
 * markup is converted: bold sub-headings are `heading` blocks, bullets are a
 * `list` block, everything else is a `paragraph`. The two קן סתומה texts are
 * kept in their pieces (`parts`), so the possibilities can quote a bullet or
 * paragraph by reference instead of retyping it.
 */

import type { RichLabel, RichText } from '../../engine';

/** One case's preserved text. */
export interface CaseText {
  /** The case's name, from the doc's "Case (x): …" heading. */
  title: RichLabel;
  /** The doc's "Result title". */
  verdict: RichText;
  /** The doc's "Explanation". */
  reasons: RichText;
}

export const oneChatasOneOlah: CaseText = {
  title: { en: 'One חטאת and One עולה' },
  verdict: 'Both are ספיקות - They must die',
  reasons: [
    {
      type: 'paragraph',
      text: "A חטאת needs to have its blood placed below the חוט הסקרא and an עולה needs to have its blood placed above the חוט הסקרא. Therefore, if a bird is definitely a חטאת or definitely an עולה but we don't know which, it must be left to die. In this scenario, both birds are a ספק and must be left to die.",
    },
  ],
};

export const manyChataosOneOlah: CaseText = {
  title: { en: 'Many חטאות and One עולה' },
  verdict: 'All are ספיקות - They must all die',
  reasons: [
    {
      type: 'paragraph',
      text: 'Even though there are many חטאות and only one עולה, the birds are living beings, so the עולה does not become בטל in the חטאות. Therefore, all of the birds are now ספיקות and must be left to die. This would also be true in the opposite case of many עולות and one חטאת.',
    },
  ],
};

/**
 * The explanation of a קן סתומה case, in the pieces its possibilities quote
 * (each piece is one heading, sentence or bullet of the author's text, as is).
 */
export interface KeinParts {
  canBringHeading: string;
  anyBird: string;
  pickDefined: string;
  pickUndefined: string;
  secondHeading: string;
  second: string;
  otherHeading: string;
  other: string;
}

/** A קן סתומה case's text, with its explanation also available in pieces. */
export interface KeinText extends CaseText {
  parts: KeinParts;
}

/** Assembles the explanation from its pieces, in the author's order. */
function keinText(title: RichLabel, verdict: string, parts: KeinParts): KeinText {
  return {
    title,
    verdict,
    parts,
    reasons: [
      { type: 'heading', text: parts.canBringHeading },
      { type: 'paragraph', text: parts.anyBird },
      { type: 'list', items: [parts.pickDefined, parts.pickUndefined] },
      { type: 'heading', text: parts.secondHeading },
      { type: 'paragraph', text: parts.second },
      { type: 'heading', text: parts.otherHeading },
      { type: 'paragraph', text: parts.other },
    ],
  };
}

export const keinWithChatas = keinText(
  { en: 'קן סתומה + One חטאת' },
  '1 חטאת can be brought, 2 birds must die',
  {
    canBringHeading: 'Why 1 חטאת can be brought:',
    anyBird: 'No matter which bird we select as a חטאת, it is valid:',
    pickDefined: "If we pick the defined חטאת → it's a valid חטאת",
    pickUndefined: 'If we pick either undefined bird → bringing it as a חטאת defines it as such',
    secondHeading: 'Why we cannot bring a second חטאת:',
    second:
      'If the first bird was undefined bird A (now defined as חטאת), then undefined bird B is now an עולה. Bringing it as a חטאת would mean bringing an עולה as a חטאת - invalid.',
    otherHeading: 'Why we cannot bring any עולה:',
    other:
      'The bird we select might be the defined חטאת, so we would be bringing a חטאת as an עולה - invalid.',
  },
);

export const keinWithOlah = keinText(
  { en: 'קן סתומה + One עולה' },
  '1 עולה can be brought, 2 birds must die',
  {
    canBringHeading: 'Why 1 עולה can be brought:',
    anyBird: 'No matter which bird we select as an עולה, it is valid:',
    pickDefined: "If we pick the defined עולה → it's a valid עולה",
    pickUndefined: 'If we pick either undefined bird → bringing it as an עולה defines it as such',
    secondHeading: 'Why we cannot bring a second עולה:',
    second:
      'If the first bird was undefined bird A (now defined as עולה), then undefined bird B is now a חטאת. Bringing it as an עולה would mean bringing a חטאת as an עולה - invalid.',
    otherHeading: 'Why we cannot bring any חטאת:',
    other:
      'The bird we select might be the defined עולה, so we would be bringing an עולה as a חטאת - invalid.',
  },
);
