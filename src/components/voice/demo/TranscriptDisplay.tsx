import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface TranscriptEntry {
  startTime: number;
  endTime: number;
  speaker: 'agent' | 'applicant';
  text: string;
}

interface TranscriptDisplayProps {
  currentTime: number;
}

const transcriptData: TranscriptEntry[] = [
  { startTime: 0, endTime: 3, speaker: 'agent', text: 'Hello, Cody.' },
  { startTime: 3, endTime: 10, speaker: 'agent', text: "This is a follow-up call from our company about your application for the driving position. Is now a good time to chat?" },
  { startTime: 10, endTime: 11, speaker: 'applicant', text: 'Yes.' },
  { startTime: 11, endTime: 15, speaker: 'agent', text: "Excellent. I'm glad we could connect." },
  { startTime: 15, endTime: 26, speaker: 'agent', text: "I see here that you're Cody Forbes from Weatherford, Texas, and you have a Class A CDL with one year of experience. You're also willing to pass a drug test, and you're a veteran. Does all that sound correct?" },
  { startTime: 28, endTime: 29, speaker: 'applicant', text: 'Yes.' },
  { startTime: 29, endTime: 38, speaker: 'agent', text: "Great. Thanks for confirming that, Cody. We appreciate your service as a veteran, and we're always looking for dedicated drivers like yourself." },
  { startTime: 38, endTime: 44, speaker: 'agent', text: 'Do you have any questions for me about the driving position at our company?' },
  { startTime: 44, endTime: 47, speaker: 'applicant', text: "I don't believe so." },
  { startTime: 47, endTime: 55, speaker: 'agent', text: 'Great news, Cody. Everything looks good. A recruiter from our company will review your application and reach out soon about the driving position.' },
  { startTime: 55, endTime: 60, speaker: 'agent', text: "Thanks for your time, Cody. We're excited about your interest in our company. Talk soon." },
];

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ currentTime }) => {
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
                  {entry.speaker === 'agent' ? 'AI Agent' : 'Applicant'}
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
