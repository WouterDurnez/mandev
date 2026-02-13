import { clearToken } from '../lib/api';

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
    <nav
      className="max-w-4xl mx-auto px-4 py-3 font-mono text-sm flex items-center gap-1"
    >
      <span
        style={{ color: active === 'editor' ? 'var(--accent)' : 'var(--dim)' }}
      >
        &gt;
      </span>
      <a href="/dashboard" className={linkClass('editor')}>
        editor
      </a>
      <span style={{ color: 'var(--border)' }}>|</span>
      <button
        onClick={handleLogout}
        className="bg-transparent border-none font-mono text-sm cursor-pointer transition-colors duration-150 text-terminal-dim hover:text-terminal-fg p-0"
      >
        logout
      </button>
    </nav>
  );
}
