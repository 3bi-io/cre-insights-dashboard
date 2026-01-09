/**
 * Grok Chat Interface Component
 * Main chat UI with message history and input
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Trash2, Sparkles } from 'lucide-react';
import { useGrokChat } from '../hooks/useGrokChat';
import { ChatMessage } from './ChatMessage';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useGrokChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Grok 4 Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Powered by xAI • 256K context
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearMessages}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center max-w-md space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Welcome to Grok 4</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  I'm powered by xAI's most advanced Grok 4 model with 256K token context.
                  Ask me anything about analysis, reasoning, creative tasks, and more!
                </p>
              </div>
              <div className="grid gap-2 text-left">
                <Card className="p-3 cursor-pointer hover:bg-accent transition-colors">
                  <p className="text-sm font-medium">Explain a complex concept</p>
                  <p className="text-xs text-muted-foreground">
                    Help me understand quantum computing
                  </p>
                </Card>
                <Card className="p-3 cursor-pointer hover:bg-accent transition-colors">
                  <p className="text-sm font-medium">Brainstorm ideas</p>
                  <p className="text-xs text-muted-foreground">
                    Suggest creative project names
                  </p>
                </Card>
                <Card className="p-3 cursor-pointer hover:bg-accent transition-colors">
                  <p className="text-sm font-medium">Analyze data</p>
                  <p className="text-xs text-muted-foreground">
                    Help me interpret trends in my data
                  </p>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 px-4 py-6 bg-muted/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-2">Grok 4</p>
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            id="grok-chat-input"
            name="grok-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Grok 4 anything..."
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-[60px] w-[60px] shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
