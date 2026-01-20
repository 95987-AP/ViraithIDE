'use client';

import { useState, useRef } from 'react';
import {
  Settings,
  Radio,
  Search,
  Command,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface HeaderProps {
  onToggleSignalFeed: () => void;
  onToggleChatPanel?: () => void;
  showChatPanel?: boolean;
}

export function Header({ onToggleSignalFeed, onToggleChatPanel, showChatPanel }: HeaderProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindowRef = useRef<ReturnType<typeof getCurrentWindow> | null>(null);

  const getAppWindow = () => {
    if (!appWindowRef.current && typeof window !== 'undefined') {
      appWindowRef.current = getCurrentWindow();
    }
    return appWindowRef.current;
  };

  const handleClose = async () => {
    const window = getAppWindow();
    if (window) {
      await window.close();
    }
  };

  const handleMinimize = async () => {
    const window = getAppWindow();
    if (window) {
      await window.minimize();
    }
  };

  const handleToggleMaximize = async () => {
    const window = getAppWindow();
    if (window) {
      await window.toggleMaximize();
      setIsMaximized(!isMaximized);
    }
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border-subtle bg-surface">
      {/* Left - Logo and project */}
      <div className="flex items-center gap-4">
        {/* Window controls (macOS style) */}
        <div className="flex items-center gap-1.5">
          <button
            className="w-3 h-3 rounded-full bg-status-error/80 hover:bg-status-error transition-colors"
            onClick={handleClose}
            title="Close"
          />
          <button
            className="w-3 h-3 rounded-full bg-status-warning/80 hover:bg-status-warning transition-colors"
            onClick={handleMinimize}
            title="Minimize"
          />
          <button
            className="w-3 h-3 rounded-full bg-status-success/80 hover:bg-status-success transition-colors"
            onClick={handleToggleMaximize}
            title="Maximize"
          />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-accent font-mono font-bold text-sm">VIRAITH</span>
          <span className="text-text-dim font-mono text-xs">v0.1.0</span>
        </div>

        {/* Project name */}
        <div className="flex items-center gap-1 text-text-secondary text-sm font-mono">
          <span className="text-text-muted">/</span>
          <span>my-project</span>
        </div>
      </div>

      {/* Center - Command palette trigger */}
      <button
        className={cn(
          'flex items-center gap-2 px-3 py-1.5',
          'bg-surface-elevated border border-border-subtle rounded-sm',
          'text-text-muted text-sm font-mono',
          'hover:border-border hover:text-text-secondary transition-colors'
        )}
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search...</span>
        <div className="flex items-center gap-0.5 ml-4 text-2xs">
          <kbd className="px-1 py-0.5 bg-background rounded text-text-dim">
            <Command className="w-2.5 h-2.5 inline" />
          </kbd>
          <kbd className="px-1 py-0.5 bg-background rounded text-text-dim">K</kbd>
        </div>
      </button>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSignalFeed}
          className={cn(
            'btn-icon',
            !showChatPanel && 'text-accent'
          )}
          title="Toggle Signal Feed"
        >
          <Radio className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleChatPanel}
          className={cn(
            'btn-icon',
            showChatPanel && 'text-accent'
          )}
          title="Local AI Agent"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button className="btn-icon" title="Settings">
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Window controls (Windows style for non-mac) */}
        <button
          className="btn-icon"
          onClick={handleToggleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
