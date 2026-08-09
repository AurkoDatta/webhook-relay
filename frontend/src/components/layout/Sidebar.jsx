import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

/** Persistent left nav: brand mark plus top-level sections of the dashboard. */
export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <SignalMark />
        <span className="font-display text-sm font-semibold tracking-tight text-text">Webhook Relay</span>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        <NavItem to="/applications">Applications</NavItem>
      </nav>
    </aside>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-accent-soft text-accent' : 'text-text-muted hover:bg-surface-raised hover:text-text'
        )
      }
    >
      {children}
    </NavLink>
  );
}

function SignalMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-bg" />
      <circle cx="16" cy="16" r="3.5" className="fill-accent" />
      <circle cx="16" cy="16" r="8" className="stroke-accent" strokeOpacity="0.55" strokeWidth="1.5" />
    </svg>
  );
}
