import React, { useState, useEffect, useRef } from 'react';
import type { Agent, Message } from '@/types';
import { SendIcon } from './icons';
import { apiChat } from '@/lib/api/chat';

interface AgentChatProps {
  agent: Agent;
}

const AgentChat: React.FC<AgentChatProps> = ({ agent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiChat.converse({
        agent_id: agent.id,
        message: input,
      });
      const aiMessage: Message = { role: 'model', text: response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage =
        'Lo siento, ha ocurrido un error al contactar al modelo de IA.';
      setMessages((prev) => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex-shrink-0">
        Prueba de Agente
      </h3>
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 pt-16 h-full flex flex-col justify-center items-center">
            <p>Prueba a tu agente aquí.</p>
            <p className="text-sm">
              Los cambios que hagas en la configuración se reflejarán al
              instante.
            </p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index.toString()}
            className={`mb-2 flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#232A37] text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 bg-gray-200 text-gray-800">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSendMessage}
        className="flex items-center space-x-2 border-t pt-4 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#232A37] text-gray-600 placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="p-2 bg-[#232A37] text-white rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
          disabled={isLoading || !input.trim()}
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default AgentChat;
