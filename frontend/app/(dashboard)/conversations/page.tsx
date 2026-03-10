'use client';

import { useState } from 'react';
import {
  MessagesSquare,
  Bot,
  User,
  Trash2,
  X,
  MessageSquare,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useAgents } from '@/lib/hooks/useAgents';
import {
  useConversations,
  useConversationMessages,
  useDeleteConversation,
} from '@/lib/hooks/useConversations';
import type { Conversation, ConversationMessage } from '@/types';
import ModalDelete from '@/components/ui/ModalDelete';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value: string | number): string {
  const ms = typeof value === 'number' ? value : Number(value);
  const d = new Date(ms > 1e12 ? ms : ms * 1000);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(value: string | number): string {
  const ms = typeof value === 'number' ? value : Number(value);
  const d = new Date(ms > 1e12 ? ms : ms * 1000);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// ── Conversation row ──────────────────────────────────────────────────────────

function ConversationRow({
  conversation,
  agentName,
  isSelected,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  agentName: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-white/[0.05] last:border-0 ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-500/10'
          : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <MessagesSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate transition-colors ${
            isSelected
              ? 'text-indigo-700 dark:text-indigo-300'
              : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
          }`}
        >
          {conversation.title || 'Sin título'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Bot className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {agentName}
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <User className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {conversation.user}
          </p>
        </div>
        <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">
          {formatDate(conversation.updated_at)}
        </p>
      </div>

      {/* Delete action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
        title="Eliminar conversación"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser
            ? 'bg-indigo-600'
            : 'bg-gray-100 dark:bg-white/[0.08]'
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-gray-200 rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <p className="text-xs mt-1 opacity-70">
              📎 {message.attachments.length} adjunto(s)
            </p>
          )}
        </div>
        <span className="text-[10px] text-gray-300 dark:text-gray-600 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ── Message thread panel ──────────────────────────────────────────────────────

function MessageThread({
  conversation,
  agentName,
  onClose,
}: {
  conversation: Conversation;
  agentName: string;
  onClose: () => void;
}) {
  const { data: messages, isLoading } = useConversationMessages(conversation.id);

  const sorted = messages ? [...messages].reverse() : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Thread header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {conversation.title || 'Sin título'}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Bot className="w-3 h-3" />
              {agentName}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <User className="w-3 h-3" />
              {conversation.user}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MessageSquare className="w-8 h-8 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No hay mensajes en esta conversación
            </p>
          </div>
        ) : (
          sorted.map((msg, i) => <MessageBubble key={i} message={msg} />)
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: agents } = useAgents();
  const { data: conversations, isLoading } = useConversations(
    selectedAgentId || undefined
  );
  const deleteConversation = useDeleteConversation();

  const agentMap = new Map(agents?.map((a) => [a.id, a.name]) ?? []);

  const handleDeleteRequest = (conversation: Conversation) => {
    setConversationToDelete(conversation);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    await deleteConversation.mutateAsync(conversationToDelete.id);
    if (selectedConversation?.id === conversationToDelete.id) {
      setSelectedConversation(null);
    }
    setIsDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              Conversaciones
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Historial de conversaciones de todos los agentes
            </p>
          </div>

          {/* Agent filter */}
          <div className="relative">
            <select
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setSelectedConversation(null);
              }}
              className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors cursor-pointer"
            >
              <option value="">Todos los agentes</option>
              {agents?.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Two-panel body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: conversation list */}
          <div className="w-80 border-r border-gray-100 dark:border-white/[0.06] flex flex-col overflow-hidden flex-shrink-0">
            {isLoading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 px-4 text-center">
                <MessagesSquare className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No hay conversaciones
                </p>
                <p className="text-xs text-gray-300 dark:text-gray-600">
                  Las conversaciones se guardan automáticamente cuando un usuario
                  chatea con un agente
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    agentName={agentMap.get(conversation.agent_id) ?? conversation.agent_id}
                    isSelected={selectedConversation?.id === conversation.id}
                    onSelect={() => setSelectedConversation(conversation)}
                    onDelete={() => handleDeleteRequest(conversation)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: message thread */}
          <div className="flex-1 overflow-hidden">
            {selectedConversation ? (
              <MessageThread
                conversation={selectedConversation}
                agentName={
                  agentMap.get(selectedConversation.agent_id) ??
                  selectedConversation.agent_id
                }
                onClose={() => setSelectedConversation(null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <MessagesSquare className="w-6 h-6 text-indigo-400 dark:text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Selecciona una conversación
                  </p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                    Haz clic en una conversación de la lista para ver los mensajes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSave={handleConfirmDelete}
        isLoading={deleteConversation.isPending}
        message="¿Estás seguro de que quieres eliminar esta conversación? Se perderán todos los mensajes."
      />
    </div>
  );
}
