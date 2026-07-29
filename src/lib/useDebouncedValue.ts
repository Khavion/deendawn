import { useEffect, useState } from 'react';

/**
 * The given value, updated only once it has been stable for `delayMs`.
 * Used to keep synchronous FTS queries off the keystroke path — the query runs
 * when the user pauses, not on every character.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
