import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ApplicationTabs } from '../components/applications/ApplicationTabs';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EndpointList } from '../components/endpoints/EndpointList';
import { EndpointForm } from '../components/endpoints/EndpointForm';
import * as endpointService from '../services/endpointService';

export default function Endpoints() {
  const { appId } = useParams();
  const [endpoints, setEndpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [deletingEndpoint, setDeletingEndpoint] = useState(null);

  const loadEndpoints = useCallback(async () => {
    setIsLoading(true);
    const data = await endpointService.listEndpoints(appId);
    setEndpoints(data);
    setIsLoading(false);
  }, [appId]);

  useEffect(() => {
    loadEndpoints();
  }, [loadEndpoints]);

  async function handleCreate(values) {
    const endpoint = await endpointService.createEndpoint(appId, values);
    setEndpoints((current) => [endpoint, ...current]);
    setIsCreateOpen(false);
  }

  async function handleUpdate(values) {
    const updated = await endpointService.updateEndpoint(editingEndpoint.id, values);
    setEndpoints((current) => current.map((e) => (e.id === updated.id ? updated : e)));
    setEditingEndpoint(null);
  }

  async function handleToggleActive(endpoint) {
    const updated = await endpointService.updateEndpoint(endpoint.id, { isActive: !endpoint.isActive });
    setEndpoints((current) => current.map((e) => (e.id === updated.id ? updated : e)));
  }

  async function handleConfirmDelete() {
    await endpointService.deleteEndpoint(deletingEndpoint.id);
    setEndpoints((current) => current.filter((e) => e.id !== deletingEndpoint.id));
    setDeletingEndpoint(null);
  }

  return (
    <AppShell title="Endpoints">
      <ApplicationTabs appId={appId} />

      <Card>
        <div className="flex items-center justify-between border-b border-border p-4">
          <p className="text-sm text-text-muted">Subscriber endpoints receive matching events via signed HTTP POST.</p>
          <Button onClick={() => setIsCreateOpen(true)}>Add endpoint</Button>
        </div>
        {isLoading ? (
          <p className="p-6 text-center font-mono text-sm text-text-muted">loading…</p>
        ) : (
          <EndpointList
            endpoints={endpoints}
            onToggleActive={handleToggleActive}
            onEdit={setEditingEndpoint}
            onDelete={setDeletingEndpoint}
          />
        )}
      </Card>

      {isCreateOpen && (
        <Modal title="Add endpoint" onClose={() => setIsCreateOpen(false)}>
          <EndpointForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
        </Modal>
      )}

      {editingEndpoint && (
        <Modal title="Edit endpoint" onClose={() => setEditingEndpoint(null)}>
          <EndpointForm
            initialValues={editingEndpoint}
            onSubmit={handleUpdate}
            onCancel={() => setEditingEndpoint(null)}
          />
        </Modal>
      )}

      {deletingEndpoint && (
        <Modal title="Delete endpoint" onClose={() => setDeletingEndpoint(null)}>
          <p className="mb-5 text-sm text-text-muted">
            Delete <code className="font-mono text-xs text-text">{deletingEndpoint.url}</code>? Its delivery history
            is kept, but it will stop receiving new events.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeletingEndpoint(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete endpoint
            </Button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
