import { useQuery } from "@tanstack/react-query";
import { apiAgents } from "../api/agents";

export const useAgents = () => {
  return useQuery({
    queryKey: ["agents"],
    queryFn: apiAgents.getAgents,
  });
};
