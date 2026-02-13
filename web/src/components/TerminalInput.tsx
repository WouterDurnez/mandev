import { useState, useRef, type ChangeEvent } from 'react';

interface TerminalInputProps {
  /** Shell-prompt label shown before the input. */
  label: string;
  /** HTML input name attribute. */
  name: string;
  /** HTML input type (text, email, password, etc.). */
  type?: string;
  /** Controlled value. */
  value?: string;
  /** Change handler. */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Placeholder text. */
  placeholder?: string;
}

/**
 * A terminal-styled input that mimics a shell prompt.
 *
 * Renders as: ``$ label: ___`` with a blinking cursor on focus.
 */
export default function TerminalInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
}: TerminalInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex items-center gap-2 font-mono text-sm py-1 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <span style={{ color: 'var(--accent)' }}>$</span>
      <span style={{ color: 'var(--dim)' }}>{label}:</span>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent border-none outline-none font-mono text-sm"
          style={{ color: 'var(--fg)', caretColor: 'transparent' }}
          autoComplete="off"
          spellCheck={false}
        />
        {focused && (
          <span
            className="absolute top-0 pointer-events-none"
            style={{
              left: `${(value?.length ?? 0)}ch`,
              color: 'var(--accent)',
              animation: 'blink 1s step-end infinite',
            }}
          >
            {'\u2588'}
          </span>
        )}
      </div>
    </div>
  );
}
