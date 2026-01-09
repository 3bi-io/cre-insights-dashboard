import React, { useState, useRef } from 'react';
import { Send, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { AIModel } from './types';

interface ChatInputProps {
  onSend: (message: string) => void;
  onShowHistory: () => void;
  onShowSettings: () => void;
  isLoading: boolean;
  selectedModel: AIModel;
  isMobile: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onShowHistory,
  onShowSettings,
  isLoading,
  selectedModel,
  isMobile
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSend(message);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modelLabel = selectedModel === 'openai' ? '🤖 GPT-4' : selectedModel === 'anthropic' ? '🧠 Claude' : '⚡ Grok';

  return (
    <div className="p-3 md:p-4 border-t bg-background">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          id="ai-chat-input"
          name="ai-chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your data..."
          className="min-h-[44px] max-h-[100px] resize-none text-base md:text-sm"
          disabled={isLoading}
          style={{ fontSize: isMobile ? '16px' : '14px' }}
        />
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowSettings}
            className="h-5 w-5 md:h-6 md:w-6"
            title="Settings"
          >
            <Settings className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowHistory}
            className="h-5 w-5 md:h-6 md:w-6"
            title="History"
          >
            <History className="w-3 h-3" />
          </Button>
        </div>
        <Button
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          size="icon"
          className="h-11 w-11 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-2 flex justify-between items-center">
        <span className="truncate">Try: "Analyze performance"</span>
        <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
          {modelLabel}
        </Badge>
      </div>
    </div>
  );
};
