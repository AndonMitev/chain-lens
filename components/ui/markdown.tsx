'use client';

import * as React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type='button'
      size='icon'
      variant='ghost'
      onClick={handleCopy}
      className={cn(
        'h-8 w-8 absolute top-2 right-2 transition-all duration-200',
        copied
          ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
      )}
      aria-label={copied ? 'Copied' : 'Copy'}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
    </Button>
  );
}

/**
 * Check if code block is short and single-line (blockchain addresses, hashes)
 */
function isShortSingleLine(content: string) {
  return !content.includes('\n') && content.trim().length <= 80;
}

const components: Components = {
  a: ({ node, href, children, ...props }) => {
    const isExternal = href?.startsWith('http');
    const isBlockScout = href?.includes('blockscout.com');

    return (
      <a
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        href={href}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium transition-all duration-200',
          'underline underline-offset-2 decoration-2',
          isBlockScout
            ? 'text-primary hover:text-primary/80 decoration-primary/50 hover:decoration-primary'
            : 'text-blue-400 hover:text-blue-300 decoration-blue-400/50 hover:decoration-blue-400',
          'group',
        )}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer' : undefined}
      >
        {children}
        {isExternal && (
          <ExternalLink className='h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity' />
        )}
      </a>
    );
  },
  code: ({
    inline,
    children,
  }: {
    inline?: boolean;
    children?: React.ReactNode;
  }) => {
    const content = String(children ?? '');

    // Inline code or short addresses/hashes
    if (inline || isShortSingleLine(content)) {
      return (
        <code className='inline-flex items-center rounded-lg bg-zinc-900/70 px-3 py-1.5 font-mono text-[13px] border border-zinc-800/60 text-zinc-100 shadow-sm'>
          {content}
        </code>
      );
    }

    // Block code with copy button
    return (
      <div className='my-5 not-prose group'>
        <pre className='relative rounded-xl bg-zinc-950/90 p-5 overflow-x-auto border border-zinc-800/60 backdrop-blur-sm shadow-lg'>
          <CopyBtn text={content} />
          <code className='font-mono text-[13px] text-zinc-100 leading-relaxed'>
            {content}
          </code>
        </pre>
      </div>
    );
  },
  h1: ({ children }) => (
    <h1 className='text-3xl font-bold mt-8 mb-5 text-foreground bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text'>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className='text-2xl font-bold mt-7 mb-4 text-foreground flex items-center gap-2'>
      <span className='h-1.5 w-1.5 rounded-full bg-primary/60' />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className='text-xl font-bold mt-6 mb-3 text-foreground/95 flex items-center gap-2'>
      <span className='h-1 w-1 rounded-full bg-secondary/60' />
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className='text-lg font-semibold mt-5 mb-2.5 text-foreground/90'>
      {children}
    </h4>
  ),
  ul: ({ children }) => (
    <ul className='my-4 ml-6 space-y-2.5 list-disc marker:text-primary/70'>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className='my-4 ml-6 space-y-2.5 list-decimal marker:text-primary/70 marker:font-semibold'>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className='leading-relaxed text-foreground/90 pl-1.5'>{children}</li>
  ),
  p: ({ children }) => (
    <p className='my-3.5 text-foreground/95 leading-relaxed'>{children}</p>
  ),
  blockquote: ({ children }) => (
    <blockquote className='border-l-4 border-primary/60 pl-5 py-3 my-5 italic bg-primary/8 rounded-r-xl shadow-sm'>
      <div className='text-foreground/85 leading-relaxed'>{children}</div>
    </blockquote>
  ),
  table: ({ children }) => (
    <div className='my-5 overflow-x-auto rounded-xl border border-zinc-800/50 shadow-lg'>
      <table className='w-full border-collapse'>{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className='bg-zinc-900/60 border-b-2 border-zinc-800'>
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className='divide-y divide-zinc-800/40 bg-zinc-900/20'>
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className='hover:bg-zinc-900/40 transition-colors duration-150'>
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className='px-5 py-3.5 text-left text-sm font-bold text-foreground'>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className='px-5 py-3.5 text-sm text-foreground/90'>{children}</td>
  ),
  hr: () => (
    <hr className='my-8 border-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent' />
  ),
  strong: ({ children }) => (
    <strong className='font-bold text-foreground'>{children}</strong>
  ),
  em: ({ children }) => (
    <em className='italic text-foreground/90'>{children}</em>
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-code:before:content-[''] prose-code:after:content-['']">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
