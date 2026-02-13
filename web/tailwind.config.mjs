/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Source Code Pro"', 'monospace'],
      },
      colors: {
        terminal: {
          bg: 'var(--bg)',
          fg: 'var(--fg)',
          accent: 'var(--accent)',
          dim: 'var(--dim)',
          border: 'var(--border)',
        },
      },
      maxWidth: {
        terminal: '80ch',
      },
    },
  },
  plugins: [],
};
