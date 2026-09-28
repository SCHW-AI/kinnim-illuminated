/**
 * PROVISIONAL PORTRAYAL. The container layout and labels, the step breakdown,
 * the CTA wording, the variant switch and the bird count of case (b) are a
 * first draft for the author to redesign in a design session. The logic
 * (setup → mix → every bird dies) and the verdict/reasons text are the
 * author's and are preserved from docs/legacy-scenarios.md.
 *
 * Cases (a) and (b): designated birds only, mixed together.
 */

import type { CaseState, PlainCaseDef, Ruling, VariantDef, VariedCaseDef } from '../../../engine';
import { birdsOf, everyBird, initialState, tally } from '../helpers';
import { manyChataosOneOlah, oneChatasOneOlah, type CaseText } from '../text';

/**
 * PROVISIONAL: case (b)'s "many" birds. The old portrayal showed 24; 12 keeps
 * the stage readable. The ruling does not depend on the number.
 */
export const MANY = 12;

const mixture = { he: 'תערובת' };

/** Every bird in the state must be left to die. */
function allDie(text: CaseText) {
  return (state: CaseState): Ruling => {
    const birds = everyBird(state, 'yamus');
    return { verdict: text.verdict, reasons: text.reasons, birds, counts: tally(birds) };
  };
}

/** Case (a): one חטאת and one עולה are mixed; both are ספיקות and die. */
export const caseA: PlainCaseDef = {
  id: 'case-a',
  title: oneChatasOneOlah.title,
  // Two lone birds: neither is a group, so neither is boxed or captioned.
  initial: initialState({
    chatas: { kind: 'loose', birds: birdsOf('chatas', 'chatas', 1) },
    olah: { kind: 'loose', birds: birdsOf('olah', 'olah', 1) },
  }),
  steps: [
    {
      id: 'mix',
      events: [{ type: 'mix', from: ['chatas', 'olah'], into: 'mixture', label: mixture }],
      advance: { cta: { en: 'Mix the birds' } },
    },
  ],
  ruling: allDie(oneChatasOneOlah),
};

/** The plural container id for many birds of a designation. */
const PLURAL: Record<'chatas' | 'olah', string> = { chatas: 'chataos', olah: 'olos' };

/**
 * One setup of case (b): `many` birds of one designation, in a box with no
 * caption (every bird already says what it is), and one lone bird of the other.
 */
function manyAndOne(
  many: 'chatas' | 'olah',
  one: 'chatas' | 'olah',
  variant: Pick<VariantDef, 'label' | 'title'>,
): VariantDef {
  const group = PLURAL[many];
  return {
    id: group,
    ...variant,
    initial: initialState({
      [group]: { kind: 'pile', birds: birdsOf(many, many, MANY) },
      [one]: { kind: 'loose', birds: birdsOf(one, one, 1) },
    }),
    steps: [
      {
        id: 'mix',
        events: [{ type: 'mix', from: [group, one], into: 'mixture', label: mixture }],
        advance: { cta: { en: 'Mix the birds' } },
      },
    ],
    // The author's explanation holds in the opposite case too ("This would also
    // be true in the opposite case of many עולות and one חטאת"), so both
    // variants give the same verdict and reasons.
    ruling: allDie(manyChataosOneOlah),
  };
}

/**
 * Case (b): one bird mixed into many of the other kind; every bird is a ספק
 * and dies. The switch flips it: many חטאות and one עולה ⇄ many עולות and one
 * חטאת.
 */
export const caseB: VariedCaseDef = {
  id: 'case-b',
  title: manyChataosOneOlah.title,
  variants: [
    manyAndOne('chatas', 'olah', { label: { en: 'Many חטאות, one עולה' } }),
    manyAndOne('olah', 'chatas', {
      label: { en: 'Many עולות, one חטאת' },
      // The author's own phrase, from the last sentence of the explanation,
      // capitalised as a title like case (b)'s.
      title: { en: 'Many עולות and One חטאת' },
    }),
  ],
};
