'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Terminal,
  Eye,
  Layout,
  Upload,
  X,
  Wand2,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Trash2,
  Edit3,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTauri, fileApi, shellApi } from '@/lib/tauri';
import { open } from '@tauri-apps/plugin-dialog';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { SkillsPanel } from '@/components/skills/SkillsPanel';
import { useFileStore, type FileNode } from '@/store/fileStore';

interface SidebarProps {
  onFileClick?: (path: string, name: string) => void;
  width?: number;
}

type ViewMode = 'files' | 'skills' | 'board' | 'terminal' | 'preview';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: FileNode | null;
}

interface DialogState {
  type: 'create-file' | 'create-folder' | 'rename' | null;
  parentPath: string;
  currentName: string;
  visible: boolean;
}

export function Sidebar({ onFileClick, width = 256 }: SidebarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('files');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });
  const [dialog, setDialog] = useState<DialogState>({
    type: null,
    parentPath: '',
    currentName: '',
    visible: false,
  });
  const [inputValue, setInputValue] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Use file store
  const {
    projectPath,
    fileTree,
    expandedFolders,
    isLoading,
    loadFolder,
    toggleFolder,
    clearProject,
    refreshFileTree,
  } = useFileStore();

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, node: null });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Set up Tauri drag-drop event listener
  useEffect(() => {
    if (!isTauri) return;

    let unlisten: (() => void) | undefined;

    const setupDragDrop = async () => {
      try {
        const appWindow = getCurrentWebviewWindow();
        unlisten = await appWindow.onDragDropEvent((event) => {
          const eventType = event.payload.type;
          if (eventType === 'drop') {
            const paths = (event.payload as { type: 'drop'; paths: string[] }).paths;
            if (paths && paths.length > 0) {
              loadFolder(paths[0]);
            }
            setIsDraggingOver(false);
          } else if (eventType === 'over' || eventType === 'enter') {
            setIsDraggingOver(true);
          } else if (eventType === 'leave' || eventType === 'cancel') {
            setIsDraggingOver(false);
          }
        });
      } catch (error) {
        console.error('Failed to setup drag-drop listener:', error);
      }
    };

    setupDragDrop();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [loadFolder]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;

    if (files.length > 0) {
      const file = files[0] as any;
      const folderPath = file.path || file.name;

      if (folderPath) {
        await loadFolder(folderPath);
      }
    }
  }, [loadFolder]);

  // Browse for folder using Tauri dialog
  const handleBrowseFolder = async () => {
    try {
      if (isTauri) {
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Project Folder',
        });
        if (selected && typeof selected === 'string') {
          await loadFolder(selected);
        }
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error);
    }
  };

  // Refresh file tree
  const handleRefresh = async () => {
    if (!projectPath) return;
    setIsRefreshing(true);
    try {
      await refreshFileTree();
    } catch (error) {
      console.error('Failed to refresh file tree:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create new file
  const handleCreateFile = (parentPath: string) => {
    setDialog({
      type: 'create-file',
      parentPath,
      currentName: '',
      visible: true,
    });
    setInputValue('');
  };

  // Create new folder
  const handleCreateFolder = (parentPath: string) => {
    setDialog({
      type: 'create-folder',
      parentPath,
      currentName: '',
      visible: true,
    });
    setInputValue('');
  };

  // Rename file/folder
  const handleRename = (node: FileNode) => {
    setDialog({
      type: 'rename',
      parentPath: node.path,
      currentName: node.name,
      visible: true,
    });
    setInputValue(node.name);
  };

  // Delete file/folder
  const handleDelete = async (node: FileNode) => {
    if (!confirm(`Are you sure you want to delete "${node.name}"?`)) return;

    try {
      await fileApi.delete(node.path);
      await handleRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reveal in Finder
  const handleReveal = async (node: FileNode) => {
    try {
      await shellApi.revealInFinder(node.path);
    } catch (error) {
      console.error('Failed to reveal in Finder:', error);
    }
  };

  // Open with default app
  const handleOpenWith = async (node: FileNode) => {
    try {
      await shellApi.openPath(node.path);
    } catch (error) {
      console.error('Failed to open:', error);
    }
  };

  // Submit dialog
  const handleDialogSubmit = async () => {
    if (!inputValue.trim()) return;

    try {
      if (dialog.type === 'create-file') {
        const newPath = `${dialog.parentPath}/${inputValue}`;
        await fileApi.create(newPath, '');
      } else if (dialog.type === 'create-folder') {
        const newPath = `${dialog.parentPath}/${inputValue}`;
        await fileApi.createDirectory(newPath);
      } else if (dialog.type === 'rename') {
        const parts = dialog.parentPath.split('/');
        parts.pop();
        const newPath = `${parts.join('/')}/${inputValue}`;
        // In a real implementation, you'd need a rename command
        // For now, we'll create a new file/folder and delete the old one
        if (isTauri) {
          // Read old content if it's a file
          const content = await fileApi.read(dialog.parentPath);
          await fileApi.create(newPath, content);
          await fileApi.delete(dialog.parentPath);
        }
      }
      await handleRefresh();
      setDialog({ type: null, parentPath: '', currentName: '', visible: false });
    } catch (error) {
      console.error('Failed to complete action:', error);
      alert(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle right-click
  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  // Render file tree node
  const renderFileTree = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            className={cn(
              'w-full flex items-center gap-1.5 py-1 px-2 text-sm font-mono',
              'hover:bg-surface-elevated text-text-secondary hover:text-text-primary',
              'transition-colors'
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-text-muted" />
            ) : (
              <ChevronRight className="w-3 h-3 text-text-muted" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-accent-muted" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-accent-muted" />
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderFileTree(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const ext = node.name.split('.').pop()?.toLowerCase();
    const getFileColor = () => {
      switch (ext) {
        case 'ts':
        case 'tsx':
          return 'text-status-info';
        case 'js':
        case 'jsx':
          return 'text-accent';
        case 'css':
        case 'scss':
          return 'text-status-success';
        case 'json':
          return 'text-status-warning';
        case 'md':
          return 'text-text-muted';
        case 'html':
          return 'text-orange-400';
        default:
          return 'text-text-muted';
      }
    };

    return (
      <button
        key={node.path}
        onClick={() => onFileClick?.(node.path, node.name)}
        onContextMenu={(e) => handleContextMenu(e, node)}
        className={cn(
          'w-full flex items-center gap-1.5 py-1 px-2 text-sm font-mono',
          'hover:bg-surface-elevated text-text-muted hover:text-text-secondary',
          'transition-colors'
        )}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
      >
        <FileText className={cn('w-3.5 h-3.5', getFileColor())} />
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  const navItems = [
    { id: 'files' as ViewMode, icon: Folder, label: 'Files' },
    { id: 'skills' as ViewMode, icon: Wand2, label: 'Skills' },
    { id: 'board' as ViewMode, icon: Layout, label: 'Board' },
    { id: 'terminal' as ViewMode, icon: Terminal, label: 'Terminal' },
    { id: 'preview' as ViewMode, icon: Eye, label: 'Preview' },
  ];

  return (
    <aside style={{ width: `${width}px` }} className="flex flex-col border-r border-border-subtle bg-surface">
      {/* View mode tabs */}
      <div className="flex items-center border-b border-border-subtle">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setViewMode(item.id)}
            className={cn(
              'flex-1 flex items-center justify-center py-2.5',
              'text-text-muted hover:text-text-secondary transition-colors',
              viewMode === item.id && 'text-accent border-b-2 border-accent'
            )}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Content based on view mode */}
      <div
        className={cn(
          'flex-1 overflow-y-auto relative',
          isDraggingOver && 'bg-accent/5'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {viewMode === 'files' && (
          <>
            {/* Project header with toolbar */}
            {projectPath && (
              <div className="border-b border-border-subtle">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-mono text-text-secondary truncate">
                    {projectPath.split('/').pop()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleRefresh}
                      className="btn-icon p-0.5"
                      title="Refresh"
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
                    </button>
                    <button
                      onClick={clearProject}
                      className="btn-icon p-0.5"
                      title="Close project"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-2 pb-2">
                  <button
                    onClick={() => handleCreateFile(projectPath)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-surface-elevated rounded transition-colors"
                    title="New File"
                  >
                    <FilePlus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleCreateFolder(projectPath)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-surface-elevated rounded transition-colors"
                    title="New Folder"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* File tree or drop zone */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-text-muted text-sm font-mono">Loading...</div>
              </div>
            ) : fileTree ? (
              <div className="py-2">{renderFileTree(fileTree)}</div>
            ) : (
              <div
                className={cn(
                  'flex flex-col items-center justify-center py-12 px-4',
                  'border-2 border-dashed m-3 rounded',
                  isDraggingOver
                    ? 'border-accent bg-accent/10'
                    : 'border-border-subtle'
                )}
              >
                <Upload
                  className={cn(
                    'w-8 h-8 mb-3',
                    isDraggingOver ? 'text-accent' : 'text-text-dim'
                  )}
                />
                <p className="text-sm font-mono text-text-muted text-center">
                  {isDraggingOver ? 'Drop folder here' : 'Drag a folder here'}
                </p>
                <p className="text-2xs text-text-dim mt-2 text-center mb-3">
                  or click to browse
                </p>
                <button
                  onClick={handleBrowseFolder}
                  className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-mono rounded transition-colors"
                >
                  Browse
                </button>
              </div>
            )}

            {/* Drag overlay */}
            {isDraggingOver && fileTree && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-accent mx-auto mb-2" />
                  <p className="text-sm font-mono text-accent">
                    Drop to replace project
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === 'skills' && (
          <div className="h-full">
            <SkillsPanel />
          </div>
        )}

        {viewMode === 'board' && (
          <div className="p-4 text-sm text-text-muted font-mono">
            <p>Board view</p>
            <p className="text-2xs mt-2">Switch to see Kanban</p>
          </div>
        )}

        {viewMode === 'terminal' && (
          <div className="p-4 text-sm text-text-muted font-mono">
            <p>Terminal view</p>
            <p className="text-2xs mt-2">Coming soon</p>
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="p-4 text-sm text-text-muted font-mono">
            <p>Preview view</p>
            <p className="text-2xs mt-2">Coming soon</p>
          </div>
        )}
      </div>

      {/* Git status */}
      <div className="border-t border-border-subtle p-3">
        <div className="flex items-center gap-2 text-sm font-mono">
          <GitBranch className="w-3.5 h-3.5 text-status-info" />
          <span className="text-text-secondary">main</span>
          <span className="text-2xs text-text-muted ml-auto">clean</span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.node && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[180px] bg-surface border border-border rounded-sm shadow-lg py-1"
          style={{
            left: `${Math.min(contextMenu.x, window.innerWidth - 200)}px`,
            top: `${Math.min(contextMenu.y, window.innerHeight - 200)}px`,
          }}
        >
          {/* Open */}
          <button
            onClick={() => {
              if (!contextMenu.node) return;
              if (contextMenu.node.type === 'file') {
                onFileClick?.(contextMenu.node.path, contextMenu.node.name);
              } else {
                toggleFolder(contextMenu.node.path);
              }
              setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </button>

          {/* Reveal in Finder */}
          <button
            onClick={() => {
              handleReveal(contextMenu.node!);
              setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Reveal in Finder
          </button>

          {/* Open With (files only) */}
          {contextMenu.node.type === 'file' && (
            <button
              onClick={() => {
                handleOpenWith(contextMenu.node!);
                setContextMenu({ visible: false, x: 0, y: 0, node: null });
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open With
            </button>
          )}

          <div className="h-px bg-border-subtle my-1" />

          {/* Create File/Folder (folders only) */}
          {contextMenu.node.type === 'folder' && (
            <>
              <button
                onClick={() => {
                  handleCreateFile(contextMenu.node!.path);
                  setContextMenu({ visible: false, x: 0, y: 0, node: null });
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5" />
                New File
              </button>
              <button
                onClick={() => {
                  handleCreateFolder(contextMenu.node!.path);
                  setContextMenu({ visible: false, x: 0, y: 0, node: null });
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                New Folder
              </button>
              <div className="h-px bg-border-subtle my-1" />
            </>
          )}

          {/* Rename */}
          <button
            onClick={() => {
              handleRename(contextMenu.node!);
              setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Rename
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              handleDelete(contextMenu.node!);
              setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-status-error hover:bg-surface-elevated transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Create/Rename Dialog */}
      {dialog.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-sm w-80 p-4">
            <h3 className="font-mono text-sm text-text-primary mb-3">
              {dialog.type === 'create-file' && 'New File'}
              {dialog.type === 'create-folder' && 'New Folder'}
              {dialog.type === 'rename' && 'Rename'}
            </h3>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDialogSubmit();
                if (e.key === 'Escape') setDialog({ type: null, parentPath: '', currentName: '', visible: false });
              }}
              placeholder={
                dialog.type === 'rename'
                  ? dialog.currentName
                  : dialog.type === 'create-file'
                    ? 'filename.ext'
                    : 'folder-name'
              }
              className="input-terminal w-full mb-3"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDialog({ type: null, parentPath: '', currentName: '', visible: false })}
                className="px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDialogSubmit}
                disabled={!inputValue.trim()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {dialog.type === 'rename' ? 'Rename' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
