import { useState, useEffect } from 'react';

interface TypeWriterProps {
  /** The full text to type out. */
  text: string;
  /** Milliseconds per character. */
  speed?: number;
  /** Milliseconds to wait before typing starts. */
  delay?: number;
  /** Extra CSS class names. */
  className?: string;
}

/**
 * Types text character by character with a blinking cursor.
 *
 * The cursor blinks while typing and disappears when finished.
 */
export default function TypeWriter({
  text,
  speed = 50,
  delay = 0,
  className = '',
}: TypeWriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    if (displayed.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    } else {
      setDone(true);
    }
  }, [started, displayed, text, speed]);

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span
          style={{
            color: 'var(--accent)',
            animation: 'blink 1s step-end infinite',
          }}
        >
          {'\u2588'}
        </span>
      )}
    </span>
  );
}
