export interface SourceChunk {
  index: number;
  source: string;
  page: number | null;
  sheet: string | null;
  snippet: string;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number | null;
}

export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
  trace_id: string | null;
  chat_message_id: string;
  usage: TokenUsage | null;
}

export type DocumentSourceType = "pdf" | "excel" | "csv" | "url";

export interface DocumentOut {
  id: string;
  source: string;
  source_type: DocumentSourceType;
  num_chunks: number;
  status: string;
  is_active: boolean;
  ingested_at: string;
}

export interface IngestResponse {
  document_id: string;
  source: string;
  source_type: DocumentSourceType;
  num_chunks: number;
}

export interface AnalyticsSummary {
  document_count: number;
  chunk_count: number;
  chat_count: number;
  feedback_count: number;
  positive_feedback_count: number;
  positive_feedback_ratio: number | null;
  total_tokens: number;
  estimated_cost_usd: number | null;
  langfuse_enabled: boolean;
  langfuse_host: string | null;
}
