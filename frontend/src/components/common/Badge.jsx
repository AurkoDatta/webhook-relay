import clsx from 'clsx';

const TONE_CLASSES = {
  neutral: 'bg-surface-raised text-text-muted border-border',
  accent: 'bg-accent-soft text-accent border-accent-dim',
  success: 'bg-success-soft text-success border-success/30',
  danger: 'bg-danger-soft text-danger border-danger/30',
  info: 'bg-info-soft text-info border-info/30',
};

/** Small pill label used for plan tiers, event types, and other short tags. */
export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
