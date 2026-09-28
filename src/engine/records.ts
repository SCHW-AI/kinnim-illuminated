/**
 * Own-property record lookup. Bird, container and knowledge records are keyed
 * by author-chosen ids, so a plain `record[id]` would also find inherited
 * properties such as `toString` or `constructor`.
 */
export function ownEntry<T>(record: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

/**
 * Adds or replaces an own, enumerable entry. Unlike `record[key] = value`, a
 * key of `__proto__` becomes an ordinary entry instead of setting the record's
 * prototype. Use it wherever a record keyed by ids is built.
 */
export function ownAssign<T>(record: Record<string, T>, key: string, value: T): void {
  Object.defineProperty(record, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}
