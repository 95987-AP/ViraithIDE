'use client';

import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card } from './Card';
import { useBoardStore } from '@/store/boardStore';
import type { Card as CardType, Column as ColumnType } from '@/types';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
}

export function Column({ column, cards }: ColumnProps) {
  const { addCard, deleteColumn } = useBoardStore();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;

    const newCard: CardType = {
      id: crypto.randomUUID(),
      columnId: column.id,
      title: newCardTitle.trim(),
      description: newCardDescription.trim(),
      filePaths: [],
      agentConfig: {},
      position: cards.length,
      status: 'idle',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
      metadata: {},
    };

    addCard(newCard);
    setNewCardTitle('');
    setNewCardDescription('');
    setIsAddingCard(false);
  };

  // Status color based on column name
  const getColumnAccent = () => {
    const name = column.name.toLowerCase();
    if (name.includes('done') || name.includes('complete'))
      return 'border-l-status-success';
    if (name.includes('progress') || name.includes('working'))
      return 'border-l-accent';
    if (name.includes('review')) return 'border-l-status-warning';
    if (name.includes('blocked') || name.includes('error'))
      return 'border-l-status-error';
    return 'border-l-border';
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-72 shrink-0 flex flex-col max-h-full',
        'bg-surface border border-border-subtle rounded-sm',
        'border-l-2',
        getColumnAccent(),
        isOver && 'ring-1 ring-accent/30'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-sm text-text-primary">{column.name}</h3>
          <span className="text-2xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
            {cards.length}
          </span>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="btn-icon p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="panel-elevated p-1 min-w-[120px] animate-fade-in"
              sideOffset={4}
            >
              <DropdownMenu.Item
                onClick={() => deleteColumn(column.id)}
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

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </SortableContext>

        {/* Add card inline */}
        {mounted && (isAddingCard ? (
          <div className="p-2 border border-border-subtle rounded-sm bg-surface-elevated">
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard();
                }
                if (e.key === 'Escape') setIsAddingCard(false);
              }}
              placeholder="Card title..."
              className="input-terminal w-full text-sm"
              autoFocus
            />
            <textarea
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsAddingCard(false);
              }}
              placeholder="Todolist / description (what needs to be done)..."
              className="input-terminal w-full text-sm mt-2 min-h-[60px] resize-y"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleAddCard} className="btn-primary text-xs flex-1">
                Add
              </button>
              <button
                onClick={() => setIsAddingCard(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className={cn(
              'w-full p-2 flex items-center justify-center gap-2',
              'border border-dashed border-border-subtle rounded-sm',
              'text-text-muted text-xs font-mono',
              'hover:border-border hover:text-text-secondary transition-colors'
            )}
          >
            <Plus className="w-3 h-3" />
            Add Card
          </button>
        ))}
      </div>
    </div>
  );
}
