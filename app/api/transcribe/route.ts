import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const apiKey = formData.get("apiKey") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "No API key provided" }, { status: 400 });
    }

    // Determine extension from file name if available
    const fileName = (file as File).name || "recording.webm";
    const ext = fileName.endsWith(".ogg") ? "ogg" : "webm";

    const groqForm = new FormData();
    groqForm.append(
      "file",
      new Blob([await file.arrayBuffer()], { type: `audio/${ext}` }),
      `recording.${ext}`
    );
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("response_format", "json");
    groqForm.append("language", "en");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq transcription error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    console.error("[transcribe]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
