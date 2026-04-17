import { type NextRequest, NextResponse } from "next/server";

const MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { message, fullTranscript, chatHistory, apiKey, customPrompt, expansionMode, suggestion, expansionPrompt } = body;

  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 400 });

  const transcriptBlock = fullTranscript ? `\n\nMeeting transcript:\n${fullTranscript}` : "";
  let systemContent: string;
  let userContent: string;
  let history: Array<{ role: string; content: string }> = [];

  if (expansionMode && suggestion) {
    systemContent = (expansionPrompt || "You are an AI meeting assistant. Expand on the suggestion using the meeting transcript. Use bullet points and be detailed.") + transcriptBlock;
    userContent = `Expand on this suggestion:\nType: ${suggestion.type}\nTitle: ${suggestion.title}\nPreview: ${suggestion.preview}`;
  } else {
    systemContent = (customPrompt || "You are an AI meeting assistant. Answer questions based on the meeting transcript. Be specific and reference what was actually said.") + transcriptBlock;
    userContent = message || "";
    history = Array.isArray(chatHistory) ? chatHistory : [];
  }

  const messages = [{ role: "system", content: systemContent }, ...history, { role: "user", content: userContent }];

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, stream: true, temperature: 0.7, max_tokens: 1024 }),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fetch failed" }, { status: 500 });
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    console.error("[chat] Groq error:", errText);
    return NextResponse.json({ error: `Groq error ${groqRes.status}: ${errText}` }, { status: 500 });
  }

  if (!groqRes.body) {
    return NextResponse.json({ error: "No response body from Groq" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const body2 = groqRes.body;
  const readable = new ReadableStream({
    async start(controller) {
      const reader = body2.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t || t === "data: [DONE]") continue;
            if (t.startsWith("data: ")) {
              try {
                const delta = JSON.parse(t.slice(6))?.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(encoder.encode(delta));
              } catch {
                // skip
              }
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
