import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Pin, PinOff, Move, Send, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isAnalytics?: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface ChatSession {
  id: string;
  title: string;
  page?: string;
  context?: string;
  created_at: string;
  updated_at: string;
}

interface ChatBotProps {
  page?: string;
  context?: any;
}

const MobileChatBot: React.FC<ChatBotProps> = ({ page = 'general', context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Mobile-optimized dimensions
  const chatWidth = isMobile ? 'calc(100vw - 32px)' : '384px';
  const chatHeight = isMobile 
    ? (isMinimized ? '64px' : 'calc(100vh - 32px)') 
    : (isMinimized ? '64px' : '600px');

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPinned) return;
    
    const rect = chatRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isPinned) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    const maxX = window.innerWidth - (isMobile ? window.innerWidth - 32 : 384);
    const maxY = window.innerHeight - (isMinimized ? 64 : (isMobile ? window.innerHeight - 32 : 600));
    
    setPosition({
      x: Math.max(16, Math.min(newX, maxX)),
      y: Math.max(16, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isPinned) return;
    
    const touch = e.touches[0];
    const rect = chatRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !isPinned) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    
    const maxX = window.innerWidth - (isMobile ? window.innerWidth - 32 : 384);
    const maxY = window.innerHeight - (isMinimized ? 64 : (isMobile ? window.innerHeight - 32 : 600));
    
    setPosition({
      x: Math.max(16, Math.min(newX, maxX)),
      y: Math.max(16, Math.min(newY, maxY))
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      // Add both mouse and touch event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Load user's chat sessions when component mounts and user is authenticated
    const fetchSessions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .order('updated_at', { ascending: false });
          
          if (error) throw error;
          if (data) setSessions(data);
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  // Create a new chat session or update existing one with messages
  const saveSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save chat sessions.",
          variant: "destructive"
        });
        return;
      }
      
      if (messages.length <= 1) {
        // Don't save sessions with only the welcome message
        return;
      }

      // Generate a title based on first user message
      const userMessages = messages.filter(msg => msg.sender === 'user');
      const sessionTitle = userMessages.length > 0 
        ? userMessages[0].text.slice(0, 40) + (userMessages[0].text.length > 40 ? '...' : '')
        : 'New Chat';

      let sessionId = currentSessionId;
      
      // Create a new session if we don't have one
      if (!sessionId) {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert([{
            user_id: user.id,
            title: sessionTitle,
            page,
            context: context ? JSON.stringify(context) : null
          }])
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          sessionId = data.id;
          setCurrentSessionId(sessionId);
          setSessions(prev => [data, ...prev]);
        }
      } else {
        // Update existing session
        const { error } = await supabase
          .from('chat_sessions')
          .update({ 
            title: sessionTitle,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        if (error) throw error;
      }

      // Save messages to the database
      if (sessionId) {
        // Get only new messages that need to be saved
        const messagesToSave = messages.filter(msg => !msg.id.includes('db_'));
        
        if (messagesToSave.length > 0) {
          const { error } = await supabase
            .from('chat_messages')
            .insert(
              messagesToSave.map(msg => ({
                session_id: sessionId,
                message: msg.text,
                sender: msg.sender,
                is_analytics: !!msg.isAnalytics,
                timestamp: msg.timestamp.toISOString()
              }))
            );
          
          if (error) throw error;
          
          // Update message IDs to indicate they're saved in DB
          setMessages(prev => 
            prev.map(msg => 
              messagesToSave.includes(msg) 
                ? { ...msg, id: `db_${msg.id}` } 
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error saving chat session:', error);
      toast({
        title: "Save Error",
        description: "Could not save your chat session.",
        variant: "destructive"
      });
    }
  };

  // Load an existing chat session
  const loadSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const loadedMessages = data.map(msg => ({
          id: `db_${msg.id}`,
          text: msg.message,
          sender: msg.sender as 'user' | 'bot',
          timestamp: new Date(msg.timestamp),
          isAnalytics: msg.is_analytics
        }));
        
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
        setShowSessionHistory(false);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      toast({
        title: "Load Error",
        description: "Could not load the chat session.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new chat session
  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([{
      id: '1',
      text: getWelcomeMessage(page),
      sender: 'bot',
      timestamp: new Date()
    }]);
    setShowSessionHistory(false);
  };

  // Save chat session after messages update
  useEffect(() => {
    if (isOpen && messages.length > 1 && !isLoading) {
      const saveTimer = setTimeout(() => {
        saveSession();
      }, 2000); // Save after 2 seconds of inactivity
      
      return () => clearTimeout(saveTimer);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startNewSession();
    }
  }, [isOpen]);

  const getWelcomeMessage = (currentPage: string): string => {
    const pageMessages: Record<string, string> = {
      'dashboard': '👋 Hi! I can help you understand your dashboard metrics and provide insights. What would you like to know?',
      'applications': '📋 Welcome! I can analyze your application data and help optimize your recruitment funnel. How can I assist?',
      'jobs': '💼 Hello! I can help you analyze job performance and optimize your job postings. What insights do you need?',
      'clients': '👥 Hi there! I can provide client analytics and relationship insights. What would you like to explore?',
      'platforms': '🚀 Welcome! I can analyze platform performance and help optimize your strategy. How can I help?',
      'general': '🤖 Hi! I\'m your ƷBI Analytics Assistant. Ask me anything about your recruitment data!'
    };

    return pageMessages[currentPage] || pageMessages['general'];
  };

  const getPageContext = (currentPage: string): string => {
    const contexts: Record<string, string> = {
      'dashboard': 'The user is viewing dashboard metrics on mobile.',
      'applications': 'The user is reviewing applications on mobile.',
      'jobs': 'The user is managing jobs on mobile.',
      'clients': 'The user is managing clients on mobile.',
      'platforms': 'The user is reviewing platforms on mobile.',
    };

    return contexts[currentPage] || 'The user is on mobile.';
  };

  const detectQueryType = (message: string): 'analytics' | 'analysis' | 'general' => {
    const analyticsKeywords = ['how many', 'total', 'count', 'show me', 'list', 'breakdown'];
    const analysisKeywords = ['analyze', 'insights', 'trends', 'compare', 'optimize', 'recommend'];
    
    const lowerMessage = message.toLowerCase();
    
    if (analysisKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'analysis';
    }
    
    if (analyticsKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'analytics';
    }
    
    return 'general';
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const queryType = detectQueryType(currentMessage);
      const systemPrompt = `You are ƷBI's mobile-optimized analytics assistant.

Current Context: ${getPageContext(page)}
Device: Mobile
${context ? `Additional Context: ${JSON.stringify(context)}` : ''}

Your role:
- Provide concise, mobile-friendly responses
- Use bullet points and short paragraphs
- Focus on key insights and actionable items
- Adapt to touch interface and smaller screens`;

      let response;
      
      if (queryType === 'analysis') {
        response = await supabase.functions.invoke('data-analysis', {
          body: { 
            query: currentMessage,
            analysisType: 'insights',
            timeframe: 'last30days',
            includeRecommendations: true,
            dataPoints: [page, 'mobile']
          }
        });
      } else if (queryType === 'analytics') {
        response = await supabase.functions.invoke('chatbot-analytics', {
          body: { 
            query: currentMessage,
            context: getPageContext(page)
          }
        });
      } else {
        response = await supabase.functions.invoke('openai-chat', {
          body: { 
            message: currentMessage,
            systemPrompt,
            includeAnalytics: false
          }
        });
      }

      if (response.error) {
        throw new Error(response.error.message);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.analysis || response.data.response || response.data.generatedText || 'I couldn\'t process your request. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        isAnalytics: queryType !== 'general'
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I\'m having trouble right now. Please try again in a moment.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const togglePin = () => {
    if (isMobile) {
      // On mobile, just show a toast
      toast({
        title: "Pin Feature",
        description: "Pinning is optimized for desktop use. On mobile, the chat automatically adapts to your screen.",
      });
      return;
    }
    setIsPinned(!isPinned);
    if (!isPinned) {
      setIsMinimized(false);
    }
  };

  // Mobile-specific positioning
  const chatStyle = isPinned && !isMobile ? {
    position: 'fixed' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    bottom: 'auto',
    right: 'auto',
    width: chatWidth,
    height: chatHeight
  } : {
    width: chatWidth,
    height: chatHeight
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed ${isMobile ? 'bottom-4 right-4 w-16 h-16' : 'bottom-6 right-6 w-14 h-14'} rounded-full shadow-lg z-50 animate-pulse`}
        size="lg"
      >
        <MessageSquare className={isMobile ? 'w-8 h-8' : 'w-6 h-6'} />
      </Button>
    );
  }

  return (
    <Card 
      ref={chatRef}
      className={`bg-background border shadow-xl z-50 transition-all duration-300 ${
        isPinned && !isMobile
          ? `${isDragging ? 'cursor-move' : ''}`
          : `fixed ${isMobile ? 'bottom-4 right-4 left-4' : 'bottom-6 right-6'}`
      }`}
      style={chatStyle}
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-4 border-b bg-primary text-primary-foreground ${
          isPinned && !isMobile ? 'cursor-move' : ''
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
          <span className={`font-medium truncate ${isMobile ? 'text-sm' : ''}`}>
            ƷBI Assistant
          </span>
          {page !== 'general' && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {page}
            </Badge>
          )}
          {isPinned && !isMobile && (
            <Move className="w-3 h-3 opacity-60 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePin}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              title={isPinned ? 'Unpin chat' : 'Pin chat'}
            >
              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setIsPinned(false);
              setIsMinimized(false);
            }}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {showSessionHistory ? (
            // Session History UI
            <div className={`flex-1 p-4 ${isMobile ? 'h-[calc(100vh-180px)]' : 'h-[460px]'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Chat History</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={startNewSession}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100%-48px)]">
                {sessions.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    No chat history yet. Start a conversation!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map(session => (
                      <Card
                        key={session.id}
                        className="p-3 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="font-medium truncate">{session.title}</div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                          <span>{new Date(session.updated_at).toLocaleDateString()}</span>
                          {session.page && <Badge variant="outline" className="text-xs">{session.page}</Badge>}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            // Messages UI
            <ScrollArea className={`flex-1 p-4 ${isMobile ? 'h-[calc(100vh-180px)]' : 'h-[460px]'}`}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className={`${isMobile ? 'text-sm' : 'text-sm'} whitespace-pre-wrap`}>
                        {message.text}
                      </div>
                      {message.isAnalytics && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          📊 Analytics
                        </Badge>
                      )}
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Input */}
          <div className="p-4 border-t bg-background">
            {showSessionHistory ? (
              <Button
                variant="outline" 
                className="w-full"
                onClick={() => setShowSessionHistory(false)}
              >
                Back to Current Chat
              </Button>
            ) : (
              <>
                <div className="flex gap-2 items-end">
                  <Textarea
                    ref={textareaRef}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your data..."
                    className={`min-h-[44px] max-h-[120px] resize-none ${isMobile ? 'text-base' : 'text-sm'}`}
                    disabled={isLoading}
                    style={{ fontSize: isMobile ? '16px' : '14px' }} // Prevents zoom on iOS
                  />
                  <Button
                    variant="ghost"
                    size="sm" 
                    onClick={() => setShowSessionHistory(true)}
                    className="h-[44px] px-3"
                    title="Chat history"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={sendMessage} 
                    disabled={isLoading || !currentMessage.trim()}
                    size="sm"
                    className="h-[44px] px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground mt-2`}>
                  Try: "Analyze performance" or "Show application trends"
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

export default MobileChatBot;