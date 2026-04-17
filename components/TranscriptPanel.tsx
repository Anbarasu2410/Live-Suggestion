"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { formatTime } from "@/lib/transcript";
import MicRecorder from "./MicRecorder";
import { FileText, Trash2 } from "lucide-react";

export default function TranscriptPanel() {
  const { transcript, clearTranscript, isRecording } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-400" />
          <span className="font-semibold text-sm text-zinc-200">Transcript</span>
          {isRecording && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <button
          onClick={clearTranscript}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Clear transcript"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mic control */}
      <div className="p-4 border-b border-zinc-800">
        <MicRecorder />
      </div>

      {/* Transcript content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcript.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm mt-8">
            <p>No transcript yet.</p>
            <p className="mt-1 text-xs">Start recording to capture audio.</p>
          </div>
        ) : (
          transcript.map((entry) => (
            <div key={entry.id} className="group">
              <span className="text-xs text-zinc-500 font-mono">
                {formatTime(entry.timestamp)}
              </span>
              <p className="text-sm text-zinc-200 mt-0.5 leading-relaxed">
                {entry.text}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer stats */}
      {transcript.length > 0 && (
        <div className="p-3 border-t border-zinc-800 text-xs text-zinc-500">
          {transcript.length} segment{transcript.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
