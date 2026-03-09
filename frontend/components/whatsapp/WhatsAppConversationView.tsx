'use client';

import { useEffect, useRef } from 'react';
import { WhatsAppMessage } from '@/types';
import WhatsAppMessageBubble from './WhatsAppMessageBubble';
import { MessageCircle } from 'lucide-react';

interface Props {
  messages: WhatsAppMessage[];
  isLoading: boolean;
}

export default function WhatsAppConversationView({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-sm px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0 animate-pulse" />
              <div className={`h-9 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-gray-200 dark:bg-white/10 w-48' : 'bg-indigo-200 dark:bg-indigo-500/20 w-40'}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aún no hay mensajes en esta conversación.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => (
        <WhatsAppMessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
