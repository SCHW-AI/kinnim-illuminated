/**
 * Resolving the active view and the ruling of a track (a resolved case's main
 * line, or a possibility path from `trackFor`).
 *
 * When the ruling shows: from `track.rulingFrom` if the track sets it (every
 * track from `trackFor` does); otherwise from the position reached by the
 * earliest step with `showRuling: true`, onward, or, if no step sets it, only
 * at the final position (a track with no steps therefore shows its ruling at
 * position 0).
 */

import type { CaseState, Ruling, Track, ViewDef } from './scenario';
import { clampPosition, finalPosition } from './timeline';

/**
 * The view with this id if there is one, else the first view, else
 * undefined. An unknown id falls back instead of throwing.
 */
export function resolveView(
  owner: { views?: readonly ViewDef[] },
  viewId?: string,
): ViewDef | undefined {
  const views = owner.views ?? [];
  return views.find((view) => view.id === viewId) ?? views[0];
}

/** The track's ruling for a state under the resolved view, or undefined if it has no ruling. */
export function rulingAt(track: Track, state: CaseState, viewId?: string): Ruling | undefined {
  return track.ruling?.(state, resolveView(track, viewId)?.id);
}

/** The first position at which the ruling is shown (see the rule at the top of this file). */
export function rulingFrom(track: Track): number {
  if (track.rulingFrom !== undefined) return track.rulingFrom;
  const index = track.steps.findIndex((step) => step.showRuling === true);
  return index === -1 ? finalPosition(track) : index + 1;
}

/** Whether the track wants its ruling shown at a position (clamped). */
export function isRulingShownAt(track: Track, position: number): boolean {
  return clampPosition(track, position) >= rulingFrom(track);
}
