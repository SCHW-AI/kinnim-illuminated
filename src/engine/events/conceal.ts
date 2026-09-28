import { setKnowledge } from './helpers';
import type { Handler } from './types';

/** Hides the listed birds' designations (or every bird's, for `'all'`) from the observers. */
export const conceal: Handler<'conceal'> = (state, event) =>
  setKnowledge(state, event.birds, 'unknown', 'conceal');
