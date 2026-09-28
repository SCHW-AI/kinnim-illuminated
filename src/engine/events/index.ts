/**
 * The event registry.
 *
 * To add an event: add a member to `EngineEvent` in `scenario.ts`, write its
 * handler in a file here, and list it in `handlers`. The `satisfies` clause
 * makes TypeScript reject a missing or misspelt handler.
 */

import { EngineError } from '../errors';
import type { CaseState, EngineEvent } from '../scenario';
import { conceal } from './conceal';
import { create } from './create';
import { designate } from './designate';
import { mix } from './mix';
import { move } from './move';
import { reveal } from './reveal';
import type { EventType, Handler } from './types';

export type { EventOf, EventType, Handler } from './types';

const handlers = { mix, move, reveal, conceal, create, designate } satisfies {
  [K in EventType]: Handler<K>;
};

/** Every event type the engine understands, in registry order. */
export const eventTypes = Object.keys(handlers) as EventType[];

/**
 * Applies one event to a state and returns the next state; the input is never mutated.
 * Throws `EngineError` for an unknown event type or a reference that does not exist.
 */
export function applyEvent(state: CaseState, event: EngineEvent): CaseState {
  const type: unknown = (event as { type?: unknown }).type;
  if (typeof type !== 'string' || !Object.hasOwn(handlers, type)) {
    throw new EngineError(
      `Unknown event type ${JSON.stringify(type)}; known types: ${eventTypes.join(', ')}`,
    );
  }
  const handler = handlers[event.type] as (state: CaseState, event: EngineEvent) => CaseState;
  return handler(state, event);
}
