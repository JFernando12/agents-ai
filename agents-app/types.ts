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
  product_id: string;
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
  product_id: string;
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
  product_id?: string;
  section?: string | null;
  name?: string;
  display_name?: string;
  description?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string> | null;
  input_schema?: ToolInputSchema;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  description?: string | null;
  slug: string;
}

export interface ProductUpdate {
  name?: string;
  description?: string | null;
  slug?: string;
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
