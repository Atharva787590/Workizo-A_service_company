import React from 'react';
import { CloudOff, Clock } from 'lucide-react';

interface CachedDataBadgeProps {
  lastUpdated?: string;
  isStale?: boolean;
  className?: string;
}

export const CachedDataBadge: React.FC<CachedDataBadgeProps> = ({
  lastUpdated,
  isStale = false,
  className = '',
}) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Recently';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
        isStale
          ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
      } ${className}`}
      role="status"
      title="This data is stored locally on your device for offline resilience."
    >
      <CloudOff className="w-3.5 h-3.5 shrink-0" />
      <span>
        Cached View {isStale ? '(Update Available)' : ''}
      </span>
      <span className="opacity-60">•</span>
      <span className="inline-flex items-center gap-0.5 opacity-80">
        <Clock className="w-3 h-3" />
        {formattedTime}
      </span>
    </div>
  );
};

export default CachedDataBadge;
