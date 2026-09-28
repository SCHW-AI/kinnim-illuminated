import { EngineError } from '../errors';
import { ownAssign, ownEntry } from '../records';
import type { Bird, BirdId } from '../scenario';
import { requireBird } from './helpers';
import type { Handler } from './types';

/**
 * Sets the true designation of each listed bird. Knowledge is unchanged, so an
 * unknown bird stays unknown until a `reveal`.
 */
export const designate: Handler<'designate'> = (state, event) => {
  const seen = new Set<BirdId>();
  for (const { bird } of event.birds) {
    requireBird(state, bird, 'designate');
    if (seen.has(bird)) throw new EngineError(`designate: bird "${bird}" is listed twice`);
    seen.add(bird);
  }
  const birds: Record<BirdId, Bird> = { ...state.birds };
  for (const { bird, designation } of event.birds) {
    ownAssign(birds, bird, { ...ownEntry(state.birds, bird)!, designation });
  }
  return { ...state, birds };
};
