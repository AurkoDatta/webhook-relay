import clsx from 'clsx';

const STATUS_CONFIG = {
  success: { label: 'Delivered', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  retrying: { label: 'Retrying', tone: 'info' },
  pending: { label: 'Pending', tone: 'neutral' },
};

const TONE_CLASSES = {
  neutral: 'bg-surface-raised text-text-muted border-border',
  success: 'bg-success-soft text-success border-success/30',
  danger: 'bg-danger-soft text-danger border-danger/30',
  info: 'bg-info-soft text-info border-info/30',
};

const DOT_CLASSES = {
  neutral: 'bg-text-faint',
  success: 'bg-success',
  danger: 'bg-danger',
  info: 'bg-info',
};

/**
 * Status pill for a delivery. The "retrying" state gets the signal-pulse
 * ring — the same motif used on the auth screens — since a delivery that's
 * retrying is, literally, a signal being re-sent.
 */
export function DeliveryStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        TONE_CLASSES[config.tone]
      )}
    >
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        {status === 'retrying' && (
          <span className="signal-pulse-ring absolute inset-0 rounded-full border border-info" />
        )}
        <span className={clsx('h-1.5 w-1.5 rounded-full', DOT_CLASSES[config.tone])} />
      </span>
      {config.label}
    </span>
  );
}
