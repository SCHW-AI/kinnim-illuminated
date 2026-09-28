/**
 * The default CaseState + Ruling to Scene projection, and `sceneAt`, which
 * picks a track's own `project` when it has one.
 */

import type { SceneBird, SceneContainer } from '../stage/scene';
import { EngineError } from './errors';
import { ownEntry } from './records';
import { isRulingShownAt, rulingAt } from './resolve';
import type { BirdId, CaseState, Designation, RichLabel, Ruling, Scene, Track } from './scenario';
import { stateAt } from './timeline';

const TINTS: Record<Designation, SceneBird['tint']> = {
  chatas: 'chatas',
  olah: 'olah',
  unassigned: 'neutral',
};

/** Stage labels are Hebrew only: no transliterations. */
const LABELS: Record<Designation, RichLabel> = {
  chatas: { he: 'חטאת' },
  olah: { he: 'עולה' },
  unassigned: { he: 'חטאת/עולה' },
};

/**
 * Projects a state (and optional ruling) onto a Scene: containers in record
 * order; a known bird is tinted and labelled by its designation, an unknown
 * one is tinted `unknown` with no label; status comes from the ruling, else `alive`.
 */
export function projectScene(state: CaseState, ruling?: Ruling): Scene {
  const containerOf = new Map<BirdId, string>();
  const containers: SceneContainer[] = Object.values(state.containers).map((container) => {
    for (const id of container.birdIds) containerOf.set(id, container.id);
    return {
      id: container.id,
      kind: container.kind,
      birdIds: [...container.birdIds],
      ...(container.label ? { label: container.label } : {}),
    };
  });

  const birds: SceneBird[] = Object.values(state.birds).map((bird) => {
    const containerId = containerOf.get(bird.id);
    if (containerId === undefined) {
      throw new EngineError(`projectScene: bird "${bird.id}" is not in any container`);
    }
    const revealed = ownEntry(state.knowledge, bird.id) === 'known';
    return {
      id: bird.id,
      containerId,
      tint: revealed ? TINTS[bird.designation] : 'unknown',
      revealed,
      status: (ruling && ownEntry(ruling.birds, bird.id)) ?? 'alive',
      ...(revealed ? { label: LABELS[bird.designation] } : {}),
    };
  });

  return { containers, birds };
}

/**
 * The Scene at a position (clamped) of a track under a view, via
 * `track.project` or `projectScene`. The ruling is passed only where
 * `isRulingShownAt` allows it.
 */
export function sceneAt(track: Track, position: number, viewId?: string): Scene {
  const state = stateAt(track, position);
  const ruling = isRulingShownAt(track, position) ? rulingAt(track, state, viewId) : undefined;
  return (track.project ?? projectScene)(state, ruling);
}
