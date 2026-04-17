import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/groq";
import { buildSuggestionMessages } from "@/lib/prompts";
import { Suggestion, SuggestionBatch } from "@/types";
import { generateId } from "@/lib/transcript";

export const runtime = "nodejs";
export const maxDuration = 30;

function isValidSuggestions(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.suggestions) || d.suggestions.length !== 3) return false;
  return d.suggestions.every(
    (s: unknown) =>
      s &&
      typeof s === "object" &&
      typeof (s as Record<string, unknown>).type === "string" &&
      typeof (s as Record<string, unknown>).title === "string" &&
      typeof (s as Record<string, unknown>).preview === "string" &&
      (s as Record<string, unknown>).title !== "" &&
      (s as Record<string, unknown>).preview !== ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recentTranscript, transcriptHash, apiKey, customPrompt } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "No API key provided" }, { status: 400 });
    }
    if (!recentTranscript?.trim()) {
      return NextResponse.json({ error: "No transcript content" }, { status: 400 });
    }

    const messages = buildSuggestionMessages(recentTranscript, customPrompt);

    let parsed: unknown = null;
    let attempts = 0;

    while (attempts < 2) {
      attempts++;
      try {
        const res = await groqChat(apiKey, messages, {
          temperature: 0.7,
          maxTokens: 512,
        });
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }

        if (isValidSuggestions(parsed)) break;
        parsed = null;
      } catch {
        if (attempts >= 2) throw new Error("Failed to generate valid suggestions");
      }
    }

    if (!parsed || !isValidSuggestions(parsed)) {
      return NextResponse.json(
        { error: "Could not generate quality suggestions" },
        { status: 422 }
      );
    }

    const batchId = generateId();
    const batch: SuggestionBatch = {
      id: batchId,
      timestamp: Date.now(),
      transcriptHash,
      suggestions: (parsed as { suggestions: Array<{ type: string; title: string; preview: string }> }).suggestions.map(
        (s) => ({
          id: generateId(),
          type: s.type as Suggestion["type"],
          title: s.title,
          preview: s.preview,
          timestamp: Date.now(),
          batchId,
        })
      ),
    };

    return NextResponse.json({ batch });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Suggestion generation failed";
    console.error("[suggest]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
