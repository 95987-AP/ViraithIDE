'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import type { TimelineExecution, ExecutionStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  History,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  ChevronRight,
  FileCode,
  FilePlus,
  Edit3,
  X,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

// Demo data generator for testing
const generateDemoExecutions = (startExecution: Function, completeExecution: Function) => {
  // Demo execution 1: Successful API endpoint creation
  const exec1Id = startExecution({
    cardId: 'demo-card-1',
    cardTitle: 'Create user authentication API',
    cardDescription: 'Implement JWT-based authentication with login and registration endpoints',
    agentType: 'backend',
    model: 'deepseek-chat',
    skillsUsed: ['Backend Development', 'Security'],
    promptUsed: 'Create a user authentication API with JWT tokens...',
    inputContext: { folderPath: '/src/api' },
  });

  setTimeout(() => {
    completeExecution(exec1Id, {
      status: 'success',
      responseText: `Created authentication API with the following endpoints:

- POST /api/auth/register - User registration
- POST /api/auth/login - User login with JWT
- GET /api/auth/me - Get current user
- POST /api/auth/refresh - Refresh access token

Implementation includes:
- Password hashing with bcrypt
- JWT token generation and validation
- Rate limiting on auth endpoints
- Input validation with Zod schemas`,
      filesCreated: ['src/api/auth/route.ts', 'src/lib/auth.ts', 'src/types/auth.ts'],
      filesModified: ['src/middleware.ts'],
    });
  }, 100);

  // Demo execution 2: Failed database migration
  const exec2Id = startExecution({
    cardId: 'demo-card-2',
    cardTitle: 'Add user preferences table',
    cardDescription: 'Create database migration for user preferences with theme and notification settings',
    agentType: 'database',
    model: 'deepseek-chat',
    skillsUsed: ['Database'],
    promptUsed: 'Create a database migration for user preferences...',
    inputContext: { folderPath: '/prisma' },
  });

  setTimeout(() => {
    completeExecution(exec2Id, {
      status: 'failed',
      responseText: '',
      filesCreated: [],
      filesModified: [],
      errorMessage: 'Database connection failed: ECONNREFUSED - Could not connect to PostgreSQL server',
    });
  }, 150);

  // Demo execution 3: Successful UI component
  const exec3Id = startExecution({
    cardId: 'demo-card-3',
    cardTitle: 'Build settings page UI',
    cardDescription: 'Create a settings page with tabs for profile, preferences, and security',
    agentType: 'frontend',
    model: 'deepseek-chat',
    skillsUsed: ['React Development', 'Tailwind CSS'],
    promptUsed: 'Build a settings page with tabs...',
    inputContext: { folderPath: '/src/components' },
  });

  setTimeout(() => {
    completeExecution(exec3Id, {
      status: 'success',
      responseText: `Created a settings page with the following structure:

- SettingsPage component with tab navigation
- ProfileTab: Avatar upload, name, email editing
- PreferencesTab: Theme toggle, language selector
- SecurityTab: Password change, 2FA setup
- NotificationsTab: Email and push notification preferences

Used Radix UI tabs for accessibility and Tailwind for styling.`,
      filesCreated: [
        'src/components/settings/SettingsPage.tsx',
        'src/components/settings/ProfileTab.tsx',
        'src/components/settings/PreferencesTab.tsx',
        'src/components/settings/SecurityTab.tsx',
      ],
      filesModified: ['src/app/settings/page.tsx'],
    });
  }, 200);
};

export function TimelinePanel() {
  const {
    executions,
    filterStatus,
    searchQuery,
    selectedExecutionId,
    isDetailViewOpen,
    setFilterStatus,
    setSearchQuery,
    deleteExecution,
    clearAllExecutions,
    getFilteredExecutions,
    getExecutionById,
    getExecutionLogs,
    getStats,
    openDetailView,
    closeDetailView,
    startExecution,
    completeExecution,
  } = useTimelineStore();

  const filteredExecutions = getFilteredExecutions();
  const stats = getStats();
  const selectedExecution = selectedExecutionId ? getExecutionById(selectedExecutionId) : null;
  const selectedLogs = selectedExecutionId ? getExecutionLogs(selectedExecutionId) : [];

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />;
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-status-success" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-status-error" />;
      case 'cancelled':
        return <XCircle className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  const getStatusLabel = (status: ExecutionStatus) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-accent" />
          <span className="font-mono text-sm text-text-primary">Agent Timeline</span>
          <span className="text-2xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
            {executions.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {executions.length === 0 && (
            <button
              onClick={() => generateDemoExecutions(startExecution, completeExecution)}
              className="btn-icon p-1 text-accent"
              title="Load demo data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={clearAllExecutions}
            className="btn-icon p-1"
            title="Clear all"
            disabled={executions.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border-subtle bg-surface-elevated/50">
        <div className="flex items-center gap-1.5 text-2xs">
          <BarChart3 className="w-3 h-3 text-text-muted" />
          <span className="text-text-muted">Total:</span>
          <span className="text-text-primary font-mono">{stats.total}</span>
        </div>
        <div className="flex items-center gap-1.5 text-2xs">
          <CheckCircle className="w-3 h-3 text-status-success" />
          <span className="text-text-primary font-mono">{stats.successful}</span>
        </div>
        <div className="flex items-center gap-1.5 text-2xs">
          <XCircle className="w-3 h-3 text-status-error" />
          <span className="text-text-primary font-mono">{stats.failed}</span>
        </div>
        {stats.running > 0 && (
          <div className="flex items-center gap-1.5 text-2xs">
            <Loader2 className="w-3 h-3 text-accent animate-spin" />
            <span className="text-text-primary font-mono">{stats.running}</span>
          </div>
        )}
        {stats.avgDuration > 0 && (
          <div className="flex items-center gap-1.5 text-2xs ml-auto">
            <Clock className="w-3 h-3 text-text-muted" />
            <span className="text-text-muted">Avg:</span>
            <span className="text-text-primary font-mono">{formatDuration(stats.avgDuration)}</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border-subtle">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search executions..."
            className="w-full pl-7 pr-2 py-1.5 text-xs font-mono bg-surface-elevated border border-border-subtle rounded-sm
                       text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border-subtle">
        {(['all', 'running', 'success', 'failed', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'px-2 py-0.5 text-2xs font-mono rounded',
              filterStatus === status
                ? 'bg-surface-elevated text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Executions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredExecutions.length === 0 ? (
          <div className="text-center text-text-dim text-xs font-mono py-8">
            {executions.length === 0 ? 'No executions yet' : 'No matching executions'}
          </div>
        ) : (
          filteredExecutions.map((execution) => (
            <ExecutionItem
              key={execution.id}
              execution={execution}
              onView={() => openDetailView(execution.id)}
              onDelete={() => deleteExecution(execution.id)}
              formatTime={formatTime}
              formatDuration={formatDuration}
              getStatusIcon={getStatusIcon}
            />
          ))
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1.5 border-t border-border-subtle text-2xs text-text-dim font-mono">
        {stats.running > 0 ? (
          <>
            <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full mr-2 animate-pulse" />
            {stats.running} execution{stats.running > 1 ? 's' : ''} running...
          </>
        ) : (
          <>
            <span className="inline-block w-1.5 h-1.5 bg-status-success rounded-full mr-2" />
            ready
          </>
        )}
      </div>

      {/* Execution Detail Dialog */}
      <Dialog.Root open={isDetailViewOpen} onOpenChange={(open) => !open && closeDetailView()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-h-[80vh] bg-surface border border-border rounded-sm z-50 flex flex-col">
            {selectedExecution && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedExecution.status)}
                    <Dialog.Title className="font-mono text-sm text-text-primary">
                      Execution Details
                    </Dialog.Title>
                    <span className={cn(
                      'text-2xs px-1.5 py-0.5 rounded',
                      selectedExecution.status === 'success' && 'bg-status-success/10 text-status-success',
                      selectedExecution.status === 'failed' && 'bg-status-error/10 text-status-error',
                      selectedExecution.status === 'running' && 'bg-accent/10 text-accent',
                      selectedExecution.status === 'cancelled' && 'bg-surface-elevated text-text-muted'
                    )}>
                      {getStatusLabel(selectedExecution.status)}
                    </span>
                  </div>
                  <Dialog.Close asChild>
                    <button className="btn-icon p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Metadata */}
                <div className="px-4 py-3 border-b border-border-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted font-mono">Card:</span>
                    <span className="text-xs text-text-primary">{selectedExecution.cardTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted font-mono">Model:</span>
                    <span className="text-xs text-text-primary font-mono">{selectedExecution.model}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted font-mono">Started:</span>
                    <span className="text-xs text-text-primary">{formatTime(selectedExecution.startedAt)}</span>
                  </div>
                  {selectedExecution.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted font-mono">Duration:</span>
                      <span className="text-xs text-text-primary font-mono">{formatDuration(selectedExecution.duration)}</span>
                    </div>
                  )}
                  {selectedExecution.skillsUsed.length > 0 && (
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-text-muted font-mono">Skills:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[300px]">
                        {selectedExecution.skillsUsed.map((skill) => (
                          <span key={skill} className="text-2xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* File changes */}
                {(selectedExecution.filesCreated.length > 0 || selectedExecution.filesModified.length > 0) && (
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <div className="text-xs text-text-muted font-mono mb-2">File Changes</div>
                    <div className="space-y-1">
                      {selectedExecution.filesCreated.map((file) => (
                        <div key={file} className="flex items-center gap-2 text-xs">
                          <FilePlus className="w-3.5 h-3.5 text-status-success" />
                          <span className="font-mono text-text-secondary">{file}</span>
                          <span className="text-2xs text-status-success">created</span>
                        </div>
                      ))}
                      {selectedExecution.filesModified.map((file) => (
                        <div key={file} className="flex items-center gap-2 text-xs">
                          <Edit3 className="w-3.5 h-3.5 text-status-warning" />
                          <span className="font-mono text-text-secondary">{file}</span>
                          <span className="text-2xs text-status-warning">modified</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {selectedExecution.errorMessage && (
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <div className="text-xs text-status-error font-mono mb-2">Error</div>
                    <div className="text-xs text-text-secondary bg-status-error/5 border border-status-error/20 rounded p-2 font-mono">
                      {selectedExecution.errorMessage}
                    </div>
                  </div>
                )}

                {/* Response */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-xs text-text-muted font-mono mb-2">Response</div>
                  <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap bg-background border border-border-subtle rounded p-3">
                    {selectedExecution.responseText || '(No response yet)'}
                  </pre>
                </div>

                {/* Logs */}
                {selectedLogs.length > 0 && (
                  <div className="border-t border-border-subtle">
                    <div className="px-4 py-2 text-xs text-text-muted font-mono bg-surface-elevated/50">
                      Execution Logs ({selectedLogs.length})
                    </div>
                    <div className="max-h-[150px] overflow-y-auto p-2 space-y-1">
                      {selectedLogs.map((log) => (
                        <div key={log.id} className="flex gap-2 text-2xs font-mono">
                          <span className="text-text-dim shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                          </span>
                          <span className={cn(
                            'shrink-0',
                            log.level === 'error' && 'text-status-error',
                            log.level === 'warn' && 'text-status-warning',
                            log.level === 'info' && 'text-status-info',
                            log.level === 'debug' && 'text-text-muted'
                          )}>
                            [{log.level}]
                          </span>
                          <span className="text-text-secondary">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
                  <button
                    onClick={() => deleteExecution(selectedExecution.id)}
                    className="btn-ghost text-sm text-status-error flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <Dialog.Close asChild>
                    <button className="btn-ghost text-sm">Close</button>
                  </Dialog.Close>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// Execution item component
function ExecutionItem({
  execution,
  onView,
  onDelete,
  formatTime,
  formatDuration,
  getStatusIcon,
}: {
  execution: TimelineExecution;
  onView: () => void;
  onDelete: () => void;
  formatTime: (ts: number) => string;
  formatDuration: (ms: number) => string;
  getStatusIcon: (status: ExecutionStatus) => React.ReactNode;
}) {
  return (
    <div
      onClick={onView}
      className="group p-2.5 rounded hover:bg-surface-elevated transition-colors cursor-pointer border border-transparent hover:border-border-subtle"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getStatusIcon(execution.status)}
          <span className="text-sm font-mono text-text-primary truncate">
            {execution.cardTitle}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {execution.duration && (
            <span className="text-2xs text-text-muted font-mono">
              {formatDuration(execution.duration)}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="btn-icon p-0.5 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-3 mt-1.5 text-2xs text-text-muted">
        <span className="font-mono">{formatTime(execution.startedAt)}</span>
        <span className="font-mono">{execution.model}</span>
        {execution.filesCreated.length + execution.filesModified.length > 0 && (
          <span className="flex items-center gap-1">
            <FileCode className="w-3 h-3" />
            {execution.filesCreated.length + execution.filesModified.length} files
          </span>
        )}
        {execution.skillsUsed.length > 0 && (
          <span className="text-accent">
            {execution.skillsUsed.length} skill{execution.skillsUsed.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error preview */}
      {execution.errorMessage && (
        <div className="mt-2 text-2xs text-status-error font-mono truncate">
          {execution.errorMessage}
        </div>
      )}
    </div>
  );
}
