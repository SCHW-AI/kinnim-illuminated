import { EngineError } from '../errors';
import { ownAssign, ownEntry } from '../records';
import type { Container, ContainerId } from '../scenario';
import { requireContainer } from './helpers';
import type { Handler } from './types';

/**
 * Adds a new, empty container right after `after` in container order, or at
 * the end. Throws if the id already exists or `after` does not.
 */
export const create: Handler<'create'> = (state, { container: spec, after }) => {
  if (ownEntry(state.containers, spec.id)) {
    throw new EngineError(`create: container "${spec.id}" already exists`);
  }
  if (after !== undefined) requireContainer(state, after, 'create');
  const created: Container = {
    id: spec.id,
    kind: spec.kind,
    birdIds: [],
    ...(spec.label ? { label: spec.label } : {}),
  };

  const containers: Record<ContainerId, Container> = {};
  for (const [id, container] of Object.entries(state.containers)) {
    ownAssign(containers, id, container);
    if (id === after) ownAssign(containers, created.id, created);
  }
  if (after === undefined) ownAssign(containers, created.id, created);
  return { ...state, containers };
};
