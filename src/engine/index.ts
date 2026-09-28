/**
 * The engine's public API: pure TypeScript, no React. Import from here, not
 * from the files inside `engine/`.
 */

export type * from './scenario';
export { EngineError } from './errors';
export { applyEvent, eventTypes } from './events';
export type { EventOf, EventType, Handler } from './events';
export {
  buildTimeline,
  clampPosition,
  finalPosition,
  nextStepAt,
  stateAt,
  stepAt,
} from './timeline';
export type { Timeline } from './timeline';
export { isRulingShownAt, resolveView, rulingAt, rulingFrom } from './resolve';
export { possibilityAt, resolveVariant, trackFor } from './tracks';
export { projectScene, sceneAt } from './project';
export {
  assertValid,
  formatIssues,
  sceneProblems,
  validateCase,
  validateLink,
  validateMishnah,
  validatePath,
  ValidationError,
} from './validate';
export type { MishnahLink, ValidationIssue } from './validate';
export { createRegistry } from './registry';
export type { MishnahRegistry } from './registry';
