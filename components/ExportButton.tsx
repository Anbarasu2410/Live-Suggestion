"use client";

import { useAppStore } from "@/store/useAppStore";
import { SessionExport } from "@/types";
import { Download } from "lucide-react";

export default function ExportButton() {
  const { transcript, suggestionBatches, chatMessages } = useAppStore();

  const handleExport = () => {
    const session: SessionExport = {
      exportedAt: new Date().toISOString(),
      transcript,
      suggestionBatches,
      chatHistory: chatMessages,
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-session-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isEmpty =
    transcript.length === 0 &&
    suggestionBatches.length === 0 &&
    chatMessages.length === 0;

  return (
    <button
      onClick={handleExport}
      disabled={isEmpty}
      className="flex items-center gap-2 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download className="w-3.5 h-3.5" />
      Export Session
    </button>
  );
}
