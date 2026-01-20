'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Terminal as XTermType } from '@xterm/xterm';
import type { FitAddon as FitAddonType } from '@xterm/addon-fit';
import type { SearchAddon as SearchAddonType } from '@xterm/addon-search';
import { cn } from '@/lib/utils';

interface TerminalProps {
  id: string;
  workingDirectory?: string;
  isActive?: boolean;
  className?: string;
}

// Mock command handler for browser mode
const mockCommands: Record<string, (args: string[], term: XTermType, cwd: string) => string | void> = {
  help: () => `
Available commands:
  help          Show this help message
  clear         Clear terminal screen
  pwd           Print working directory
  ls            List files (mock)
  cd <dir>      Change directory (mock)
  echo <text>   Print text
  date          Show current date
  whoami        Show current user
  cat <file>    Read file (mock)
  npm <cmd>     NPM commands (mock)
  git <cmd>     Git commands (mock)

Note: This is a browser mock terminal. Full PTY support available in Tauri.
`.trim(),

  clear: (_, term) => {
    term.clear();
  },

  pwd: (_, __, cwd) => cwd,

  ls: () => `
drwxr-xr-x  node_modules/
drwxr-xr-x  src/
-rw-r--r--  package.json
-rw-r--r--  package-lock.json
-rw-r--r--  tsconfig.json
-rw-r--r--  README.md
-rw-r--r--  next.config.js
`.trim(),

  echo: (args) => args.join(' '),

  date: () => new Date().toString(),

  whoami: () => 'developer',

  cat: (args) => {
    if (args.length === 0) return 'cat: missing file operand';
    const file = args[0];
    if (file === 'package.json') {
      return `{
  "name": "viraith-ide",
  "version": "0.1.0",
  "description": "AI-Native IDE for developers"
}`;
    }
    return `cat: ${file}: No such file or directory (mock)`;
  },

  npm: (args) => {
    const cmd = args[0];
    if (cmd === 'run') {
      return `> ${args[1] || 'dev'}
Starting development server...
✓ Ready on http://localhost:3000 (mock)`;
    }
    if (cmd === 'install') {
      return `Installing packages... done (mock)`;
    }
    return `npm ${args.join(' ')}: command simulated (mock)`;
  },

  git: (args) => {
    const cmd = args[0];
    if (cmd === 'status') {
      return `On branch main
Changes not staged for commit:
  modified:   src/app/page.tsx
  modified:   src/components/terminal/Terminal.tsx (mock)`;
    }
    if (cmd === 'branch') {
      return `* main
  feature/terminal
  develop (mock)`;
    }
    return `git ${args.join(' ')}: command simulated (mock)`;
  },

  cd: (args, _, cwd) => {
    if (args.length === 0 || args[0] === '~') return '~';
    if (args[0] === '..') {
      const parts = cwd.split('/').filter(Boolean);
      parts.pop();
      return parts.length > 0 ? '/' + parts.join('/') : '~';
    }
    if (args[0].startsWith('/')) return args[0];
    return cwd === '~' ? `~/${args[0]}` : `${cwd}/${args[0]}`;
  },
};

export function Terminal({ id, workingDirectory = '~', isActive = true, className }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTermType | null>(null);
  const fitAddonRef = useRef<FitAddonType | null>(null);
  const searchAddonRef = useRef<SearchAddonType | null>(null);
  const [currentDir, setCurrentDir] = useState(workingDirectory);
  const [isInitialized, setIsInitialized] = useState(false);
  const inputBufferRef = useRef<string>('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const promptWrittenRef = useRef<boolean>(false);

  const writePrompt = useCallback((term: XTermType) => {
    if (promptWrittenRef.current) return;
    term.write(`\r\n\x1b[38;2;201;166;115m${currentDir} >\x1b[0m `);
    promptWrittenRef.current = true;
  }, [currentDir]);

  const handleCommand = useCallback((term: XTermType, command: string) => {
    const trimmed = command.trim();
    if (!trimmed) {
      promptWrittenRef.current = false;
      writePrompt(term);
      return;
    }

    // Add to history
    historyRef.current.push(trimmed);
    historyIndexRef.current = historyRef.current.length;

    const [cmd, ...args] = trimmed.split(/\s+/);
    const handler = mockCommands[cmd.toLowerCase()];

    if (handler) {
      const result = handler(args, term, currentDir);
      if (cmd.toLowerCase() === 'cd' && result) {
        setCurrentDir(result as string);
        term.write(`\r\n\x1b[38;2;201;166;115m${result} >\x1b[0m `);
        promptWrittenRef.current = true;
        return;
      }
      if (result) {
        term.write(`\r\n${result}`);
      }
    } else {
      term.write(`\r\n\x1b[38;2;155;91;91mCommand not found: ${cmd}\x1b[0m`);
      term.write(`\r\nType 'help' for available commands`);
    }

    promptWrittenRef.current = false;
    writePrompt(term);
  }, [currentDir, writePrompt]);

  // Initialize terminal with dynamic imports
  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    let isMounted = true;

    const initTerminal = async () => {
      // Dynamic imports for browser-only modules
      const [
        { Terminal: XTerm },
        { FitAddon },
        { SearchAddon },
        { WebLinksAddon },
        { defaultTerminalOptions }
      ] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
        import('@xterm/addon-search'),
        import('@xterm/addon-web-links'),
        import('@/lib/terminalTheme')
      ]);

      if (!isMounted || !containerRef.current) return;

      const term = new XTerm({
        ...defaultTerminalOptions,
        rows: 10,
        cols: 80,
      });

      const fitAddon = new FitAddon();
      const searchAddon = new SearchAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(searchAddon);
      term.loadAddon(webLinksAddon);

      term.open(containerRef.current);

      // Initial fit
      setTimeout(() => {
        fitAddon.fit();
      }, 0);

      // Welcome message
      term.writeln('\x1b[38;2;201;166;115mVIRAITH Terminal v0.1.0\x1b[0m');
      term.writeln('\x1b[38;2;112;112;112mType "help" for available commands\x1b[0m');
      promptWrittenRef.current = false;
      term.write(`\r\n\x1b[38;2;201;166;115m${currentDir} >\x1b[0m `);
      promptWrittenRef.current = true;

      terminalRef.current = term;
      fitAddonRef.current = fitAddon;
      searchAddonRef.current = searchAddon;
      setIsInitialized(true);
    };

    initTerminal();

    return () => {
      isMounted = false;
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
        searchAddonRef.current = null;
      }
    };
  }, []);

  // Handle input
  useEffect(() => {
    if (!isInitialized) return;
    const term = terminalRef.current;
    if (!term) return;

    const dataDisposable = term.onData((data) => {
      const code = data.charCodeAt(0);

      // Enter
      if (code === 13) {
        handleCommand(term, inputBufferRef.current);
        inputBufferRef.current = '';
        return;
      }

      // Backspace
      if (code === 127) {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Ctrl+C
      if (code === 3) {
        term.write('^C');
        inputBufferRef.current = '';
        promptWrittenRef.current = false;
        writePrompt(term);
        return;
      }

      // Ctrl+L (clear)
      if (code === 12) {
        term.clear();
        inputBufferRef.current = '';
        promptWrittenRef.current = false;
        writePrompt(term);
        return;
      }

      // Ctrl+K (clear line)
      if (code === 11) {
        const len = inputBufferRef.current.length;
        term.write('\b \b'.repeat(len));
        inputBufferRef.current = '';
        return;
      }

      // Arrow keys (escape sequences)
      if (data.startsWith('\x1b[')) {
        if (data === '\x1b[A') {
          // Up arrow - history
          if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            const historyCmd = historyRef.current[historyIndexRef.current];
            const len = inputBufferRef.current.length;
            term.write('\b \b'.repeat(len));
            term.write(historyCmd);
            inputBufferRef.current = historyCmd;
          }
        } else if (data === '\x1b[B') {
          // Down arrow - history
          if (historyIndexRef.current < historyRef.current.length - 1) {
            historyIndexRef.current++;
            const historyCmd = historyRef.current[historyIndexRef.current];
            const len = inputBufferRef.current.length;
            term.write('\b \b'.repeat(len));
            term.write(historyCmd);
            inputBufferRef.current = historyCmd;
          } else {
            historyIndexRef.current = historyRef.current.length;
            const len = inputBufferRef.current.length;
            term.write('\b \b'.repeat(len));
            inputBufferRef.current = '';
          }
        }
        return;
      }

      // Regular printable characters
      if (code >= 32 && code < 127) {
        inputBufferRef.current += data;
        term.write(data);
      }
    });

    return () => {
      dataDisposable.dispose();
    };
  }, [isInitialized, handleCommand, writePrompt]);

  // Handle resize
  useEffect(() => {
    const fitAddon = fitAddonRef.current;
    if (!fitAddon || !isActive) return;

    const handleResize = () => {
      setTimeout(() => {
        fitAddon.fit();
      }, 0);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive]);

  // Re-fit when becoming active
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 0);
    }
  }, [isActive]);

  // Focus terminal when active
  useEffect(() => {
    if (isActive && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full w-full terminal-container',
        !isActive && 'hidden',
        className
      )}
      data-terminal-id={id}
    />
  );
}
