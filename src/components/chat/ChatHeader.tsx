import React from 'react';
import { X, Minimize2, Maximize2, Pin, PinOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChatHeaderProps {
  page: string;
  isMinimized: boolean;
  isPinned: boolean;
  isMobile: boolean;
  onToggleMinimize: () => void;
  onTogglePin: () => void;
  onToggleSettings: () => void;
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  page,
  isMinimized,
  isPinned,
  isMobile,
  onToggleMinimize,
  onTogglePin,
  onToggleSettings,
  onClose
}) => {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 border-b bg-primary text-primary-foreground">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
        {!isMinimized && (
          <>
            <span className="font-medium truncate text-sm md:text-base">ƷBI Assistant</span>
            {page !== 'general' && (
              <Badge variant="secondary" className="text-xs flex-shrink-0 hidden sm:inline-flex">
                {page}
              </Badge>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSettings}
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <Settings className="w-4 h-4" />
        </Button>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onTogglePin}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMinimize}
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
