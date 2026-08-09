import { useEffect, useRef } from 'react';

/**
 * Calls `callback` every `intervalMs` while `enabled` is true. Used to
 * auto-refresh a delivery's status while it's still pending/retrying,
 * without polling forever once it has resolved to success or failed — the
 * caller flips `enabled` off once nothing is left in flight.
 *
 * A ref holds the latest callback so the interval doesn't need to be
 * torn down and recreated on every render just because the callback
 * closure changed (e.g. it captures fresh state each render).
 */
export function usePolling(callback, intervalMs, enabled) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;
    const intervalId = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(intervalId);
  }, [intervalMs, enabled]);
}
