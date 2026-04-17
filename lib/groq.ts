const GROQ_API_BASE = "https://api.groq.com/openai/v1";
const TRANSCRIPTION_MODEL = "whisper-large-v3";
const CHAT_MODEL = "llama-3.3-70b-versatile";

export async function groqChat(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  options: { stream?: boolean; temperature?: number; maxTokens?: number } = {}
) {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      stream: options.stream ?? false,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error ${response.status}: ${error}`);
  }

  return response;
}

export async function groqTranscribe(
  apiKey: string,
  audioBlob: Blob,
  mimeType: string
): Promise<string> {
  const formData = new FormData();
  const ext = mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("ogg")
    ? "ogg"
    : "wav";
  formData.append("file", audioBlob, `audio.${ext}`);
  formData.append("model", TRANSCRIPTION_MODEL);
  formData.append("response_format", "json");
  formData.append("language", "en");

  const response = await fetch(
    `${GROQ_API_BASE}/audio/transcriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq transcription error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.text || "";
}
