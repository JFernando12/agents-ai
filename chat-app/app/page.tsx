"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import MainContent from "../components/MainContent";
import { useAgents } from "@/lib/hooks/useAgents";
import { Agent, Chat } from "@/types";
import { useChats, useConverse, useCreateAndConverse } from "@/lib/hooks/useChat";
import { useUser } from "@/contexts/UserContext";


const Home = () => {
  const { user } = useUser();
  const { data: agents } = useAgents();
  const converse = useConverse()
  const createAndConverse = useCreateAndConverse();

  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: chats } = useChats({
    serviceId: activeAgent?.id,
    user: user?.email,
  });

  const handleLogout = () => {
    setActiveChat(null);
  };

  const handleCreateChat = async (prompt: string, file?: File | null) => {
    if (!activeAgent || !user) return;

    setActiveChat({
      id: 'new',
      title: 'New Chat',
      timestamp: new Date().toISOString(),
    });
    const response = await createAndConverse.mutateAsync({
      serviceId: activeAgent.id,
      user: user.email,
      message: prompt,
    });

    setActiveChat(response.chat);
  };

  const handleSendMessage = async (prompt: string, file?: File | null) => {
    if (!activeChat) return handleCreateChat(prompt, file);

    await converse.mutateAsync({ chatId: activeChat.id, message: prompt });
  };

  const handleNewChat = () => {
    setActiveChat(null);
  };
  
  const handleDeselectProfile = () => {
    setActiveAgent(null);
    setActiveChat(null);
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
  };

  const handleSelectAgent = (agent: Agent) => {
    setActiveAgent(agent);
    setActiveChat(null);
  };

  return (
    <div className="flex h-screen bg-white text-gray-800 dark:bg-slate-900 dark:text-gray-200 font-sans">
      <Sidebar
        agents={agents || []}
        chats={chats || []}
        onNewChat={handleNewChat}
        onSelectAgent={handleSelectAgent}
        onSelectChat={handleSelectChat}
        activeAgent={activeAgent}
        activeChat={activeChat}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <MainContent
        activeAgent={activeAgent}
        activeChat={activeChat}
        onSendMessage={handleSendMessage}
        isLoading={converse.isPending || createAndConverse.isPending}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        onDeselectProfile={handleDeselectProfile}
      />
    </div>
  );
};

export default Home;
