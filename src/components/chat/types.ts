export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isAnalytics?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  page?: string;
  context?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatContext {
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  userRole?: string;
}

export interface ChatBotProps {
  page?: string;
  context?: ChatContext;
}

export type AIModel = 'openai' | 'anthropic' | 'grok';
