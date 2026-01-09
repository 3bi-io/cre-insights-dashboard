/**
 * Live Transcript Panel
 * Displays real-time transcription during voice conversations
 */

import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Bot, Loader2 } from 'lucide-react';
import { LiveTranscriptMessage } from '../types';
import { cn } from '@/lib/utils';

interface LiveTranscriptPanelProps {
  transcripts: LiveTranscriptMessage[];
  pendingUserTranscript?: string;
  isSpeaking: boolean;
  isConnected: boolean;
}

export const LiveTranscriptPanel: React.FC<LiveTranscriptPanelProps> = ({
  transcripts,
  pendingUserTranscript,
  isSpeaking,
  isConnected
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, pendingUserTranscript]);

  if (!isConnected) return null;

  return (
    <div className="border rounded-lg bg-muted/30">
      <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
        <span className="text-sm font-medium">Live Transcript</span>
        {isSpeaking && (
          <span className="text-xs text-primary flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Agent speaking...
          </span>
        )}
      </div>
      
      <ScrollArea className="h-48" ref={scrollRef}>
        <div className="p-3 space-y-3">
          {transcripts.length === 0 && !pendingUserTranscript && (
            <div className="text-center py-4">
              {isSpeaking ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Listening to agent...
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The agent will speak first...
                </p>
              )}
            </div>
          )}

          {/* Pending agent indicator - shows while agent is speaking before transcript arrives */}
          {isSpeaking && transcripts.length > 0 && transcripts[transcripts.length - 1]?.speaker === 'user' && (
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3" />
              </div>
              <div className="flex-1 p-2 rounded-lg text-sm bg-secondary/30 border border-dashed border-secondary/50">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}

          {transcripts.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 items-start",
                message.speaker === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                message.speaker === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              )}>
                {message.speaker === 'user' 
                  ? <User className="w-3 h-3" /> 
                  : <Bot className="w-3 h-3" />
                }
              </div>
              <div className={cn(
                "flex-1 p-2 rounded-lg text-sm",
                message.speaker === 'user' 
                  ? 'bg-primary/10 text-right' 
                  : 'bg-secondary/50'
              )}>
                <p>{message.text}</p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {/* Pending user transcript (what they're currently saying) */}
          {pendingUserTranscript && (
            <div className="flex gap-2 items-start flex-row-reverse">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3" />
              </div>
              <div className="flex-1 p-2 rounded-lg text-sm bg-primary/5 text-right border border-dashed border-primary/30">
                <p className="italic text-muted-foreground">{pendingUserTranscript}</p>
                <span className="text-xs text-muted-foreground mt-1 block">speaking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
