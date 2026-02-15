import { clearToken } from '../lib/api';
import TypeWriter from './TypeWriter';
import ModeToggle from './ModeToggle';

interface DashboardNavProps {
  /** Currently active tab. */
  active?: 'editor' | 'settings';
}

/**
 * Navigation bar for authenticated dashboard pages.
 *
 * Shows editor/settings links and a logout action.
 */
export default function DashboardNav({ active = 'editor' }: DashboardNavProps) {
  function handleLogout() {
    clearToken();
    window.location.href = '/';
  }

  const linkClass = (item: string) =>
    `transition-colors duration-150 no-underline cursor-pointer ${
      active === item
        ? 'text-terminal-accent'
        : 'text-terminal-dim hover:text-terminal-fg'
    }`;

  return (
    <header className="floating-nav fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300">
      <nav className="relative px-4 py-3 font-mono text-sm flex items-center justify-center">
        <div className="nav-links absolute left-4 flex items-center gap-1">
          <ModeToggle />
        </div>
        <a
          href="/"
          className="text-terminal-dim hover:text-terminal-fg transition-colors duration-150 no-underline"
        >
          <span>$ </span><TypeWriter text="man dev" speed={80} loop />
        </a>
        <div className="nav-links absolute right-4 flex items-center gap-1">
          <a href="/dashboard" className={linkClass('editor')}>
            editor
          </a>
          <span className="text-terminal-border">|</span>
          <button
            onClick={handleLogout}
            className="bg-transparent border-none font-mono text-sm cursor-pointer transition-colors duration-150 text-terminal-dim hover:text-terminal-fg p-0"
          >
            logout
          </button>
        </div>
      </nav>
    </header>
  );
}
