import clsx from 'clsx';

/** Flat bordered panel — the base surface for every content block in the dashboard. */
export function Card({ className, children, ...props }) {
  return (
    <div className={clsx('rounded-lg border border-border bg-surface', className)} {...props}>
      {children}
    </div>
  );
}
