import clsx from 'clsx';

const VARIANT_CLASSES = {
  primary: 'bg-accent text-bg hover:bg-accent/90 focus-visible:outline-accent',
  secondary:
    'bg-surface-raised text-text border border-border hover:border-border-strong focus-visible:outline-accent',
  danger: 'bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25 focus-visible:outline-danger',
  ghost: 'text-text-muted hover:text-text hover:bg-surface-raised focus-visible:outline-accent',
};

/**
 * Base button used throughout the dashboard. `variant` picks the visual
 * treatment; everything else (type, onClick, disabled, ...) passes through.
 */
export function Button({ variant = 'primary', className, children, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium',
        'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
