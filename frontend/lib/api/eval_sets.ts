import { EvalSet, EvalSetCreate, EvalRun, EvalRunSummary } from '@/types';
import { ApiService } from './api';

class ApiEvalSets extends ApiService {
  constructor() {
    super();
  }

  listByAgent = async (agentId: string): Promise<EvalSet[]> => {
    const response = await this.api.get('/eval-sets', { params: { agent_id: agentId } });
    return response.data.data as EvalSet[];
  };

  get = async (evalSetId: string): Promise<EvalSet> => {
    const response = await this.api.get(`/eval-sets/${evalSetId}`);
    return response.data.data as EvalSet;
  };

  create = async (data: EvalSetCreate): Promise<EvalSet> => {
    const response = await this.api.post('/eval-sets', data);
    return response.data.data as EvalSet;
  };

  update = async (evalSetId: string, data: EvalSetCreate): Promise<EvalSet> => {
    const response = await this.api.put(`/eval-sets/${evalSetId}`, data);
    return response.data.data as EvalSet;
  };

  delete = async (evalSetId: string): Promise<void> => {
    await this.api.delete(`/eval-sets/${evalSetId}`);
  };

  // Runs
  triggerRun = async (evalSetId: string): Promise<EvalRun> => {
    const response = await this.api.post(`/eval-sets/${evalSetId}/runs`);
    return response.data.data as EvalRun;
  };

  listRuns = async (evalSetId: string): Promise<EvalRunSummary[]> => {
    const response = await this.api.get(`/eval-sets/${evalSetId}/runs`);
    return response.data.data as EvalRunSummary[];
  };

  getRun = async (evalSetId: string, runId: string): Promise<EvalRun> => {
    const response = await this.api.get(`/eval-sets/runs/${runId}`);
    return response.data.data as EvalRun;
  };
}

export const apiEvalSets = new ApiEvalSets();
