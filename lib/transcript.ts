import { TranscriptEntry } from "@/types";

// Rough token estimate: 1 token ≈ 4 chars
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function getRecentTranscript(
  entries: TranscriptEntry[],
  maxTokens: number = 1500
): string {
  if (entries.length === 0) return "";

  const texts: string[] = [];
  let tokenCount = 0;

  // Walk backwards to get most recent
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    const line = `[${formatTime(entry.timestamp)}] ${entry.text}`;
    const tokens = estimateTokens(line);

    if (tokenCount + tokens > maxTokens) break;

    texts.unshift(line);
    tokenCount += tokens;
  }

  return texts.join("\n");
}

export function getFullTranscript(
  entries: TranscriptEntry[],
  maxTokens: number = 6000
): string {
  if (entries.length === 0) return "";

  const texts: string[] = [];
  let tokenCount = 0;

  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    const line = `[${formatTime(entry.timestamp)}] ${entry.text}`;
    const tokens = estimateTokens(line);

    if (tokenCount + tokens > maxTokens) break;

    texts.unshift(line);
    tokenCount += tokens;
  }

  return texts.join("\n");
}

export function hashTranscript(entries: TranscriptEntry[]): string {
  if (entries.length === 0) return "";
  const last = entries[entries.length - 1];
  return `${entries.length}-${last.id}-${last.timestamp}`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
