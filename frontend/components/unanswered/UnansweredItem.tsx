"use client";

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  CheckCircle2,
  MessageSquarePlus,
  BrainCircuit,
} from 'lucide-react';
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

const STATUS_STYLES: Record<string, string> = {
  pending:
    'bg-amber-100  text-amber-700  dark:bg-amber-500/10  dark:text-amber-400',
  reviewed:
    'bg-blue-100   text-blue-700   dark:bg-blue-500/10   dark:text-blue-400',
  resolved:
    'bg-green-100  text-green-700  dark:bg-green-500/10  dark:text-green-400',
  dismissed:
    'bg-gray-100   text-gray-600   dark:bg-white/[0.06]  dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  resolved: 'Resuelto',
  dismissed: 'Descartado',
};

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

  const handleMarkAsFed = () =>
    markAsFed.mutate({
      id: question.id,
      comment: 'Información proporcionada al agente',
    });

  const handleStatusChange = (status: Unanswered['status']) =>
    updateStatus.mutate({ id: question.id, status });

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate(
      { questionId: question.id, comment: commentText },
      {
        onSuccess: () => {
          setCommentText('');
          setShowCommentForm(false);
        },
      },
    );
  };

  const badgeClass = STATUS_STYLES[question.status] ?? STATUS_STYLES.dismissed;

  return (
    <div className="border border-gray-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.02] hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors">
      {/* Summary row */}
      <div
        className="flex items-start gap-4 px-4 py-3.5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Question text + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug mb-1.5">
            {question.question}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${badgeClass}`}
            >
              {STATUS_LABELS[question.status] ?? question.status}
            </span>
            {question.wasFedToAgent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                <CheckCircle2 className="w-3 h-3" /> Entrenado
              </span>
            )}
            {question.category && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
                {question.category}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Bot className="w-3 h-3" />
              {question.agentName}
            </span>
            {question.user && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <User className="w-3 h-3" />
                {question.user}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(question.timestamp).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div
          className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-white/[0.06] space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {question.context && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                Contexto
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {question.context}
              </p>
            </div>
          )}

          {question.attemptedResponse && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                Respuesta intentada
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {question.attemptedResponse}
              </p>
            </div>
          )}

          {question.comment && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                Nota
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {question.comment}
              </p>
            </div>
          )}

          {comments.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Comentarios
              </p>
              <div className="space-y-2">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-lg px-3 py-2"
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {comment.user}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString(
                          'es-ES',
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!question.wasFedToAgent && (
              <button
                onClick={handleMarkAsFed}
                disabled={markAsFed.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                {markAsFed.isPending ? 'Procesando...' : 'Entrenar agente'}
              </button>
            )}
            {question.status !== 'resolved' && (
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={updateStatus.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolver
              </button>
            )}
            {question.status === 'pending' && (
              <button
                onClick={() => handleStatusChange('reviewed')}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Marcar revisado
              </button>
            )}
            <button
              onClick={() => handleStatusChange('dismissed')}
              disabled={updateStatus.isPending}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/[0.08] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/[0.08] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              {showCommentForm ? 'Cancelar' : 'Comentar'}
            </button>
          </div>

          {showCommentForm && (
            <div className="space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none placeholder-gray-400 transition-colors"
                rows={3}
              />
              <button
                onClick={handleAddComment}
                disabled={addComment.isPending || !commentText.trim()}
                className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {addComment.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
