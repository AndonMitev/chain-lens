import { ChatContainer } from './components/chat-container';

export default function Home() {
  return (
    <main className='relative w-full h-screen bg-gradient-to-br from-background via-background to-secondary/5 overflow-hidden'>
      {/* Gradient orbs background */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl' />
      </div>

      {/* Content */}
      <div className='relative z-10 w-full h-full flex items-center justify-center'>
        <ChatContainer />
      </div>
    </main>
  );
}
