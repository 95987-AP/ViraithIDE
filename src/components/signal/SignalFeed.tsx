'use client';

import { useEffect, useState } from 'react';
import type { SignalEvent } from '@/types';
import { cn } from '@/lib/utils';
import { Radio, Trash2 } from 'lucide-react';

export function SignalFeed() {
  const [events, setEvents] = useState<SignalEvent[]>([]);
  const [filter, setFilter] = useState<SignalEvent['type'] | 'all'>('all');
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize events on client only to avoid hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
    const now = Math.floor(Date.now() / 1000);
    setEvents([
      {
        source: 'system',
        message: 'VIRAITH IDE initialized',
        timestamp: now - 60,
        type: 'info',
      },
      {
        source: 'board',
        message: 'Demo project loaded',
        timestamp: now - 30,
        type: 'success',
      },
      {
        source: 'git',
        message: 'Branch: main (clean)',
        timestamp: now - 10,
        type: 'info',
      },
    ]);
  }, []);

  const addEvent = (event: Omit<SignalEvent, 'timestamp'>) => {
    setEvents((prev) => [
      { ...event, timestamp: Math.floor(Date.now() / 1000) },
      ...prev,
    ].slice(0, 100));
  };

  const clearEvents = () => setEvents([]);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.type === filter);

  const getTypeColor = (type: SignalEvent['type']) => {
    switch (type) {
      case 'success':
        return 'text-status-success';
      case 'error':
        return 'text-status-error';
      case 'warning':
        return 'text-status-warning';
      case 'info':
      default:
        return 'text-status-info';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-accent" />
          <span className="font-mono text-sm text-text-primary">Signal Feed</span>
          <span className="text-2xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
            {filteredEvents.length}
          </span>
        </div>
        <button
          onClick={clearEvents}
          className="btn-icon p-1"
          title="Clear all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border-subtle">
        {(['all', 'info', 'success', 'warning', 'error'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              'px-2 py-0.5 text-2xs font-mono rounded',
              filter === type
                ? 'bg-surface-elevated text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-text-dim text-xs font-mono py-8">
            No signals yet
          </div>
        ) : (
          filteredEvents.map((event, i) => (
            <div
              key={`${event.timestamp}-${i}`}
              className="flex gap-2 text-xs font-mono p-2 rounded hover:bg-surface-elevated transition-colors"
            >
              <span className="text-text-dim shrink-0">
                {formatTime(event.timestamp)}
              </span>
              <span className={cn('shrink-0', getTypeColor(event.type))}>
                [{event.source}]
              </span>
              <span className="text-text-secondary break-all">
                {event.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1.5 border-t border-border-subtle text-2xs text-text-dim font-mono">
        <span className="inline-block w-1.5 h-1.5 bg-status-success rounded-full mr-2 animate-pulse" />
        listening for events...
      </div>
    </div>
  );
}
