export interface Context {
  content: string;
  score: number;
  metadata: {
    source: string;
    service_id: string;
    chunk_index: number;
    timestamp: string;
    document_id: string;
  };
  rank: number;
}

export interface SearchInfo {
  queries_used: string[];
  total_documents_found: number;
  contexts_used: number;
  context_length: number;
  agent_id: string;
}

export interface ContextData {
  contexts: Context[];
  search_info: SearchInfo;
}

export interface Message {
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
  context_data?: ContextData;
}

export interface Chat {
  id: string;
  title: string;
  timestamp: string;
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

export interface FrequentQuestion {
  id: string;
  question: string;
  order: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  questions?: FrequentQuestion[];
}
