/**
 * Draft Restoration Banner
 * Shows when a saved form draft is available with restore/discard options
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DraftBannerProps {
  lastSaved: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
  className?: string;
}

export const DraftBanner: React.FC<DraftBannerProps> = ({
  lastSaved,
  onRestore,
  onDiscard,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-info/10 border border-info/20 rounded-lg animate-in slide-in-from-top-2 duration-300',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-info/20">
          <Clock className="w-5 h-5 text-info" />
        </div>
        <div>
          <p className="font-medium text-foreground">You have a saved draft</p>
          {lastSaved && (
            <p className="text-sm text-muted-foreground">
              Last saved {format(lastSaved, 'MMM d, yyyy \'at\' h:mm a')}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onDiscard}
          className="flex-1 sm:flex-initial min-h-[40px] gap-2"
        >
          <X className="w-4 h-4" />
          <span>Start Fresh</span>
        </Button>
        <Button
          size="sm"
          onClick={onRestore}
          className="flex-1 sm:flex-initial min-h-[40px] gap-2 bg-info hover:bg-info/90"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restore Draft</span>
        </Button>
      </div>
    </div>
  );
};

/**
 * Auto-save indicator (shows when form is being saved)
 */
interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSaved,
  className,
}) => {
  if (!lastSaved) return null;

  return (
    <div 
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground',
        className
      )}
    >
      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
      <span>Draft saved {format(lastSaved, 'h:mm a')}</span>
    </div>
  );
};

export default DraftBanner;
