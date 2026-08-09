import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ApplicationCard } from '../components/applications/ApplicationCard';
import { ApplicationForm } from '../components/applications/ApplicationForm';
import { ApiKeyRevealModal } from '../components/applications/ApiKeyRevealModal';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import * as applicationService from '../services/applicationService';

export default function ApplicationsList() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [revealedCredentials, setRevealedCredentials] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setIsLoading(true);
    const data = await applicationService.listApplications();
    setApplications(data);
    setIsLoading(false);
  }

  async function handleCreate({ name }) {
    const { application, signingSecret, apiKey } = await applicationService.createApplication({ name });
    setApplications((current) => [application, ...current]);
    setIsCreateOpen(false);
    setRevealedCredentials({
      title: `${application.name} is ready`,
      fields: [
        { label: 'Ingestion API key', value: apiKey },
        { label: 'Signing secret', value: signingSecret },
      ],
    });
  }

  return (
    <AppShell title="Applications">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-text-muted">Each application is an isolated namespace with its own endpoints and signing secret.</p>
        <Button onClick={() => setIsCreateOpen(true)}>New application</Button>
      </div>

      {isLoading ? (
        <p className="font-mono text-sm text-text-muted">loading…</p>
      ) : applications.length === 0 ? (
        <EmptyState onCreate={() => setIsCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {isCreateOpen && (
        <Modal title="New application" onClose={() => setIsCreateOpen(false)}>
          <ApplicationForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
        </Modal>
      )}

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

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <p className="text-sm text-text-muted">No applications yet. Create one to start ingesting events.</p>
      <Button onClick={onCreate}>New application</Button>
    </div>
  );
}
