"use client";

import { useState, useCallback, useEffect } from "react";
import TranscriptPanel from "@/components/TranscriptPanel";
import SuggestionsPanel from "@/components/SuggestionsPanel";
import ChatPanel from "@/components/ChatPanel";
import ExportButton from "@/components/ExportButton";
import { Suggestion } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { Settings, Trash2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { clearSession, settings } = useAppStore();
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    suggestion: Suggestion;
    expanded: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSendToChat = useCallback(
    (suggestion: Suggestion, expanded: string) => {
      setPendingSuggestion({ suggestion, expanded });
    },
    []
  );

  const handlePendingConsumed = useCallback(() => {
    setPendingSuggestion(null);
  }, []);

  const hasApiKey = mounted && !!settings.groqApiKey;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">AI</span>
          </div>
          <span className="font-semibold text-sm">Meeting Assistant</span>
          {!hasApiKey && (
            <Link
              href="/settings"
              className="text-xs text-yellow-400 hover:text-yellow-300 underline"
            >
              ⚠ Set API key
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
          <button
            onClick={() => {
              if (confirm("Clear the entire session?")) clearSession();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
        </div>
      </header>

      {/* 3-column layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Transcript */}
        <div className="w-[30%] border-r border-zinc-800 overflow-hidden flex flex-col">
          <TranscriptPanel />
        </div>

        {/* Middle: Suggestions */}
        <div className="w-[35%] border-r border-zinc-800 overflow-hidden flex flex-col">
          <SuggestionsPanel onSendToChat={handleSendToChat} />
        </div>

        {/* Right: Chat */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatPanel
            pendingSuggestion={pendingSuggestion}
            onPendingConsumed={handlePendingConsumed}
          />
        </div>
      </main>
    </div>
  );
}
