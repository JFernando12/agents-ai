import { Agent } from "@/types";
import { ApiService } from "./api";

class ApiAgents extends ApiService {
  constructor() {
    super();
  }

  getAgents = async (): Promise<Agent[]> => {
    const response = await this.api.get('/agents', {
      params: {
        is_public: true,
      },
    });
    const data = response.data;
    const formattedData = data.data.map((service: any) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      icon: service.icon,
      questions: service.questions || [],
    }));
    return formattedData;
  };
}

export const apiAgents = new ApiAgents();
