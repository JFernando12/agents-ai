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

export interface RAGConfig {
  enabled: boolean;
  embedding_model: string;
  top_k: number;
  score_threshold: number | null;
  chunk_size: number;
  chunk_overlap: number;
  context_max_chars: number;
  search_type: 'semantic';
  query_rewriting_enabled: boolean;
  query_rewriting_model: string;
  eval_enabled: boolean;
  eval_model: string;
  hybrid_search_enabled: boolean;
  hybrid_alpha: number;
  chunking_strategy: 'fixed' | 'semantic' | 'contextual';
  contextual_retrieval_model: string;
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
  whatsappEnabled?: boolean;
  tools?: AgentTool[];
  sub_agents?: AgentTool[];
  questions?: FrequestQuestion[];
  ragConfig?: RAGConfig;
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

export type DocumentStatus = 'pending' | 'processing' | 'processed' | 'failed';

export type Fuente = {
  id: string;
  name: string;
  active: boolean;
  lastUpdated: string;
  status: DocumentStatus;
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

// ── RAG traces ───────────────────────────────────────────────────────────────

export interface RAGTrace {
  id: string;
  agent_id: string;
  conversation_id: string | null;
  query: string;
  rewritten_query: string | null;
  chunks_retrieved: number;
  chunks_used: number;
  avg_score: number;
  max_score: number;
  min_score: number;
  latency_ms: number;
  embedding_model: string;
  top_k_requested: number;
  score_threshold: number | null;
  documents_hit: string[];
  created_at: string;
  faithfulness: number | null;
  answer_relevance: number | null;
  context_precision: number | null;
  hybrid_search_used: boolean;
}

export interface RAGTracesResponse {
  items: RAGTrace[];
  last_key: Record<string, string> | null;
  has_more: boolean;
}

export interface RAGMetrics {
  agent_id: string;
  total_queries: number;
  queries_with_results: number;
  queries_without_results: number;
  hit_rate: number;
  avg_chunks_retrieved: number;
  avg_chunks_used: number;
  avg_score: number;
  avg_latency_ms: number;
  top_documents: { document: string; hits: number }[];
  avg_faithfulness: number | null;
  avg_answer_relevance: number | null;
  avg_context_precision: number | null;
  evaluated_traces: number;
}

// ---------------------------------------------------------------------------
// Eval Sets
// ---------------------------------------------------------------------------

export interface EvalSetItem {
  id: string;
  question: string;
  expected_answer?: string | null;
  notes?: string | null;
}

export interface EvalSet {
  id: string;
  agent_id: string;
  name: string;
  description?: string | null;
  items: EvalSetItem[];
  created_at: string;
  updated_at: string;
}

// ── Conversations ─────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string | null;
  user: string;
  agent_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown> | null;
  context_data?: Record<string, unknown> | null;
  attachments?: string[] | null;
}

export interface EvalSetCreate {
  agent_id: string;
  name: string;
  description?: string | null;
  items: EvalSetItem[];
}

export interface EvalRunResult {
  item_id: string;
  question: string;
  expected_answer?: string | null;
  answer?: string | null;
  rewritten_query?: string | null;
  chunks_used?: number | null;
  faithfulness?: number | null;
  answer_relevance?: number | null;
  context_precision?: number | null;
  answer_correctness?: number | null;
  latency_ms?: number | null;
  error?: string | null;
}

export type EvalRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface EvalRun {
  id: string;
  eval_set_id: string;
  agent_id: string;
  eval_set_name?: string | null;
  status: EvalRunStatus;
  rag_config_snapshot?: Record<string, unknown> | null;
  results: EvalRunResult[];
  created_at: string;
  completed_at?: string | null;
  error?: string | null;
}

export interface EvalRunSummary {
  id: string;
  eval_set_id: string;
  eval_set_name?: string | null;
  agent_id: string;
  status: EvalRunStatus;
  total_items: number;
  completed_items: number;
  avg_faithfulness?: number | null;
  avg_answer_relevance?: number | null;
  avg_context_precision?: number | null;
  avg_answer_correctness?: number | null;
  created_at: string;
  completed_at?: string | null;
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

export interface WhatsAppChannel {
  id: string;
  account_id: string;
  agent_id: string;
  name: string;
  phone_number_id: string;
  wa_token: string;
  app_secret?: string | null;
  verify_token: string;
  webhook_secret?: string | null;
  is_active: boolean;
  created_at: number; // epoch ms
  updated_at: number; // epoch ms
}

export interface WhatsAppChannelCreate {
  agent_id: string;
  name: string;
  phone_number_id: string;
  wa_token: string;
  app_secret?: string | null;
  verify_token: string;
  webhook_secret?: string | null;
}

export interface WhatsAppChannelUpdate {
  agent_id?: string;
  name?: string;
  phone_number_id?: string;
  wa_token?: string;
  app_secret?: string | null;
  verify_token?: string;
  is_active?: boolean;
}

export interface WhatsAppSession {
  id: string;
  channel_id: string;
  from_phone: string;
  contact_name?: string | null;
  conversation_id: string;
  agent_id: string;
  status: 'active' | 'human_handoff';
  last_message_at?: number | null; // epoch ms
  last_message_preview?: string | null;
  unread_count: number;
  labels: string[];
}

export type WhatsAppMessageStatus = 'received' | 'processing' | 'sent' | 'failed';
export type WhatsAppMessageRole = 'user' | 'assistant';
export type WhatsAppMessageSentBy = 'agent' | 'human' | 'user';

export interface WhatsAppInteractiveButton {
  id: string;
  title: string;
}

export interface WhatsAppInteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppInteractiveListSection {
  title?: string;
  rows: WhatsAppInteractiveListRow[];
}

export interface WhatsAppInteractiveData {
  buttons?: WhatsAppInteractiveButton[];
  sections?: WhatsAppInteractiveListSection[];
  button_label?: string;
}

export interface WhatsAppMessage {
  id: string;
  session_id: string;
  channel_id: string;
  wa_message_id?: string | null;
  role: WhatsAppMessageRole;
  content: string;
  type:
    | 'text'
    | 'image'
    | 'audio'
    | 'document'
    | 'sticker'
    | 'buttons'
    | 'list';
  media_url?: string | null;
  interactive_data?: WhatsAppInteractiveData | null;
  status: WhatsAppMessageStatus;
  sent_by: WhatsAppMessageSentBy;
  error_detail?: string | null;
  created_at: number; // epoch ms
}

export interface WhatsAppStats {
  total_channels: number;
  active_channels: number;
  total_sessions: number;
  active_sessions: number;
}

export interface WhatsAppSessionsResponse {
  items: WhatsAppSession[];
  next_key: Record<string, string> | null;
}

export interface WhatsAppMessagesResponse {
  items: WhatsAppMessage[];
  next_key: Record<string, string> | null;
}

