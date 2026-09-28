import { EngineError } from '../errors';
import { ownAssign, ownEntry } from '../records';
import type { BirdId, CaseState, Container, ContainerId, Knowledge } from '../scenario';

export function requireContainer(state: CaseState, id: ContainerId, type: string): Container {
  const container = ownEntry(state.containers, id);
  if (!container) {
    throw new EngineError(`${type}: container "${id}" does not exist`);
  }
  return container;
}

export function requireBird(state: CaseState, id: BirdId, type: string): void {
  if (!Object.hasOwn(state.birds, id)) {
    throw new EngineError(`${type}: bird "${id}" does not exist`);
  }
}

export function containerOf(state: CaseState, bird: BirdId, type: string): ContainerId {
  for (const container of Object.values(state.containers)) {
    if (container.birdIds.includes(bird)) return container.id;
  }
  throw new EngineError(`${type}: bird "${bird}" is not in any container`);
}

export function setKnowledge(
  state: CaseState,
  birds: BirdId[] | 'all',
  value: Knowledge,
  type: string,
): CaseState {
  const ids = birds === 'all' ? Object.keys(state.birds) : birds;
  for (const id of ids) requireBird(state, id, type);
  const knowledge = { ...state.knowledge };
  for (const id of ids) ownAssign(knowledge, id, value);
  return { ...state, knowledge };
}
