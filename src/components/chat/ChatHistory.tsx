import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ChatSession } from './types';

interface ChatHistoryProps {
  sessions: ChatSession[];
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onBack: () => void;
  isMobile: boolean;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  onSelectSession,
  onNewSession,
  onBack,
  isMobile
}) => {
  return (
    <div className={`flex-1 p-4 ${isMobile ? 'h-[calc(100dvh-200px)]' : 'h-[460px]'} flex flex-col`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Chat History</h3>
        <Button variant="ghost" size="sm" onClick={onNewSession} className="gap-1">
          <Plus className="w-4 h-4" />
          <span>New</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No chat history yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => (
              <Card
                key={session.id}
                className="p-3 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => onSelectSession(session.id)}
              >
                <p className="font-medium text-sm truncate">{session.title}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  <span>{new Date(session.updated_at).toLocaleDateString()}</span>
                  {session.page && <Badge variant="outline" className="text-xs">{session.page}</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="mt-4 pt-4 border-t">
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to Chat
        </Button>
      </div>
    </div>
  );
};
