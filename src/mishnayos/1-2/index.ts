/**
 * Mishnah Kinnim 1:2, seeded with the author's four legacy cases
 * (docs/legacy-scenarios.md) as three: legacy cases (c) and (d) are the two
 * variants of case (c).
 *
 * PROVISIONAL PORTRAYAL: the layout, steps, CTAs, variant switches and
 * possibilities in `cases/` are a first draft for the author to redesign. The
 * logic and the verdict and explanation text (`text.ts`, verbatim) are the
 * author's.
 */

import type { MishnahDef } from '../../engine';
import { caseA, caseB } from './cases/defined';
import { caseC } from './cases/kein-stumah';

const mishnah: MishnahDef = {
  id: '1-2',
  ref: { chapter: 1, mishnah: 2 },
  cases: [caseA, caseB, caseC],
};

export default mishnah;
