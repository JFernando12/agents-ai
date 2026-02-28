import React from "react";
import { NewChatIcon, ChevronDownIcon } from './Icons';
import { Agent, Chat } from '@/types';
import { AgentIcon } from './AgentIcon';
import { Trash2, Loader2 } from 'lucide-react';
import { useDeleteChat } from '@/lib/hooks/useChat';

interface SidebarProps {
  agents: Agent[];
  chats: Chat[];
  onNewChat: (prompt?: string) => void;
  onSelectAgent: (agent: Agent) => void;
  onSelectChat: (chat: Chat) => void;
  activeAgent: Agent | null;
  activeChat: Chat | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  classProps?: string;
}> = ({ icon, label, onClick, active, classProps }) => (
  <button
    onClick={onClick}
    className={`flex items-center ${classProps} ${
      active
        ? 'bg-slate-700 text-white'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3 truncate flex-1 text-left">{label}</span>
  </button>
);

const NavItemChat: React.FC<{
  id: string;
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  classProps?: string;
}> = ({ id, icon, label, onClick, active, classProps }) => {
  const deleteChat = useDeleteChat();

  const handleDelete = async () => {
    // Lógica para eliminar el chat
    console.log('Eliminar chat:', label);
    await deleteChat.mutateAsync({ chatId: id });
    console.log('Chat eliminado');
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`flex items-center ${classProps} ${
          active
            ? 'bg-slate-700 text-white'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        {icon}
        <span className="ml-3 truncate flex-1 text-left">{label}</span>
      </button>
      <button
        onClick={handleDelete}
        disabled={deleteChat.isPending}
        className={`absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400 transition-opacity p-1 rounded ${
          deleteChat.isPending
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        title="Eliminar chat"
      >
        {deleteChat.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

const NavSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mt-4">
    <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
      {title}
      <ChevronDownIcon className="w-4 h-4 text-slate-400 transform -rotate-90" />
    </h3>
    <div className="mt-2 space-y-1">{children}</div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({
  agents,
  chats,
  onNewChat,
  onSelectAgent,
  onSelectChat,
  activeAgent,
  activeChat,
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-slate-800 text-white flex flex-col p-4 transition-all duration-300">
      <div className="flex items-center justify-center mb-8 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cpa-llm_logo.png"
          alt="CPA VISION LM"
          style={{ width: '100%', maxWidth: '160px', height: 'auto' }}
        />
      </div>

      <div className="grow overflow-y-auto pr-2 -mr-2">
        {activeAgent && (
          <NavItem
            icon={<NewChatIcon className="w-5 h-5" />}
            label="Nuevo Chat"
            onClick={() => onNewChat()}
            classProps="w-full text-left py-2 px-4 rounded-md text-sm transition-colors duration-200"
          />
        )}
        {!activeAgent && (
          <div className="mx-4 p-2 bg-slate-700/30 border border-slate-600/30 rounded-lg">
            <p className="text-sm text-slate-400 text-center">
              Selecciona un agente
            </p>
          </div>
        )}

        <NavSection title="Especializados">
          {agents.map((agent) => (
            <NavItem
              key={agent.id}
              icon={<AgentIcon name={agent.icon} className="w-5 h-5" />}
              label={agent.name}
              active={activeAgent?.id === agent.id}
              onClick={() => onSelectAgent(agent)}
              classProps="w-full text-left py-2 px-4 rounded-md text-sm transition-colors duration-200"
            />
          ))}
        </NavSection>

        <NavSection title="Chats Recientes">
          {chats.map((chat) => (
            <NavItemChat
              id={chat.id}
              key={chat.id}
              label={chat.title}
              active={chat.id === activeChat?.id}
              onClick={() => onSelectChat(chat)}
              classProps="w-full text-left py-2 px-2 rounded-md text-sm transition-colors duration-200 overflow-hidden"
            />
          ))}
        </NavSection>
      </div>
    </aside>
  );
};

export default Sidebar;
