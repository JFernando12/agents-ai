import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { FrequestQuestion } from '@/types';

interface AgentFormQuestionsProps {
  questions: FrequestQuestion[];
  onQuestionsChange: (questions: FrequestQuestion[]) => void;
}

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const formControlClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#232A37] text-gray-700';

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddQuestion();
    }
  };

  return (
    <div className="space-y-4 mb-4 p-2">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Preguntas Frecuentes
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Agrega preguntas frecuentes que se sugerirán a los usuarios para
          consultar al agente.
        </p>
      </div>

      {/* Input para agregar nueva pregunta */}
      <div>
        <label htmlFor="newQuestion" className={labelClass}>
          Nueva Pregunta
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="newQuestion"
            value={newQuestion.question}
            onChange={(e) =>
              setNewQuestion({
                ...newQuestion,
                question: e.target.value,
              })
            }
            onKeyDown={handleKeyPress}
            placeholder="Escribe una pregunta frecuente..."
            className={formControlClass}
          />
          <button
            type="button"
            onClick={handleAddQuestion}
            // disabled={!newQuestion.trim()}
            disabled={!newQuestion.question.trim()}
            className="px-4 py-2 bg-[#232A37] text-white rounded-lg hover:bg-[#1a1f2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de preguntas */}
      <div>
        <label className={labelClass}>
          Preguntas Guardadas ({questions.length})
        </label>
        {questions.length > 0 ? (
          <div className="space-y-2 p-3 border border-gray-300 rounded-lg max-h-96 overflow-y-auto custom-scrollbar">
            {questions.map((question, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <p className="text-sm text-gray-700 flex-1">
                  {question.question}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(index)}
                  className="ml-3 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar pregunta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-gray-300 rounded-lg text-center">
            <p className="text-sm text-gray-500">
              No hay preguntas frecuentes agregadas.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Agrega preguntas que los usuarios puedan hacer al agente.
            </p>
          </div>
        )}
      </div>

      {/* Información adicional */}
      {questions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Estas preguntas se mostrarán como
            sugerencias rápidas cuando los usuarios interactúen con el agente.
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentFormQuestions;
