/**
 * PROVISIONAL PORTRAYAL. The container layout and labels, the step breakdown,
 * the CTA wording, the "select one bird" step, the variant switch and the
 * possibilities are a first draft for the author to redesign in a design
 * session. The logic (setup → mix → 1 bird kasher, 2 die) and the
 * verdict/reasons text are the author's and are preserved from
 * docs/legacy-scenarios.md.
 *
 * Case (c): a קן סתומה mixed with one designated bird, with a switch between
 * the legacy cases (c) (a designated חטאת) and (d) (a designated עולה). They
 * mirror each other, so one factory builds both variants.
 *
 * The ruling needs a status per bird, but the halacha is "any one bird may be
 * brought". So after the mix, one step creates a zone for the bird being
 * brought and moves ONE bird into it: that bird is kasher and the two left in
 * the mixture must die.
 */

import type {
  BirdId,
  BirdStatus,
  CaseState,
  PossibilityDef,
  RichLabel,
  RichText,
  Ruling,
  VariantDef,
  VariedCaseDef,
} from '../../../engine';
import { birdsOf, everyBird, initialState, tally } from '../helpers';
import { keinWithChatas, keinWithOlah, type KeinText } from '../text';

/** The zone the brought bird is moved into; it appears only at the select step. */
export const BROUGHT = 'brought';

/** The zone a second bird is moved into, in the `second-…` possibility. */
export const SECOND = 'second';

/** The bird the "select" step moves into the zone. */
export const SELECTED_BIRD = 'kein-1';

/** The other bird of the קן סתומה. */
export const PARTNER_BIRD = 'kein-2';

type Offering = 'chatas' | 'olah';

const OTHER: Record<Offering, Offering> = { chatas: 'olah', olah: 'chatas' };

/** A stage caption naming an offering: Hebrew only. */
const WORD: Record<Offering, RichLabel> = { chatas: { he: 'חטאת' }, olah: { he: 'עולה' } };

/** The offering's name in UI chrome, with its article, as the author writes it ("a חטאת", "an עולה"). */
const A: Record<Offering, string> = { chatas: 'a חטאת', olah: 'an עולה' };

/** Birds in the brought zone are kasher; every other bird must be left to die. */
function oneBrought(text: KeinText) {
  return (state: CaseState): Ruling => {
    const brought = new Set(state.containers[BROUGHT]?.birdIds);
    const birds = Object.fromEntries(
      Object.keys(state.birds).map((id) => [id, brought.has(id) ? 'kasher' : 'yamus'] as const),
    );
    return { verdict: text.verdict, reasons: text.reasons, birds, counts: tally(birds) };
  };
}

/**
 * A possibility's ruling: the birds it brings get the status the author's
 * reasoning gives them; every bird not brought stays alive (the supposition
 * says nothing about it). The verdict is the possibility's outcome text.
 */
function supposing(outcome: RichText, statuses: Record<BirdId, BirdStatus>) {
  return (state: CaseState): Ruling => ({
    verdict: outcome,
    birds: { ...everyBird(state, 'alive'), ...statuses },
  });
}

/**
 * PROVISIONAL POSSIBILITIES, for the author to review. They follow the
 * author's own reasoning bullets and add no halachic claim: each outcome is a
 * bullet, or a heading and its paragraph, of the variant's verbatim
 * explanation (by reference, from `text.ts`), and each label only restates the
 * supposition. All three fork after the mix, before a bird is selected.
 */
function possibilities(offering: Offering, text: KeinText): PossibilityDef[] {
  const other = OTHER[offering];
  const single = `${offering}-1`;
  const { parts } = text;
  const afterMix = 1;
  const secondOutcome: RichText = [
    { type: 'heading', text: parts.secondHeading },
    { type: 'paragraph', text: parts.second },
  ];
  const otherOutcome: RichText = [
    { type: 'heading', text: parts.otherHeading },
    { type: 'paragraph', text: parts.other },
  ];
  return [
    {
      id: 'take-defined',
      label: { en: `Suppose we took the defined ${WORD[offering].he}` },
      from: afterMix,
      steps: [
        {
          id: 'take',
          // No caption: once revealed, the bird's own label says what it is.
          events: [
            { type: 'create', container: { id: BROUGHT, kind: 'zone' }, after: 'mixture' },
            { type: 'move', bird: single, to: BROUGHT },
            { type: 'reveal', birds: [single] },
          ],
          advance: { cta: { en: `Take the defined ${WORD[offering].he}` } },
        },
      ],
      outcome: parts.pickDefined,
      ruling: supposing(parts.pickDefined, { [single]: 'kasher' }),
    },
    {
      id: 'take-stumah',
      label: { en: 'Suppose we took a bird from the קן סתומה' },
      from: afterMix,
      steps: [
        {
          id: 'take',
          // Revealed as a bird of the kein: not yet a חטאת or an עולה.
          events: [
            { type: 'create', container: { id: BROUGHT, kind: 'zone' }, after: 'mixture' },
            { type: 'move', bird: SELECTED_BIRD, to: BROUGHT },
            { type: 'reveal', birds: [SELECTED_BIRD] },
          ],
          advance: { cta: { en: 'Take a bird of the קן סתומה' } },
        },
        {
          id: 'bring',
          // Bringing it as the offering fixes it, and so its partner as the other.
          // The defined bird stays unknown: the partner now sits beside it.
          events: [
            {
              type: 'designate',
              birds: [
                { bird: SELECTED_BIRD, designation: offering },
                { bird: PARTNER_BIRD, designation: other },
              ],
            },
            { type: 'reveal', birds: [PARTNER_BIRD] },
          ],
          advance: { cta: { en: `Bring it as ${A[offering]}` } },
        },
      ],
      outcome: parts.pickUndefined,
      ruling: supposing(parts.pickUndefined, { [SELECTED_BIRD]: 'kasher' }),
      possibilities: [
        {
          id: `second-${offering}`,
          label: { en: `Then try to bring a second ${WORD[offering].he}` },
          steps: [
            {
              id: 'bring-second',
              events: [
                {
                  type: 'create',
                  container: { id: SECOND, kind: 'zone', label: WORD[offering] },
                  after: BROUGHT,
                },
                { type: 'move', bird: PARTNER_BIRD, to: SECOND },
              ],
              advance: { cta: { en: `Bring the partner as ${A[offering]}` } },
            },
          ],
          outcome: secondOutcome,
          ruling: supposing(secondOutcome, { [SELECTED_BIRD]: 'kasher', [PARTNER_BIRD]: 'pasul' }),
        },
      ],
    },
    {
      id: `take-as-${other}`,
      label: { en: `Suppose we try to bring ${A[other]}` },
      from: afterMix,
      steps: [
        {
          id: 'bring',
          events: [
            {
              type: 'create',
              container: { id: BROUGHT, kind: 'zone', label: WORD[other] },
              after: 'mixture',
            },
            // The worst case: the bird taken might be the defined one.
            { type: 'move', bird: single, to: BROUGHT },
          ],
          advance: { cta: { en: `Bring a bird as ${A[other]}` } },
        },
        { id: 'worst-case', events: [{ type: 'reveal', birds: [single] }], advance: 'auto' },
      ],
      outcome: otherOutcome,
      ruling: supposing(otherOutcome, { [single]: 'pasul' }),
    },
  ];
}

function keinVariant(
  offering: Offering,
  text: KeinText,
  label: RichLabel,
  cta: RichLabel,
): VariantDef {
  return {
    id: offering,
    label,
    title: text.title,
    initial: initialState({
      // The caption adds what the birds' own labels (חטאת/עולה) do not.
      kein: {
        kind: 'kein',
        label: { he: 'קן סתומה' },
        keinId: 'kein',
        birds: birdsOf('kein', 'unassigned', 2),
      },
      // A lone bird is not a group.
      [offering]: { kind: 'loose', birds: birdsOf(offering, offering, 1) },
    }),
    steps: [
      {
        id: 'mix',
        events: [
          { type: 'mix', from: ['kein', offering], into: 'mixture', label: { he: 'תערובת' } },
        ],
        advance: { cta: { en: 'Mix the birds' } },
      },
      {
        id: 'select',
        // Arbitrary: "no matter which bird we select" the ruling is the same.
        // The first bird of the mixture is taken so the timeline is deterministic.
        // The zone appears only now, when a bird is brought.
        events: [
          {
            type: 'create',
            container: { id: BROUGHT, kind: 'zone', label: WORD[offering] },
            after: 'mixture',
          },
          { type: 'move', bird: SELECTED_BIRD, to: BROUGHT },
        ],
        advance: { cta },
      },
    ],
    ruling: oneBrought(text),
    possibilities: possibilities(offering, text),
  };
}

/**
 * Case (c): a קן סתומה and one designated bird; 1 bird can be brought, as that
 * bird's offering, and 2 die. Variants: a designated חטאת (legacy case c) or a
 * designated עולה (legacy case d).
 */
export const caseC: VariedCaseDef = {
  id: 'case-c',
  title: { en: 'קן סתומה + One חטאת/עולה' },
  variants: [
    keinVariant('chatas', keinWithChatas, { en: 'One חטאת' }, { en: 'Select a bird as a chatas' }),
    keinVariant('olah', keinWithOlah, { en: 'One עולה' }, { en: 'Select a bird as an olah' }),
  ],
};
