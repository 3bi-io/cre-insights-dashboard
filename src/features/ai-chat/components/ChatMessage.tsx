/**
 * Chat Message Component
 * Displays individual messages in the chat interface
 */

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../hooks/useGrokChat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-6',
        isAssistant ? 'bg-muted/50' : 'bg-background'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isAssistant
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isAssistant ? (
          <Bot className="h-5 w-5" />
        ) : (
          <User className="h-5 w-5" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <p className="font-semibold text-sm">
          {isAssistant ? 'Grok' : 'You'}
        </p>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {message.timestamp && (
          <p className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
