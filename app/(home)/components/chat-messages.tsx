'use client';

import { useEffect, useRef, useState } from 'react';
import { UIMessage } from 'ai';
import { ArrowDown, Bot, Sparkles, Zap } from 'lucide-react';

import { ChatMessage } from '@/app/(home)/components/chat-message';
import { Button } from '@/components/ui/button';
import { TypingDots } from '@/components/ui/typing-dots';
import { cn } from '@/lib/utils';

export function ChatMessages({
  messages,
  status,
  onPromptSelect,
}: {
  messages: UIMessage[];
  status?: string;
  onPromptSelect?: (prompt: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastMessageLengthRef = useRef(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const isInitialRenderRef = useRef(true);

  // Detect if AI is actively streaming (content length is changing)
  useEffect(() => {
    if (messages.length === 0) {
      setIsStreaming(false);
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') {
      setIsStreaming(false);
      return;
    }

    const currentLength = JSON.stringify(lastMessage.parts || []).length;

    if (currentLength > lastMessageLengthRef.current) {
      setIsStreaming(true);
      lastMessageLengthRef.current = currentLength;
    } else if (status !== 'submitted') {
      setIsStreaming(false);
      lastMessageLengthRef.current = 0;
    }
  }, [messages, status]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Skip auto-scroll on initial render to prevent scroll on page refresh
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    if (isAtBottom || status === 'submitted') {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status, isAtBottom]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 100);
  };

  return (
    <div className='relative flex-1 overflow-hidden'>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className='absolute inset-0 overflow-y-auto overscroll-contain'
        style={{ overflowAnchor: 'none' }}
      >
        <div className='flex flex-col gap-0 p-6 max-w-5xl mx-auto'>
          {messages.length === 0 ? (
            <div className='flex flex-col items-center justify-center flex-1 text-center px-4'>
              {/* Hero Icon with enhanced animation */}
              <div className='mb-8 relative'>
                <div className='absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 blur-3xl rounded-full' />
                <div className='relative p-6 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border-2 border-primary/30 backdrop-blur-sm shadow-2xl'>
                  <Bot className='h-16 w-16 text-primary drop-shadow-lg' />
                </div>
              </div>

              {/* Welcome Text with enhanced styling */}
              <h1 className='text-5xl font-black mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent'>
                Welcome to AI Explorer
              </h1>

              <p className='text-muted-foreground/90 max-w-2xl leading-relaxed text-lg mb-10'>
                Your intelligent copilot for blockchain exploration. I can
                explain transactions, analyze addresses, trace token flows, and
                help you understand on-chain activity across multiple networks.
              </p>

              {/* Example prompts */}
              <div className='flex flex-wrap gap-2.5 justify-center max-w-3xl'>
                {[
                  {
                    text: '💰 Analyze transaction 0x42375f...0748',
                    fullPrompt:
                      'Can you analyze this transaction: 0x42375fd147e763fd3b6f9f7f49f0e481e650fb8c4fddd6294f73e98ef40d0748',
                    color: 'border-primary/30 hover:border-primary/60',
                  },
                  {
                    text: '🔍 What does 0xd8dA6B...6045 do?',
                    fullPrompt:
                      'What does this address do: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                    color: 'border-secondary/30 hover:border-secondary/60',
                  },
                  {
                    text: '🌉 Help me bridge tokens',
                    fullPrompt:
                      'Help me understand how to bridge tokens to different networks',
                    color: 'border-purple-500/30 hover:border-purple-500/60',
                  },
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onPromptSelect?.(prompt.fullPrompt)}
                    className={cn(
                      'px-4 py-2.5 rounded-full bg-zinc-900/50 border text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/70 transition-all duration-200 cursor-pointer',
                      prompt.color,
                    )}
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className='space-y-0'>
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
            </div>
          )}

          {/* Enhanced thinking indicator */}
          {status === 'submitted' && (
            <div className='flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-secondary/15 via-secondary/8 to-transparent border border-secondary/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-400 mt-8 shadow-lg'>
              <div className='relative flex items-center justify-center h-10 w-10 rounded-full bg-secondary/20'>
                <Sparkles className='h-5 w-5 text-secondary animate-pulse' />
                <div className='absolute inset-0 rounded-full bg-secondary/10 animate-ping' />
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-3'>
                  <TypingDots />
                  <span className='text-sm text-foreground/80 font-semibold'>
                    {isStreaming ? 'AI is responding...' : 'AI is thinking...'}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground/60 mt-1'>
                  {isStreaming
                    ? 'Generating response with real-time blockchain data'
                    : 'Analyzing your request and fetching on-chain data'}
                </p>
              </div>
            </div>
          )}

          <div ref={endRef} className='shrink-0 h-4' />
        </div>
      </div>
    </div>
  );
}
