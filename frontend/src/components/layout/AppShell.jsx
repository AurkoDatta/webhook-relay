import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

/** Shared authenticated-area chrome: sidebar + top bar around a page's content. */
export function AppShell({ title, children }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar title={title} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
