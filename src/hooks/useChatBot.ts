import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, ChatSession, ChatContext, AIModel } from '@/components/chat/types';
import { logger } from '@/lib/logger';

interface UseChatBotProps {
  page: string;
  context?: ChatContext;
}

export const useChatBot = ({ page, context }: UseChatBotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel>('openai');
  const { toast } = useToast();

  const getWelcomeMessage = useCallback((currentPage: string): string => {
    const orgName = context?.organizationName || 'your organization';
    const pageMessages: Record<string, string> = {
      'dashboard': `👋 Hi! I can help you understand ${orgName}'s dashboard metrics. What would you like to know?`,
      'applications': `📋 Welcome! I can analyze ${orgName}'s application data. How can I assist?`,
      'jobs': `💼 Hello! I can help analyze ${orgName}'s job performance. What insights do you need?`,
      'clients': `👥 Hi! I can provide ${orgName}'s client analytics. What would you like to explore?`,
      'publishers': `🚀 Welcome! I can analyze ${orgName}'s publisher performance. How can I help?`,
      'general': `🤖 Hi! I'm your ƷBI Analytics Assistant for ${orgName}. Ask me anything!`
    };
    return pageMessages[currentPage] || pageMessages['general'];
  }, [context?.organizationName]);

  const getPageContext = useCallback((currentPage: string): string => {
    const orgContext = context?.organizationName ? ` for ${context.organizationName}` : '';
    const contexts: Record<string, string> = {
      'dashboard': `User viewing dashboard${orgContext}.`,
      'applications': `User reviewing applications${orgContext}.`,
      'jobs': `User managing jobs${orgContext}.`,
      'clients': `User managing clients${orgContext}.`,
      'publishers': `User reviewing publishers${orgContext}.`,
    };
    return contexts[currentPage] || `User on mobile${orgContext}.`;
  }, [context?.organizationName]);

  const detectQueryType = (message: string): 'analytics' | 'analysis' | 'general' => {
    const lowerMessage = message.toLowerCase();
    if (['analyze', 'insights', 'trends', 'compare', 'optimize', 'recommend'].some(k => lowerMessage.includes(k))) return 'analysis';
    if (['how many', 'total', 'count', 'show me', 'list', 'breakdown'].some(k => lowerMessage.includes(k))) return 'analytics';
    return 'general';
  };

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('chat_sessions')
            .select('*')
            .order('updated_at', { ascending: false });
          if (data) setSessions(data);
        }
      } catch (error) {
        logger.error('Error fetching chat sessions', error);
      }
    };
    fetchSessions();
  }, []);

  const startNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([{
      id: '1',
      text: getWelcomeMessage(page),
      sender: 'bot',
      timestamp: new Date()
    }]);
  }, [page, getWelcomeMessage]);

  const loadSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      if (data?.length) {
        setMessages(data.map(msg => ({
          id: `db_${msg.id}`,
          text: msg.message,
          sender: msg.sender as 'user' | 'bot',
          timestamp: new Date(msg.timestamp),
          isAnalytics: msg.is_analytics
        })));
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      toast({ title: "Load Error", description: "Could not load session.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || messages.length <= 1) return;

      const userMessages = messages.filter(msg => msg.sender === 'user');
      const sessionTitle = userMessages.length > 0
        ? userMessages[0].text.slice(0, 40) + (userMessages[0].text.length > 40 ? '...' : '')
        : 'New Chat';

      let sessionId = currentSessionId;

      if (!sessionId) {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert([{ user_id: user.id, title: sessionTitle, page, context: context ? JSON.stringify(context) : null }])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          sessionId = data.id;
          setCurrentSessionId(sessionId);
          setSessions(prev => [data, ...prev]);
        }
      } else {
        await supabase.from('chat_sessions').update({ title: sessionTitle, updated_at: new Date().toISOString() }).eq('id', sessionId);
      }

      if (sessionId) {
        const messagesToSave = messages.filter(msg => !msg.id.includes('db_'));
        if (messagesToSave.length > 0) {
          await supabase.from('chat_messages').insert(
            messagesToSave.map(msg => ({
              session_id: sessionId,
              message: msg.text,
              sender: msg.sender,
              is_analytics: !!msg.isAnalytics,
              timestamp: msg.timestamp.toISOString()
            }))
          );
          setMessages(prev => prev.map(msg => messagesToSave.includes(msg) ? { ...msg, id: `db_${msg.id}` } : msg));
        }
      }
    } catch (error) {
      logger.error('Error saving session', error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const queryType = detectQueryType(text);
      const orgInfo = context?.organizationName
        ? `\n\nIMPORTANT: Assisting ${context.organizationName} (ID: ${context.organizationId}). Filter all data to this organization. User Role: ${context.userRole || 'admin'}`
        : '';

      const systemPrompt = `You are ƷBI's analytics assistant.\nContext: ${getPageContext(page)}${orgInfo}\n\nProvide concise, mobile-friendly responses with bullet points.`;

      let response;
      if (queryType === 'analysis') {
        response = await supabase.functions.invoke('data-analysis', {
          body: { query: text, analysisType: 'insights', timeframe: 'last30days', includeRecommendations: true, organizationId: context?.organizationId }
        });
      } else if (queryType === 'analytics') {
        response = await supabase.functions.invoke('chatbot-analytics', {
          body: { query: text, context: getPageContext(page), organizationId: context?.organizationId }
        });
      } else {
        const endpoint = selectedModel === 'anthropic' ? 'anthropic-chat' : 'openai-chat';
        response = await supabase.functions.invoke(endpoint, {
          body: { message: text, systemPrompt, ...(selectedModel === 'anthropic' ? { model: 'claude-sonnet-4-5' } : { includeAnalytics: false }) }
        });
      }

      if (response.error) throw new Error(response.error.message);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.analysis || response.data.response || response.data.generatedText || 'Could not process request.',
        sender: 'bot',
        timestamp: new Date(),
        isAnalytics: queryType !== 'general'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      logger.error('Chat error', error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Having trouble. Please try again.', sender: 'bot', timestamp: new Date() }]);
      toast({ title: "Connection Error", description: "Check your connection.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sessions,
    selectedModel,
    setSelectedModel,
    sendMessage,
    startNewSession,
    loadSession,
    saveSession
  };
};
