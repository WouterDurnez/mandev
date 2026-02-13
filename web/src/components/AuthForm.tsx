import { useState, type FormEvent } from 'react';
import TerminalInput from './TerminalInput';
import { apiPost, setToken } from '../lib/api';

interface AuthFormProps {
  /** Whether to render login or signup fields. */
  mode: 'login' | 'signup';
}

/**
 * Terminal-styled authentication form.
 *
 * Renders email/password (and username for signup) inputs styled as
 * shell prompts.  On success the JWT is stored and the browser is
 * redirected to ``/dashboard``.
 */
export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await apiPost('/api/auth/signup', {
          email,
          username,
          password,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(
            data?.detail || `Signup failed (${res.status})`,
          );
        }
        // Auto-login after signup
        const loginRes = await apiPost('/api/auth/login', {
          email,
          password,
        });
        if (!loginRes.ok) {
          throw new Error('Account created. Please log in manually.');
        }
        const loginData = await loginRes.json();
        setToken(loginData.access_token);
      } else {
        const res = await apiPost('/api/auth/login', {
          email,
          password,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(
            data?.detail || 'Invalid credentials',
          );
        }
        const data = await res.json();
        setToken(data.access_token);
      }
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const label = mode === 'login' ? 'LOGIN' : 'SIGN UP';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <TerminalInput
        label="email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      {mode === 'signup' && (
        <TerminalInput
          label="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ada"
        />
      )}

      <TerminalInput
        label="password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="********"
      />

      {error && (
        <p className="text-sm font-mono" style={{ color: 'var(--accent)' }}>
          stderr: {error}
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-block font-mono text-sm tracking-wider border px-4 py-2 transition-colors duration-150 cursor-pointer bg-transparent border-terminal-accent text-terminal-accent hover:bg-terminal-accent hover:text-terminal-bg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          [ {loading ? 'LOADING...' : label} ]
        </button>
      </div>

      <p className="text-xs font-mono" style={{ color: 'var(--dim)' }}>
        {mode === 'login' ? (
          <>
            No account?{' '}
            <a href="/signup" className="underline" style={{ color: 'var(--accent)' }}>
              signup
            </a>
          </>
        ) : (
          <>
            Already registered?{' '}
            <a href="/login" className="underline" style={{ color: 'var(--accent)' }}>
              login
            </a>
          </>
        )}
      </p>
    </form>
  );
}
