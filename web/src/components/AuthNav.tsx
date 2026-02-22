import { useEffect, useState } from 'react';
import { getToken, clearToken, apiGet } from '../lib/api';

interface NavItem {
  label: string;
  href: string;
}

interface Props {
  items: NavItem[];
  active?: string;
}

interface MeData {
  username: string;
  avatar?: string | null;
}

export default function AuthNav({ items, active }: Props) {
  const [me, setMe] = useState<MeData | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setChecked(true);
      return;
    }

    apiGet('/api/auth/me', token)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: MeData) => setMe(data))
      .catch(() => {
        clearToken();
      })
      .finally(() => setChecked(true));
  }, []);

  function handleLogout() {
    clearToken();
    window.location.reload();
  }

  const linkClass = (isActive: boolean) =>
    `transition-colors duration-150 no-underline ${
      isActive ? 'text-terminal-accent' : 'text-terminal-dim hover:text-terminal-fg'
    }`;

  if (!checked) {
    return (
      <div className="flex items-center gap-1">
        {items.map((item, i) => (
          <span key={item.label}>
            <a href={item.href} className={linkClass(active === item.label)}>
              {item.label}
            </a>
            {i < items.length - 1 && <span className="text-terminal-border"> | </span>}
          </span>
        ))}
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex items-center gap-1">
        {items.map((item, i) => (
          <span key={item.label}>
            <a href={item.href} className={linkClass(active === item.label)}>
              {item.label}
            </a>
            {i < items.length - 1 && <span className="text-terminal-border"> | </span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {me.avatar && (
        <>
          <img
            src={me.avatar}
            alt=""
            width={16}
            height={16}
            style={{ imageRendering: 'pixelated' }}
            className="inline-block"
          />
          <span className="text-terminal-border">|</span>
        </>
      )}
      <a href={`/${me.username}`} className={linkClass(false)}>
        @{me.username}
      </a>
      <span className="text-terminal-border">|</span>
      <a href="/dashboard" className={linkClass(active === 'dashboard')}>
        dashboard
      </a>
      <span className="text-terminal-border">|</span>
      <button
        onClick={handleLogout}
        className="bg-transparent border-none font-mono text-sm cursor-pointer transition-colors duration-150 text-terminal-dim hover:text-terminal-fg p-0"
      >
        logout
      </button>
    </div>
  );
}
