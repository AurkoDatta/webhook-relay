/**
 * Shared shell for Login/Register: a signal-pulse mark (the same ring
 * animation used on the "retrying" delivery badge) gives the auth screens
 * a bit of the product's real personality instead of a bare centered form.
 */
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="signal-pulse-ring absolute inset-0 rounded-full border border-accent" />
            <span
              className="signal-pulse-ring absolute inset-0 rounded-full border border-accent"
              style={{ animationDelay: '0.8s' }}
            />
            <span className="relative h-3 w-3 rounded-full bg-accent" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-lg font-semibold text-text">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">{children}</div>
      </div>
    </div>
  );
}
