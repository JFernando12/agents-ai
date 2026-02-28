'use client';

import { useState } from 'react';
import { Trash2, Plus, MessageSquare } from 'lucide-react';
import { FrequestQuestion } from '@/types';

interface AgentFormQuestionsProps {
  questions: FrequestQuestion[];
  onQuestionsChange: (questions: FrequestQuestion[]) => void;
}

const label =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';
const input =
  'w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';

const AgentFormQuestions = ({
  questions,
  onQuestionsChange,
}: AgentFormQuestionsProps) => {
  const [newQuestion, setNewQuestion] = useState({
    id: (questions.length + 1).toString(),
    question: '',
    order: questions.length + 1,
  });

  const handleAddQuestion = () => {
    if (newQuestion) {
      onQuestionsChange([...questions, newQuestion]);
      setNewQuestion({
        id: (questions.length + 2).toString(),
        question: '',
        order: questions.length + 2,
      });
    }
  };

  const handleRemoveQuestion = (index: number) => {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddQuestion();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Preguntas frecuentes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Agrega preguntas sugeridas que los usuarios verán al interactuar con
          el agente.
        </p>
      </section>

      {/* Add question */}
      <section>
        <label className={label}>Nueva pregunta</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuestion.question}
            onChange={(e) =>
              setNewQuestion({ ...newQuestion, question: e.target.value })
            }
            onKeyDown={handleKeyDown}
            placeholder="Escribe una pregunta frecuente..."
            className={input}
          />
          <button
            type="button"
            onClick={handleAddQuestion}
            disabled={!newQuestion.question.trim()}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>
      </section>

      {/* Question list */}
      <section>
        <label className={label}>
          Preguntas guardadas
          {questions.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold normal-case">
              {questions.length}
            </span>
          )}
        </label>

        {questions.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06] border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
            {questions.map((question, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors group"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 pr-3">
                  {question.question}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(index)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Eliminar pregunta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-200 dark:border-white/[0.08] rounded-xl p-10 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Sin preguntas aún
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Las preguntas se mostrarán como sugerencias rápidas en el chat.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AgentFormQuestions;
