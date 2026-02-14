import { useState, useEffect } from 'react';

const SCHEMES = [
  { name: 'dracula', label: 'Dracula' },
  { name: 'monokai', label: 'Monokai' },
  { name: 'gruvbox', label: 'Gruvbox' },
  { name: 'nord', label: 'Nord' },
  { name: 'solarized-dark', label: 'Solarized' },
  { name: 'catppuccin', label: 'Catppuccin' },
  { name: 'tokyo-night', label: 'Tokyo Night' },
  { name: 'one-dark', label: 'One Dark' },
  { name: 'github-dark', label: 'GitHub Dark' },
  { name: 'terminal-green', label: 'Terminal Green' },
];

/**
 * Interactive theme switcher that applies color schemes to the page in real time.
 *
 * Renders a grid of clickable scheme names. Selecting one sets the
 * ``data-scheme`` attribute on the root ``<html>`` element so all
 * CSS custom properties update instantly.
 */
export default function ThemeSwitcher() {
  const [active, setActive] = useState('dracula');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-scheme');
    if (current) setActive(current);
  }, []);

  function apply(scheme: string) {
    setActive(scheme);
    document.documentElement.setAttribute('data-scheme', scheme);
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        padding: '1rem 1.25rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.5rem',
        }}
      >
        {SCHEMES.map((s) => {
          const isActive = active === s.name;
          return (
            <button
              key={s.name}
              onClick={() => apply(s.name)}
              style={{
                background: 'transparent',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                color: isActive ? 'var(--accent)' : 'var(--dim)',
                fontFamily: 'inherit',
                fontSize: '0.75rem',
                padding: '0.375rem 0.5rem',
                cursor: 'pointer',
                textAlign: 'left',
                letterSpacing: '0.03em',
                transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              {isActive ? '> ' : '  '}{s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
