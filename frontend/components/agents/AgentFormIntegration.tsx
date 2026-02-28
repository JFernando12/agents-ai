import { useState } from 'react';
import { ApiIcon, CopyIcon } from '../ui/icons';

interface AgentFormIntegrationProps {
  agentId?: string;
}

const AgentFormIntegration = ({ agentId }: AgentFormIntegrationProps) => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
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
    <div className="space-y-6 text-gray-800 max-w-4xl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-4">
        <ApiIcon className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold text-blue-800">
            Integración de API
          </h3>
          <p className="text-blue-700 text-sm">
            Integra este agente en tus aplicaciones usando nuestra API REST.
            Envía mensajes y recibe respuestas potenciadas por IA. Puedes pasar
            contexto adicional para personalizar las respuestas.
          </p>
        </div>
      </div>

      {/* Endpoint */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold">Endpoint</h4>
          <button
            type="button"
            onClick={() => handleCopy('endpoint', endpoint)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <CopyIcon className="w-4 h-4" />
            <span>{copiedStates['endpoint'] ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
        <div className="bg-gray-900 text-white rounded-lg p-4 font-mono text-sm">
          <span className="text-green-400 font-bold mr-4">POST</span>
          <span>{endpoint}</span>
        </div>
      </div>

      {/* Headers */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold">Headers — Con API Key</h4>
          <button
            type="button"
            onClick={() => handleCopy('headers', headersWithApiKey)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <CopyIcon className="w-4 h-4" />
            <span>{copiedStates['headers'] ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
        <pre className="bg-gray-900 text-white rounded-lg p-4 text-sm whitespace-pre-wrap">
          <code>{headersWithApiKey}</code>
        </pre>
      </div>

      {/* Headers with JWT (alternative) */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold">Headers — Con JWT propio</h4>
          <button
            type="button"
            onClick={() => handleCopy('headersJwt', headersWithJwt)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <CopyIcon className="w-4 h-4" />
            <span>{copiedStates['headersJwt'] ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-2">
          Si tu sistema genera JWT firmados con el mismo secret, úsalos con los
          campos <code className="bg-gray-100 px-1 rounded">id</code>,{' '}
          <code className="bg-gray-100 px-1 rounded">email</code> y{' '}
          <code className="bg-gray-100 px-1 rounded">name</code> en el payload.
        </p>
        <pre className="bg-gray-900 text-white rounded-lg p-4 text-sm whitespace-pre-wrap">
          <code>{headersWithJwt}</code>
        </pre>
      </div>

      {/* Request body - normal */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold">Body — Chat simple</h4>
          <button
            type="button"
            onClick={() => handleCopy('request', requestExample)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <CopyIcon className="w-4 h-4" />
            <span>{copiedStates['request'] ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
        <pre className="bg-gray-900 text-white rounded-lg p-4 text-sm whitespace-pre-wrap">
          <code>{requestExample}</code>
        </pre>
      </div>

      {/* Request body - conversation */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold">
            Body — Con historial de conversación
          </h4>
          <button
            type="button"
            onClick={() =>
              handleCopy('requestConversation', requestConversationExample)
            }
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <CopyIcon className="w-4 h-4" />
            <span>
              {copiedStates['requestConversation'] ? 'Copiado!' : 'Copiar'}
            </span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-2">
          Envía{' '}
          <code className="bg-gray-100 px-1 rounded">
            conversation_id: null
          </code>{' '}
          para crear una nueva conversación. La respuesta incluirá el{' '}
          <code className="bg-gray-100 px-1 rounded">conversation_id</code> para
          usarlo en los siguientes mensajes.
        </p>
        <pre className="bg-gray-900 text-white rounded-lg p-4 text-sm whitespace-pre-wrap">
          <code>{requestConversationExample}</code>
        </pre>
      </div>

      {/* Parameters table */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Parámetros del body</h4>
        <div className="bg-gray-50 rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3 font-medium text-gray-600">PARÁMETRO</th>
                <th className="p-3 font-medium text-gray-600">TIPO</th>
                <th className="p-3 font-medium text-gray-600">REQUERIDO</th>
                <th className="p-3 font-medium text-gray-600">DESCRIPCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr className="bg-white">
                <td className="p-3 font-mono">message</td>
                <td className="p-3">string</td>
                <td className="p-3 text-green-600 font-semibold">Sí</td>
                <td className="p-3">Texto del mensaje del usuario</td>
              </tr>
              <tr className="bg-white">
                <td className="p-3 font-mono">agent_id</td>
                <td className="p-3">string</td>
                <td className="p-3 text-green-600 font-semibold">Sí</td>
                <td className="p-3">ID del agente (pre-completado abajo)</td>
              </tr>
              <tr className="bg-white">
                <td className="p-3 font-mono">type</td>
                <td className="p-3">string</td>
                <td className="p-3 text-gray-400">No</td>
                <td className="p-3">
                  <code className="bg-gray-100 px-1 rounded">normal</code>{' '}
                  (default) o{' '}
                  <code className="bg-gray-100 px-1 rounded">conversation</code>{' '}
                  para mantener historial
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-3 font-mono">conversation_id</td>
                <td className="p-3">string | null</td>
                <td className="p-3 text-gray-400">No</td>
                <td className="p-3">
                  ID de conversación existente. Enviar{' '}
                  <code className="bg-gray-100 px-1 rounded">null</code> para
                  crear una nueva (solo con{' '}
                  <code className="bg-gray-100 px-1 rounded">
                    type: conversation
                  </code>
                  )
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-3 font-mono">context</td>
                <td className="p-3">object | null</td>
                <td className="p-3 text-gray-400">No</td>
                <td className="p-3">
                  Datos adicionales en clave-valor que se inyectan en el system
                  prompt del agente. Útil para pasar información del usuario,
                  sesión o página actual.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Response example */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold">Respuesta</h4>
          <button
            type="button"
            onClick={() => handleCopy('response', responseExample)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <CopyIcon className="w-4 h-4" />
            <span>{copiedStates['response'] ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
        <pre className="bg-gray-900 text-white rounded-lg p-4 text-sm whitespace-pre-wrap">
          <code>{responseExample}</code>
        </pre>
      </div>

      {/* Agent ID */}
      {agentId && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-semibold">Agent ID</h4>
            <button
              type="button"
              onClick={() => handleCopy('agentId', agentId)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <CopyIcon className="w-4 h-4" />
              <span>{copiedStates['agentId'] ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <div className="bg-gray-900 text-white rounded-lg p-4 font-mono text-sm">
            {agentId}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentFormIntegration;
