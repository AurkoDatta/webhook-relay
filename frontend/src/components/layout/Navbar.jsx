import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';

/** Top bar: page title slot on the left, current user + sign out on the right. */
export function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="font-display text-sm font-medium text-text">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-text-muted">{user?.email}</span>
        <Button variant="ghost" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
