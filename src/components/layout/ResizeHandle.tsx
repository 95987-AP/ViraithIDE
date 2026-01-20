import { cn } from '@/lib/utils';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
  side: 'left' | 'right';
}

export function ResizeHandle({ onMouseDown, isResizing, side }: ResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        'relative z-10 hover:bg-accent/20 transition-colors cursor-col-resize group',
        side === 'left' ? '-ml-1' : '-mr-1'
      )}
      style={{ width: '6px' }}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px]',
          'bg-border-subtle group-hover:bg-accent',
          isResizing && 'bg-accent'
        )}
      />
    </div>
  );
}
