'use client';

import {
  useState,
  FormEvent,
  KeyboardEvent,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value?: string;
  setValue?: Dispatch<SetStateAction<string>>;
  onSubmit: (message: { text: string }) => Promise<void>;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export function ChatInput({
  value = '',
  setValue,
  onSubmit,
  isLoading = false,
  onStop,
  placeholder = 'Ask about a transaction or describe an action...',
}: ChatInputProps) {
  const [local, setLocal] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // keep local ↔ external in sync
  useEffect(() => setLocal(value), [value]);

  // auto-resize
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(el.scrollHeight, 240) + 'px'; // clamp to 240px
  };
  useEffect(autoResize, [local]);

  // global type-to-focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent | any) => {
      const target = e.target as HTMLElement;
      const isFormElement = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(
        target?.tagName || '',
      );
      if (isFormElement) return;
      if (e.key?.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = (setValue ? value : local).trim();
    if (!text || isLoading) return;

    await onSubmit({ text });
    setValue ? setValue('') : setLocal('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='relative group'>
      <Textarea
        ref={textareaRef}
        value={setValue ? value : local}
        onChange={(e) =>
          setValue ? setValue(e.target.value) : setLocal(e.target.value)
        }
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className={cn(
          'min-h-[60px] pr-14 resize-none rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm',
          'focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary',
          'transition-all duration-200',
          isLoading && 'opacity-60',
        )}
        rows={2}
      />
      {isLoading ? (
        <Button
          type='button'
          size='icon'
          onClick={onStop}
          className='absolute right-3 bottom-3 h-9 w-9 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground'
          aria-label='Stop generating'
        >
          <Square className='h-4 w-4' />
        </Button>
      ) : (
        <Button
          type='submit'
          size='icon'
          disabled={!(setValue ? value : local).trim()}
          className='absolute right-3 bottom-3 h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50'
          aria-label='Send message'
        >
          <Send className='h-4 w-4' />
        </Button>
      )}
    </form>
  );
}
