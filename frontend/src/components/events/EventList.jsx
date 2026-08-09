import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

/** Table of ingested events; each row links through to EventDetail. */
export function EventList({ events, appId }) {
  if (events.length === 0) {
    return <p className="p-6 text-center text-sm text-text-muted">No events match these filters yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-text-muted">
          <th className="px-4 py-2 font-medium">Event type</th>
          <th className="px-4 py-2 font-medium">Event ID</th>
          <th className="px-4 py-2 font-medium">Received</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id} className="border-b border-border last:border-0 hover:bg-surface-raised">
            <td className="px-4 py-2.5">
              <Link
                to={`/applications/${appId}/events/${event.id}`}
                className="font-mono text-xs text-accent hover:underline"
              >
                {event.eventType}
              </Link>
            </td>
            <td className="px-4 py-2.5 font-mono text-xs text-text-faint">{event.id.slice(0, 8)}…</td>
            <td className="px-4 py-2.5 text-xs text-text-muted">{formatDate(event.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
