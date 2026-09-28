/** Thrown when the engine is given something it cannot apply: an unknown event type or a reference to a bird or container that does not exist. */
export class EngineError extends Error {
  override name = 'EngineError';
}

/**
 * A message for anything a `catch` caught, which may be any value: an Error's
 * message, else the value as a string. Never throws, not even for a value
 * `String` cannot convert (e.g. `Object.create(null)`) or an Error whose
 * `message` getter throws: it then falls back to `Object.prototype.toString`,
 * and finally to "unknown error".
 */
export function describeThrown(value: unknown): string {
  try {
    return String(value instanceof Error ? value.message : value);
  } catch {
    try {
      return Object.prototype.toString.call(value);
    } catch {
      return 'unknown error';
    }
  }
}
