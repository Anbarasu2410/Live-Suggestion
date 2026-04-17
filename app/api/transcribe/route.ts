import { NextRequest, NextResponse } from "next/server";
import { groqTranscribe } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as Blob | null;
    const apiKey = formData.get("apiKey") as string | null;
    const mimeType = (formData.get("mimeType") as string) || "audio/webm";

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "No API key provided" }, { status: 400 });
    }

    const text = await groqTranscribe(apiKey, audio, mimeType);

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    console.error("[transcribe]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
