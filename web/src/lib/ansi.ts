const ESC = '\x1b[';

export const ansi = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  underline: `${ESC}4m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  gray: `${ESC}90m`,
};

export function bold(text: string): string {
  return `${ansi.bold}${text}${ansi.reset}`;
}

export function dim(text: string): string {
  return `${ansi.dim}${text}${ansi.reset}`;
}

export function color(text: string, c: string): string {
  return `${c}${text}${ansi.reset}`;
}

export function boldColor(text: string, c: string): string {
  return `${ansi.bold}${c}${text}${ansi.reset}`;
}

export function underline(text: string): string {
  return `${ansi.underline}${text}${ansi.reset}`;
}

const CLI_PATTERNS = [
  'curl/', 'Wget/', 'HTTPie/', 'libfetch/', 'Go-http-client/',
  'python-requests/', 'python-httpx/', 'node-fetch/', 'undici/',
];

export function isCLI(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return CLI_PATTERNS.some((pattern) => userAgent.includes(pattern));
}
