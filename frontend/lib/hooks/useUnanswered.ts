import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unansweredQuestionsService } from '../api/unanswered';
import type { Unanswered, UnansweredFilters } from '@/types';

export function useUnansweredQuestions(filters?: UnansweredFilters) {
  return useQuery({
    queryKey: ['unanswered', filters],
    queryFn: () => unansweredQuestionsService.getUnansweredQuestions(filters),
  });
}

export function useUnansweredQuestion(id: string) {
  return useQuery({
    queryKey: ['unanswered-question', id],
    queryFn: () => unansweredQuestionsService.getUnansweredQuestionById(id),
    enabled: !!id,
  });
}

export function useUpdateUnansweredQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Unanswered> }) =>
      unansweredQuestionsService.updateUnansweredQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unanswered'] });
      queryClient.invalidateQueries({ queryKey: ['unanswered-question'] });
      queryClient.invalidateQueries({ queryKey: ['unanswered-stats'] });
    },
  });
}

export function useMarkAsFedToAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      unansweredQuestionsService.markAsFedToAgent(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unanswered'] });
      queryClient.invalidateQueries({ queryKey: ['unanswered-question'] });
      queryClient.invalidateQueries({ queryKey: ['unanswered-stats'] });
    },
  });
}

export function useUpdateQuestionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      comment,
    }: {
      id: string;
      status: Unanswered['status'];
      comment?: string;
    }) => unansweredQuestionsService.updateStatus(id, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unanswered'] });
      queryClient.invalidateQueries({ queryKey: ['unanswered-question'] });
      queryClient.invalidateQueries({ queryKey: ['unanswered-stats'] });
    },
  });
}

export function useAddQuestionComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      questionId, 
      comment 
    }: { 
      questionId: string; 
      comment: string 
    }) => unansweredQuestionsService.addComment(questionId, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['question-comments', variables.questionId] 
      });
    },
  });
}

export function useQuestionComments(questionId: string) {
  return useQuery({
    queryKey: ['question-comments', questionId],
    queryFn: () => unansweredQuestionsService.getComments(questionId),
    enabled: !!questionId,
  });
}

export function useDeleteUnansweredQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      unansweredQuestionsService.deleteUnansweredQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unanswered'] });
      queryClient.invalidateQueries({ queryKey: ['unanswered-stats'] });
    },
  });
}
