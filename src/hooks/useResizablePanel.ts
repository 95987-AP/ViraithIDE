import { useState, useRef, useCallback, useEffect } from 'react';

interface UseResizablePanelProps {
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  side: 'left' | 'right' | 'top' | 'bottom';
  storageKey?: string;
}

export function useResizablePanel({
  defaultWidth = 256,
  defaultHeight = 250,
  minWidth = 180,
  maxWidth = 600,
  minHeight = 150,
  maxHeight = 600,
  side,
  storageKey,
}: UseResizablePanelProps) {
  const isVertical = side === 'top' || side === 'bottom';
  const defaultSize = isVertical ? defaultHeight : defaultWidth;
  const minSize = isVertical ? minHeight : minWidth;
  const maxSize = isVertical ? maxHeight : maxWidth;

  const [size, setSize] = useState(defaultSize);

  // Load from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= minSize && parsed <= maxSize) {
          setSize(parsed);
        }
      }
    }
  }, [storageKey, minSize, maxSize]);

  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(size);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startPosRef.current = isVertical ? e.clientY : e.clientX;
    startSizeRef.current = size;
  }, [size, isVertical]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = isVertical ? e.clientY : e.clientX;
      const delta = currentPos - startPosRef.current;
      let newSize: number;

      if (side === 'left' || side === 'bottom') {
        newSize = startSizeRef.current + delta;
      } else {
        newSize = startSizeRef.current - delta;
      }

      // For bottom panels, dragging up should increase height
      if (side === 'bottom') {
        newSize = startSizeRef.current - delta;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (storageKey) {
        localStorage.setItem(storageKey, size.toString());
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minSize, maxSize, side, storageKey, size, isVertical]);

  return {
    width: isVertical ? undefined : size,
    height: isVertical ? size : undefined,
    size,
    isResizing,
    resizeHandleProps: {
      onMouseDown: handleMouseDown,
    },
  };
}
