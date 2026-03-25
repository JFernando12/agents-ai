'use client';

import { Fragment } from 'react';
import { WhatsAppMessage } from '@/types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Bot,
  UserRound,
} from 'lucide-react';

interface Props {
  message: WhatsAppMessage;
}

function StatusIcon({ status }: { status: WhatsAppMessage['status'] }) {
  if (status === 'processing')
    return <Loader2 className="w-3 h-3 animate-spin text-gray-400" />;
  if (status === 'sent')
    return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
  if (status === 'failed')
    return <AlertCircle className="w-3 h-3 text-red-500" />;
  return <Clock className="w-3 h-3 text-gray-400" />;
}

// Parses WhatsApp-style markdown: *bold*, _italic_, ~strikethrough~, `code`
function WhatsAppText({ text }: { text: string }) {
  const lines = text.split('\n');

  function parseLine(line: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex)
        parts.push(line.slice(lastIndex, match.index));
      const token = match[0];
      const inner = token.slice(1, -1);
      if (token.startsWith('*'))
        parts.push(<strong key={match.index}>{inner}</strong>);
      else if (token.startsWith('_'))
        parts.push(<em key={match.index}>{inner}</em>);
      else if (token.startsWith('~'))
        parts.push(<del key={match.index}>{inner}</del>);
      else if (token.startsWith('`'))
        parts.push(
          <code
            key={match.index}
            className="bg-black/10 rounded px-0.5 font-mono text-xs"
          >
            {inner}
          </code>,
        );
      lastIndex = match.index + token.length;
    }
    if (lastIndex < line.length) parts.push(line.slice(lastIndex));
    return parts;
  }

  return (
    <span>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {parseLine(line)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </span>
  );
}

export default function WhatsAppMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isProcessing = message.status === 'processing';
  const time = new Date(message.created_at).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ${
          isUser
            ? 'bg-gray-200 dark:bg-white/10'
            : 'bg-indigo-100 dark:bg-indigo-500/20'
        }`}
      >
        {isUser ? (
          <UserRound className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        ) : message.sent_by === 'human' ? (
          <UserRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[72%] group ${isUser ? '' : ''}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-gray-100 dark:bg-white/[0.08] text-gray-900 dark:text-white rounded-bl-sm'
              : 'bg-indigo-600 text-white rounded-br-sm'
          } ${isProcessing ? 'opacity-60' : ''}`}
        >
          {isProcessing && !message.content ? (
            <span className="flex items-center gap-1.5 text-xs opacity-70">
              <Loader2 className="w-3 h-3 animate-spin" />
              El agente está respondiendo...
            </span>
          ) : message.type === 'image' && message.media_url ? (
            <div>
              <img
                src={message.media_url}
                alt="imagen"
                className="rounded-lg max-h-60 w-auto max-w-full"
              />
              {message.content && message.content !== '[imagen]' && (
                <p className="mt-1">
                  <WhatsAppText text={message.content} />
                </p>
              )}
            </div>
          ) : (
            <WhatsAppText text={message.content ?? ''} />
          )}
        </div>

        {/* Meta row */}
        <div
          className={`flex items-center gap-1.5 mt-1 px-1 ${isUser ? '' : 'flex-row-reverse'}`}
        >
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {time}
          </span>
          {!isUser && <StatusIcon status={message.status} />}
          {!isUser && message.sent_by === 'human' && (
            <span className="text-[10px] text-indigo-400">Operador</span>
          )}
        </div>

        {message.status === 'failed' && message.error_detail && (
          <p className="text-[11px] text-red-500 mt-1 px-1">
            {message.error_detail}
          </p>
        )}
      </div>
    </div>
  );
}
