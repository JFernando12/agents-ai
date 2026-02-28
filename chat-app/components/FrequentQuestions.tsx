import React from "react";
import { FrequentQuestion } from "@/types";

interface FrequentQuestionsProps {
  questions: FrequentQuestion[];
  onQuestionClick: (question: string) => void;
}

const FrequentQuestions: React.FC<FrequentQuestionsProps> = ({
  questions,
  onQuestionClick,
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  return (
    <div className="w-full mb-8">
      <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
        Preguntas frecuentes
      </h2>
      <div className="flex flex-col gap-3">
        {sortedQuestions.map((faq) => (
          <button
            key={faq.id}
            onClick={() => onQuestionClick(faq.question)}
            className="group text-left px-5 py-4 rounded-xl bg-linear-to-r from-slate-50 via-slate-50 to-blue-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-blue-900/20 hover:from-blue-50 hover:via-blue-50/70 hover:to-blue-100 dark:hover:from-slate-700 dark:hover:via-slate-700 dark:hover:to-blue-900/40 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              {faq.question}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FrequentQuestions;
