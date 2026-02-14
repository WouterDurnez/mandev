import { useState, useEffect } from 'react';

/**
 * Light/dark mode toggle for the nav bar.
 *
 * Reads and persists the mode to ``localStorage`` under the key
 * ``"mandev-mode"``.  Falls back to the system ``prefers-color-scheme``
 * on first visit.  Sets ``data-mode`` on the root ``<html>`` element.
 */
export default function ModeToggle() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-mode');
    if (current === 'light' || current === 'dark') {
      setMode(current);
    }
  }, []);

  function toggle() {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    document.documentElement.setAttribute('data-mode', next);
    localStorage.setItem('mandev-mode', next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      className="bg-transparent border-none font-mono text-sm cursor-pointer transition-colors duration-150 text-terminal-dim hover:text-terminal-fg p-0"
    >
      {mode === 'dark' ? '--light' : '--dark'}
    </button>
  );
}
