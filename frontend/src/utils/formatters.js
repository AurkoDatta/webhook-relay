/**
 * Small display-formatting helpers shared across pages/components. Kept
 * framework-free so they're trivial to reason about and reuse.
 */

/** @param {string | Date} value */
export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** @param {number | null | undefined} ms */
export function formatLatency(ms) {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** @param {number} ratio - a 0..1 fraction. */
export function formatPercent(ratio) {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return '—';
  return `${Math.round(ratio * 100)}%`;
}
