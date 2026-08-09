import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';

/** Summary card for one application, linking through to its detail page. */
export function ApplicationCard({ application }) {
  return (
    <Link to={`/applications/${application.id}`}>
      <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-border-strong">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-sm font-medium text-text">{application.name}</h3>
          <Badge tone={application.planTier === 'pro' ? 'accent' : 'neutral'}>{application.planTier}</Badge>
        </div>
        <dl className="flex flex-col gap-1 font-mono text-xs text-text-muted">
          <div className="flex justify-between gap-2">
            <dt>API key</dt>
            <dd>{application.apiKeyPrefix}…</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Created</dt>
            <dd>{formatDate(application.createdAt)}</dd>
          </div>
        </dl>
      </Card>
    </Link>
  );
}
