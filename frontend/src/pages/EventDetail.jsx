import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { JsonViewer } from '../components/common/JsonViewer';
import { DeliveryStatusRow } from '../components/events/DeliveryStatusRow';
import * as eventService from '../services/eventService';
import * as deliveryService from '../services/deliveryService';
import { usePolling } from '../hooks/usePolling';
import { formatDate } from '../utils/formatters';

const POLL_INTERVAL_MS = 4000;

/** A single event's payload plus live per-endpoint delivery/retry status, with manual replay. */
export default function EventDetail() {
  const { appId, eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvent = useCallback(async () => {
    const data = await eventService.getEvent(eventId);
    setEvent(data);
  }, [eventId]);

  useEffect(() => {
    setIsLoading(true);
    loadEvent().finally(() => setIsLoading(false));
  }, [loadEvent]);

  // Keep fan-out status live while anything is still in flight — polling
  // stops on its own once every delivery has resolved to success or
  // permanently failed, so an idle tab doesn't keep hitting the API.
  const hasInFlightDelivery = event?.deliveries.some((d) => d.status === 'pending' || d.status === 'retrying');
  usePolling(loadEvent, POLL_INTERVAL_MS, Boolean(hasInFlightDelivery));

  async function handleReplay(delivery) {
    await deliveryService.replayDelivery(delivery.id);
    await loadEvent();
  }

  if (isLoading || !event) {
    return (
      <AppShell title="Event">
        <p className="font-mono text-sm text-text-muted">loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Event detail">
      <Link to={`/applications/${appId}`} className="mb-4 inline-block text-sm text-accent hover:underline">
        ← Back to events
      </Link>

      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-mono text-sm font-medium text-text">{event.eventType}</h2>
            <Badge>{event.id.slice(0, 8)}…</Badge>
          </div>
          <p className="mb-4 text-xs text-text-faint">Received {formatDate(event.createdAt)}</p>
          <JsonViewer data={event.payload} rootLabel="payload" />
        </Card>

        <Card>
          <div className="border-b border-border p-4">
            <h3 className="font-display text-sm font-medium text-text">Delivery status</h3>
          </div>
          {event.deliveries.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-muted">
              No subscriber endpoints matched this event type.
            </p>
          ) : (
            event.deliveries.map((delivery) => (
              <DeliveryStatusRow key={delivery.id} delivery={delivery} onReplay={handleReplay} />
            ))
          )}
        </Card>
      </div>
    </AppShell>
  );
}
