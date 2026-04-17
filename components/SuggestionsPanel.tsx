"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  getRecentTranscript,
  hashTranscript,
} from "@/lib/transcript";
import SuggestionCard from "./SuggestionCard";
import { Suggestion } from "@/types";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTION_INTERVAL_MS = 30000;

export default function SuggestionsPanel({
  onSendToChat,
}: {
  onSendToChat: (suggestion: Suggestion, expanded: string) => void;
}) {
  const {
    transcript,
    suggestionBatches,
    addSuggestionBatch,
    lastTranscriptHash,
    setLastTranscriptHash,
    isSuggestionsLoading,
    setSuggestionsLoading,
    isRecording,
    settings,
  } = useAppStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSuggestions = useCallback(
    async (force = false) => {
      if (!settings.groqApiKey || transcript.length === 0) return;
      if (isSuggestionsLoading) return;

      const recentTranscript = getRecentTranscript(
        transcript,
        settings.suggestionContextTokens
      );
      if (!recentTranscript.trim()) return;

      const hash = hashTranscript(transcript);
      if (!force && hash === lastTranscriptHash) return;

      setSuggestionsLoading(true);
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recentTranscript,
            transcriptHash: hash,
            apiKey: settings.groqApiKey,
            customPrompt: settings.suggestionPrompt,
          }),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (data.batch) {
          addSuggestionBatch(data.batch);
          setLastTranscriptHash(hash);
        }
      } catch (err) {
        console.error("[SuggestionsPanel] fetch error:", err);
      } finally {
        setSuggestionsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transcript, settings, lastTranscriptHash, isSuggestionsLoading]
  );

  // Auto-refresh every 30s while recording
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(
        () => fetchSuggestions(false),
        SUGGESTION_INTERVAL_MS
      );
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording, fetchSuggestions]);

  const allSuggestions = suggestionBatches.flatMap((b) => b.suggestions);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-zinc-400" />
          <span className="font-semibold text-sm text-zinc-200">
            Suggestions
          </span>
          {allSuggestions.length > 0 && (
            <span className="text-xs text-zinc-500">
              ({allSuggestions.length})
            </span>
          )}
        </div>
        <button
          onClick={() => fetchSuggestions(true)}
          disabled={isSuggestionsLoading || transcript.length === 0}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all",
            "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {isSuggestionsLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Refresh
        </button>
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isSuggestionsLoading && allSuggestions.length === 0 && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm justify-center mt-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating suggestions...
          </div>
        )}

        {!isSuggestionsLoading && allSuggestions.length === 0 && (
          <div className="text-center text-zinc-500 text-sm mt-8">
            <p>No suggestions yet.</p>
            <p className="mt-1 text-xs">
              Suggestions appear automatically every 30s while recording.
            </p>
          </div>
        )}

        {/* Batch separator rendering */}
        {suggestionBatches.map((batch, batchIdx) => (
          <div key={batch.id}>
            {batchIdx > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-600">
                  {new Date(batch.timestamp).toLocaleTimeString()}
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            )}
            <div className="space-y-2">
              {batch.suggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  onSendToChat={onSendToChat}
                />
              ))}
            </div>
          </div>
        ))}

        {isSuggestionsLoading && allSuggestions.length > 0 && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs justify-center py-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Refreshing...
          </div>
        )}
      </div>
    </div>
  );
}
