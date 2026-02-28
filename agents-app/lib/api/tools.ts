import { Tool, ToolCreate, ToolUpdate } from '@/types';
import { ApiService } from './api';

class ApiTools extends ApiService {
  constructor() {
    super();
  }

  getAllTools = async (): Promise<Tool[]> => {
    const response = await this.api.get('/tools/');
    return response.data.data as Tool[];
  };

  getToolsByProduct = async (productId: string): Promise<Tool[]> => {
    const response = await this.api.get(`/tools/product/${productId}`);
    return response.data.data as Tool[];
  };

  getTool = async (toolId: string): Promise<Tool> => {
    const response = await this.api.get(`/tools/${toolId}`);
    return response.data.data as Tool;
  };

  createTool = async (toolData: ToolCreate): Promise<{ id: string }> => {
    const response = await this.api.post('/tools/', toolData);
    return response.data.data as { id: string };
  };

  updateTool = async (toolId: string, toolData: ToolUpdate): Promise<void> => {
    await this.api.put(`/tools/${toolId}`, toolData);
  };

  deleteTool = async (toolId: string): Promise<void> => {
    await this.api.delete(`/tools/${toolId}`);
  };

  parseToolDocs = async (docs: string): Promise<Record<string, unknown>> => {
    const response = await this.api.post('/tools/parse-docs', { docs });
    return response.data.data;
  };
}

export const apiTools = new ApiTools();
