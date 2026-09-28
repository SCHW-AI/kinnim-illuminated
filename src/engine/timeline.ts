/**
 * The timeline: a track's steps folded into states. A track is a resolved
 * case's main line or one possibility path (see `tracks.ts`); every function
 * here takes either.
 *
 * Position model. A track with n steps has positions 0..n:
 * - position 0 is `initial`, before any step;
 * - position p (1..n) is the state after steps 0..p-1, i.e. after step p-1.
 *
 * So `steps[i]` leads from position i to position i + 1. The step that
 * produced position p is `stepAt(t, p)`; the step
 * the viewer takes next from position p (and supplies its CTA) is
 * `nextStepAt(t, p)`. Stepping back is just reading an earlier position.
 */

import { applyEvent } from './events';
import { EngineError } from './errors';
import type { CaseState, StepDef, Track } from './scenario';

/** Every state of a track: `states[p]` is the state at position p. */
export interface Timeline {
  /** Length `steps.length + 1`; `states[0]` is `initial`. */
  readonly states: readonly CaseState[];
}

function foldStep(state: CaseState, step: StepDef, index: number): CaseState {
  return step.events.reduce((current, event, j) => {
    try {
      return applyEvent(current, event);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new EngineError(`steps[${index}].events[${j}] (step "${step.id}"): ${message}`, {
        cause: error,
      });
    }
  }, state);
}

/** Folds every step of a track; `states[p]` is the state at position p (see the position model above). */
export function buildTimeline(track: Track): Timeline {
  const states: CaseState[] = [track.initial];
  track.steps.forEach((step, i) => {
    states.push(foldStep(states[i] ?? track.initial, step, i));
  });
  return { states };
}

/** The last position of a track: `steps.length`, after every step. */
export function finalPosition(track: Track): number {
  return track.steps.length;
}

/** Clamps any number to a valid integer position 0..steps.length (NaN becomes 0). */
export function clampPosition(track: Track, position: number): number {
  if (Number.isNaN(position)) return 0;
  return Math.min(Math.max(Math.trunc(position), 0), finalPosition(track));
}

/** The state at a position (clamped), folding only the steps before it. */
export function stateAt(track: Track, position: number): CaseState {
  const end = clampPosition(track, position);
  return track.steps.slice(0, end).reduce(foldStep, track.initial);
}

/** The step that led to a position (clamped), or undefined at position 0. */
export function stepAt(track: Track, position: number): StepDef | undefined {
  const p = clampPosition(track, position);
  return p === 0 ? undefined : track.steps[p - 1];
}

/** The step the viewer takes next from a position (clamped), or undefined at the final position. */
export function nextStepAt(track: Track, position: number): StepDef | undefined {
  return track.steps[clampPosition(track, position)];
}
