/**
 * Hook for managing Grok chat conversations with streaming
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  id?: string;
  timestamp?: Date;
}

export function useGrokChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Send a message and stream the response
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function with streaming
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grok-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let assistantMessageId = crypto.randomUUID();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          // Handle CRLF
          if (line.endsWith('\r')) {
            line = line.slice(0, -1);
          }

          // Skip comments and empty lines
          if (line.startsWith(':') || line.trim() === '') {
            continue;
          }

          // Parse SSE data
          if (!line.startsWith('data: ')) {
            continue;
          }

          const jsonStr = line.slice(6).trim();

          // Check for [DONE] marker
          if (jsonStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;

            if (delta) {
              assistantMessage += delta;

              // Update assistant message in state
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.id === assistantMessageId) {
                  // Update existing message
                  return prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantMessage }
                      : msg
                  );
                } else {
                  // Create new assistant message
                  return [
                    ...prev,
                    {
                      role: 'assistant' as const,
                      content: assistantMessage,
                      id: assistantMessageId,
                      timestamp: new Date(),
                    },
                  ];
                }
              });
            }
          } catch (parseError) {
            // Incomplete JSON, put back in buffer
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (const raw of textBuffer.split('\n')) {
          if (!raw || raw.startsWith(':') || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantMessage += delta;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantMessage }
                    : msg
                )
              );
            }
          } catch {
            // Ignore parse errors in final flush
          }
        }
      }
    } catch (error: any) {
      logger.error('Chat error', error);
      
      // Handle specific errors
      if (error.message.includes('Rate limit')) {
        toast({
          title: 'Rate Limit Exceeded',
          description: 'Too many requests. Please wait a moment and try again.',
          variant: 'destructive',
        });
      } else if (error.message.includes('Payment required')) {
        toast({
          title: 'API Credits Required',
          description: 'Please add xAI API credits to continue using Grok.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send message',
          variant: 'destructive',
        });
      }

      // Remove failed user message
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
