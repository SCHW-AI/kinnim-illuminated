import { createContext, use } from 'react';
import type { MishnahRegistry } from '../engine';
import { registry } from '../mishnayos';

/** The mishnah registry the app reads. Defaults to the real one; tests provide fixtures. */
export const RegistryContext = createContext<MishnahRegistry>(registry);

export function useRegistry(): MishnahRegistry {
  return use(RegistryContext);
}
