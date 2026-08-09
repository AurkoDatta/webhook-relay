import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

/** Sub-nav for a single application's Overview/Endpoints/Analytics sections. */
export function ApplicationTabs({ appId }) {
  return (
    <nav className="mb-4 flex gap-1 border-b border-border">
      <Tab to={`/applications/${appId}`} end>
        Overview
      </Tab>
      <Tab to={`/applications/${appId}/endpoints`}>Endpoints</Tab>
      <Tab to={`/applications/${appId}/analytics`}>Analytics</Tab>
    </nav>
  );
}

function Tab({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'border-accent text-text' : 'border-transparent text-text-muted hover:text-text'
        )
      }
    >
      {children}
    </NavLink>
  );
}
