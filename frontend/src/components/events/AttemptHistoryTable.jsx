import { Badge } from '../common/Badge';
import { formatDate, formatLatency } from '../../utils/formatters';

/** Full attempt-by-attempt history for a single delivery: status code, latency, and truncated response body. */
export function AttemptHistoryTable({ attempts }) {
  if (attempts.length === 0) {
    return <p className="p-4 text-center text-xs text-text-muted">No attempts recorded yet.</p>;
  }

  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b border-border text-text-muted">
          <th className="px-3 py-2 font-medium">#</th>
          <th className="px-3 py-2 font-medium">Result</th>
          <th className="px-3 py-2 font-medium">Status</th>
          <th className="px-3 py-2 font-medium">Latency</th>
          <th className="px-3 py-2 font-medium">Attempted</th>
          <th className="px-3 py-2 font-medium">Response</th>
        </tr>
      </thead>
      <tbody>
        {attempts.map((attempt) => (
          <tr key={attempt.id} className="border-b border-border last:border-0 align-top">
            <td className="px-3 py-2 font-mono text-text-muted">{attempt.attemptNumber}</td>
            <td className="px-3 py-2">
              <Badge tone={attempt.succeeded ? 'success' : 'danger'}>{attempt.succeeded ? 'OK' : 'Failed'}</Badge>
            </td>
            <td className="px-3 py-2 font-mono text-text">{attempt.statusCode ?? '—'}</td>
            <td className="px-3 py-2 font-mono text-text">{formatLatency(attempt.latencyMs)}</td>
            <td className="px-3 py-2 text-text-muted">{formatDate(attempt.attemptedAt)}</td>
            <td className="max-w-xs px-3 py-2">
              <code className="block truncate font-mono text-text-faint" title={attempt.responseBodyTruncated ?? ''}>
                {attempt.responseBodyTruncated || '—'}
              </code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
