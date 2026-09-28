/**
 * Variants and possibility tracks.
 *
 * A case is played in two stages of resolution:
 * 1. `resolveVariant(caseDef, variantId)` picks one concrete setup (a
 *    `ResolvedCase`); a case without variants is its own resolution.
 * 2. `trackFor(resolved, path)` gives the linear `Track` to play: the main
 *    line for `[]`, or, for a path of possibility ids (e.g.
 *    `['take-stumah', 'second-chatas']`), the parent track's steps up to the
 *    possibility's `from`, then the possibility's own steps. Each level forks
 *    from the track of the level above it.
 *
 * On a possibility track, `start` is the fork point (where the possibility's
 * own steps begin), and the ruling is the possibility's own: shown from its
 * earliest `showRuling` step, else at its final position. Without one, every
 * bird stays alive.
 */

import { EngineError } from './errors';
import { rulingFrom } from './resolve';
import type {
  CaseDef,
  PossibilityDef,
  ResolvedCase,
  Track,
  VariantDef,
  VariedCaseDef,
} from './scenario';
import { finalPosition } from './timeline';

/** A varied case resolved to one of its variants. Internal: validation uses it for every variant. */
export function resolvedOf(caseDef: VariedCaseDef, variant: VariantDef): ResolvedCase {
  const { id, title, views, project } = caseDef;
  return {
    id,
    title: variant.title ?? title,
    variantId: variant.id,
    initial: variant.initial,
    steps: variant.steps,
    ...(views ? { views } : {}),
    ...(project ? { project } : {}),
    ...(variant.ruling ? { ruling: variant.ruling } : {}),
    ...(variant.possibilities ? { possibilities: variant.possibilities } : {}),
  };
}

/**
 * The case with the variant of this id, else its first variant (an unknown or
 * missing id falls back, as views do). A case without variants resolves to itself.
 */
export function resolveVariant(caseDef: CaseDef, variantId?: string): ResolvedCase {
  if (!caseDef.variants) return caseDef;
  const variant = caseDef.variants.find((v) => v.id === variantId) ?? caseDef.variants[0];
  if (!variant) throw new EngineError(`Case "${caseDef.id}" lists no variants`);
  return resolvedOf(caseDef, variant);
}

/** The main-line track of a resolved case. */
function mainTrack(resolved: ResolvedCase): Track {
  const { initial, steps, views, ruling, project } = resolved;
  return { initial, steps, views, ruling, project, rulingFrom: rulingFrom(resolved), start: 0 };
}

/**
 * The track of a possibility forking from its parent's track. Internal:
 * validation checks `from` first; here a bad `from` throws.
 */
export function branchTrack(parent: Track, possibility: PossibilityDef): Track {
  const last = finalPosition(parent);
  const start = possibility.from ?? last;
  if (!(Number.isInteger(start) && start >= 0 && start <= last)) {
    throw new EngineError(
      `Possibility "${possibility.id}" forks at ${start}, outside its parent's positions 0..${last}`,
    );
  }
  const steps = [...parent.steps.slice(0, start), ...possibility.steps];
  const own = possibility.steps.findIndex((step) => step.showRuling === true);
  return {
    initial: parent.initial,
    steps,
    views: parent.views,
    project: parent.project,
    ruling: possibility.ruling,
    rulingFrom: own === -1 ? steps.length : start + own + 1,
    start,
  };
}

/**
 * Walks a path of possibility ids. Returns the possibilities along it, or the
 * index of the first id that names no possibility at its level.
 */
export function walkPath(
  resolved: ResolvedCase,
  path: readonly string[],
): { found: PossibilityDef[] } | { missing: number } {
  const found: PossibilityDef[] = [];
  let options = resolved.possibilities ?? [];
  for (const [i, id] of path.entries()) {
    const possibility = options.find((p) => p.id === id);
    if (!possibility) return { missing: i };
    found.push(possibility);
    options = possibility.possibilities ?? [];
  }
  return { found };
}

/**
 * The linear track for the main line (`[]`) or a possibility path. Throws an
 * `EngineError` for a path that names no possibility; check it first with
 * `validatePath`.
 */
export function trackFor(resolved: ResolvedCase, path: readonly string[] = []): Track {
  const walked = walkPath(resolved, path);
  if ('missing' in walked) {
    throw new EngineError(
      `Case "${resolved.id}" has no possibility "${path.slice(0, walked.missing + 1).join('.')}"`,
    );
  }
  return walked.found.reduce(branchTrack, mainTrack(resolved));
}

/** The possibility a non-empty path names, or undefined (for `[]` or an unknown path). */
export function possibilityAt(
  resolved: ResolvedCase,
  path: readonly string[],
): PossibilityDef | undefined {
  const walked = walkPath(resolved, path);
  return 'found' in walked ? walked.found.at(-1) : undefined;
}
