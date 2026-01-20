'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { localAgent } from '@/lib/localAgent';
import { useBoardStore } from '@/store/boardStore';
import { useFileStore } from '@/store/fileStore';
import { fileApi, isTauri } from '@/lib/tauri';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
}

export function ChatPanel({ isOpen, onClose, width = 288 }: ChatPanelProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<'ollama' | 'lm-studio'>('ollama');
  const [model, setModel] = useState('qwen2.5:7b');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const { cards, addCard, deleteCard, columns } = useBoardStore();
  const { projectPath, fileTree } = useFileStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check agent availability on mount when opened
  useEffect(() => {
    if (isOpen) {
      checkAvailability();
    }
  }, [isOpen, provider]);

  const checkAvailability = async () => {
    localAgent.configure({ provider });
    const available = await localAgent.isAvailable();
    setIsAvailable(available);

    if (available) {
      const models = await localAgent.getAvailableModels();
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(model)) {
        setModel(models[0]);
      }
    }
  };

  // Register tools for the agent
  useEffect(() => {
    // Helper to find file in tree
    const findFile = (name: string, node: any = fileTree): string | null => {
      if (!node) return null;
      if (node.type === 'file' && node.name.toLowerCase() === name.toLowerCase()) {
        return node.path;
      }
      if (node.children) {
        for (const child of node.children) {
          const found = findFile(name, child);
          if (found) return found;
        }
      }
      return null;
    };

    // Register card management tools
    localAgent.registerTool({
      name: 'create_card',
      description: 'Create a new to-do card on the kanban board',
      parameters: {
        title: { type: 'string', description: 'The title of the card', required: true },
        description: { type: 'string', description: 'Detailed description of the task' },
        column: { type: 'string', description: 'Column name (To Do, In Progress, Review, Done)' },
      },
      handler: async (args) => {
        const targetColumn = columns.find(c =>
          c.name.toLowerCase().includes(args.column?.toLowerCase() || 'to do')
        );

        if (!targetColumn) {
          return `Error: Could not find column "${args.column || 'To Do'}"`;
        }

        const id = `card_${Date.now()}`;
        addCard({
          id,
          columnId: targetColumn.id,
          title: args.title,
          description: args.description || '',
          folderPath: projectPath || undefined,
          filePaths: [],
          agentConfig: {},
          position: cards.length,
          status: 'idle',
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
          metadata: {},
        });

        return `Created card "${args.title}" in ${targetColumn.name}`;
      },
    });

    localAgent.registerTool({
      name: 'list_cards',
      description: 'List all cards on the kanban board',
      parameters: {},
      handler: async () => {
        const byColumn = columns.map(col => {
          const colCards = cards.filter(c => c.columnId === col.id);
          return `${col.name}: ${colCards.map(c => `- ${c.title}${c.description ? ': ' + c.description.slice(0, 50) + '...' : ''}`).join('\n') || '(empty)'}`;
        });
        return byColumn.join('\n\n');
      },
    });

    localAgent.registerTool({
      name: 'scan_project',
      description: 'Scan the project folder and return the file structure',
      parameters: {},
      handler: async () => {
        if (!fileTree) {
          return 'No project is currently loaded.';
        }

        const formatTree = (node: any, depth = 0): string => {
          const indent = '  '.repeat(depth);
          let result = `${indent}${node.name}${node.type === 'folder' ? '/' : ''}\n`;
          if (node.children) {
            for (const child of node.children) {
              result += formatTree(child, depth + 1);
            }
          }
          return result;
        };

        return `Project structure:\n${formatTree(fileTree)}`;
      },
    });

    localAgent.registerTool({
      name: 'read_file',
      description: 'Read the contents of a file by name or path',
      parameters: {
        filename: { type: 'string', description: 'The filename (e.g., "README.md") or relative path' },
      },
      handler: async (args) => {
        if (!isTauri) {
          return 'File reading only available in Tauri app';
        }

        let filePath = args.filename;

        if (!filePath.includes('/') && !filePath.includes('\\')) {
          const found = findFile(filePath);
          if (found) {
            filePath = found;
          } else {
            filePath = projectPath ? `${projectPath}/${args.filename}` : args.filename;
          }
        }

        try {
          const content = await fileApi.read(filePath);
          const maxLength = 3000;
          const truncated = content.length > maxLength
            ? content.slice(0, maxLength) + '\n... (truncated)'
            : content;
          return `File: ${args.filename}\n\n${truncated}`;
        } catch (error) {
          return `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },
    });

    localAgent.registerTool({
      name: 'read_documentation',
      description: 'Read project documentation files (README.md, CONTRIBUTING.md, docs folder)',
      parameters: {},
      handler: async () => {
        if (!isTauri || !fileTree) {
          return 'No project loaded or not in Tauri app';
        }

        const docFiles: string[] = [];
        const docNames = ['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'package.json'];
        for (const name of docNames) {
          const found = findFile(name);
          if (found) docFiles.push(found);
        }

        if (docFiles.length === 0) {
          return 'No documentation files found (README.md, docs/, etc.)';
        }

        let result = `Found ${docFiles.length} documentation file(s):\n\n`;

        for (const filePath of docFiles.slice(0, 3)) {
          try {
            const content = await fileApi.read(filePath);
            const fileName = filePath.split('/').pop() || filePath;
            const maxLength = 1000;
            const truncated = content.length > maxLength
              ? content.slice(0, maxLength) + '\n... (truncated)'
              : content;
            result += `## ${fileName}\n\n${truncated}\n\n`;
          } catch (error) {
            result += `## ${filePath}\n\nError reading file\n\n`;
          }
        }

        return result;
      },
    });

    localAgent.registerTool({
      name: 'delete_card',
      description: 'Delete a card by its title (or exact/partial match)',
      parameters: {
        title: { type: 'string', description: 'The title of the card to delete', required: true },
      },
      handler: async (args) => {
        // Find card by title (case-insensitive, partial match)
        const card = cards.find(c => c.title.toLowerCase().includes(args.title.toLowerCase()));

        if (!card) {
          return `Card not found: "${args.title}". Available cards: ${cards.map(c => c.title).join(', ')}`;
        }

        deleteCard(card.id);
        return `Deleted card: "${card.title}"`;
      },
    });

    localAgent.registerTool({
      name: 'delete_all_cards_in_column',
      description: 'Delete all cards in a specific column (To Do, In Progress, Review, Done)',
      parameters: {
        column: { type: 'string', description: 'Column name (e.g., "To Do", "In Progress")', required: true },
      },
      handler: async (args) => {
        const targetColumn = columns.find(c =>
          c.name.toLowerCase().includes(args.column.toLowerCase())
        );

        if (!targetColumn) {
          return `Column not found: "${args.column}". Available columns: ${columns.map(c => c.name).join(', ')}`;
        }

        const cardsToDelete = cards.filter(c => c.columnId === targetColumn.id);

        if (cardsToDelete.length === 0) {
          return `No cards found in "${targetColumn.name}" column.`;
        }

        // Delete all cards in the column
        for (const card of cardsToDelete) {
          deleteCard(card.id);
        }

        return `Deleted ${cardsToDelete.length} card(s) from "${targetColumn.name}": ${cardsToDelete.map(c => c.title).join(', ')}`;
      },
    });

    return () => {
      localAgent.unregisterTool('create_card');
      localAgent.unregisterTool('list_cards');
      localAgent.unregisterTool('scan_project');
      localAgent.unregisterTool('read_file');
      localAgent.unregisterTool('read_documentation');
      localAgent.unregisterTool('delete_card');
      localAgent.unregisterTool('delete_all_cards_in_column');
    };
  }, [columns, cards, addCard, deleteCard, projectPath, fileTree]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await localAgent.chat(userMessage, {
        context: {
          projectPath: projectPath || undefined,
          fileTree: fileTree,
          currentCards: cards,
        },
      });

      if (response.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${response.error}`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.content,
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <aside style={{ width: `${width}px` }} className="border-l border-border-subtle bg-surface flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Sparkles className={cn(
            'w-4 h-4',
            isAvailable === false ? 'text-status-error' : 'text-accent'
          )} />
          <span className="font-mono text-sm text-text-primary">
            Local Agent
          </span>
          {isAvailable !== null && (
            <span className={cn(
              'text-2xs px-1.5 py-0.5 rounded font-mono',
              isAvailable ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'
            )}>
              {isAvailable ? 'Connected' : 'Disconnected'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-icon p-1"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="btn-icon p-1"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 border-b border-border-subtle bg-surface-elevated">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-text-secondary">Provider:</label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value as 'ollama' | 'lm-studio');
                  setIsAvailable(null);
                }}
                className="input-terminal text-xs py-1 px-2 flex-1"
              >
                <option value="ollama">Ollama</option>
                <option value="lm-studio">LM Studio</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-text-secondary">Model:</label>
              {availableModels.length > 0 ? (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="input-terminal text-xs py-1 px-2 flex-1"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="qwen2.5:7b"
                  className="input-terminal text-xs py-1 px-2 flex-1"
                />
              )}
            </div>
            <button
              onClick={checkAvailability}
              className="btn-ghost text-xs py-1 px-2 w-full"
            >
              Check Connection
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-6 h-6 text-accent-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted font-mono">
              Ask me to create cards, analyze your project, or suggest improvements.
            </p>
            <p className="text-2xs text-text-dim mt-2 font-mono">
              Try: "Create 3 tasks for building a login page"
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-full rounded-sm px-2 py-1.5 text-sm',
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-surface-elevated text-text-secondary'
              )}
            >
              <p className="font-mono whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-elevated rounded-sm px-2 py-1.5">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span className="font-mono">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-border-subtle">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAvailable ? 'Ask the agent...' : 'Connect to local agent first...'}
          disabled={!isAvailable || isLoading}
          rows={2}
          className={cn(
            'input-terminal flex-1 text-sm py-2 px-3 min-h-[60px] max-h-[200px] resize-y',
            !isAvailable && 'opacity-50'
          )}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !isAvailable || isLoading}
          className={cn(
            'btn-primary p-1.5 mt-auto',
            (!input.trim() || !isAvailable || isLoading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
