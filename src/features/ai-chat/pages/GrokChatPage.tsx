/**
 * Grok Chat Page
 * Full-page chat interface with Grok AI
 */

import { ChatInterface } from '../components/ChatInterface';

export function GrokChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <ChatInterface />
    </div>
  );
}
