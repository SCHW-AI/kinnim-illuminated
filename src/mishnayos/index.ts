/**
 * Every authored mishnah: each folder `./<chapter>-<mishnah>/index.ts` default-exports a
 * `MishnahDef`. Discovered at build time; an empty directory gives an empty registry.
 */

import { createRegistry, type MishnahDef } from '../engine';

/** The app's mishnah registry, validated at load. */
export const registry = createRegistry(
  import.meta.glob<{ default: MishnahDef }>('./*/index.ts', { eager: true }),
);
