import { useState } from 'react';

/**
 * "Before" pane: a boring, generic portfolio bio styled like a Word document.
 */
function GenericBio() {
  return (
    <div
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#333',
        background: '#fafafa',
        padding: '1rem 1.25rem',
        fontSize: '0.7rem',
        lineHeight: 1.6,
      }}
    >
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          marginBottom: '0.1rem',
          color: '#111',
        }}
      >
        Jane Doe
      </h3>
      <p style={{ color: '#777', fontSize: '0.6rem', marginBottom: '0.5rem' }}>
        Full-Stack Developer &middot; San Francisco, CA
      </p>
      <h4 style={{ fontSize: '0.65rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
        About Me
      </h4>
      <p style={{ color: '#555', marginBottom: '0.4rem' }}>
        Full-stack developer with 5+ years of experience building scalable web
        applications. Passionate about clean code and developer experience.
      </p>
      <h4 style={{ fontSize: '0.65rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
        Skills
      </h4>
      <p style={{ color: '#555', marginBottom: '0.4rem' }}>
        JavaScript &middot; Python &middot; React &middot; Node.js
      </p>
      <h4 style={{ fontSize: '0.65rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
        Experience
      </h4>
      <p style={{ color: '#555', marginBottom: '0' }}>
        Software Engineer at BigCorp (2020&ndash;present)
      </p>
    </div>
  );
}

const mandevLines = [
  { text: 'NAME' },
  { text: '    jane \u2014 builds reliable backend systems' },
  { text: '' },
  { text: 'SKILLS' },
  { text: '    Python   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 expert' },
  { text: '    React    \u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591 advanced' },
  { text: '    Node.js  \u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591 intermediate' },
  { text: '' },
  { text: 'EXPERIENCE' },
  { text: '    Software Engineer at BigCorp' },
  { text: '    2020\u2013present' },
  { text: '' },
  { text: 'SEE ALSO' },
  { text: '    github.com/jane' },
];

/**
 * "After" pane: terminal-styled man page output.
 */
function MandevProfile() {
  return (
    <div style={{ fontSize: '0.7rem', lineHeight: 1.5, padding: '0.25rem 0' }}>
      {mandevLines.map((line, i) => (
        <div
          key={`mandev-${i}`}
          style={{
            color: /^[A-Z]/.test(line.text) ? 'var(--accent)' : 'var(--fg)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: line.text === '' ? '1em' : undefined,
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}

/**
 * Interactive before/after comparison with overlapping rotated cards.
 *
 * The "before" card (generic bio) is tilted slightly askew. The "after"
 * card (man.dev profile) sits clean and straight. Clicking swaps which
 * card is on top.
 */
export default function DiffToggle() {
  const [showMandev, setShowMandev] = useState(false);

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.75rem',
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
          position: 'relative',
          height: '18rem',
          cursor: 'pointer',
        }}
        onClick={() => setShowMandev(!showMandev)}
      >
        {/* Before card — tilted, messy */}
        <div
          style={{
            position: 'absolute',
            top: showMandev ? '0.5rem' : '0',
            left: showMandev ? '-0.5rem' : '0',
            right: showMandev ? undefined : '0',
            width: showMandev ? '92%' : '100%',
            maxWidth: '100%',
            border: '1px solid #ccc',
            background: '#fafafa',
            padding: '1.25rem 1rem',
            paddingTop: '1.5rem',
            transform: showMandev ? 'rotate(-2.5deg)' : 'rotate(-1.5deg)',
            zIndex: showMandev ? 1 : 2,
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: showMandev
              ? '2px 2px 8px rgba(0,0,0,0.06)'
              : '3px 3px 12px rgba(0,0,0,0.1)',
            overflow: 'visible',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '0.75rem',
              transform: 'translateY(-50%)',
              background: '#fafafa',
              padding: '0 0.4rem',
              color: '#999',
              fontSize: '0.6rem',
              letterSpacing: '0.05em',
              fontFamily: 'inherit',
            }}
          >
            resume_2024_final_v3.docx
          </div>
          <GenericBio />
        </div>

        {/* After card — clean, straight */}
        <div
          style={{
            position: 'absolute',
            top: showMandev ? '0' : '0.5rem',
            right: showMandev ? '0' : '-0.5rem',
            left: showMandev ? '0' : undefined,
            width: showMandev ? '100%' : '92%',
            maxWidth: '100%',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            padding: '1.25rem 1rem',
            paddingTop: '1.5rem',
            transform: showMandev ? 'rotate(0deg)' : 'rotate(1deg)',
            zIndex: showMandev ? 2 : 1,
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: showMandev
              ? '3px 3px 12px rgba(0,0,0,0.15)'
              : '2px 2px 8px rgba(0,0,0,0.08)',
            overflow: 'visible',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '0.75rem',
              transform: 'translateY(-50%)',
              background: 'var(--bg)',
              padding: '0 0.4rem',
              color: 'var(--dim)',
              fontSize: '0.6rem',
              letterSpacing: '0.05em',
              fontFamily: 'inherit',
            }}
          >
            man.dev/jane
          </div>
          <MandevProfile />
        </div>
      </div>
    </div>
  );
}
