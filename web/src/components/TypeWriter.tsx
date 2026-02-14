import { useState, useEffect, useRef } from 'react';

interface TypeWriterProps {
  /** The full text to type out. */
  text: string;
  /** Milliseconds per character. */
  speed?: number;
  /** Milliseconds to wait before typing starts. */
  delay?: number;
  /** Loop the animation (type, pause, erase, pause, repeat). */
  loop?: boolean;
  /** Milliseconds to pause after fully typed before erasing (loop mode). */
  pauseAfterType?: number;
  /** Milliseconds to pause after erasing before retyping (loop mode). */
  pauseAfterErase?: number;
  /** Extra CSS class names. */
  className?: string;
}

/**
 * Types text character by character with a blinking cursor.
 *
 * Supports optional loop mode: type → pause → erase → pause → repeat.
 */
export default function TypeWriter({
  text,
  speed = 50,
  delay = 0,
  loop = false,
  pauseAfterType = 2000,
  pauseAfterErase = 800,
  className = '',
}: TypeWriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const phase = useRef<'typing' | 'pausing' | 'erasing' | 'waiting'>('typing');

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    if (phase.current === 'typing') {
      if (displayed.length < text.length) {
        const timer = setTimeout(() => {
          setDisplayed(text.slice(0, displayed.length + 1));
        }, speed);
        return () => clearTimeout(timer);
      }
      if (!loop) {
        setDone(true);
        return;
      }
      phase.current = 'pausing';
      const timer = setTimeout(() => {
        phase.current = 'erasing';
        setDisplayed(text.slice(0, text.length - 1));
      }, pauseAfterType);
      return () => clearTimeout(timer);
    }

    if (phase.current === 'erasing') {
      if (displayed.length > 0) {
        const timer = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, speed / 2);
        return () => clearTimeout(timer);
      }
      phase.current = 'waiting';
      const timer = setTimeout(() => {
        phase.current = 'typing';
        setDisplayed(text.slice(0, 1));
      }, pauseAfterErase);
      return () => clearTimeout(timer);
    }
  }, [started, displayed, text, speed, loop, pauseAfterType, pauseAfterErase]);

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
