import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  TranscriptEntry,
  SuggestionBatch,
  ChatMessage,
  AppSettings,
} from "@/types";
import {
  DEFAULT_SUGGESTION_PROMPT,
  DEFAULT_EXPANSION_PROMPT,
  DEFAULT_CHAT_PROMPT,
} from "@/lib/prompts";

interface AppState {
  // Recording
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;

  // Transcript
  transcript: TranscriptEntry[];
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;

  // Suggestions
  suggestionBatches: SuggestionBatch[];
  addSuggestionBatch: (batch: SuggestionBatch) => void;
  lastTranscriptHash: string;
  setLastTranscriptHash: (hash: string) => void;
  isSuggestionsLoading: boolean;
  setSuggestionsLoading: (v: boolean) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  isChatLoading: boolean;
  setChatLoading: (v: boolean) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Session
  clearSession: () => void;
}

const defaultSettings: AppSettings = {
  groqApiKey: "",
  suggestionPrompt: DEFAULT_SUGGESTION_PROMPT,
  expansionPrompt: DEFAULT_EXPANSION_PROMPT,
  chatPrompt: DEFAULT_CHAT_PROMPT,
  suggestionContextTokens: 1500,
  chatContextTokens: 6000,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isRecording: false,
      setIsRecording: (v) => set({ isRecording: v }),

      transcript: [],
      addTranscriptEntry: (entry) =>
        set((s) => ({ transcript: [...s.transcript, entry] })),
      clearTranscript: () => set({ transcript: [] }),

      suggestionBatches: [],
      addSuggestionBatch: (batch) =>
        set((s) => ({ suggestionBatches: [batch, ...s.suggestionBatches] })),
      lastTranscriptHash: "",
      setLastTranscriptHash: (hash) => set({ lastTranscriptHash: hash }),
      isSuggestionsLoading: false,
      setSuggestionsLoading: (v) => set({ isSuggestionsLoading: v }),

      chatMessages: [],
      addChatMessage: (msg) =>
        set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
      updateLastAssistantMessage: (content) =>
        set((s) => {
          const msgs = [...s.chatMessages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === "assistant") {
              msgs[i] = { ...msgs[i], content };
              break;
            }
          }
          return { chatMessages: msgs };
        }),
      isChatLoading: false,
      setChatLoading: (v) => set({ isChatLoading: v }),

      settings: defaultSettings,
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      clearSession: () =>
        set({
          transcript: [],
          suggestionBatches: [],
          chatMessages: [],
          lastTranscriptHash: "",
          isRecording: false,
        }),
    }),
    {
      name: "ai-meeting-assistant",
      partialize: (s) => ({ settings: s.settings }),
    }
  )
);
