'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface Props {
  channelId: string;
  verifyToken: string;
  webhookSecret?: string | null;
}

export default function WhatsAppChannelSetupGuide({
  channelId,
  verifyToken,
  webhookSecret,
}: Props) {
  const [copied, setCopied] = useState<
    'url' | 'token' | 'async' | 'secret' | null
  >(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const webhookUrl = `${apiUrl}/whatsapp/webhook/${channelId}`;
  const asyncWebhookBase = `${apiUrl}/whatsapp/webhooks/async/${channelId}/{session_id}`;

  const copy = async (
    type: 'url' | 'token' | 'async' | 'secret',
    text: string,
  ) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4 mt-2">
      {/* Meta webhook setup */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-3">
          Configura el webhook en Meta Business Manager
        </p>
        <ol className="space-y-3 text-xs text-amber-700 dark:text-amber-300">
          <li className="flex gap-2">
            <span className="font-semibold flex-shrink-0">1.</span>
            <span>
              Ve a{' '}
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-0.5"
              >
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
                <button
                  onClick={() => copy('url', webhookUrl)}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-amber-200 dark:bg-amber-500/20 hover:bg-amber-300 dark:hover:bg-amber-500/30 transition-colors"
                >
                  {copied === 'url' ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                  )}
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
                <button
                  onClick={() => copy('token', verifyToken)}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-amber-200 dark:bg-amber-500/20 hover:bg-amber-300 dark:hover:bg-amber-500/30 transition-colors"
                >
                  {copied === 'token' ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                  )}
                </button>
              </div>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold flex-shrink-0">4.</span>
            <span>
              Suscríbete al campo <strong>messages</strong> en Webhooks.
            </span>
          </li>
        </ol>
      </div>

      {/* Ecommerce async webhook */}
      <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
        <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-400 mb-3">
          Integración con Ecommerce (webhook asíncrono)
        </p>
        <div className="space-y-3 text-xs text-indigo-700 dark:text-indigo-300">
          <div>
            <p className="mb-1.5">
              URL base del webhook (el ecommerce hace{' '}
              <code className="px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/50 font-mono">
                POST
              </code>{' '}
              a esta URL):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 block px-2.5 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 font-mono text-[11px] truncate">
                {asyncWebhookBase}
              </code>
              <button
                onClick={() => copy('async', asyncWebhookBase)}
                className="flex-shrink-0 p-1.5 rounded-lg bg-indigo-200 dark:bg-indigo-500/20 hover:bg-indigo-300 dark:hover:bg-indigo-500/30 transition-colors"
              >
                {copied === 'async' ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-300" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-indigo-500 dark:text-indigo-400">
              <code className="font-mono">{'{session_id}'}</code> es inyectado
              automáticamente por la plataforma en cada conversación.
            </p>
          </div>
          {webhookSecret && (
            <div>
              <p className="mb-1.5">
                Webhook Secret (header{' '}
                <code className="px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/50 font-mono">
                  X-Webhook-Secret
                </code>
                ):
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 block px-2.5 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 font-mono text-[11px] truncate">
                  {webhookSecret}
                </code>
                <button
                  onClick={() => copy('secret', webhookSecret)}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-indigo-200 dark:bg-indigo-500/20 hover:bg-indigo-300 dark:hover:bg-indigo-500/30 transition-colors"
                >
                  {copied === 'secret' ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-300" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
