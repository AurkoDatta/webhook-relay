import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ApiKeyRevealModal } from '../components/applications/ApiKeyRevealModal';
import * as applicationService from '../services/applicationService';
import { formatDate } from '../utils/formatters';

export default function ApplicationDetail() {
  const { appId } = useParams();
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedCredentials, setRevealedCredentials] = useState(null);
  const [rotating, setRotating] = useState(null);

  useEffect(() => {
    applicationService.getApplication(appId).then((app) => {
      setApplication(app);
      setIsLoading(false);
    });
  }, [appId]);

  async function handleRotateSecret() {
    setRotating('secret');
    try {
      const { application: updated, signingSecret } = await applicationService.rotateSigningSecret(appId);
      setApplication(updated);
      setRevealedCredentials({
        title: 'Signing secret rotated',
        fields: [{ label: 'New signing secret', value: signingSecret }],
      });
    } finally {
      setRotating(null);
    }
  }

  async function handleRotateApiKey() {
    setRotating('apiKey');
    try {
      const { application: updated, apiKey } = await applicationService.rotateApiKey(appId);
      setApplication(updated);
      setRevealedCredentials({
        title: 'API key rotated',
        fields: [{ label: 'New ingestion API key', value: apiKey }],
      });
    } finally {
      setRotating(null);
    }
  }

  if (isLoading || !application) {
    return (
      <AppShell title="Application">
        <p className="font-mono text-sm text-text-muted">loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={application.name}>
      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-base font-medium text-text">{application.name}</h2>
            <Badge tone={application.planTier === 'pro' ? 'accent' : 'neutral'}>{application.planTier}</Badge>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CredentialRow
              label="Signing secret"
              value={application.signingSecret}
              action={
                <Button variant="secondary" onClick={handleRotateSecret} disabled={rotating === 'secret'}>
                  {rotating === 'secret' ? 'Rotating…' : 'Rotate'}
                </Button>
              }
            />
            <CredentialRow
              label="Ingestion API key"
              value={`${application.apiKeyPrefix}…`}
              action={
                <Button variant="secondary" onClick={handleRotateApiKey} disabled={rotating === 'apiKey'}>
                  {rotating === 'apiKey' ? 'Rotating…' : 'Rotate'}
                </Button>
              }
            />
          </dl>

          <p className="mt-4 text-xs text-text-faint">Created {formatDate(application.createdAt)}</p>
        </Card>

        <Card className="p-5">
          <h3 className="mb-2 font-display text-sm font-medium text-text">Sending events</h3>
          <p className="text-sm text-text-muted">
            POST to <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs text-text">/api/ingest</code> with
            your API key as a Bearer token, an <code className="font-mono text-xs">eventType</code>, and a JSON{' '}
            <code className="font-mono text-xs">payload</code>. Matching endpoints below receive it automatically.
          </p>
        </Card>
      </div>

      {revealedCredentials && (
        <ApiKeyRevealModal
          title={revealedCredentials.title}
          fields={revealedCredentials.fields}
          onClose={() => setRevealedCredentials(null)}
        />
      )}
    </AppShell>
  );
}

function CredentialRow({ label, value, action }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-bg px-3 py-2 font-mono text-xs text-text">
          {value}
        </code>
        {action}
      </dd>
    </div>
  );
}
