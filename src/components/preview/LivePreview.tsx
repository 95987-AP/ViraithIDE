'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  X,
} from 'lucide-react';

type DeviceSize = 'mobile' | 'tablet' | 'desktop';

interface LivePreviewProps {
  url?: string;
  onClose?: () => void;
}

export function LivePreview({
  url = 'http://localhost:3000',
  onClose,
}: LivePreviewProps) {
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const [isLoading, setIsLoading] = useState(false);

  const deviceWidths: Record<DeviceSize, string> = {
    mobile: 'w-[375px]',
    tablet: 'w-[768px]',
    desktop: 'w-full',
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // In production, this would reload the iframe
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border-subtle rounded-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-text-primary">Live Preview</span>
          <span className="text-2xs text-status-success bg-surface-elevated px-1.5 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse" />
            connected
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Device size toggles */}
          <div className="flex items-center border border-border-subtle rounded-sm mr-2">
            {[
              { size: 'mobile' as DeviceSize, icon: Smartphone },
              { size: 'tablet' as DeviceSize, icon: Tablet },
              { size: 'desktop' as DeviceSize, icon: Monitor },
            ].map(({ size, icon: Icon }) => (
              <button
                key={size}
                onClick={() => setDeviceSize(size)}
                className={cn(
                  'p-1.5',
                  deviceSize === size
                    ? 'bg-surface-elevated text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                )}
                title={size}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className={cn('btn-icon p-1', isLoading && 'animate-spin')}
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.open(url, '_blank')}
            className="btn-icon p-1"
            title="Open in browser"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-icon p-1" title="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* URL bar */}
      <div className="flex items-center px-3 py-1.5 border-b border-border-subtle bg-background">
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 bg-transparent text-xs font-mono text-text-muted outline-none"
        />
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-[#1a1a1a] overflow-auto">
        <div
          className={cn(
            'bg-white rounded-sm shadow-2xl transition-all duration-300 h-full',
            deviceWidths[deviceSize],
            deviceSize !== 'desktop' && 'max-h-[600px]'
          )}
        >
          {/* Placeholder for actual preview */}
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
            <Monitor className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm font-mono text-center">
              Live Preview
              <br />
              <span className="text-xs opacity-70">
                Connect to dev server to see changes
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-4 font-mono">
              {url}
            </p>
            <p className="text-2xs text-gray-600 mt-8">
              Phase 1: Preview placeholder
              <br />
              Phase 2: Real BrowserView integration
            </p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-border-subtle text-2xs text-text-dim font-mono">
        <span>viewport: {deviceSize}</span>
        <span>hot reload: enabled</span>
      </div>
    </div>
  );
}
