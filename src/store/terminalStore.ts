import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TerminalSession {
  id: string;
  name: string;
  workingDirectory: string;
  isActive: boolean;
  createdAt: number;
}

interface TerminalState {
  // Panel state
  isVisible: boolean;
  panelHeight: number;

  // Sessions
  sessions: TerminalSession[];
  activeSessionId: string | null;

  // Actions
  togglePanel: () => void;
  setVisible: (visible: boolean) => void;
  setPanelHeight: (height: number) => void;

  // Session management
  createSession: (name?: string, workingDirectory?: string) => string;
  closeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
}

let sessionCounter = 0;

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      // Initial state
      isVisible: false,
      panelHeight: 250,
      sessions: [],
      activeSessionId: null,

      // Panel actions
      togglePanel: () => {
        const { isVisible, sessions, createSession } = get();
        if (!isVisible && sessions.length === 0) {
          // Auto-create first session when opening terminal
          createSession();
        }
        set({ isVisible: !isVisible });
      },

      setVisible: (visible: boolean) => {
        const { sessions, createSession } = get();
        if (visible && sessions.length === 0) {
          createSession();
        }
        set({ isVisible: visible });
      },

      setPanelHeight: (height: number) => {
        set({ panelHeight: Math.max(150, Math.min(600, height)) });
      },

      // Session actions
      createSession: (name?: string, workingDirectory: string = '~') => {
        sessionCounter++;
        const id = `terminal-${Date.now()}-${sessionCounter}`;
        const sessionName = name || `Terminal ${get().sessions.length + 1}`;

        const newSession: TerminalSession = {
          id,
          name: sessionName,
          workingDirectory,
          isActive: true,
          createdAt: Date.now(),
        };

        set((state) => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: id,
        }));

        return id;
      },

      closeSession: (id: string) => {
        const { sessions, activeSessionId } = get();
        const filteredSessions = sessions.filter((s) => s.id !== id);

        let newActiveId = activeSessionId;
        if (activeSessionId === id) {
          // Select the previous session or the first one
          const closedIndex = sessions.findIndex((s) => s.id === id);
          if (filteredSessions.length > 0) {
            newActiveId = filteredSessions[Math.max(0, closedIndex - 1)]?.id || filteredSessions[0].id;
          } else {
            newActiveId = null;
          }
        }

        set({
          sessions: filteredSessions,
          activeSessionId: newActiveId,
          // Hide panel if no sessions left
          isVisible: filteredSessions.length > 0 ? get().isVisible : false,
        });
      },

      setActiveSession: (id: string) => {
        set({ activeSessionId: id });
      },

      renameSession: (id: string, name: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, name } : s
          ),
        }));
      },
    }),
    {
      name: 'viraith-terminal-state',
      partialize: (state) => ({
        panelHeight: state.panelHeight,
        // Don't persist sessions - they need to be recreated on reload
      }),
    }
  )
);
