import React from "react";
import { PromptInput } from "./ChatView";
import { Agent } from "@/types";
import FrequentQuestions from "./FrequentQuestions";

interface AgentViewProps {
  onSendMessage: (prompt: string, file?: File | null) => void;
  agent: Agent | null;
}

const AgentView: React.FC<AgentViewProps> = ({ onSendMessage, agent }) => {
  const handleQuestionClick = (question: string) => {
    onSendMessage(question, null);
  };

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl font-bold text-blue-600">Hola</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 mb-8">
            ¿En qué puedo ayudarte?
          </p>
          <div className="w-full mb-10">
            <PromptInput onSendMessage={onSendMessage} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        <h1 className="text-4xl font-bold text-blue-600">Hola</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 mb-8">
          Estoy listo para ayudarte con tus dudas sobre {agent.name}.
        </p>

        {agent.questions && agent.questions.length > 0 && (
          <FrequentQuestions
            questions={agent.questions}
            onQuestionClick={handleQuestionClick}
          />
        )}

        <div className="w-full mb-10">
          <PromptInput
            onSendMessage={(prompt,file) => onSendMessage(prompt,file)}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentView;
