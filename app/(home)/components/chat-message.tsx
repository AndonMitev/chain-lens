'use client';

import { UIMessage } from 'ai';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Markdown } from '@/components/ui/markdown';
import { linkifyOnchain } from '@/lib/utils';
import { capitalize, formatAddress } from '@/lib/utils';

type Meta = {
  status?: 'success' | 'failed' | 'pending';
  chain?: string | number;
  method?: string;
  fee?: string;
  from?: string;
  to?: string;
};

const StatusIcon = ({ status }: { status: Meta['status'] }) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className='h-3.5 w-3.5' />;
    case 'failed':
      return <XCircle className='h-3.5 w-3.5' />;
    case 'pending':
      return <Clock className='h-3.5 w-3.5 animate-pulse' />;
    default:
      return null;
  }
};

/**
 * Parse thinking steps from AI responses
 * Thinking steps are short, action-oriented lines at the start
 */
function parseThinkingSteps(content: string): {
  thinking: string[];
  main: string;
} {
  const lines = content.split('\n');
  const thinkingSteps: string[] = [];
  const mainContent: string[] = [];
  let foundMainContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty lines separate thinking from main content
    if (!trimmed) {
      if (thinkingSteps.length > 0 && !foundMainContent) {
        foundMainContent = true;
      }
      if (foundMainContent) {
        mainContent.push(line);
      }
      continue;
    }

    // If we haven't found main content yet, check if this is a thinking step
    if (!foundMainContent) {
      // Thinking steps are:
      // - Short (< 100 chars)
      // - Action-oriented (present continuous verbs)
      // - No markdown formatting
      // - Usually at the start
      const isThinkingStep =
        trimmed.length < 100 &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('*') &&
        !trimmed.startsWith('-') &&
        !trimmed.startsWith('**') &&
        !trimmed.match(/^\d+\./) &&
        thinkingSteps.length < 5;

      if (isThinkingStep) {
        thinkingSteps.push(trimmed);
      } else {
        // This is the start of main content
        foundMainContent = true;
        mainContent.push(line);
      }
    } else {
      mainContent.push(line);
    }
  }

  return {
    thinking: thinkingSteps,
    main: mainContent.join('\n').trim(),
  };
}

export function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  const meta = (message as any).metadata as Meta | undefined;

  const { thinking, main } = useMemo(() => {
    const parts = (message.parts ?? []).filter((p: any) => p.type === 'text');
    const text = parts.map((p: any) => p.text as string).join('');

    // For user messages, linkify but don't shorten the addresses/hashes
    // For AI messages, linkify and shorten as usual
    const linkedText = linkifyOnchain(text, meta?.chain, !isUser);

    if (isUser) {
      return { thinking: [], main: linkedText };
    }

    return parseThinkingSteps(linkedText);
  }, [message.parts, meta?.chain, isUser]);

  const statusConfig = {
    success: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      hover: 'hover:bg-emerald-500/20',
      icon: 'text-emerald-400',
    },
    failed: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      hover: 'hover:bg-rose-500/20',
      icon: 'text-rose-400',
    },
    pending: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      hover: 'hover:bg-amber-500/20',
      icon: 'text-amber-400',
    },
  };

  const statusStyle = meta?.status ? statusConfig[meta.status] : null;

  return (
    <div
      className={cn(
        'group relative flex gap-4 py-8 px-2 transition-all duration-300',
        'hover:bg-zinc-900/20',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar with enhanced styling */}
      <Avatar
        className={cn(
          'h-10 w-10 shrink-0 mt-0.5 ring-2 transition-all duration-300 shadow-lg',
          isUser
            ? 'ring-primary/30 group-hover:ring-primary/50 group-hover:shadow-primary/20'
            : 'ring-secondary/30 group-hover:ring-secondary/50 group-hover:shadow-secondary/20',
        )}
      >
        <AvatarFallback
          className={cn(
            'text-sm font-bold transition-all duration-300',
            isUser
              ? 'bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-primary'
              : 'bg-gradient-to-br from-secondary/30 via-secondary/20 to-secondary/10 text-secondary',
          )}
        >
          {isUser ? <User className='h-5 w-5' /> : <Bot className='h-5 w-5' />}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div
        className={cn(
          'flex-1 min-w-0 space-y-4',
          isUser && 'flex flex-col items-end',
        )}
      >
        {/* Header with role and badges */}
        <div
          className={cn(
            'flex items-center gap-2.5 flex-wrap',
            isUser && 'justify-end',
          )}
        >
          <div className='flex items-center gap-2'>
            <span
              className={cn(
                'text-sm font-bold tracking-wide',
                isUser ? 'text-primary' : 'text-secondary',
              )}
            >
              {isUser ? 'You' : 'AI Explorer'}
            </span>
            <span className='text-xs text-muted-foreground/60'>
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Metadata badges for AI responses */}
          {!isUser && meta && (
            <div className='flex items-center gap-1.5 flex-wrap'>
              {meta.status && statusStyle && (
                <Badge
                  variant='outline'
                  className={cn(
                    'text-xs py-1 px-2.5 font-semibold transition-all duration-200 shadow-sm',
                    statusStyle.bg,
                    statusStyle.text,
                    statusStyle.border,
                    statusStyle.hover,
                  )}
                >
                  <StatusIcon status={meta.status} />
                  <span className='ml-1.5'>{capitalize(meta.status)}</span>
                </Badge>
              )}

              {meta.chain !== undefined && (
                <Badge
                  variant='outline'
                  className='text-xs py-1 px-2.5 font-semibold bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 transition-all duration-200 shadow-sm'
                >
                  <ExternalLink className='h-3 w-3 mr-1' />
                  Chain {meta.chain}
                </Badge>
              )}

              {meta.method && (
                <Badge
                  variant='outline'
                  className='text-xs py-1 px-2.5 font-semibold bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 transition-all duration-200 shadow-sm'
                >
                  {meta.method}
                </Badge>
              )}

              {meta.fee && (
                <Badge
                  variant='outline'
                  className='text-xs py-1 px-2.5 font-semibold bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20 transition-all duration-200 shadow-sm'
                >
                  <Zap className='h-3 w-3 mr-1' />
                  {meta.fee}
                </Badge>
              )}

              {meta.from && (
                <Badge
                  variant='outline'
                  className='text-xs py-1 px-2.5 font-mono font-medium bg-zinc-800/60 text-zinc-300 border-zinc-700/50 hover:bg-zinc-800 transition-all duration-200 shadow-sm'
                >
                  From: {formatAddress(meta.from)}
                </Badge>
              )}

              {meta.to && (
                <Badge
                  variant='outline'
                  className='text-xs py-1 px-2.5 font-mono font-medium bg-zinc-800/60 text-zinc-300 border-zinc-700/50 hover:bg-zinc-800 transition-all duration-200 shadow-sm'
                >
                  To: {formatAddress(meta.to)}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Thinking steps (only for AI, enhanced animation) */}
        {!isUser && thinking.length > 0 && (
          <div className='space-y-2.5 pb-2'>
            {thinking.map((step, i) => (
              <div
                key={i}
                className='flex items-start gap-2.5 text-sm text-muted-foreground/90 animate-in fade-in slide-in-from-left-3 duration-400'
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className='relative'>
                  <Sparkles className='h-4 w-4 mt-0.5 text-secondary/70 shrink-0 animate-pulse' />
                  <div className='absolute inset-0 blur-md bg-secondary/20 animate-pulse' />
                </div>
                <span className='leading-relaxed font-medium'>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main message content with enhanced card styling */}
        {main && (
          <div
            className={cn(
              'rounded-2xl px-6 py-5 transition-all duration-300 shadow-md',
              'border backdrop-blur-sm',
              isUser
                ? 'bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-primary/30 text-right'
                : 'bg-gradient-to-br from-secondary/8 via-secondary/4 to-transparent border-secondary/20',
            )}
          >
            <div
              className={cn(
                'text-[15px] leading-relaxed',
                isUser ? 'text-foreground' : 'text-foreground/95',
              )}
            >
              <Markdown>{main}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
