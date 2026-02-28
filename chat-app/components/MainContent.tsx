import React from "react";
import ChatView from "./ChatView";
import { Agent, Chat } from "@/types";
import Header from "./Header";
import AgentView from "./AgentView";

interface MainContentProps {
  activeAgent: Agent | null;
  activeChat: Chat | null;
  onSendMessage: (prompt: string, file?: File | null) => void;
  isLoading: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  onDeselectProfile: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
  activeAgent,
  activeChat,
  onSendMessage,
  isLoading,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  onDeselectProfile,
}) => {

  return (
    <main className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-900">
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={onLogout}
        activeAgent={activeAgent}
        onDeselectProfile={onDeselectProfile}
      />
      <div className="flex-1 overflow-y-auto">
        {activeAgent && activeChat && (
          <ChatView
            chat={activeChat!}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
          />
        )}

        {activeAgent && !activeChat && (
          <AgentView
            onSendMessage={onSendMessage}
            agent={activeAgent}
          />
        )}
      </div>
    </main>
  );
};

export default MainContent;
