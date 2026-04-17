"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getFullTranscript, generateId } from "@/lib/transcript";
import { Suggestion } from "@/types";
import { MessageCircle, Send, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  pendingSuggestion?: { suggestion: Suggestion; expanded: string } | null;
  onPendingConsumed: () => void;
}

export default function ChatPanel({ pendingSuggestion, onPendingConsumed }: Props) {
  const {
    chatMessages,
    addChatMessage,
    updateLastAssistantMessage,
    isChatLoading,
    setChatLoading,
    transcript,
    settings,
  } = useAppStore();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = useCallback(
    async (messageText: string, suggestionContext?: Suggestion) => {
      if (!messageText.trim() || isChatLoading) return;
      if (!settings.groqApiKey) {
        alert("Please set your Groq API key in Settings.");
        return;
      }

      const userMsg = {
        id: generateId(),
        role: "user" as const,
        content: messageText.trim(),
        timestamp: Date.now(),
        suggestionId: suggestionContext?.id,
      };

      addChatMessage(userMsg);
      setInput("");
      setChatLoading(true);

      // Add placeholder assistant message
      const assistantId = generateId();
      addChatMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      });

      try {
        const fullTranscript = getFullTranscript(
          transcript,
          settings.chatContextTokens
        );

        const history = chatMessages
          .filter((m) => m.id !== assistantId)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText.trim(),
            fullTranscript,
            chatHistory: history,
            apiKey: settings.groqApiKey,
            customPrompt: settings.chatPrompt,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Chat request failed (${res.status}): ${errText}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let content = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            content += decoder.decode(value, { stream: true });
            updateLastAssistantMessage(content);
          }
        }
      } catch (err) {
        console.error("[ChatPanel] error:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        updateLastAssistantMessage(`❌ ${msg}`);
      } finally {
        setChatLoading(false);
      }
    },
    [
      isChatLoading,
      settings,
      addChatMessage,
      updateLastAssistantMessage,
      setChatLoading,
      transcript,
      chatMessages,
    ]
  );

  // Handle pending suggestion from SuggestionsPanel
  useEffect(() => {
    if (pendingSuggestion) {
      const { suggestion, expanded } = pendingSuggestion;
      const msg = expanded
        ? `Regarding "${suggestion.title}":\n\n${expanded}\n\nCan you elaborate further?`
        : `Tell me more about: ${suggestion.title}`;
      sendMessage(msg, suggestion);
      onPendingConsumed();
    }
  }, [pendingSuggestion, sendMessage, onPendingConsumed]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
        <MessageCircle className="w-4 h-4 text-zinc-400" />
        <span className="font-semibold text-sm text-zinc-200">Chat</span>
        {chatMessages.length > 0 && (
          <span className="text-xs text-zinc-500">
            ({Math.ceil(chatMessages.length / 2)} exchanges)
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center text-zinc-500 text-sm mt-8">
            <Bot className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
            <p>Ask anything about the meeting.</p>
            <p className="mt-1 text-xs">
              Click &quot;Ask in chat&quot; on a suggestion or type below.
            </p>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-zinc-300" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-zinc-700 text-zinc-100"
                  : "bg-zinc-800/80 text-zinc-200"
              )}
            >
              {msg.content === "" && msg.role === "assistant" ? (
                <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-zinc-300" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the meeting... (Enter to send)"
            rows={2}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isChatLoading}
            className="p-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isChatLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
            ) : (
              <Send className="w-4 h-4 text-zinc-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
