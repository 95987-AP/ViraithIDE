'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2, X, Plus } from 'lucide-react';

interface VibeTerminalProps {
  projectPath?: string;
}

export function VibeTerminal({ projectPath = '~' }: VibeTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output'; content: string }>>([
    { type: 'output', content: 'VIRAITH Terminal v0.1.0' },
    { type: 'output', content: 'Type "help" for available commands' },
    { type: 'output', content: '' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  // In production, this would use xterm.js with PTY
  // For now, we'll use a simple implementation

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add input to history
    setHistory((prev) => [...prev, { type: 'input', content: `> ${trimmed}` }]);

    // Process command (placeholder implementation)
    let output = '';
    switch (trimmed.toLowerCase()) {
      case 'help':
        output = `Available commands:
  help      - Show this help message
  clear     - Clear terminal
  pwd       - Print working directory
  ls        - List files (placeholder)
  git       - Git commands (placeholder)

Note: Full terminal integration coming in Phase 2`;
        break;
      case 'clear':
        setHistory([]);
        setCurrentInput('');
        return;
      case 'pwd':
        output = projectPath;
        break;
      case 'ls':
        output = 'src/  node_modules/  package.json  README.md  (placeholder)';
        break;
      default:
        if (trimmed.startsWith('git ')) {
          output = `[git] Command: ${trimmed}\nGit integration placeholder - Phase 2`;
        } else {
          output = `Command not found: ${trimmed}\nFull shell access coming in Phase 2`;
        }
    }

    setHistory((prev) => [...prev, { type: 'output', content: output }]);
    setCurrentInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(currentInput);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when clicking terminal
  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-background border border-border-subtle rounded-sm',
        isMaximized ? 'fixed inset-4 z-50' : 'h-64'
      )}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-surface">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-text-primary">Terminal</span>
          <span className="text-2xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
            {projectPath}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-icon p-1" title="New terminal">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            className="btn-icon p-1"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button className="btn-icon p-1" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm cursor-text"
        onClick={focusInput}
      >
        {history.map((entry, i) => (
          <div
            key={i}
            className={cn(
              'whitespace-pre-wrap',
              entry.type === 'input' ? 'text-accent' : 'text-text-secondary'
            )}
          >
            {entry.content}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-accent-muted">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-text-primary caret-accent"
            autoFocus
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-border-subtle text-2xs text-text-dim font-mono">
        <span>zsh</span>
        <div className="flex items-center gap-3">
          <span>Ctrl+L: Clear</span>
          <span>Ctrl+C: Cancel</span>
        </div>
      </div>
    </div>
  );
}
