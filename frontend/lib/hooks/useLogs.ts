import { useQuery } from "@tanstack/react-query"
import { apiLogs } from "../api/logs"
import type { LastKey } from "@/types";

export const useLogs = (limit: number, lastKey: LastKey | null) => {
    return useQuery({
        queryKey: ["logs", limit, lastKey],
        queryFn: () => apiLogs.getLogs(limit, lastKey),

    });
}