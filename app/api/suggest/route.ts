import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/transcript";
import { Suggestion, SuggestionBatch } from "@/types";

const GROQ_API_BASE = "https://api.groq.com/openai/v1";
const CHAT_MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recentTranscript, transcriptHash, apiKey, customPrompt } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "No API key" }, { status: 400 });
    }
    if (!recentTranscript?.trim()) {
      return NextResponse.json({ error: "No transcript" }, { status: 400 });
    }

    const systemPrompt =
      customPrompt ||
      `You are an AI meeting assistant. Generate exactly 3 suggestions based on the meeting transcript.
Respond with ONLY a JSON object, no markdown, no explanation, no code blocks.
Use this exact format: {"suggestions":[{"type":"question","title":"title here","preview":"preview here"},{"type":"talking_point","title":"title here","preview":"preview here"},{"type":"answer","title":"title here","preview":"preview here"}]}
Types allowed: question, talking_point, answer, fact_check, clarification`;

    const groqRes = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Meeting transcript:\n\n${recentTranscript}\n\nReturn ONLY the JSON with 3 suggestions.`,
          },
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("[suggest] Groq error:", err);
      return NextResponse.json({ error: `Groq error: ${err}` }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content || "";
    console.log("[suggest] raw:", content);

    // Parse JSON — strip markdown code blocks if present
    let parsed: unknown = null;
    try {
      const clean = content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch (e) {
      console.error("[suggest] parse error:", e, "content:", content);
    }

    const p = parsed as { suggestions?: Array<{ type: string; title: string; preview: string }> };
    if (!p?.suggestions || !Array.isArray(p.suggestions) || p.suggestions.length === 0) {
      console.error("[suggest] invalid structure:", parsed);
      return NextResponse.json({ error: "Invalid suggestion structure" }, { status: 422 });
    }

    // Take up to 3, pad if fewer
    const raw = p.suggestions.slice(0, 3);
    const batchId = generateId();

    const batch: SuggestionBatch = {
      id: batchId,
      timestamp: Date.now(),
      transcriptHash,
      suggestions: raw.map((s) => ({
        id: generateId(),
        type: (s.type || "question") as Suggestion["type"],
        title: s.title || "Suggestion",
        preview: s.preview || "",
        timestamp: Date.now(),
        batchId,
      })),
    };

    return NextResponse.json({ batch });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    console.error("[suggest] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
