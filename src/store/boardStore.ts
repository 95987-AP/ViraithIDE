import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Board, Column, Card, CardStatus } from '@/types';

interface BoardState {
  // Data
  currentProjectId: string | null;
  boards: Board[];
  columns: Column[];
  cards: Card[];
  activeCardId: string | null;

  // Loading states
  isLoading: boolean;

  // Actions
  setCurrentProject: (projectId: string) => void;
  setBoards: (boards: Board[]) => void;
  setColumns: (columns: Column[]) => void;
  setCards: (cards: Card[]) => void;
  setActiveCard: (cardId: string | null) => void;

  // Card CRUD
  addCard: (card: Card) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  deleteCard: (cardId: string) => void;
  moveCard: (cardId: string, targetColumnId: string, position?: number) => void;
  updateCardStatus: (cardId: string, status: CardStatus) => void;
  attachFolderToCard: (cardId: string, folderPath: string) => void;

  // Column CRUD
  addColumn: (column: Column) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (columnIds: string[]) => void;

  // Utilities
  getColumnCards: (columnId: string) => Card[];
  findColumnByPattern: (boardId: string, patterns: string[]) => Column | undefined;
  findInProgressColumn: (boardId: string) => Column | undefined;
  findDoneColumn: (boardId: string) => Column | undefined;
  reset: () => void;
}

const initialState = {
  currentProjectId: null,
  boards: [],
  columns: [],
  cards: [],
  activeCardId: null,
  isLoading: false,
};

export const useBoardStore = create<BoardState>()(
  immer((set, get) => ({
    ...initialState,

    setCurrentProject: (projectId) =>
      set((state) => {
        state.currentProjectId = projectId;
      }),

    setBoards: (boards) =>
      set((state) => {
        state.boards = boards;
      }),

    setColumns: (columns) =>
      set((state) => {
        state.columns = columns;
      }),

    setCards: (cards) =>
      set((state) => {
        state.cards = cards;
      }),

    setActiveCard: (cardId) =>
      set((state) => {
        state.activeCardId = cardId;
      }),

    addCard: (card) =>
      set((state) => {
        state.cards.push(card);
      }),

    updateCard: (cardId, updates) =>
      set((state) => {
        const index = state.cards.findIndex((c) => c.id === cardId);
        if (index !== -1) {
          state.cards[index] = { ...state.cards[index], ...updates };
        }
      }),

    deleteCard: (cardId) =>
      set((state) => {
        state.cards = state.cards.filter((c) => c.id !== cardId);
      }),

    moveCard: (cardId, targetColumnId, position) =>
      set((state) => {
        const cardIndex = state.cards.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) return;

        const card = state.cards[cardIndex];
        card.columnId = targetColumnId;

        if (position !== undefined) {
          card.position = position;
        } else {
          // Move to end of column
          const columnCards = state.cards.filter(
            (c) => c.columnId === targetColumnId && c.id !== cardId
          );
          card.position = columnCards.length;
        }
      }),

    updateCardStatus: (cardId, status) =>
      set((state) => {
        const card = state.cards.find((c) => c.id === cardId);
        if (card) {
          card.status = status;
          card.updatedAt = Math.floor(Date.now() / 1000);
        }
      }),

    attachFolderToCard: (cardId, folderPath) =>
      set((state) => {
        const card = state.cards.find((c) => c.id === cardId);
        if (card) {
          card.folderPath = folderPath;
          card.updatedAt = Math.floor(Date.now() / 1000);
        }
      }),

    addColumn: (column) =>
      set((state) => {
        state.columns.push(column);
      }),

    updateColumn: (columnId, updates) =>
      set((state) => {
        const index = state.columns.findIndex((c) => c.id === columnId);
        if (index !== -1) {
          state.columns[index] = { ...state.columns[index], ...updates };
        }
      }),

    deleteColumn: (columnId) =>
      set((state) => {
        state.columns = state.columns.filter((c) => c.id !== columnId);
        // Also delete all cards in the column
        state.cards = state.cards.filter((c) => c.columnId !== columnId);
      }),

    reorderColumns: (columnIds) =>
      set((state) => {
        columnIds.forEach((id, index) => {
          const column = state.columns.find((c) => c.id === id);
          if (column) {
            column.position = index;
          }
        });
      }),

    getColumnCards: (columnId) => {
      return get()
        .cards.filter((c) => c.columnId === columnId)
        .sort((a, b) => a.position - b.position);
    },

    findColumnByPattern: (boardId, patterns) => {
      const boardColumns = get().columns.filter((c) => c.boardId === boardId);

      // First, try to find by name pattern
      for (const pattern of patterns) {
        const found = boardColumns.find(
          (c) => c.name.toLowerCase().includes(pattern.toLowerCase())
        );
        if (found) return found;
      }

      return undefined;
    },

    findInProgressColumn: (boardId) => {
      const patterns = ['in progress', 'progress', 'working', 'doing'];
      const found = get().findColumnByPattern(boardId, patterns);

      // Fallback: use second column if exists
      if (!found) {
        const boardColumns = get()
          .columns.filter((c) => c.boardId === boardId)
          .sort((a, b) => a.position - b.position);
        return boardColumns.length > 1 ? boardColumns[1] : undefined;
      }

      return found;
    },

    findDoneColumn: (boardId) => {
      const patterns = ['done', 'complete', 'finished'];
      const found = get().findColumnByPattern(boardId, patterns);

      // Fallback: use last column
      if (!found) {
        const boardColumns = get()
          .columns.filter((c) => c.boardId === boardId)
          .sort((a, b) => a.position - b.position);
        return boardColumns.length > 0 ? boardColumns[boardColumns.length - 1] : undefined;
      }

      return found;
    },

    reset: () => set(initialState),
  }))
);
