"use client";

import { useState } from 'react';
import type { Unanswered } from '@/types';
import {
  useMarkAsFedToAgent,
  useUpdateQuestionStatus,
  useAddQuestionComment,
  useQuestionComments,
} from '@/lib/hooks/useUnanswered';

interface UnansweredQuestionItemProps {
  question: Unanswered;
}

export default function UnansweredQuestionItem({
  question,
}: UnansweredQuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  const markAsFed = useMarkAsFedToAgent();
  const updateStatus = useUpdateQuestionStatus();
  const addComment = useAddQuestionComment();
  const { data: comments = [] } = useQuestionComments(
    isExpanded ? question.id : '',
  );

  const handleMarkAsFed = () => {
    markAsFed.mutate({
      id: question.id,
      comment: 'Información proporcionada al agente',
    });
  };

  const handleStatusChange = (status: Unanswered['status']) => {
    updateStatus.mutate({ id: question.id, status });
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      addComment.mutate(
        { questionId: question.id, comment: commentText },
        {
          onSuccess: () => {
            setCommentText('');
            setShowCommentForm(false);
          },
        },
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'reviewed':
        return 'Revisado';
      case 'resolved':
        return 'Resuelto';
      case 'dismissed':
        return 'Descartado';
      default:
        return status;
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${getStatusColor(question.status)}`}
            >
              {getStatusText(question.status)}
            </span>
            {question.wasFedToAgent && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                ✓ Info proporcionada
              </span>
            )}
            <span className="text-xs text-gray-500">
              {new Date(question.timestamp).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <h3 className="font-medium text-gray-900 mb-2">
            {question.question}
          </h3>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Agente: <strong>{question.agentName}</strong>
            </span>
            {question.user && (
              <span>
                Usuario: <strong>{question.user}</strong>
              </span>
            )}
            {question.category && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                {question.category}
              </span>
            )}
          </div>
        </div>

        <div className="text-gray-400 ml-4">
          <svg
            className={`w-5 h-5 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div
          className="mt-4 pt-4 border-t space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {question.context && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                Contexto:
              </h4>
              <p className="text-sm text-gray-600">{question.context}</p>
            </div>
          )}

          {question.attemptedResponse && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                Respuesta intentada:
              </h4>
              <p className="text-sm text-gray-600 italic">
                {question.attemptedResponse}
              </p>
            </div>
          )}

          {question.comment && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Nota:</h4>
              <p className="text-sm text-gray-600">{question.comment}</p>
            </div>
          )}

          {comments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Comentarios:
              </h4>
              <div className="space-y-2">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 p-2 rounded text-sm"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-700">
                        {comment.user}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString(
                          'es-ES',
                        )}
                      </span>
                    </div>
                    <p className="text-gray-600">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {!question.wasFedToAgent && (
              <button
                onClick={handleMarkAsFed}
                disabled={markAsFed.isPending}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {markAsFed.isPending
                  ? 'Procesando...'
                  : 'Marcar como alimentado'}
              </button>
            )}

            {question.status !== 'resolved' && (
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Marcar resuelto
              </button>
            )}

            {question.status === 'pending' && (
              <button
                onClick={() => handleStatusChange('reviewed')}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Marcar revisado
              </button>
            )}

            <button
              onClick={() => handleStatusChange('dismissed')}
              disabled={updateStatus.isPending}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Descartar
            </button>

            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              {showCommentForm ? 'Cancelar' : 'Agregar comentario'}
            </button>
          </div>

          {showCommentForm && (
            <div className="space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500 text-gray-700"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddComment}
                  disabled={addComment.isPending || !commentText.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {addComment.isPending ? 'Guardando...' : 'Guardar comentario'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
