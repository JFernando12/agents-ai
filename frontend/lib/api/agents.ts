import { Agent } from "@/types";
import { ApiService } from "./api";

class ApiAgents extends ApiService {
  constructor() {
    super();
  }

  getModels = async (): Promise<string[]> => {
    const response = await this.api.get('/agents/models');
    return response.data.data;
  };

  getAgents = async (): Promise<Agent[]> => {
    const response = await this.api.get('/agents');
    const data = response.data;
    const formattedData = data.data.map((service: any) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      model: service.model,
      customPrompt: service.custom_prompt,
      temperature: service.temperature,
      maxTokens: service.max_tokens,
      topK: service.top_k,
      icon: service.icon,
      isPublic: service.is_public ?? true,
      whatsappEnabled: service.whatsapp_enabled ?? false,
      tools: service.tools || [],
      sub_agents: service.sub_agents || [],
      questions: service.questions || [],
      ragConfig: service.rag_config ?? null,
    }));
    return formattedData;
  };

  createAgent = async (agentData: Omit<Agent, 'id'>): Promise<Agent> => {
    const bodyFormatted = {
      name: agentData.name,
      description: agentData.description,
      icon: agentData.icon,
      custom_prompt: agentData.customPrompt,
      model: agentData.model,
      temperature: agentData.temperature,
      top_k: agentData.topK,
      max_tokens: agentData.maxTokens,
      is_public: agentData.isPublic,
      whatsapp_enabled: agentData.whatsappEnabled ?? false,
      tools: agentData.tools || [],
      sub_agents: agentData.sub_agents || [],
      questions: agentData.questions || [],
      rag_config: agentData.ragConfig ?? null,
    };

    const response = await this.api.post('/agents', bodyFormatted);
    const data = response.data;

    const formattedData = {
      id: data.id,
      name: data.name,
      description: data.description,
      model: data.model,
      customPrompt: data.custom_prompt,
      temperature: data.temperature,
      maxTokens: data.max_tokens,
      topK: data.top_k,
      icon: data.icon,
      isPublic: data.is_public ?? true,
      toolIds: data.tool_ids || [],
      sub_agents: data.sub_agents || [],
      questions: data.questions || [],
    };

    return formattedData;
  };

  updateAgent = async ({
    id,
    agentData,
  }: {
    id: string;
    agentData: Omit<Agent, 'id'>;
  }): Promise<Agent> => {
    const bodyFormatted = {
      name: agentData.name,
      description: agentData.description,
      icon: agentData.icon,
      custom_prompt: agentData.customPrompt,
      model: agentData.model,
      temperature: agentData.temperature,
      top_k: agentData.topK,
      max_tokens: agentData.maxTokens,
      is_public: agentData.isPublic,
      whatsapp_enabled: agentData.whatsappEnabled ?? false,
      tools: agentData.tools || [],
      sub_agents: agentData.sub_agents || [],
      questions: agentData.questions || [],
      rag_config: agentData.ragConfig ?? null,
    };

    const response = await this.api.put(`/agents/${id}`, bodyFormatted);
    const data = response.data;

    const formattedData = {
      id: data.id,
      name: data.name,
      description: data.description,
      model: data.model,
      customPrompt: data.custom_prompt,
      temperature: data.temperature,
      maxTokens: data.max_tokens,
      topK: data.top_k,
      icon: data.icon,
      isPublic: data.is_public ?? true,
      tools: data.tools || [],
      sub_agents: data.sub_agents || [],
      questions: data.questions || [],
    };

    return formattedData;
  };

  deleteAgent = async (id: string): Promise<void> => {
    await this.api.delete(`/agents/${id}`);
  };

  improvePrompt = async (prompt: string): Promise<string> => {
    const response = await this.api.post('/agents/improve-prompt', { prompt });
    return response.data.data.improved_prompt;
  };
}

export const apiAgents = new ApiAgents();
