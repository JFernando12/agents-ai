import { useState } from 'react';
import { Copy, Check, Plug } from 'lucide-react';

interface AgentFormIntegrationProps {
  agentId?: string;
}

const AgentFormIntegration = ({ agentId }: AgentFormIntegrationProps) => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {},
  );

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/chat/`;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? '';

  const headersWithApiKey = `X-API-Key: ${apiKey || '<your_api_key>'}\nContent-Type: application/json`;
  const headersWithJwt = `Authorization: Bearer <your_jwt_token>\nContent-Type: application/json`;

  const requestExample = JSON.stringify(
    {
      message: 'Explicame en que consiste el Dashboard',
      agent_id: agentId,
      type: 'normal',
      context: {
        nombre: 'Fernando',
        cargo: 'Contador',
        empresa_cliente: 'Aceros del Norte SA',
        modulo: 'Declaraciones',
        vista_actual: 'ISR Mensual',
        anio_fiscal: '2025',
        // Puedes agregar cualquier clave que necesites
      },
    },
    null,
    2,
  );

  const requestConversationExample = JSON.stringify(
    {
      message: 'Tengo dudas sobre el cierre del periodo',
      agent_id: agentId,
      type: 'conversation',
      conversation_id: null,
      context: {
        nombre: 'Laura',
        cargo: 'Auxiliar Contable',
        rfc_cliente: 'ANO930215AB3',
        periodo: 'Enero 2025',
        estado_declaracion: 'pendiente',
        tipo_obligacion: 'IVA mensual',
      },
    },
    null,
    2,
  );

  const responseExample = JSON.stringify(
    {
      success: true,
      data: {
        answer: 'El Dashboard es...',
        conversation_id: 'conv-uuid',
        query: 'Explicame en que consiste el Dashboard',
        user_timestamp: '2026-02-26T10:00:00',
        assistant_timestamp: '2026-02-26T10:00:01',
        contexts: [],
        attachments: null,
      },
    },
    null,
    2,
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/[0.08] border border-indigo-100 dark:border-indigo-500/20">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Plug className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
            Integración de API
          </p>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-0.5">
            Integra este agente en tus aplicaciones usando nuestra API REST.
            Puedes pasar contexto adicional para personalizar las respuestas.
          </p>
        </div>
      </div>

      {/* Endpoint */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Endpoint
          </p>
          <CopyButton
            label="endpoint"
            text={endpoint}
            copiedStates={copiedStates}
            onCopy={handleCopy}
          />
        </div>
        <div className="bg-gray-950 rounded-xl px-4 py-3 font-mono text-sm flex items-center gap-3">
          <span className="text-emerald-400 font-bold text-xs tracking-wide">
            POST
          </span>
          <span className="text-gray-300">{endpoint}</span>
        </div>
      </section>

      {/* Headers – API Key */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Headers — Con API Key
          </p>
          <CopyButton
            label="headers"
            text={headersWithApiKey}
            copiedStates={copiedStates}
            onCopy={handleCopy}
          />
        </div>
        <pre className="bg-gray-950 text-gray-300 rounded-xl px-4 py-3 text-sm whitespace-pre-wrap overflow-x-auto">
          <code>{headersWithApiKey}</code>
        </pre>
      </section>

      {/* Headers – JWT */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Headers — Con JWT propio
          </p>
          <CopyButton
            label="headersJwt"
            text={headersWithJwt}
            copiedStates={copiedStates}
            onCopy={handleCopy}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Si tu sistema genera JWT firmados con el mismo secret, úsalos con los
          campos{' '}
          <code className="bg-gray-100 dark:bg-white/[0.07] px-1 rounded text-gray-700 dark:text-gray-300">
            id
          </code>
          ,{' '}
          <code className="bg-gray-100 dark:bg-white/[0.07] px-1 rounded text-gray-700 dark:text-gray-300">
            email
          </code>{' '}
          y{' '}
          <code className="bg-gray-100 dark:bg-white/[0.07] px-1 rounded text-gray-700 dark:text-gray-300">
            name
          </code>{' '}
          en el payload.
        </p>
        <pre className="bg-gray-950 text-gray-300 rounded-xl px-4 py-3 text-sm whitespace-pre-wrap overflow-x-auto">
          <code>{headersWithJwt}</code>
        </pre>
      </section>

      {/* Request – Chat simple */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Body — Chat simple
          </p>
          <CopyButton
            label="request"
            text={requestExample}
            copiedStates={copiedStates}
            onCopy={handleCopy}
          />
        </div>
        <pre className="bg-gray-950 text-gray-300 rounded-xl px-4 py-3 text-sm whitespace-pre-wrap overflow-x-auto">
          <code>{requestExample}</code>
        </pre>
      </section>

      {/* Request – Conversation */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Body — Con historial de conversación
          </p>
          <CopyButton
            label="requestConversation"
            text={requestConversationExample}
            copiedStates={copiedStates}
            onCopy={handleCopy}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Envía{' '}
          <code className="bg-gray-100 dark:bg-white/[0.07] px-1 rounded text-gray-700 dark:text-gray-300">
            conversation_id: null
          </code>{' '}
          para crear una nueva conversación. La respuesta incluirá el{' '}
          <code className="bg-gray-100 dark:bg-white/[0.07] px-1 rounded text-gray-700 dark:text-gray-300">
            conversation_id
          </code>{' '}
          para los siguientes mensajes.
        </p>
        <pre className="bg-gray-950 text-gray-300 rounded-xl px-4 py-3 text-sm whitespace-pre-wrap overflow-x-auto">
          <code>{requestConversationExample}</code>
        </pre>
      </section>

      {/* Parameters table */}
      <section>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Parámetros del body
        </p>
        <div className="border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Parámetro
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Tipo
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Req.
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {[
                {
                  param: 'message',
                  type: 'string',
                  req: true,
                  desc: 'Texto del mensaje del usuario',
                },
                {
                  param: 'agent_id',
                  type: 'string',
                  req: true,
                  desc: 'ID del agente (pre-completado abajo)',
                },
                {
                  param: 'type',
                  type: 'string',
                  req: false,
                  desc: 'normal (default) o conversation para mantener historial',
                },
                {
                  param: 'conversation_id',
                  type: 'string | null',
                  req: false,
                  desc: 'ID de conversación existente. null para crear una nueva (solo con type: conversation)',
                },
                {
                  param: 'context',
                  type: 'object | null',
                  req: false,
                  desc: 'Datos clave-valor inyectados en el system prompt. Útil para pasar info del usuario o sesión.',
                },
              ].map(({ param, type, req, desc }) => (
                <tr
                  key={param}
                  className="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-gray-300">
                    {param}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                    {type}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold">
                    {req ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Sí
                      </span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Response */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Respuesta
          </p>
          <CopyButton
            label="response"
            text={responseExample}
            copiedStates={copiedStates}
            onCopy={handleCopy}
          />
        </div>
        <pre className="bg-gray-950 text-gray-300 rounded-xl px-4 py-3 text-sm whitespace-pre-wrap overflow-x-auto">
          <code>{responseExample}</code>
        </pre>
      </section>

      {/* Agent ID */}
      {agentId && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Agent ID
            </p>
            <CopyButton
              label="agentId"
              text={agentId}
              copiedStates={copiedStates}
              onCopy={handleCopy}
            />
          </div>
          <div className="bg-gray-950 text-gray-300 rounded-xl px-4 py-3 font-mono text-sm">
            {agentId}
          </div>
        </section>
      )}
    </div>
  );
};

// Helper component
function CopyButton({
  label,
  text,
  copiedStates,
  onCopy,
}: {
  label: string;
  text: string;
  copiedStates: Record<string, boolean>;
  onCopy: (key: string, text: string) => void;
}) {
  const copied = copiedStates[label];
  return (
    <button
      type="button"
      onClick={() => onCopy(label, text)}
      className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

export default AgentFormIntegration;
