export type Role = 'user' | 'model';

export interface Message {
  role: Role;
  text: string;
}

export type IconName =
  | 'CustomTrade'
  | 'Bank'
  | 'Convertion'
  | 'FacReview'
  | 'NomReview'
  | 'Inbox'
  | 'Respond'
  | 'Risk'
  | 'CPATax'
  | 'Travel'
  | 'Process'
  | 'Default'
  | 'CPAMember'
  | 'Repse';

export interface FrequestQuestion {
  id: string;
  question: string;
  order: number;
}

export interface AgentTool {
  id: string;
  enabled: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  customPrompt: string;
  model: string;
  temperature: number;
  topK: number;
  maxTokens: number;
  isPublic: boolean;
  tools?: AgentTool[];
  sub_agents?: AgentTool[];
  questions?: FrequestQuestion[];
}

export interface Tool {
  id: string;
  section: string | null;
  name: string; // snake_case function name used by the LLM
  display_name: string; // human-readable label
  description: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string> | null;
  input_schema: ToolInputSchema;
  created_at: string;
  updated_at: string;
}

export interface ToolInputProperty {
  type: string;
  description: string;
}

export interface ToolInputSchema {
  type: string;
  properties: Record<string, ToolInputProperty>;
  required: string[];
}

export interface ToolCreate {
  section?: string | null;
  name: string;
  display_name: string;
  description: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string> | null;
  input_schema: ToolInputSchema;
}

export interface ToolUpdate {
  section?: string | null;
  name?: string;
  display_name?: string;
  description?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string> | null;
  input_schema?: ToolInputSchema;
}

export type Fuente = {
  id: string;
  name: string;
  category: 'oficial' | 'interno';
  active: boolean;
  lastUpdated: string;
  medio: string;
  link: string;
};

export interface LogEntry {
  id: string;
  user: string;
  agentName: string;
  action: 'creado' | 'editado' | 'eliminado';
  details: string;
  timestamp: Date;
  previousState?: Partial<Agent> | null;
  currentState?: Partial<Agent> | null;
}

export interface LogEntryRequest {
  id: string;
  user: string;
  agent_name: string;
  action: 'creado' | 'editado' | 'eliminado';
  detail: string;
  created_at: Date;
  agent_before_state?: Partial<Agent> | null;
  agent_after_state?: Partial<Agent> | null;
}

export interface LogsResponse {
  items: LogEntry[];
  lastKey: LastKey;
  hasMore: boolean;
  pageSize: number;
}

export interface LastKey {
  id: string;
  log_id: string;
  created_at: string;
}

// ── Execution traces ─────────────────────────────────────────────────────────

export interface ToolCallTrace {
  tool_name: string;
  tool_use_id: string;
  input: Record<string, unknown>;
  output: string | null;
  success: boolean;
  error: string | null;
  iteration: number;
}

export interface ExecutionTrace {
  id: string;
  agent_id: string;
  agent_name: string;
  user: string;
  account_id: string;
  conversation_id: string | null;
  user_message: string;
  final_response: string;
  tool_calls: ToolCallTrace[];
  total_iterations: number;
  duration_ms: number;
  was_answered: boolean;
  created_at: string;
}

export interface ExecutionTracesResponse {
  items: ExecutionTrace[];
  lastKey: Record<string, string> | null;
  hasMore: boolean;
}

export interface Unanswered {
  id: string;
  question: string;
  agentId: string;
  agentName: string;
  user: string;
  timestamp: string;
  context?: string;
  attemptedResponse?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  wasFedToAgent: boolean;
  fedDate?: string;
  comment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  category?: string;
  tags?: string[];
}

export interface UnansweredComment {
  id: string;
  questionId: string;
  user: string;
  comment: string;
  createdAt: string;
}

export interface UnansweredFilters {
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  agentId?: string;
  wasFedToAgent?: boolean;
  startDate?: string;
  endDate?: string;
}
