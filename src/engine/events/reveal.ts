import { setKnowledge } from './helpers';
import type { Handler } from './types';

/** Lets the observers know the listed birds' designations (or every bird's, for `'all'`). */
export const reveal: Handler<'reveal'> = (state, event) =>
  setKnowledge(state, event.birds, 'known', 'reveal');
