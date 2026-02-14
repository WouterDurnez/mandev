export interface SchemeColors {
  bg: string;
  fg: string;
  accent: string;
  dim: string;
  border: string;
}

export const schemes: Record<string, SchemeColors> = {
  dracula:          { bg: '#282a36', fg: '#f8f8f2', accent: '#bd93f9', dim: '#6272a4', border: '#44475a' },
  monokai:          { bg: '#272822', fg: '#f8f8f2', accent: '#f92672', dim: '#75715e', border: '#3e3d32' },
  gruvbox:          { bg: '#282828', fg: '#ebdbb2', accent: '#fabd2f', dim: '#928374', border: '#3c3836' },
  nord:             { bg: '#2e3440', fg: '#d8dee9', accent: '#88c0d0', dim: '#4c566a', border: '#3b4252' },
  'solarized-dark': { bg: '#002b36', fg: '#839496', accent: '#b58900', dim: '#586e75', border: '#073642' },
  catppuccin:       { bg: '#1e1e2e', fg: '#cdd6f4', accent: '#cba6f7', dim: '#585b70', border: '#313244' },
  'tokyo-night':    { bg: '#1a1b26', fg: '#a9b1d6', accent: '#7aa2f7', dim: '#565f89', border: '#292e42' },
  'one-dark':       { bg: '#282c34', fg: '#abb2bf', accent: '#61afef', dim: '#5c6370', border: '#3e4451' },
  'github-dark':    { bg: '#0d1117', fg: '#c9d1d9', accent: '#58a6ff', dim: '#484f58', border: '#21262d' },
  'terminal-green': { bg: '#0a0a0a', fg: '#00ff00', accent: '#00ff00', dim: '#008000', border: '#003300' },
};

export const DEFAULT_SCHEME = 'dracula';

export function getScheme(name?: string): SchemeColors {
  return schemes[name || DEFAULT_SCHEME] || schemes[DEFAULT_SCHEME];
}
