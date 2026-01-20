'use client';

import { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { Card as CardType } from '@/types';
import { useBoardStore } from '@/store/boardStore';
import { useSkillsStore } from '@/store/skillsStore';
import { useFileStore } from '@/store/fileStore';
import { useTimelineStore } from '@/store/timelineStore';
import { cn, truncatePath } from '@/lib/utils';
import { glmAgent, isAgentConfigured } from '@/lib/agent';
import {
  Folder,
  Play,
  MoreHorizontal,
  Trash2,
  GitBranch,
  Clock,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Send,
  X,
  Loader2,
  Wand2,
  XCircle,
  Edit,
  Check,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';

interface CardProps {
  card: CardType;
  isDragging?: boolean;
}

export function Card({ card, isDragging }: CardProps) {
  const {
    deleteCard,
    attachFolderToCard,
    updateCardStatus,
    updateCard,
    moveCard,
    columns,
    findInProgressColumn,
    findDoneColumn,
  } = useBoardStore();
  const { skills } = useSkillsStore();
  const { projectPath } = useFileStore();
  const { startExecution, completeExecution } = useTimelineStore();
  const [isDraggingFolder, setIsDraggingFolder] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [attachedSkillIds, setAttachedSkillIds] = useState<string[]>(
    (card.metadata.attachedSkillIds as string[]) || []
  );
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description || '');

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Set up droppable for skills
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `card-${card.id}`,
    data: {
      type: 'card',
      cardId: card.id,
    },
  });

  // Combine refs
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setSortableRef(node);
      setDroppableRef(node);
    },
    [setSortableRef, setDroppableRef]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFolder(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // @ts-expect-error - path exists in Electron/Tauri context
        const folderPath = files[0].path || files[0].name;
        attachFolderToCard(card.id, folderPath);
      }
    },
    [card.id, attachFolderToCard]
  );

  const removeSkill = (skillId: string) => {
    const newSkillIds = attachedSkillIds.filter((id) => id !== skillId);
    setAttachedSkillIds(newSkillIds);
    updateCard(card.id, {
      metadata: {
        ...card.metadata,
        attachedSkillIds: newSkillIds,
      },
    });
  };

  const handleExecute = async () => {
    updateCardStatus(card.id, 'executing');
    setTimeout(() => {
      updateCardStatus(card.id, 'review');
    }, 2000);
  };

  // Open agent dialog with pre-filled prompt
  const openAgentWithPrompt = (taskType: 'feature' | 'bugfix' | 'refactor' | 'general' = 'general') => {
    const prompt = glmAgent.generatePromptTemplate(taskType, card.title, card.description);
    setAgentPrompt(prompt);
    setAgentResponse('');
    setShowAgentDialog(true);
  };

  // Send prompt to agent
  const sendToAgent = async () => {
    if (!agentPrompt.trim()) return;

    if (!isAgentConfigured()) {
      setAgentResponse('⚠️ API key not configured. Please set NEXT_PUBLIC_GLM_API_KEY in .env.local');
      return;
    }

    setIsAgentLoading(true);
    setAgentResponse('');

    try {
      const response = await glmAgent.executeTask(agentPrompt, {
        folderPath: card.folderPath || undefined,
      });

      if (response.success) {
        setAgentResponse(response.content);
      } else {
        setAgentResponse(`Error: ${response.error}`);
      }
    } catch (error) {
      setAgentResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Get current board ID from the card's column
  const getCurrentBoardId = useCallback(() => {
    const column = columns.find((c) => c.id === card.columnId);
    return column?.boardId;
  }, [columns, card.columnId]);

  // Run agent automatically with card title + description
  const runAgent = async () => {
    // Validate card has description
    if (!card.description?.trim()) {
      // Show agent dialog with warning
      setAgentResponse('⚠️ Please add a description to the card before running the agent.');
      setShowAgentDialog(true);
      return;
    }

    // Check for working directory (card folder or project path)
    const workingPath = card.folderPath || projectPath;
    if (!workingPath) {
      setAgentResponse('⚠️ No project folder open. Please open a folder in the sidebar first, or attach a folder to this card.');
      setShowAgentDialog(true);
      return;
    }

    // Check API key
    if (!isAgentConfigured()) {
      setAgentResponse('⚠️ API key not configured. Please set NEXT_PUBLIC_OPENROUTER_API_KEY in .env.local');
      setShowAgentDialog(true);
      return;
    }

    const boardId = getCurrentBoardId();
    if (!boardId) return;

    setIsRunningAgent(true);

    // Move to "In Progress" column
    const inProgressColumn = findInProgressColumn(boardId);
    if (inProgressColumn && inProgressColumn.id !== card.columnId) {
      moveCard(card.id, inProgressColumn.id);
    }

    // Set status to executing
    updateCardStatus(card.id, 'executing');

    // Build skills context and get skill names for timeline
    let skillsContext = '';
    const skillNames: string[] = [];
    if (attachedSkillIds.length > 0) {
      const attachedSkills = attachedSkillIds
        .map((id) => skills.find((s) => s.id === id))
        .filter((skill): skill is NonNullable<typeof skill> => skill !== undefined);
      skillsContext = '\n## Assigned Skills\n' +
        attachedSkills
          .map((skill) => `### ${skill.name}\n${skill.description}\n${skill.content}`)
          .join('\n\n---\n');
      skillNames.push(...attachedSkills.map((s) => s.name));
    }

    // Use card's folder path or fall back to project path
    const finalWorkingPath = card.folderPath || projectPath || undefined;

    // Generate auto-prompt from card data
    const autoPrompt = glmAgent.generateAutoPrompt(
      card.title,
      card.description,
      finalWorkingPath,
      skillsContext || undefined
    );

    // Start timeline execution tracking
    const executionId = startExecution({
      cardId: card.id,
      cardTitle: card.title,
      cardDescription: card.description,
      agentType: card.agentConfig.type || 'general',
      model: 'deepseek-chat',
      skillsUsed: skillNames,
      promptUsed: autoPrompt,
      inputContext: {
        folderPath: finalWorkingPath,
        attachedSkills: skillNames,
      },
    });

    try {
      // Call GLM-4 API with file operations support
      const response = await glmAgent.executeTaskWithFiles(autoPrompt, {
        folderPath: finalWorkingPath,
      });

      if (response.success) {
        // Move to "Done" column
        const doneColumn = findDoneColumn(boardId);
        if (doneColumn && doneColumn.id !== card.columnId) {
          moveCard(card.id, doneColumn.id);
        }

        // Build response summary
        let summary = response.content;
        if (response.filesCreated && response.filesCreated.length > 0) {
          summary += `\n\n✅ Files created:\n${response.filesCreated.map(f => `- ${f}`).join('\n')}`;
        }
        if (response.filesModified && response.filesModified.length > 0) {
          summary += `\n\n📝 Files modified:\n${response.filesModified.map(f => `- ${f}`).join('\n')}`;
        }

        // Complete timeline execution with success
        completeExecution(executionId, {
          status: 'success',
          responseText: response.content,
          filesCreated: response.filesCreated || [],
          filesModified: response.filesModified || [],
          outputResult: { summary },
        });

        // Update card with success
        updateCardStatus(card.id, 'done');
        updateCard(card.id, {
          metadata: {
            ...card.metadata,
            lastExecutionId: executionId,
            lastAgentResponse: summary,
            lastAgentError: undefined,
            lastAgentTimestamp: Date.now(),
          },
        });
      } else {
        // Complete timeline execution with failure
        completeExecution(executionId, {
          status: 'failed',
          responseText: '',
          filesCreated: [],
          filesModified: [],
          errorMessage: response.error || 'Unknown error',
        });

        // Update card with error
        updateCardStatus(card.id, 'error');
        updateCard(card.id, {
          metadata: {
            ...card.metadata,
            lastExecutionId: executionId,
            lastAgentResponse: undefined,
            lastAgentError: response.error || 'Unknown error',
            lastAgentTimestamp: Date.now(),
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Complete timeline execution with failure
      completeExecution(executionId, {
        status: 'failed',
        responseText: '',
        filesCreated: [],
        filesModified: [],
        errorMessage,
      });

      // Update card with error
      updateCardStatus(card.id, 'error');
      updateCard(card.id, {
        metadata: {
          ...card.metadata,
          lastExecutionId: executionId,
          lastAgentResponse: undefined,
          lastAgentError: errorMessage,
          lastAgentTimestamp: Date.now(),
        },
      });
    } finally {
      setIsRunningAgent(false);
    }
  };

  const getStatusIcon = () => {
    switch (card.status) {
      case 'executing':
        return <Clock className="w-3 h-3 text-accent animate-pulse" />;
      case 'review':
        return <AlertCircle className="w-3 h-3 text-status-warning" />;
      case 'done':
        return <CheckCircle className="w-3 h-3 text-status-success" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-status-error" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onDragOver={(e) => {
          e.preventDefault();
          // Only set folder dragging if not from our skill drop
          if (!isOver) {
            setIsDraggingFolder(true);
          }
        }}
        onDragLeave={() => {
          setIsDraggingFolder(false);
        }}
        onDrop={handleDrop}
      >
        <motion.div
          whileHover={{ scale: isDragging ? 1 : 1.01 }}
          className={cn(
            'card cursor-grab active:cursor-grabbing group',
            isSortableDragging && 'opacity-50',
            isDragging && 'shadow-glow-accent rotate-2',
            (isDraggingFolder || isOver) && 'ring-2 ring-accent/50',
            card.status === 'executing' && 'card-active'
          )}
        >
          {/* Card header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getStatusIcon()}
              <h4 className="font-mono text-sm text-text-primary truncate">
                {card.title}
              </h4>
            </div>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="btn-icon p-0.5 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="panel-elevated p-1 min-w-[140px] animate-fade-in z-50"
                  sideOffset={4}
                >
                  <DropdownMenu.Item
                    onClick={() => {
                      setEditTitle(card.title);
                      setEditDescription(card.description || '');
                      setShowEditDialog(true);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary
                               hover:bg-surface rounded-sm cursor-pointer outline-none"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => openAgentWithPrompt('feature')}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary
                               hover:bg-surface rounded-sm cursor-pointer outline-none"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    Ask Agent
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-border-subtle my-1" />
                  <DropdownMenu.Item
                    onClick={() => deleteCard(card.id)}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-status-error
                               hover:bg-surface rounded-sm cursor-pointer outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Description */}
          {card.description && (
            <p className="text-xs text-text-muted mt-2 line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Folder context */}
          {card.folderPath && (
            <div className="flex items-center gap-1.5 mt-3 text-2xs text-text-muted bg-surface-elevated px-2 py-1 rounded">
              <Folder className="w-3 h-3 text-accent-muted" />
              <span className="font-mono truncate">
                {truncatePath(card.folderPath, 25)}
              </span>
            </div>
          )}

          {/* Attached Skills */}
          {attachedSkillIds.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-1 mb-1.5">
                <Wand2 className="w-3 h-3 text-accent" />
                <span className="text-2xs text-text-muted font-mono">Skills</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {attachedSkillIds.map((skillId) => {
                  const skill = skills.find((s) => s.id === skillId);
                  if (!skill) return null;
                  return (
                    <div
                      key={skill.id}
                      className="flex items-center gap-1 text-2xs bg-accent/10 text-accent px-1.5 py-0.5 rounded"
                    >
                      <span className="truncate max-w-[80px]">{skill.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSkill(skill.id);
                        }}
                        className="hover:text-status-error"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ghost branch indicator */}
          {card.metadata.ghostBranch && (
            <div className="flex items-center gap-1.5 mt-2 text-2xs text-ghost">
              <GitBranch className="w-3 h-3" />
              <span className="font-mono">{card.metadata.ghostBranch}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {/* Run Agent button - primary */}
            {(card.status === 'idle' || card.status === 'error') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  runAgent();
                }}
                disabled={isRunningAgent}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'px-2 py-1.5 rounded-sm',
                  'bg-status-success/10 text-status-success text-xs font-mono',
                  'hover:bg-status-success/20 transition-colors',
                  isRunningAgent && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isRunningAgent ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                Run Agent
              </button>
            )}

            {/* Done button */}
            {card.status !== 'done' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const boardId = getCurrentBoardId();
                  if (boardId) {
                    const doneColumn = findDoneColumn(boardId);
                    if (doneColumn && doneColumn.id !== card.columnId) {
                      moveCard(card.id, doneColumn.id);
                    }
                    updateCardStatus(card.id, 'done');
                  }
                }}
                className={cn(
                  'flex items-center justify-center gap-1.5',
                  'px-2 py-1.5 rounded-sm',
                  'bg-status-success/10 text-status-success text-xs font-mono',
                  'hover:bg-status-success/20 transition-colors',
                  card.status !== 'idle' && card.status !== 'error' && 'flex-1'
                )}
              >
                <Check className="w-3 h-3" />
                Done
              </button>
            )}

            {/* Custom Agent button - secondary */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openAgentWithPrompt('general');
              }}
              className={cn(
                'flex items-center justify-center gap-1.5',
                'px-2 py-1.5 rounded-sm',
                'bg-status-info/10 text-status-info text-xs font-mono',
                'hover:bg-status-info/20 transition-colors',
                card.status !== 'idle' && card.status !== 'error' && 'flex-1'
              )}
            >
              <Sparkles className="w-3 h-3" />
              Agent
            </button>
          </div>

          {/* View response link after completion */}
          {card.metadata.lastAgentResponse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowResponseDialog(true);
              }}
              className="mt-2 text-2xs text-accent hover:text-accent/80 font-mono flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3" />
              View response
            </button>
          )}

          {/* Error indicator */}
          {card.metadata.lastAgentError && (
            <div className="mt-2 text-2xs text-status-error font-mono flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span className="truncate">{card.metadata.lastAgentError}</span>
            </div>
          )}

          {/* Status messages */}
          {card.status === 'executing' && (
            <div className="mt-3 text-xs text-accent font-mono flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              Agent working...
            </div>
          )}

          {card.status === 'review' && (
            <div className="mt-3 text-xs text-status-warning font-mono">
              Ready for review
            </div>
          )}

          {/* Drop zone hint */}
          {!card.folderPath && (
            <div
              className={cn(
                'mt-3 border border-dashed border-border-subtle rounded-sm p-2',
                'text-2xs text-text-dim text-center font-mono',
                isDraggingFolder && 'border-accent/50 bg-accent/5 text-accent-muted'
              )}
            >
              {isDraggingFolder ? 'Drop folder here' : 'Drag folder to add context'}
            </div>
          )}
        </motion.div>
      </div>

      {/* Response Dialog */}
      <Dialog.Root open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-surface border border-border rounded-sm z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-status-success" />
                <Dialog.Title className="font-mono text-sm text-text-primary">
                  Agent Response
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="btn-icon p-1">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Task context */}
            <div className="px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="font-mono">Task:</span>
                <span className="text-text-primary">{card.title}</span>
              </div>
              {card.metadata.lastAgentTimestamp && (
                <div className="text-2xs text-text-dim mt-1">
                  Completed: {new Date(card.metadata.lastAgentTimestamp).toLocaleString()}
                </div>
              )}
            </div>

            {/* Response content */}
            <div className="p-4 flex-1 overflow-y-auto">
              <pre className="text-sm font-mono text-text-secondary whitespace-pre-wrap">
                {card.metadata.lastAgentResponse}
              </pre>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
              <Dialog.Close asChild>
                <button className="btn-ghost text-sm">Close</button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Agent Dialog */}
      <Dialog.Root open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-surface border border-border rounded-sm z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <Dialog.Title className="font-mono text-sm text-text-primary">
                  VIRAITH Agent
                </Dialog.Title>
                <span className="text-2xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
                  GLM-4
                </span>
              </div>
              <Dialog.Close asChild>
                <button className="btn-icon p-1">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Task context */}
            <div className="px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="font-mono">Task:</span>
                <span className="text-text-primary">{card.title}</span>
              </div>
              {card.folderPath && (
                <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                  <Folder className="w-3 h-3" />
                  <span className="font-mono">{truncatePath(card.folderPath, 40)}</span>
                </div>
              )}
            </div>

            {/* Prompt input */}
            <div className="p-4 flex-1 overflow-y-auto">
              <label className="block text-xs text-text-muted mb-2 font-mono">
                Prompt
              </label>
              <textarea
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="Describe what you want the agent to do..."
                className="input-terminal w-full h-32 resize-none"
              />

              {/* Quick prompt buttons */}
              <div className="flex gap-2 mt-3">
                {(['feature', 'bugfix', 'refactor', 'test'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      const prompt = glmAgent.generatePromptTemplate(type, card.title, card.description);
                      setAgentPrompt(prompt);
                    }}
                    className="btn-ghost text-2xs py-1 px-2"
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Response */}
              {(agentResponse || isAgentLoading) && (
                <div className="mt-4">
                  <label className="block text-xs text-text-muted mb-2 font-mono">
                    Response
                  </label>
                  <div className="bg-background border border-border-subtle rounded-sm p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                    {isAgentLoading ? (
                      <div className="flex items-center gap-2 text-text-muted">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-mono">Thinking...</span>
                      </div>
                    ) : (
                      <pre className="text-sm font-mono text-text-secondary whitespace-pre-wrap">
                        {agentResponse}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
              <Dialog.Close asChild>
                <button className="btn-ghost text-sm">Cancel</button>
              </Dialog.Close>
              <button
                onClick={sendToAgent}
                disabled={isAgentLoading || !agentPrompt.trim()}
                className={cn(
                  'btn-primary text-sm flex items-center gap-2',
                  (isAgentLoading || !agentPrompt.trim()) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isAgentLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send to Agent
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Dialog */}
      <Dialog.Root open={showEditDialog} onOpenChange={setShowEditDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-surface border border-border rounded-sm z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-accent" />
                <Dialog.Title className="font-mono text-sm text-text-primary">
                  Edit Card
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="btn-icon p-1">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Form */}
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-xs text-text-muted mb-2 font-mono">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter card title..."
                  className="input-terminal w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-2 font-mono">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter card description..."
                  className="input-terminal w-full h-32 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
              <Dialog.Close asChild>
                <button className="btn-ghost text-sm">Cancel</button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <button
                  onClick={() => {
                    updateCard(card.id, {
                      title: editTitle,
                      description: editDescription || undefined,
                    });
                  }}
                  disabled={!editTitle.trim()}
                  className={cn(
                    'btn-primary text-sm flex items-center gap-2',
                    !editTitle.trim() && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
