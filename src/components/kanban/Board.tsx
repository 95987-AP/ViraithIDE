'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column } from './Column';
import { Card } from './Card';
import { useBoardStore } from '@/store/boardStore';
import type { Card as CardType, Column as ColumnType } from '@/types';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoardProps {
  boardId: string;
}

export function Board({ boardId }: BoardProps) {
  const { columns, cards, moveCard, addCard, addColumn } = useBoardStore();
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const boardColumns = columns
    .filter((col) => col.boardId === boardId)
    .sort((a, b) => a.position - b.position);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const card = cards.find((c) => c.id === active.id);
      if (card) {
        setActiveCard(card);
      }
    },
    [cards]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find the active card
      const activeCard = cards.find((c) => c.id === activeId);
      if (!activeCard) return;

      // Check if we're over a column
      const overColumn = columns.find((col) => col.id === overId);
      if (overColumn && activeCard.columnId !== overId) {
        moveCard(activeId, overId);
      }

      // Check if we're over another card
      const overCard = cards.find((c) => c.id === overId);
      if (overCard && activeCard.columnId !== overCard.columnId) {
        moveCard(activeId, overCard.columnId);
      }
    },
    [cards, columns, moveCard]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);
      // TODO: Persist to database via Tauri
    },
    []
  );

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const newColumn: ColumnType = {
      id: crypto.randomUUID(),
      boardId,
      name: newColumnName.trim(),
      position: boardColumns.length,
      automationRules: [],
      createdAt: Math.floor(Date.now() / 1000),
    };

    addColumn(newColumn);
    setNewColumnName('');
    setIsAddingColumn(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Board header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <h2 className="text-text-primary font-mono text-sm">
          <span className="text-text-muted">board/</span>main
        </h2>
        <div className="flex items-center gap-2 text-2xs text-text-muted">
          <span>{boardColumns.length} columns</span>
          <span className="text-border">|</span>
          <span>{cards.length} cards</span>
        </div>
      </div>

      {/* Board content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 h-full min-w-max">
            <SortableContext
              items={boardColumns.map((col) => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {boardColumns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  cards={cards
                    .filter((c) => c.columnId === column.id)
                    .sort((a, b) => a.position - b.position)}
                />
              ))}
            </SortableContext>

            {/* Add column button */}
            {isAddingColumn ? (
              <div className="w-72 shrink-0">
                <div className="panel p-3">
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn();
                      if (e.key === 'Escape') setIsAddingColumn(false);
                    }}
                    placeholder="Column name..."
                    className="input-terminal w-full text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleAddColumn} className="btn-primary text-xs flex-1">
                      Add
                    </button>
                    <button
                      onClick={() => setIsAddingColumn(false)}
                      className="btn-ghost text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className={cn(
                  'w-72 shrink-0 h-12 flex items-center justify-center gap-2',
                  'border border-dashed border-border-subtle rounded-sm',
                  'text-text-muted text-sm font-mono',
                  'hover:border-border hover:text-text-secondary transition-colors'
                )}
              >
                <Plus className="w-4 h-4" />
                Add Column
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="opacity-90">
              <Card card={activeCard} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
