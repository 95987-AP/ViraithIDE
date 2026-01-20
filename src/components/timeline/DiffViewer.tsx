'use client';

import { useState } from 'react';
import type { FileChange } from '@/types';
import { cn } from '@/lib/utils';
import {
  FilePlus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

interface DiffViewerProps {
  changes: FileChange[];
  className?: string;
}

export function DiffViewer({ changes, className }: DiffViewerProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const copyPath = async (path: string) => {
    await navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const getChangeIcon = (type: FileChange['type']) => {
    switch (type) {
      case 'created':
        return <FilePlus className="w-3.5 h-3.5 text-status-success" />;
      case 'modified':
        return <Edit3 className="w-3.5 h-3.5 text-status-warning" />;
      case 'deleted':
        return <Trash2 className="w-3.5 h-3.5 text-status-error" />;
    }
  };

  const getChangeLabel = (type: FileChange['type']) => {
    switch (type) {
      case 'created':
        return 'Created';
      case 'modified':
        return 'Modified';
      case 'deleted':
        return 'Deleted';
    }
  };

  const renderDiff = (change: FileChange) => {
    if (change.type === 'deleted') {
      return (
        <div className="p-3 text-xs font-mono">
          {change.beforeContent ? (
            <pre className="text-status-error/70 whitespace-pre-wrap">
              {change.beforeContent.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="select-none text-text-dim w-8 shrink-0 text-right pr-2 border-r border-border-subtle mr-2">
                    {i + 1}
                  </span>
                  <span className="bg-status-error/10">- {line}</span>
                </div>
              ))}
            </pre>
          ) : (
            <div className="text-text-muted italic">File content not available</div>
          )}
        </div>
      );
    }

    if (change.type === 'created') {
      return (
        <div className="p-3 text-xs font-mono">
          {change.afterContent ? (
            <pre className="text-status-success/70 whitespace-pre-wrap">
              {change.afterContent.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="select-none text-text-dim w-8 shrink-0 text-right pr-2 border-r border-border-subtle mr-2">
                    {i + 1}
                  </span>
                  <span className="bg-status-success/10">+ {line}</span>
                </div>
              ))}
            </pre>
          ) : (
            <div className="text-text-muted italic">File content not available</div>
          )}
        </div>
      );
    }

    // Modified file - show unified diff style
    return (
      <div className="p-3 text-xs font-mono">
        {change.beforeContent && change.afterContent ? (
          <SimpleDiff before={change.beforeContent} after={change.afterContent} />
        ) : change.afterContent ? (
          <pre className="text-text-secondary whitespace-pre-wrap">
            {change.afterContent.split('\n').map((line, i) => (
              <div key={i} className="flex">
                <span className="select-none text-text-dim w-8 shrink-0 text-right pr-2 border-r border-border-subtle mr-2">
                  {i + 1}
                </span>
                <span>{line}</span>
              </div>
            ))}
          </pre>
        ) : (
          <div className="text-text-muted italic">File content not available</div>
        )}
      </div>
    );
  };

  if (changes.length === 0) {
    return (
      <div className={cn('text-center text-text-dim text-xs font-mono py-4', className)}>
        No file changes
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {changes.map((change) => {
        const isExpanded = expandedFiles.has(change.path);
        const hasContent = change.beforeContent || change.afterContent;

        return (
          <div
            key={change.path}
            className="border border-border-subtle rounded-sm overflow-hidden"
          >
            {/* File header */}
            <div
              onClick={() => hasContent && toggleFile(change.path)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 bg-surface-elevated/50',
                hasContent && 'cursor-pointer hover:bg-surface-elevated'
              )}
            >
              {hasContent ? (
                isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                )
              ) : (
                <div className="w-3.5 shrink-0" />
              )}
              {getChangeIcon(change.type)}
              <span className="flex-1 font-mono text-xs text-text-primary truncate">
                {change.path}
              </span>
              <span
                className={cn(
                  'text-2xs px-1.5 py-0.5 rounded shrink-0',
                  change.type === 'created' && 'bg-status-success/10 text-status-success',
                  change.type === 'modified' && 'bg-status-warning/10 text-status-warning',
                  change.type === 'deleted' && 'bg-status-error/10 text-status-error'
                )}
              >
                {getChangeLabel(change.type)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyPath(change.path);
                }}
                className="btn-icon p-1 shrink-0"
                title="Copy path"
              >
                {copiedPath === change.path ? (
                  <Check className="w-3 h-3 text-status-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* File content */}
            {isExpanded && hasContent && (
              <div className="border-t border-border-subtle bg-background max-h-[300px] overflow-auto">
                {renderDiff(change)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simple line-by-line diff component
function SimpleDiff({ before, after }: { before: string; after: string }) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');

  // Simple diff - just show added and removed lines
  // For a production app, you'd use a proper diff algorithm
  const maxLines = Math.max(beforeLines.length, afterLines.length);
  const diffLines: Array<{ type: 'same' | 'add' | 'remove'; content: string; lineNum: number }> = [];

  // Very simple diff - compare line by line
  for (let i = 0; i < maxLines; i++) {
    const beforeLine = beforeLines[i];
    const afterLine = afterLines[i];

    if (beforeLine === afterLine) {
      if (beforeLine !== undefined) {
        diffLines.push({ type: 'same', content: beforeLine, lineNum: i + 1 });
      }
    } else {
      if (beforeLine !== undefined) {
        diffLines.push({ type: 'remove', content: beforeLine, lineNum: i + 1 });
      }
      if (afterLine !== undefined) {
        diffLines.push({ type: 'add', content: afterLine, lineNum: i + 1 });
      }
    }
  }

  return (
    <pre className="whitespace-pre-wrap">
      {diffLines.map((line, i) => (
        <div
          key={i}
          className={cn(
            'flex',
            line.type === 'add' && 'bg-status-success/10',
            line.type === 'remove' && 'bg-status-error/10'
          )}
        >
          <span className="select-none text-text-dim w-8 shrink-0 text-right pr-2 border-r border-border-subtle mr-2">
            {line.lineNum}
          </span>
          <span
            className={cn(
              line.type === 'add' && 'text-status-success',
              line.type === 'remove' && 'text-status-error',
              line.type === 'same' && 'text-text-secondary'
            )}
          >
            {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}
            {line.content}
          </span>
        </div>
      ))}
    </pre>
  );
}
