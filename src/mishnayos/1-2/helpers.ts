/** Small authoring helpers shared by the 1:2 cases. */

import type {
  Bird,
  BirdId,
  BirdStatus,
  CaseState,
  Container,
  ContainerId,
  ContainerKind,
  RichLabel,
} from '../../engine';

/** One container of an initial state: its kind, caption and birds (in order). */
export interface ContainerSpec {
  kind: ContainerKind;
  label?: RichLabel;
  birds: Omit<Bird, 'keinId'>[];
  /** Set on a `kein`: each of its birds gets this `keinId`. */
  keinId?: string;
}

/**
 * Builds an initial state from containers in display order (record insertion
 * order is the display order). Every bird starts known to the observers.
 */
export function initialState(spec: Record<ContainerId, ContainerSpec>): CaseState {
  const state: CaseState = { birds: {}, containers: {}, knowledge: {} };
  for (const [id, { kind, label, birds, keinId }] of Object.entries(spec)) {
    const container: Container = { id, kind, birdIds: birds.map((bird) => bird.id) };
    if (label) container.label = label;
    state.containers[id] = container;
    for (const bird of birds) {
      state.birds[bird.id] = keinId ? { ...bird, keinId } : { ...bird };
      state.knowledge[bird.id] = 'known';
    }
  }
  return state;
}

/** `count` designated birds with ids `${prefix}-1` … `${prefix}-${count}`. */
export function birdsOf(
  prefix: string,
  designation: Bird['designation'],
  count: number,
): Omit<Bird, 'keinId'>[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${prefix}-${i + 1}`, designation }));
}

/** Tallies statuses, e.g. `{ kasher: 1, yamus: 2 }`, in first-seen order. */
export function tally(statuses: Record<BirdId, BirdStatus>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const status of Object.values(statuses)) counts[status] = (counts[status] ?? 0) + 1;
  return counts;
}

/** Every bird in the state gets the same status. */
export function everyBird(state: CaseState, status: BirdStatus): Record<BirdId, BirdStatus> {
  return Object.fromEntries(Object.keys(state.birds).map((id) => [id, status]));
}
