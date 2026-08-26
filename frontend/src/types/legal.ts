export type ActType = "BNS" | "BNSS" | "BSA";

export interface SourceItem {
  act: string;
  source: string;
  page: number;
  chunk_id: string;
  score: number;
}

export interface RelevantProvision {
  act: string;
  section_or_topic: string;
  description: string;
  relevance_reason: string;
}

export interface LegalQueryRequest {
  question: string;
  top_k?: number;
  act_filter?: ActType | null;
  user_type?: string | null;
  purpose?: string | null;
}

export interface LegalQueryResponse {
  question: string;
  answer: string;
  relevant_provisions: RelevantProvision[];
  why_they_may_apply?: string | null;
  additional_facts_needed: string[];
  sources: SourceItem[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  disclaimer: string;
}

export interface SearchResultItem {
  content: string;
  source: string;
  page: number;
  chunk_id: string;
  score: number;
  act: string;
}

export interface LegalSearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}

export interface VectorstoreStatsResponse {
  collection_name: string;
  persist_directory: string;
  total_documents: number;
  sources: Record<string, number>;
  status: string;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  environment: string;
  timestamp: string;
}
