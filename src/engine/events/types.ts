import type { CaseState, EngineEvent } from '../scenario';

/** Every event type the engine understands. */
export type EventType = EngineEvent['type'];

/** The event union member with type `K`. */
export type EventOf<K extends EventType> = Extract<EngineEvent, { type: K }>;

/**
 * A pure event handler: returns the next state and never mutates its input.
 * Throws `EngineError` when the event refers to something that does not exist.
 */
export type Handler<K extends EventType> = (state: CaseState, event: EventOf<K>) => CaseState;
