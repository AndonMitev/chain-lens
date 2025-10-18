export function TypingDots() {
  return (
    <div className='flex items-center gap-1 text-muted-foreground text-sm'>
      <span className='dot dot1' />
      <span className='dot dot2' />
      <span className='dot dot3' />
      <style jsx>{`
        .dot{width:6px;height:6px;background:currentColor;border-radius:9999px;display:inline-block}
        .dot1{animation:blink 1.2s infinite 0s}
        .dot2{animation:blink 1.2s infinite .2s}
        .dot3{animation:blink 1.2s infinite .4s}
        @keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}
      `}</style>
    </div>
  );
}
