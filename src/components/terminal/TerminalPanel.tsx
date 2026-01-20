'use client';

import { useCallback } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { Terminal } from './Terminal';
import { useTerminalStore } from '@/store/terminalStore';
import { cn } from '@/lib/utils';

interface TerminalPanelProps {
  height: number;
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

export function TerminalPanel({ height, onResizeStart, isResizing }: TerminalPanelProps) {
  const {
    isVisible,
    sessions,
    activeSessionId,
    togglePanel,
    createSession,
    closeSession,
    setActiveSession,
  } = useTerminalStore();

  const handleNewTerminal = useCallback(() => {
    createSession();
  }, [createSession]);

  const handleCloseTerminal = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    closeSession(id);
  }, [closeSession]);

  if (!isVisible) return null;

  return (
    <div
      className="flex flex-col bg-background border-t border-border-subtle"
      style={{ height }}
    >
      {/* Resize handle */}
      <div
        className={cn(
          'h-1 cursor-ns-resize hover:bg-accent/30 transition-colors',
          isResizing && 'bg-accent/50'
        )}
        onMouseDown={onResizeStart}
      />

      {/* Terminal header with tabs */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border-subtle bg-surface">
        {/* Tab bar */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1 text-xs font-mono rounded-sm transition-colors group',
                session.id === activeSessionId
                  ? 'bg-background text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              )}
            >
              <span className="truncate max-w-[120px]">{session.name}</span>
              <button
                onClick={(e) => handleCloseTerminal(e, session.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-surface-elevated rounded transition-opacity"
                title="Close terminal"
              >
                <X className="w-3 h-3" />
              </button>
            </button>
          ))}

          {/* New terminal button */}
          <button
            onClick={handleNewTerminal}
            className="p-1 text-text-muted hover:text-text-secondary hover:bg-surface-elevated rounded-sm transition-colors"
            title="New terminal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <span className="text-2xs text-text-dim font-mono mr-2">
            {sessions.length > 0 && `${sessions.findIndex(s => s.id === activeSessionId) + 1}/${sessions.length}`}
          </span>
          <button
            onClick={togglePanel}
            className="p-1 text-text-muted hover:text-text-secondary hover:bg-surface-elevated rounded-sm transition-colors"
            title="Minimize terminal"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={togglePanel}
            className="p-1 text-text-muted hover:text-text-secondary hover:bg-surface-elevated rounded-sm transition-colors"
            title="Close terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal instances */}
      <div className="flex-1 min-h-0 relative">
        {sessions.map((session) => (
          <Terminal
            key={session.id}
            id={session.id}
            workingDirectory={session.workingDirectory}
            isActive={session.id === activeSessionId}
          />
        ))}

        {sessions.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-muted font-mono text-sm">
            <button
              onClick={handleNewTerminal}
              className="flex items-center gap-2 px-4 py-2 hover:bg-surface-elevated rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Terminal
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-border-subtle bg-surface text-2xs font-mono text-text-dim">
        <span>zsh</span>
        <div className="flex items-center gap-4">
          <span>Ctrl+L: Clear</span>
          <span>Ctrl+K: Clear Line</span>
          <span>Ctrl+C: Cancel</span>
        </div>
      </div>
    </div>
  );
}
