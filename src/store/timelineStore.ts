import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TimelineExecution, AgentLog, ExecutionStatus, FileChange } from '@/types';

interface TimelineState {
  // Data
  executions: TimelineExecution[];
  logs: AgentLog[];
  selectedExecutionId: string | null;
  filterStatus: ExecutionStatus | 'all';
  searchQuery: string;

  // UI State
  isPanelOpen: boolean;
  isDetailViewOpen: boolean;

  // Actions - Execution CRUD
  startExecution: (execution: Omit<TimelineExecution, 'id' | 'startedAt' | 'status' | 'duration' | 'completedAt' | 'filesCreated' | 'filesModified' | 'responseText' | 'outputResult' | 'errorMessage'>) => string;
  completeExecution: (executionId: string, result: {
    status: ExecutionStatus;
    responseText: string;
    filesCreated: string[];
    filesModified: string[];
    outputResult?: Record<string, unknown>;
    errorMessage?: string;
  }) => void;
  cancelExecution: (executionId: string) => void;
  deleteExecution: (executionId: string) => void;
  clearAllExecutions: () => void;

  // Actions - Logs
  addLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  getExecutionLogs: (executionId: string) => AgentLog[];

  // Actions - UI
  setSelectedExecution: (executionId: string | null) => void;
  setFilterStatus: (status: ExecutionStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  togglePanel: () => void;
  openDetailView: (executionId: string) => void;
  closeDetailView: () => void;

  // Queries
  getFilteredExecutions: () => TimelineExecution[];
  getExecutionById: (id: string) => TimelineExecution | undefined;
  getExecutionsByCardId: (cardId: string) => TimelineExecution[];
  getRecentExecutions: (limit?: number) => TimelineExecution[];
  getRunningExecutions: () => TimelineExecution[];
  getStats: () => {
    total: number;
    successful: number;
    failed: number;
    running: number;
    avgDuration: number;
  };
}

const generateId = () => crypto.randomUUID();

const initialState = {
  executions: [] as TimelineExecution[],
  logs: [] as AgentLog[],
  selectedExecutionId: null as string | null,
  filterStatus: 'all' as ExecutionStatus | 'all',
  searchQuery: '',
  isPanelOpen: false,
  isDetailViewOpen: false,
};

export const useTimelineStore = create<TimelineState>()(
  immer((set, get) => ({
      ...initialState,

      startExecution: (executionData) => {
        const id = generateId();
        const execution: TimelineExecution = {
          ...executionData,
          id,
          startedAt: Date.now(),
          status: 'running',
          filesCreated: [],
          filesModified: [],
          responseText: '',
        };

        set((state) => {
          state.executions.unshift(execution); // Add to beginning for chronological order
        });

        // Add initial log
        get().addLog({
          executionId: id,
          level: 'info',
          message: `Started execution for card: ${executionData.cardTitle}`,
          metadata: { model: executionData.model, skills: executionData.skillsUsed },
        });

        return id;
      },

      completeExecution: (executionId, result) => {
        set((state) => {
          const execution = state.executions.find((e) => e.id === executionId);
          if (execution) {
            execution.status = result.status;
            execution.completedAt = Date.now();
            execution.duration = execution.completedAt - execution.startedAt;
            execution.responseText = result.responseText;
            execution.filesCreated = result.filesCreated;
            execution.filesModified = result.filesModified;
            execution.outputResult = result.outputResult;
            execution.errorMessage = result.errorMessage;
          }
        });

        // Add completion log
        get().addLog({
          executionId,
          level: result.status === 'success' ? 'info' : 'error',
          message: result.status === 'success'
            ? `Execution completed successfully`
            : `Execution failed: ${result.errorMessage}`,
          metadata: {
            filesCreated: result.filesCreated,
            filesModified: result.filesModified,
            duration: get().getExecutionById(executionId)?.duration,
          },
        });
      },

      cancelExecution: (executionId) => {
        set((state) => {
          const execution = state.executions.find((e) => e.id === executionId);
          if (execution && execution.status === 'running') {
            execution.status = 'cancelled';
            execution.completedAt = Date.now();
            execution.duration = execution.completedAt - execution.startedAt;
          }
        });

        get().addLog({
          executionId,
          level: 'warn',
          message: 'Execution cancelled by user',
          metadata: {},
        });
      },

      deleteExecution: (executionId) => {
        set((state) => {
          state.executions = state.executions.filter((e) => e.id !== executionId);
          state.logs = state.logs.filter((l) => l.executionId !== executionId);
          if (state.selectedExecutionId === executionId) {
            state.selectedExecutionId = null;
            state.isDetailViewOpen = false;
          }
        });
      },

      clearAllExecutions: () => {
        set((state) => {
          state.executions = [];
          state.logs = [];
          state.selectedExecutionId = null;
          state.isDetailViewOpen = false;
        });
      },

      addLog: (logData) => {
        const log: AgentLog = {
          ...logData,
          id: generateId(),
          timestamp: Date.now(),
        };

        set((state) => {
          state.logs.push(log);
        });
      },

      getExecutionLogs: (executionId) => {
        return get()
          .logs.filter((l) => l.executionId === executionId)
          .sort((a, b) => a.timestamp - b.timestamp);
      },

      setSelectedExecution: (executionId) => {
        set((state) => {
          state.selectedExecutionId = executionId;
        });
      },

      setFilterStatus: (status) => {
        set((state) => {
          state.filterStatus = status;
        });
      },

      setSearchQuery: (query) => {
        set((state) => {
          state.searchQuery = query;
        });
      },

      togglePanel: () => {
        set((state) => {
          state.isPanelOpen = !state.isPanelOpen;
        });
      },

      openDetailView: (executionId) => {
        set((state) => {
          state.selectedExecutionId = executionId;
          state.isDetailViewOpen = true;
        });
      },

      closeDetailView: () => {
        set((state) => {
          state.isDetailViewOpen = false;
        });
      },

      getFilteredExecutions: () => {
        const { executions, filterStatus, searchQuery } = get();

        return executions.filter((e) => {
          // Filter by status
          if (filterStatus !== 'all' && e.status !== filterStatus) {
            return false;
          }

          // Filter by search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              e.cardTitle.toLowerCase().includes(query) ||
              e.cardDescription?.toLowerCase().includes(query) ||
              e.model.toLowerCase().includes(query) ||
              e.skillsUsed.some((s) => s.toLowerCase().includes(query))
            );
          }

          return true;
        });
      },

      getExecutionById: (id) => {
        return get().executions.find((e) => e.id === id);
      },

      getExecutionsByCardId: (cardId) => {
        return get()
          .executions.filter((e) => e.cardId === cardId)
          .sort((a, b) => b.startedAt - a.startedAt);
      },

      getRecentExecutions: (limit = 10) => {
        return get().executions.slice(0, limit);
      },

      getRunningExecutions: () => {
        return get().executions.filter((e) => e.status === 'running');
      },

      getStats: () => {
        const executions = get().executions;
        const completed = executions.filter((e) => e.completedAt);
        const successful = executions.filter((e) => e.status === 'success');
        const failed = executions.filter((e) => e.status === 'failed');
        const running = executions.filter((e) => e.status === 'running');

        const totalDuration = completed.reduce((sum, e) => sum + (e.duration || 0), 0);
        const avgDuration = completed.length > 0 ? totalDuration / completed.length : 0;

        return {
          total: executions.length,
          successful: successful.length,
          failed: failed.length,
          running: running.length,
          avgDuration,
        };
      },
    }))
);
