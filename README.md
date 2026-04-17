# AI Meeting Assistant

A real-time AI meeting assistant that transcribes speech, generates intelligent suggestions, and provides a context-aware chat interface — all powered by Groq.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding Your Groq API Key

1. Go to [console.groq.com](https://console.groq.com) and create an API key
2. Click **Settings** in the top-right of the app
3. Paste your key in the "Groq API Key" field and click **Save Settings**

The key is stored in `localStorage` only — never sent to any server other than Groq directly.

## Architecture

```
app/
  page.tsx              # Main 3-column layout
  settings/page.tsx     # Settings UI
  api/
    transcribe/         # Whisper Large V3 via Groq
    suggest/            # Generates 3 suggestions from recent transcript
    chat/               # Streaming chat + suggestion expansion

components/
  MicRecorder.tsx       # Web Audio API + MediaRecorder, chunks every 30s
  TranscriptPanel.tsx   # Left panel — live transcript with timestamps
  SuggestionsPanel.tsx  # Middle panel — auto-refreshing suggestion cards
  SuggestionCard.tsx    # Individual card with expand + send-to-chat
  ChatPanel.tsx         # Right panel — streaming chat interface
  ExportButton.tsx      # JSON session export

lib/
  groq.ts               # Fetch wrapper for Groq API (chat + transcription)
  prompts.ts            # All prompt templates + message builders
  transcript.ts         # Token estimation, context windowing, hashing

store/
  useAppStore.ts        # Zustand store (persists settings to localStorage)

types/
  index.ts              # Shared TypeScript types
```

## Prompt Strategy

**Suggestions** use only the last ~1500 tokens of transcript to stay focused on recent context. The prompt enforces exactly 3 suggestions with diverse types (question, talking_point, answer, fact_check, clarification). A quality check retries once if the output is malformed.

**Expansion** uses the full transcript (up to ~6000 tokens) to give detailed, structured responses with bullets and actionable content.

**Chat** uses the full transcript as system context so every answer is grounded in what was actually said in the meeting.

## Key Tradeoffs

- **Client-side API key**: Stored in localStorage for simplicity. For production, use server-side sessions or a backend proxy.
- **30s audio chunks**: Balances transcription latency vs. cost. Shorter chunks = more API calls; longer = more delay.
- **No WebSocket**: Uses polling + interval-based suggestions instead of a persistent connection. Simpler to deploy on Vercel.
- **Transcript hashing**: Prevents duplicate suggestion calls when transcript hasn't changed.
- **Streaming chat**: Uses ReadableStream passthrough from Groq → client for low-latency responses.

## Deployment (Vercel)

```bash
vercel deploy
```

No environment variables required — the API key is managed client-side via Settings.

## Models Used

| Task | Model |
|------|-------|
| Transcription | `whisper-large-v3` |
| Suggestions + Chat | `llama3-70b-8192` |
