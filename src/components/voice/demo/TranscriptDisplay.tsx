import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { TranscriptEntry } from './transcriptData';

interface TranscriptDisplayProps {
  currentTime: number;
  transcriptData: TranscriptEntry[];
  speakerLabels?: {
    agent: string;
    applicant: string;
  };
}

const defaultSpeakerLabels = {
  agent: 'AI Agent',
  applicant: 'Applicant',
};

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ 
  currentTime, 
  transcriptData,
  speakerLabels = defaultSpeakerLabels 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      {transcriptData.map((entry, index) => {
        const isActive = currentTime >= entry.startTime && currentTime < entry.endTime;
        const isPast = currentTime >= entry.endTime;
        
        return (
          <div
            key={index}
            className={cn(
              'flex gap-3 p-3 rounded-lg transition-all duration-300',
              entry.speaker === 'agent' ? 'bg-primary/5' : 'bg-secondary/50',
              isActive && 'ring-2 ring-primary bg-primary/10',
              isPast && 'opacity-70'
            )}
          >
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
              entry.speaker === 'agent' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            )}>
              {entry.speaker === 'agent' ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'text-xs font-medium',
                  entry.speaker === 'agent' ? 'text-primary' : 'text-secondary-foreground'
                )}>
                  {speakerLabels[entry.speaker]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(entry.startTime)}
                </span>
              </div>
              <p className="text-sm text-foreground">{entry.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TranscriptDisplay;
