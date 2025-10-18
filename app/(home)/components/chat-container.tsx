'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useState } from 'react';
import { Bolt, CircuitBoard } from 'lucide-react';

import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ChatContainer() {
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const [draft, setDraft] = useState('');
  const isLoading = status === 'streaming' || status === 'submitted';

  const handlePromptSelect = (prompt: string) => {
    setDraft(prompt);
    // Send the message immediately after setting draft
    setTimeout(() => {
      sendMessage({ text: prompt });
      setDraft(''); // Clear input after sending
    }, 0);
  };

  return (
    <Card className='flex flex-col w-full h-full max-h-screen border-0 shadow-2xl bg-card/95 backdrop-blur-xl overflow-hidden gap-0'>
      <ChatMessages
        messages={messages}
        status={status}
        onPromptSelect={handlePromptSelect}
      />

      <div className='sticky bottom-0 p-4 border-t border-border/40 bg-gradient-to-t from-card to-card/80 backdrop-blur-sm'>
        <ChatInput
          value={draft}
          setValue={setDraft}
          onSubmit={sendMessage}
          isLoading={isLoading}
          onStop={stop}
        />
      </div>
    </Card>
  );
}
