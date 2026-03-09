'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface Props {
  channelId: string;
  verifyToken: string;
}

export default function WhatsAppChannelSetupGuide({ channelId, verifyToken }: Props) {
  const [copied, setCopied] = useState<'url' | 'token' | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const webhookUrl = `${apiUrl}/whatsapp/webhook/${channelId}`;

  const copy = async (type: 'url' | 'token', text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
      <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-3">
        Configura el webhook en Meta Business Manager
      </p>
      <ol className="space-y-3 text-xs text-amber-700 dark:text-amber-300">
        <li className="flex gap-2">
          <span className="font-semibold flex-shrink-0">1.</span>
          <span>
            Ve a{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
              developers.facebook.com <ExternalLink className="w-3 h-3" />
            </a>{' '}
            → tu App → WhatsApp → Configuración → Webhooks.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="font-semibold flex-shrink-0">2.</span>
          <div className="min-w-0 w-full">
            <span>Webhook URL:</span>
            <div className="flex items-center gap-2 mt-1.5">
              <code className="flex-1 min-w-0 block px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 font-mono text-[11px] truncate">
                {webhookUrl}
              </code>
              <button onClick={() => copy('url', webhookUrl)} className="flex-shrink-0 p-1.5 rounded-lg bg-amber-200 dark:bg-amber-500/20 hover:bg-amber-300 dark:hover:bg-amber-500/30 transition-colors">
                {copied === 'url' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />}
              </button>
            </div>
          </div>
        </li>
        <li className="flex gap-2">
          <span className="font-semibold flex-shrink-0">3.</span>
          <div className="min-w-0 w-full">
            <span>Verify Token:</span>
            <div className="flex items-center gap-2 mt-1.5">
              <code className="flex-1 min-w-0 block px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 font-mono text-[11px] truncate">
                {verifyToken}
              </code>
              <button onClick={() => copy('token', verifyToken)} className="flex-shrink-0 p-1.5 rounded-lg bg-amber-200 dark:bg-amber-500/20 hover:bg-amber-300 dark:hover:bg-amber-500/30 transition-colors">
                {copied === 'token' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />}
              </button>
            </div>
          </div>
        </li>
        <li className="flex gap-2">
          <span className="font-semibold flex-shrink-0">4.</span>
          <span>Suscríbete al campo <strong>messages</strong> en Webhooks.</span>
        </li>
      </ol>
    </div>
  );
}
