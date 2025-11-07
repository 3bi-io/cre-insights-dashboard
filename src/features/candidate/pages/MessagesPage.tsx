import React from 'react';
import { MessageSquare } from 'lucide-react';

const MessagesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with employers
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
        <p className="text-muted-foreground">
          When employers reach out, you'll see their messages here
        </p>
      </div>
    </div>
  );
};

export default MessagesPage;
