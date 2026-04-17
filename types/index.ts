export type SuggestionType =
  | "question"
  | "talking_point"
  | "answer"
  | "fact_check"
  | "clarification";

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  preview: string;
  expandedContent?: string;
  timestamp: number;
  batchId: string;
}

export interface SuggestionBatch {
  id: string;
  suggestions: Suggestion[];
  timestamp: number;
  transcriptHash: string;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  suggestionId?: string;
}

export interface AppSettings {
  groqApiKey: string;
  suggestionPrompt: string;
  expansionPrompt: string;
  chatPrompt: string;
  suggestionContextTokens: number;
  chatContextTokens: number;
}

export interface SessionExport {
  exportedAt: string;
  transcript: TranscriptEntry[];
  suggestionBatches: SuggestionBatch[];
  chatHistory: ChatMessage[];
}
