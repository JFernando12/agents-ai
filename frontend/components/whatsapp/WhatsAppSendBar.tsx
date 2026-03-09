'use client';

import { useState, KeyboardEvent } from 'react';
import { SendHorizonal } from 'lucide-react';

interface Props {
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
}

export default function WhatsAppSendBar({ onSend, isSending }: Props) {
  const [text, setText] = useState('');

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText('');
    await onSend(trimmed);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#18181B]">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe un mensaje manual... (Enter para enviar)"
          rows={1}
          className="flex-1 resize-none px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 max-h-32 overflow-y-auto transition-colors"
          style={{ minHeight: '42px' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-600">
        El mensaje se enviará directamente por WhatsApp (modo operador humano, el agente no responderá).
      </p>
    </div>
  );
}
