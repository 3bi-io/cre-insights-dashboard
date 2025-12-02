import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChatBotPreferences } from '@/hooks/useChatBotPreferences';
import { useChatBot } from '@/hooks/useChatBot';
import { useToast } from '@/hooks/use-toast';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ChatSettings } from './ChatSettings';
import { ChatHistory } from './ChatHistory';
import type { ChatBotProps } from './types';

const MobileChatBot: React.FC<ChatBotProps> = ({ page = 'general', context }) => {
  const { preferences, isLoading: prefsLoading, savePreferences } = useChatBotPreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [view, setView] = useState<'chat' | 'settings' | 'history'>('chat');
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const {
    messages,
    isLoading,
    sessions,
    selectedModel,
    setSelectedModel,
    sendMessage,
    startNewSession,
    loadSession,
    saveSession
  } = useChatBot({ page, context });

  // Load preferences
  useEffect(() => {
    if (!prefsLoading) {
      setIsPinned(preferences.isPinned);
      setIsMinimized(preferences.isMinimized);
    }
  }, [prefsLoading, preferences]);

  // Initialize session when opening
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startNewSession();
    }
  }, [isOpen, messages.length, startNewSession]);

  // Auto-save session
  useEffect(() => {
    if (isOpen && messages.length > 1 && !isLoading) {
      const timer = setTimeout(saveSession, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, isOpen, saveSession]);

  const togglePin = () => {
    if (isMobile) {
      toast({ title: "Pin Feature", description: "Pinning is optimized for desktop." });
      return;
    }
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    if (newPinned) setIsMinimized(false);
    savePreferences({ isPinned: newPinned, isMinimized: newPinned ? false : isMinimized });
  };

  const toggleMinimize = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    savePreferences({ isMinimized: newMinimized });
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsPinned(false);
    setIsMinimized(false);
  };

  const handleLoadSession = (sessionId: string) => {
    loadSession(sessionId);
    setView('chat');
  };

  const handleNewSession = () => {
    startNewSession();
    setView('chat');
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 md:h-12 md:w-12 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6 md:h-5 md:w-5" />
      </Button>
    );
  }

  // Side panel style when pinned (desktop only)
  const sidePanelStyle = isPinned && !isMobile ? {
    position: 'fixed' as const,
    right: 0,
    top: 0,
    height: '100vh',
    width: isMinimized ? '64px' : '400px',
    borderRadius: 0,
  } : {};

  return (
    <Card
      className={`bg-background border shadow-xl z-50 transition-all duration-300 flex flex-col ${
        isPinned && !isMobile
          ? `h-screen rounded-none ${isMinimized ? 'w-16' : 'w-[400px]'}`
          : `fixed inset-4 md:bottom-6 md:right-6 md:left-auto md:top-auto md:w-96 ${
              isMinimized ? 'h-16' : 'md:h-[600px]'
            } rounded-lg`
      }`}
      style={sidePanelStyle}
    >
      <ChatHeader
        page={page}
        isMinimized={isMinimized}
        isPinned={isPinned}
        isMobile={isMobile}
        onToggleMinimize={toggleMinimize}
        onTogglePin={togglePin}
        onToggleSettings={() => setView(view === 'settings' ? 'chat' : 'settings')}
        onClose={handleClose}
      />

      {!isMinimized && (
        <>
          {view === 'settings' ? (
            <ChatSettings
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onBack={() => setView('chat')}
              isMobile={isMobile}
            />
          ) : view === 'history' ? (
            <ChatHistory
              sessions={sessions}
              onSelectSession={handleLoadSession}
              onNewSession={handleNewSession}
              onBack={() => setView('chat')}
              isMobile={isMobile}
            />
          ) : (
            <>
              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                isPinned={isPinned}
                isMobile={isMobile}
              />
              <ChatInput
                onSend={sendMessage}
                onShowHistory={() => setView('history')}
                onShowSettings={() => setView('settings')}
                isLoading={isLoading}
                selectedModel={selectedModel}
                isMobile={isMobile}
              />
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default MobileChatBot;
