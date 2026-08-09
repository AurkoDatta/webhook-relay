import { useState } from 'react';
import clsx from 'clsx';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { AttemptHistoryTable } from './AttemptHistoryTable';
import { Button } from '../common/Button';
import * as deliveryService from '../../services/deliveryService';

/**
 * One endpoint's fan-out row for an event: status, attempt count, a Replay
 * action, and an expandable attempt-history table fetched lazily on first
 * expand (most rows are never opened, so there's no reason to fetch every
 * delivery's full history up front).
 */
export function DeliveryStatusRow({ delivery, onReplay }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [attempts, setAttempts] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);

  async function toggleExpanded() {
    if (!isExpanded && attempts === null) {
      const data = await deliveryService.getAttemptHistory(delivery.id);
      setAttempts(data);
    }
    setIsExpanded((current) => !current);
  }

  async function handleReplay(event) {
    event.stopPropagation();
    setIsReplaying(true);
    try {
      await onReplay(delivery);
    } finally {
      setIsReplaying(false);
    }
  }

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button type="button" onClick={toggleExpanded} className="flex flex-1 items-center gap-3 text-left">
          <span className={clsx('text-text-faint transition-transform', isExpanded && 'rotate-90')}>▸</span>
          <span className="font-mono text-xs text-text">{delivery.endpointUrl}</span>
          <DeliveryStatusBadge status={delivery.status} />
        </button>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>
            {delivery.attemptCount} attempt{delivery.attemptCount === 1 ? '' : 's'}
          </span>
          <Button variant="secondary" onClick={handleReplay} disabled={isReplaying}>
            {isReplaying ? 'Replaying…' : 'Replay'}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-border bg-bg">
          {attempts === null ? (
            <p className="p-4 text-center text-xs text-text-muted">loading…</p>
          ) : (
            <AttemptHistoryTable attempts={attempts} />
          )}
        </div>
      )}
    </div>
  );
}
