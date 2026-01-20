'use client';

import { useEffect, useState, useRef } from 'react';
import { Board } from '@/components/kanban/Board';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { SignalFeed } from '@/components/signal/SignalFeed';
import { TimelinePanel } from '@/components/timeline/TimelinePanel';
import { CodeEditor } from '@/components/editor';
import { ChatPanel } from '@/components/chat';
import { TerminalPanel } from '@/components/terminal/TerminalPanel';
import { ResizeHandle } from '@/components/layout/ResizeHandle';
import { useBoardStore } from '@/store/boardStore';
import { useTerminalStore } from '@/store/terminalStore';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import type { Board as BoardType, Column } from '@/types';

type MainView = 'board' | 'editor';

// Demo data for initial state
const DEMO_BOARD: BoardType = {
  id: 'board-1',
  projectId: 'project-1',
  name: 'Main Board',
  position: 0,
  createdAt: Math.floor(Date.now() / 1000),
};

const DEMO_COLUMNS: Column[] = [
  {
    id: 'col-todo',
    boardId: 'board-1',
    name: 'To Do',
    position: 0,
    automationRules: [],
    createdAt: Math.floor(Date.now() / 1000),
  },
  {
    id: 'col-progress',
    boardId: 'board-1',
    name: 'In Progress',
    position: 1,
    automationRules: [],
    createdAt: Math.floor(Date.now() / 1000),
  },
  {
    id: 'col-review',
    boardId: 'board-1',
    name: 'Review',
    position: 2,
    automationRules: [],
    createdAt: Math.floor(Date.now() / 1000),
  },
  {
    id: 'col-done',
    boardId: 'board-1',
    name: 'Done',
    position: 3,
    automationRules: [],
    createdAt: Math.floor(Date.now() / 1000),
  },
];

export default function Home() {
  const { setBoards, setColumns, setCurrentProject, boards, columns } = useBoardStore();
  const [showSignalFeed, setShowSignalFeed] = useState(true);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [mainView, setMainView] = useState<MainView>('board');
  const [openFilePath, setOpenFilePath] = useState<string | null>(null);

  // Resizable sidebar
  const sidebarResize = useResizablePanel({
    defaultWidth: 256,
    minWidth: 180,
    maxWidth: 600,
    side: 'left',
    storageKey: 'sidebar-width',
  });

  // Resizable chat panel
  const chatPanelResize = useResizablePanel({
    defaultWidth: 288,
    minWidth: 250,
    maxWidth: 500,
    side: 'right',
    storageKey: 'chat-panel-width',
  });

  // Resizable terminal panel
  const terminalPanelResize = useResizablePanel({
    defaultHeight: 250,
    minHeight: 150,
    maxHeight: 500,
    side: 'bottom',
    storageKey: 'terminal-panel-height',
  });

  // Terminal store
  const { isVisible: isTerminalVisible, togglePanel: toggleTerminal } = useTerminalStore();

  useEffect(() => {
    // Only initialize with demo data if there's no existing data (first run)
    if (boards.length === 0 && columns.length === 0) {
      setCurrentProject('project-1');
      setBoards([DEMO_BOARD]);
      setColumns(DEMO_COLUMNS);
    }
  }, [setBoards, setColumns, setCurrentProject, boards, columns]);

  // Handle file click from sidebar
  const handleFileClick = (path: string, name: string) => {
    setMainView('editor');
    setOpenFilePath(path);
    if ((window as any).openFileInEditor) {
      (window as any).openFileInEditor(path, name);
    }
  };

  // Switch back to board view
  const showBoardView = () => {
    setMainView('board');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <Header
        onToggleSignalFeed={() => setShowSignalFeed(!showSignalFeed)}
        onToggleChatPanel={() => setShowChatPanel(!showChatPanel)}
        onToggleTimeline={() => setShowTimeline(!showTimeline)}
        onToggleTerminal={toggleTerminal}
        showChatPanel={showChatPanel}
        showTimeline={showTimeline}
        showTerminal={isTerminalVisible}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="flex">
          <Sidebar onFileClick={handleFileClick} width={sidebarResize.width} />
          <ResizeHandle
            side="left"
            isResizing={sidebarResize.isResizing}
            {...sidebarResize.resizeHandleProps}
          />
        </div>

        {/* Main area - Board or Editor with Terminal */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Content area */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {mainView === 'board' ? (
              <Board boardId="board-1" />
            ) : (
              <div className="h-full flex flex-col">
                {/* Editor header with back button */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-surface-elevated">
                  <button
                    onClick={showBoardView}
                    className="text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
                  >
                    ← Back to Board
                  </button>
                  <span className="text-xs font-mono text-text-dim">Code Editor</span>
                </div>
                <CodeEditor className="flex-1" />
              </div>
            )}
          </div>

          {/* Terminal Panel */}
          <TerminalPanel
            height={terminalPanelResize.height || 250}
            onResizeStart={terminalPanelResize.resizeHandleProps.onMouseDown}
            isResizing={terminalPanelResize.isResizing}
          />
        </main>

        {/* Right Side Panels */}
        <div className="flex">
          {/* Signal Feed */}
          {showSignalFeed && (
            <aside className="w-72 border-l border-border-subtle">
              <SignalFeed />
            </aside>
          )}

          {/* Agent Timeline Panel */}
          {showTimeline && (
            <aside className="w-80 border-l border-border-subtle">
              <TimelinePanel />
            </aside>
          )}

          {/* Local Agent Chat Panel */}
          {showChatPanel && (
            <>
              <ResizeHandle
                side="right"
                isResizing={chatPanelResize.isResizing}
                {...chatPanelResize.resizeHandleProps}
              />
              <ChatPanel
                isOpen={showChatPanel}
                onClose={() => setShowChatPanel(false)}
                width={chatPanelResize.width}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
