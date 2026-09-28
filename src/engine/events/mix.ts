import { EngineError } from '../errors';
import { ownAssign, ownEntry } from '../records';
import type { Container, ContainerId } from '../scenario';
import { requireContainer } from './helpers';
import type { Handler } from './types';

/**
 * Merges the `from` containers, in order, into `into` (kind `mixture`). A new
 * `into` takes the place of the earliest source in container order; an `into`
 * that is one of the sources keeps its place. The other sources are removed.
 * Every merged bird becomes unknown to the observers; the truth is untouched.
 */
export const mix: Handler<'mix'> = (state, event) => {
  const { from, into, label } = event;
  if (from.length === 0) {
    throw new EngineError(`mix: "from" must list at least one container`);
  }
  const sources = new Set<ContainerId>();
  const birdIds: string[] = [];
  for (const id of from) {
    if (sources.has(id)) throw new EngineError(`mix: container "${id}" is listed twice in "from"`);
    sources.add(id);
    birdIds.push(...requireContainer(state, id, 'mix').birdIds);
  }

  const existing = ownEntry(state.containers, into);
  if (existing && !sources.has(into)) {
    throw new EngineError(
      `mix: container "${into}" already exists but is not in "from"; list it there to merge into it`,
    );
  }
  const target: Container = {
    ...(existing ?? { id: into }),
    kind: 'mixture',
    birdIds,
    ...(label ? { label } : {}),
  };

  const containers: Record<ContainerId, Container> = {};
  let placed = false;
  for (const [id, container] of Object.entries(state.containers)) {
    if (id === into) {
      ownAssign(containers, id, target);
      placed = true;
    } else if (sources.has(id)) {
      if (!existing && !placed) {
        ownAssign(containers, into, target);
        placed = true;
      }
    } else {
      ownAssign(containers, id, container);
    }
  }

  const knowledge = { ...state.knowledge };
  for (const id of birdIds) ownAssign(knowledge, id, 'unknown');
  return { ...state, containers, knowledge };
};
