/**
 * Whether the stage writes engine ids into the DOM (`data-bird-id`,
 * `data-container-id`, `data-container-ref`) for tests and debugging.
 *
 * Development only: an author's ids may name the truth (e.g. `chatas-1`), so
 * in production they would reveal an unrevealed bird to anyone inspecting the
 * page. Vite replaces `import.meta.env.DEV` with `false` in a build, so the
 * attributes are dropped there; it is read per call so tests can stub it.
 */
export function exposeDebugIds(): boolean {
  return import.meta.env.DEV;
}
