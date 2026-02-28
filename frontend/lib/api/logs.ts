import { LogEntry,LogsResponse, LastKey,LogEntryRequest} from "@/types";
import { ApiService } from "./api";

class ApiLogs extends ApiService {
    constructor() {
        super();
    }

    getLogs = async (limit = 20, lastKey: LastKey | null): Promise<LogsResponse> => {
        console.log("Fetching logs from API...");
        const params = new URLSearchParams({ limit: String(limit) });

        if (lastKey) {
            params.append("lastKey", JSON.stringify(lastKey));
        }
        const response = await this.api.get(`/logs?${params.toString()}`);
        const data = response.data;

        const actionMapping: Record<string, string> = {
          CREATE_AGENT: 'creado',
          UPDATE_AGENT: 'editado',
          DELETE_AGENT: 'eliminado',
        };

        const formattedData = data.data.items.map((log: LogEntryRequest) => ({
          id: log.id,
          user: log.user,
          agentName: log.agent_name,
          action: actionMapping[log.action] || log.action,
          details: log.detail,
          timestamp: new Date(log.created_at),
          previousState: log.agent_before_state || null,
          currentState: log.agent_after_state || null,
        }));

        return {
            items: formattedData,
            lastKey: data.lastEvaluatedKey || null,
            hasMore: data.hasMore,
            pageSize: data.pageSize,
        };
    };
}

export const apiLogs = new ApiLogs();