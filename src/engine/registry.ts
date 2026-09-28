/**
 * The mishnah registry. Pure: it takes the modules as an argument, so the app
 * passes `import.meta.glob(...)` (see `src/mishnayos/index.ts`) and tests pass a plain object.
 */

import { EngineError } from './errors';
import type { MishnahDef } from './scenario';
import { formatIssues, validateMishnah } from './validate';

/** A validated, ordered set of mishnayos. */
export interface MishnahRegistry {
  /** Every mishnah, sorted by chapter then mishnah. */
  list(): readonly MishnahDef[];
  /** The mishnah with this id (e.g. "1-2"), if registered. */
  get(id: string): MishnahDef | undefined;
  /** Whether a mishnah with this id is registered. */
  has(id: string): boolean;
}

/** The folder a module path names, e.g. "1-2" for "./1-2/index.ts". */
function folderOf(source: string): string | undefined {
  return /(?:^|\/)([^/]+)\/index\.[jt]sx?$/.exec(source)?.[1];
}

/**
 * Builds a registry from `{ [path]: { default: MishnahDef } }` modules. Throws one
 * `EngineError` listing every invalid module, folder/id mismatch and duplicate id.
 */
export function createRegistry(modules: Record<string, { default: MishnahDef }>): MishnahRegistry {
  const problems: string[] = [];
  const sources = new Map<string, string>();
  const defs: MishnahDef[] = [];

  for (const [source, module] of Object.entries(modules)) {
    const def = (module as { default?: MishnahDef } | undefined)?.default;
    if (!def) {
      problems.push(`${source}: has no default export`);
      continue;
    }
    const issues = validateMishnah(def);
    const folder = folderOf(source);
    if (folder !== undefined && folder !== def.id) {
      issues.push({
        path: 'id',
        message: `Mishnah id "${def.id}" does not match its folder "${folder}"`,
      });
    }
    if (issues.length > 0) problems.push(`${source}:\n${formatIssues(issues)}`);

    const other = sources.get(def.id);
    if (other !== undefined) {
      problems.push(`${source}: duplicate mishnah id "${def.id}" (also in ${other})`);
      continue;
    }
    sources.set(def.id, source);
    defs.push(def);
  }

  if (problems.length > 0) {
    throw new EngineError(`Invalid mishnah registry:\n${problems.join('\n')}`);
  }

  const list = Object.freeze(
    [...defs].sort((a, b) => a.ref.chapter - b.ref.chapter || a.ref.mishnah - b.ref.mishnah),
  );
  const byId = new Map(list.map((def) => [def.id, def]));
  return {
    list: () => list,
    get: (id) => byId.get(id),
    has: (id) => byId.has(id),
  };
}
