import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Pin, PinOff, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface ChatBotProps {
  page?: string;
  context?: any;
}

const ChatBot: React.FC<ChatBotProps> = ({ page = 'general', context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Drag handlers
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
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 384; // chat width
    const maxY = window.innerHeight - (isMinimized ? 64 : 600); // chat height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      // When pinning, ensure it's not minimized
      setIsMinimized(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message based on page context
      const welcomeMessage = getWelcomeMessage(page);
      setMessages([{
        id: '1',
        text: welcomeMessage,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, page]);

  const getWelcomeMessage = (currentPage: string): string => {
    const pageMessages: Record<string, string> = {
      'dashboard': '👋 Hi! I can help you understand your dashboard metrics, analyze trends, and provide insights about your recruitment marketing performance. What would you like to know?',
      'applications': '📋 Welcome! I can analyze your application data, show conversion rates, identify top sources, and help optimize your recruitment funnel. How can I assist?',
      'jobs': '💼 Hello! I can help you analyze job performance, compare publishers, track spending efficiency, and optimize your job postings. What insights do you need?',
      'clients': '👥 Hi there! I can provide client analytics, relationship insights, and help you understand client patterns and opportunities. What would you like to explore?',
      'publishers': '🚀 Welcome! I can analyze publisher performance, compare costs, show ROI metrics, and help optimize your publisher strategy. How can I help?',
      'settings': '⚙️ Hello! I can help you understand system configuration, user analytics, and provide insights about your account setup. What do you need help with?',
      'general': '🤖 Hi! I\'m your ƷBI Analytics Assistant. I can analyze your recruitment data, provide insights on applications, jobs, spending, and performance metrics. Ask me anything about your data!'
    };

    return pageMessages[currentPage] || pageMessages['general'];
  };

  const getPageContext = (currentPage: string): string => {
    const contexts: Record<string, string> = {
      'dashboard': 'The user is on the dashboard page viewing overall metrics and KPIs.',
      'applications': 'The user is on the applications page reviewing candidate applications and application analytics.',
      'jobs': 'The user is on the jobs page managing job listings and job performance.',
      'clients': 'The user is on the clients page managing client relationships and client data.',
      'publishers': 'The user is on the publishers page managing job posting publishers and publisher analytics.',
      'settings': 'The user is on the settings page configuring system settings.',
    };

    return contexts[currentPage] || 'The user is viewing general system information.';
  };

  const detectQueryType = (message: string): 'analytics' | 'analysis' | 'general' => {
    const analyticsKeywords = [
      'how many', 'total', 'count', 'show me', 'list', 'breakdown', 'distribution'
    ];
    
    const analysisKeywords = [
      'analyze', 'analysis', 'insights', 'trends', 'patterns', 'compare', 'comparison',
      'performance', 'optimize', 'optimization', 'recommend', 'prediction', 'forecast',
      'why', 'what should', 'improve', 'strategy', 'roi', 'efficiency', 'best', 'worst'
    ];
    
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

    try {
      const queryType = detectQueryType(currentMessage);
      const systemPrompt = `You are ƷBI's intelligent business assistant specialized in recruitment marketing analytics.

Current Context: ${getPageContext(page)}
${context ? `Additional Context: ${JSON.stringify(context)}` : ''}

Your role:
- Provide data-driven insights about recruitment marketing
- Analyze applications, jobs, spending, and platform performance
- Offer actionable recommendations for optimization
- Be specific with numbers and trends when available
- Keep responses concise but comprehensive

When analyzing data:
- Highlight key metrics and KPIs
- Identify trends and patterns  
- Suggest optimization opportunities
- Use bullet points for clarity
- Provide context for the numbers`;

      let response;
      
      if (queryType === 'analysis') {
        // Use advanced data analysis for complex analytical queries
        response = await supabase.functions.invoke('data-analysis', {
          body: { 
            query: currentMessage,
            analysisType: 'insights',
            timeframe: 'last30days',
            includeRecommendations: true,
            dataPoints: [page]
          }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.analysis || 'I couldn\'t complete the advanced analysis. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
          isAnalytics: true
        };

        setMessages(prev => [...prev, botMessage]);
      } else if (queryType === 'analytics') {
        // Use analytics-specific function for data queries
        response = await supabase.functions.invoke('chatbot-analytics', {
          body: { 
            query: currentMessage,
            context: getPageContext(page)
          }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.response || 'I couldn\'t process your analytics request. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
          isAnalytics: true
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        // Use general OpenAI chat for other queries
        response = await supabase.functions.invoke('openai-chat', {
          body: { 
            message: currentMessage,
            systemPrompt,
            includeAnalytics: false
          }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.generatedText || 'I apologize, but I couldn\'t generate a response. Please try again.',
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I\'m experiencing technical difficulties. Please try again in a moment. In the meantime, I can help you with data analysis, performance metrics, and recruitment insights.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Unable to process your message. Please try again.",
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

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
        size="lg"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  const chatStyle = isPinned ? {
    position: 'fixed' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    bottom: 'auto',
    right: 'auto'
  } : {};

  return (
    <Card 
      ref={chatRef}
      className={`w-96 bg-background border shadow-xl z-50 transition-all duration-300 ${
        isPinned 
          ? `${isDragging ? 'cursor-move' : ''} ${isMinimized ? 'h-16' : 'h-[600px]'}` 
          : `fixed bottom-6 right-6 ${isMinimized ? 'h-16' : 'h-[600px]'}`
      }`}
      style={chatStyle}
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-4 border-b bg-primary text-primary-foreground ${
          isPinned ? 'cursor-move' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="font-medium">ƷBI Analytics Assistant</span>
          {page !== 'general' && (
            <Badge variant="secondary" className="text-xs">
              {page}
            </Badge>
          )}
          {isPinned && (
            <Move className="w-3 h-3 opacity-60" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePin}
            className="text-primary-foreground hover:bg-primary-foreground/20"
            title={isPinned ? 'Unpin chat' : 'Pin chat'}
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </Button>
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
          {/* Messages */}
          <ScrollArea className="flex-1 p-4 h-[460px]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.text}</div>
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

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your data, metrics, or performance..."
                className="min-h-[40px] max-h-[100px] resize-none"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !currentMessage.trim()}
                size="sm"
              >
                Send
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Try: "Analyze my platform performance" or "What trends do you see in applications?"
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default ChatBot;