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

/** Compact large counts for stat tiles: 1284 -> "1.3K", 4200000 -> "4.2M". */
export function formatCompactNumber(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** Shortens a URL for chart axis labels, keeping only host + truncated path. */
export function formatEndpointLabel(url) {
  try {
    const { host, pathname } = new URL(url);
    const path = pathname === '/' ? '' : pathname;
    const label = `${host}${path}`;
    return label.length > 22 ? `${label.slice(0, 21)}…` : label;
  } catch {
    return url;
  }
}
