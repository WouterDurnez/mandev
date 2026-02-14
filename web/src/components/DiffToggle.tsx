import { useState } from 'react';

const genericLines = [
  { text: '  Full-stack developer with 5+ years of experience' },
  { text: '  building scalable web applications. Passionate about' },
  { text: '  clean code and developer experience.' },
  { text: '' },
  { text: '  Skills: JavaScript, Python, React, Node.js' },
  { text: '' },
  { text: '  Experience:' },
  { text: '    Software Engineer at BigCorp (2020-present)' },
  { text: '' },
  { text: '  Links:' },
  { text: '    github.com/jane' },
];

const mandevLines = [
  { text: 'NAME' },
  { text: '    jane \u2014 builds reliable backend systems' },
  { text: '' },
  { text: 'SKILLS' },
  { text: '    Python   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 expert' },
  { text: '    React    \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591 advanced' },
  { text: '    Node.js  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591 intermediate' },
  { text: '' },
  { text: 'EXPERIENCE' },
  { text: '    Software Engineer at BigCorp (2020\u2013present)' },
  { text: '' },
  { text: 'SEE ALSO' },
  { text: '    github: github.com/jane' },
];

/**
 * Interactive diff toggle showing a generic bio vs man.dev formatted profile.
 */
export default function DiffToggle() {
  const [showMandev, setShowMandev] = useState(false);

  const lines = showMandev ? mandevLines : genericLines;
  const label = showMandev ? 'man.dev/jane' : 'generic-bio.txt';

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setShowMandev(false)}
          style={{
            background: 'transparent',
            border: `1px solid ${!showMandev ? 'var(--accent)' : 'var(--border)'}`,
            color: !showMandev ? 'var(--accent)' : 'var(--dim)',
            fontFamily: 'inherit',
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            cursor: 'pointer',
          }}
        >
          before
        </button>
        <span style={{ color: 'var(--dim)', fontSize: '0.75rem' }}>{'\u2192'}</span>
        <button
          onClick={() => setShowMandev(true)}
          style={{
            background: 'transparent',
            border: `1px solid ${showMandev ? 'var(--accent)' : 'var(--border)'}`,
            color: showMandev ? 'var(--accent)' : 'var(--dim)',
            fontFamily: 'inherit',
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            cursor: 'pointer',
          }}
        >
          after
        </button>
      </div>

      <div
        style={{
          border: '1px solid var(--border)',
          padding: '1rem 1.25rem',
          minHeight: '14rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-0.75em',
            left: '1rem',
            backgroundColor: 'var(--bg)',
            padding: '0 0.5rem',
            color: 'var(--dim)',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </div>

        <div style={{ fontSize: '0.8rem', lineHeight: 1.7 }}>
          {lines.map((line, i) => (
            <div
              key={`${showMandev}-${i}`}
              style={{
                color: showMandev
                  ? /^[A-Z]/.test(line.text)
                    ? 'var(--accent)'
                    : 'var(--fg)'
                  : 'var(--dim)',
                opacity: 0,
                animation: `fadeSlideIn 0.3s ease forwards`,
                animationDelay: `${i * 30}ms`,
                whiteSpace: 'pre',
                minHeight: line.text === '' ? '1.2em' : undefined,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
