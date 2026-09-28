import { ownAssign } from '../records';
import type { Container, ContainerId } from '../scenario';
import { containerOf, requireBird, requireContainer } from './helpers';
import type { Handler } from './types';

/**
 * Moves one bird to the end of container `to` (which must exist). The source
 * container stays, even if it is left empty. Knowledge is unchanged.
 */
export const move: Handler<'move'> = (state, { bird, to }) => {
  requireBird(state, bird, 'move');
  requireContainer(state, to, 'move');
  const fromId = containerOf(state, bird, 'move');

  const containers: Record<ContainerId, Container> = {};
  for (const [id, container] of Object.entries(state.containers)) {
    let birdIds = container.birdIds;
    if (id === fromId) birdIds = birdIds.filter((b) => b !== bird);
    if (id === to) birdIds = [...birdIds, bird];
    ownAssign(
      containers,
      id,
      birdIds === container.birdIds ? container : { ...container, birdIds },
    );
  }
  return { ...state, containers };
};
