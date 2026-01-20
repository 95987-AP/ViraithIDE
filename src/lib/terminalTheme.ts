import type { ITheme } from '@xterm/xterm';

// Terminal theme matching VIRAITH IDE's caffeine color scheme
export const terminalTheme: ITheme = {
  background: '#1e1e1e',      // --color-background
  foreground: '#e0e0e0',      // --color-text-primary
  cursor: '#c9a673',          // --color-accent
  cursorAccent: '#1e1e1e',
  selectionBackground: 'rgba(201, 166, 115, 0.2)',
  selectionForeground: '#ffffff',
  selectionInactiveBackground: 'rgba(201, 166, 115, 0.1)',

  // ANSI colors
  black: '#2a2a2a',
  red: '#9b5b5b',
  green: '#6b9b6b',
  yellow: '#c9a673',
  blue: '#6b7d9b',
  magenta: '#9b6b9b',
  cyan: '#6b9b9b',
  white: '#e0e0e0',

  // Bright variants
  brightBlack: '#505050',
  brightRed: '#bf7070',
  brightGreen: '#8fbf8f',
  brightYellow: '#e0c090',
  brightBlue: '#8fa0bf',
  brightMagenta: '#bf8fbf',
  brightCyan: '#8fbfbf',
  brightWhite: '#ffffff',
};

// Terminal font configuration
export const terminalFontConfig = {
  fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'SF Mono', 'Consolas', monospace",
  fontSize: 13,
  fontWeight: 400,
  fontWeightBold: 700,
  lineHeight: 1.4,
  letterSpacing: 0,
};

// Default terminal options
export const defaultTerminalOptions = {
  ...terminalFontConfig,
  theme: terminalTheme,
  cursorBlink: true,
  cursorStyle: 'block' as const,
  scrollback: 1000,
  tabStopWidth: 4,
  allowProposedApi: true,
  convertEol: true,
};
