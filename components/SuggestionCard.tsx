"use client";

import { useState } from "react";
import { Suggestion } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { getFullTranscript, generateId } from "@/lib/transcript";
import {
  MessageSquare,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  question: {
    icon: HelpCircle,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "Question",
  },
  talking_point: {
    icon: Lightbulb,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    label: "Talking Point",
  },
  answer: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Answer",
  },
  fact_check: {
    icon: AlertCircle,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    label: "Fact Check",
  },
  clarification: {
    icon: MessageSquare,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    label: "Clarification",
  },
};

interface Props {
  suggestion: Suggestion;
  onSendToChat: (suggestion: Suggestion, expanded: string) => void;
}

export default function SuggestionCard({ suggestion, onSendToChat }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedContent, setExpandedContent] = useState(
    suggestion.expandedContent || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const { transcript, settings } = useAppStore();

  const config = TYPE_CONFIG[suggestion.type] || TYPE_CONFIG.question;
  const Icon = config.icon;

  const handleExpand = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    if (expandedContent) {
      setIsExpanded(true);
      return;
    }

    if (!settings.groqApiKey) {
      alert("Please set your Groq API key in Settings.");
      return;
    }

    setIsLoading(true);
    setIsExpanded(true);

    try {
      const fullTranscript = getFullTranscript(
        transcript,
        settings.chatContextTokens
      );

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: settings.groqApiKey,
          fullTranscript,
          expansionMode: true,
          suggestion: {
            type: suggestion.type,
            title: suggestion.title,
            preview: suggestion.preview,
          },
          expansionPrompt: settings.expansionPrompt,
        }),
      });

      if (!res.ok) throw new Error("Expansion failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
          setExpandedContent(content);
        }
      }
    } catch (err) {
      console.error("[SuggestionCard] expand error:", err);
      setExpandedContent("Failed to expand. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToChat = () => {
    onSendToChat(suggestion, expandedContent);
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all",
        config.bg
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-medium", config.color)}>
              {config.label}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-200 leading-snug">
            {suggestion.title}
          </p>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            {suggestion.preview}
          </p>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {isLoading ? (
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              Expanding...
            </div>
          ) : (
            <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {expandedContent}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleExpand}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Expand
            </>
          )}
        </button>

        <button
          onClick={handleSendToChat}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors ml-auto"
        >
          <ArrowRight className="w-3 h-3" />
          Ask in chat
        </button>
      </div>
    </div>
  );
}
