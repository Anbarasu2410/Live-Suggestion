"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  DEFAULT_SUGGESTION_PROMPT,
  DEFAULT_EXPANSION_PROMPT,
  DEFAULT_CHAT_PROMPT,
} from "@/lib/prompts";
import { ArrowLeft, Save, RotateCcw, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore();
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({ ...settings });

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults = {
      suggestionPrompt: DEFAULT_SUGGESTION_PROMPT,
      expansionPrompt: DEFAULT_EXPANSION_PROMPT,
      chatPrompt: DEFAULT_CHAT_PROMPT,
      suggestionContextTokens: 1500,
      chatContextTokens: 6000,
    };
    setForm((f) => ({ ...f, ...defaults }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* API Key */}
          <section className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-200 mb-1">
              Groq API Key
            </h2>
            <p className="text-xs text-zinc-500 mb-3">
              Get your key at{" "}
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                console.groq.com
              </a>
              . Stored in localStorage only.
            </p>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={form.groqApiKey}
                onChange={(e) =>
                  setForm((f) => ({ ...f, groqApiKey: e.target.value }))
                }
                placeholder="gsk_..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </section>

          {/* Context Windows */}
          <section className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">
              Context Windows
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">
                  Suggestion context (tokens)
                </label>
                <input
                  type="number"
                  value={form.suggestionContextTokens}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      suggestionContextTokens: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">
                  Chat context (tokens)
                </label>
                <input
                  type="number"
                  value={form.chatContextTokens}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      chatContextTokens: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          </section>

          {/* Prompts */}
          {[
            {
              key: "suggestionPrompt" as const,
              label: "Live Suggestions Prompt",
              desc: "Controls how suggestions are generated from recent transcript.",
            },
            {
              key: "expansionPrompt" as const,
              label: "Suggestion Expansion Prompt",
              desc: "Controls how suggestions are expanded into detailed responses.",
            },
            {
              key: "chatPrompt" as const,
              label: "Chat System Prompt",
              desc: "System prompt for the chat assistant.",
            },
          ].map(({ key, label, desc }) => (
            <section
              key={key}
              className="bg-zinc-900 rounded-xl p-5 border border-zinc-800"
            >
              <h2 className="text-sm font-semibold text-zinc-200 mb-1">
                {label}
              </h2>
              <p className="text-xs text-zinc-500 mb-3">{desc}</p>
              <textarea
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                rows={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500 resize-y"
              />
            </section>
          ))}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              {saved ? "Saved!" : "Save Settings"}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Prompts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
