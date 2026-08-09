import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

/** Table of an application's subscriber endpoints with pause/edit/delete actions. */
export function EndpointList({ endpoints, onToggleActive, onEdit, onDelete }) {
  if (endpoints.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-text-muted">
        No endpoints yet. Add one to start receiving events.
      </p>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-text-muted">
          <th className="px-4 py-2 font-medium">URL</th>
          <th className="px-4 py-2 font-medium">Event types</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium" />
        </tr>
      </thead>
      <tbody>
        {endpoints.map((endpoint) => (
          <tr key={endpoint.id} className="border-b border-border last:border-0">
            <td className="px-4 py-2.5">
              <p className="font-mono text-xs text-text">{endpoint.url}</p>
              {endpoint.description && <p className="text-xs text-text-faint">{endpoint.description}</p>}
            </td>
            <td className="px-4 py-2.5">
              <div className="flex flex-wrap gap-1">
                {endpoint.subscribedEventTypes.map((type) => (
                  <Badge key={type} tone={type === '*' ? 'accent' : 'neutral'}>
                    {type}
                  </Badge>
                ))}
              </div>
            </td>
            <td className="px-4 py-2.5">
              <button
                type="button"
                onClick={() => onToggleActive(endpoint)}
                className="text-left"
                title={endpoint.isActive ? 'Click to pause' : 'Click to reactivate'}
              >
                <Badge tone={endpoint.isActive ? 'success' : 'neutral'}>
                  {endpoint.isActive ? 'Active' : 'Paused'}
                </Badge>
              </button>
            </td>
            <td className="px-4 py-2.5 text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => onEdit(endpoint)}>
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => onDelete(endpoint)}>
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
