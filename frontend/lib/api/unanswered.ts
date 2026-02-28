import { ApiService } from './api';
import type { 
  Unanswered, 
  UnansweredComment,
  UnansweredFilters 
} from '@/types';

class UnansweredQuestionsService extends ApiService {
  async getUnansweredQuestions(
    filters?: UnansweredFilters,
  ): Promise<Unanswered[]> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.agentId) params.append('agentId', filters.agentId);
    if (filters?.wasFedToAgent !== undefined) {
      params.append('wasFedToAgent', String(filters.wasFedToAgent));
    }
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = `/unanswered${queryString ? `?${queryString}` : ''}`;

    const response = await this.api.get(url);
    const data = response.data.data;

    const formattedData: Unanswered[] = data.map((item: any) => ({
      id: item.id,
      question: item.question,
      agentId: item.agent_id,
      agentName: item.agent_name,
      user: item.user,
      timestamp: item.timestamp,
      context: item.context,
      attemptedResponse: item.attempted_response,
      status: item.status,
      wasFedToAgent: item.was_fed_to_agent,
      fedDate: item.fed_date,
      comment: item.comment,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      category: item.category,
      tags: item.tags,
    }));

    return formattedData;
  }

  async getUnansweredQuestionById(id: string): Promise<Unanswered> {
    const response = await this.api.get(`/unanswered/${id}`);
    const item = response.data;
    const formattedItem: Unanswered = {
      id: item.id,
      question: item.question,
      agentId: item.agent_id,
      agentName: item.agent_name,
      user: item.user,
      timestamp: item.timestamp,
      context: item.context,
      attemptedResponse: item.attempted_response,
      status: item.status,
      wasFedToAgent: item.was_fed_to_agent,
      fedDate: item.fed_date,
      comment: item.comment,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      category: item.category,
      tags: item.tags,
    };
    return formattedItem;
  }

  async updateUnansweredQuestion(
    id: string,
    input: Partial<Unanswered>,
  ): Promise<Unanswered> {
    const data = {
      ...input,
      agent_id: input.agentId,
      agent_name: input.agentName,
      user: input.user,
      attempted_response: input.attemptedResponse,
      was_fed_to_agent: input.wasFedToAgent,
      reviewd_by: input.reviewedBy,
      reviewed_at: input.reviewedAt,
    };
    const response = await this.api.patch(`/unanswered/${id}`, data);

    const item = response.data;
    const formattedItem: Unanswered = {
      id: item.id,
      question: item.question,
      agentId: item.agent_id,
      agentName: item.agent_name,
      user: item.user,
      timestamp: item.timestamp,
      context: item.context,
      attemptedResponse: item.attempted_response,
      status: item.status,
      wasFedToAgent: item.was_fed_to_agent,
      fedDate: item.fed_date,
      comment: item.comment,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      category: item.category,
      tags: item.tags,
    };
    return formattedItem;
  }

  async markAsFedToAgent(
    id: string,
    comment?: string,
  ): Promise<Unanswered> {
    const response = await this.api.patch(`/unanswered/${id}/mark-fed`, {
      was_fed_to_agent: true,
      fed_date: new Date().toISOString(),
      comment,
    });

    const item = response.data;
    const formattedItem: Unanswered = {
      id: item.id,
      question: item.question,
      agentId: item.agent_id,
      agentName: item.agent_name,
      user: item.user,
      timestamp: item.timestamp,
      context: item.context,
      attemptedResponse: item.attempted_response,
      status: item.status,
      wasFedToAgent: item.was_fed_to_agent,
      fedDate: item.fed_date,
      comment: item.comment,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      category: item.category,
      tags: item.tags,
    };
    return formattedItem;
  }

  async updateStatus(
    id: string,
    status: Unanswered['status'],
    comment?: string,
  ): Promise<Unanswered> {
    const response = await this.api.patch(`/unanswered/${id}/status`, {
      status,
      comment,
      reviewed_at: new Date().toISOString(),
    });

    const item = response.data;
    const formattedItem: Unanswered = {
      id: item.id,
      question: item.question,
      agentId: item.agent_id,
      agentName: item.agent_name,
      user: item.user,
      timestamp: item.timestamp,
      context: item.context,
      attemptedResponse: item.attempted_response,
      status: item.status,
      wasFedToAgent: item.was_fed_to_agent,
      fedDate: item.fed_date,
      comment: item.comment,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      category: item.category,
      tags: item.tags,
    };
    return formattedItem;
  }

  async addComment(
    questionId: string,
    comment: string,
  ): Promise<UnansweredComment> {
    const response = await this.api.post(`/unanswered/${questionId}/comments`, {
      comment,
    });

    const item = response.data;
    const formattedItem: UnansweredComment = {
      id: item.id,
      questionId: item.question_id,
      user: item.user,
      comment: item.comment,
      createdAt: item.created_at,
    };
    return formattedItem;
  }

  async getComments(questionId: string): Promise<UnansweredComment[]> {
    const response = await this.api.get(`/unanswered/${questionId}/comments`);

    const data = response.data.data;
    const formattedData: UnansweredComment[] = data.map(
      (item: any) => ({
        id: item.id,
        questionId: item.question_id,
        user: item.user,
        comment: item.comment,
        createdAt: item.created_at,
      }),
    );
    return formattedData;
  }

  async deleteUnansweredQuestion(id: string): Promise<void> {
    await this.api.delete(`/unanswered/${id}`);
  }
}

export const unansweredQuestionsService = new UnansweredQuestionsService();
