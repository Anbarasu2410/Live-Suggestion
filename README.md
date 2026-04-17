# 🧠 AI Meeting Assistant

A real-time AI-powered meeting assistant that transcribes your speech, generates intelligent suggestions, and provides a context-aware chat interface — all powered by [Groq](https://groq.com).

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)
![Groq](https://img.shields.io/badge/Groq-Whisper%20%2B%20Llama-orange)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

---

## ✨ Features

- 🎙️ **Live transcription** — captures microphone audio in 30-second chunks and transcribes using Groq Whisper Large V3
- 💡 **Auto suggestions** — generates exactly 3 context-aware suggestions every 30 seconds while recording
- 🔍 **Suggestion expansion** — click any suggestion to get a detailed, structured response
- 💬 **Context-aware chat** — full transcript loaded as context for every chat message
- 📤 **Session export** — download full transcript, suggestions, and chat history as JSON
- ⚙️ **Customizable prompts** — edit all AI prompts and context window sizes from Settings

---

## 🖥️ Demo

> Record → Transcribe → Suggestions → Chat → Export

3-column layout:

| Left | Middle | Right |
|------|--------|-------|
| Live Transcript | AI Suggestions | Chat Interface |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com)

### Installation

```bash
git clone https://github.com/Anbarasu2410/Live-Suggestion.git
cd Live-Suggestion/ai-meeting-assistant
npm install
npm run dev
```

Open [https://localhost:3000](https://localhost:3000) in your browser.

> The app runs on HTTPS locally to enable microphone access. Accept the self-signed certificate warning on first load.

### Setting your API Key

1. Click **Settings** in the top-right corner
2. Paste your Groq API key (`gsk_...`)
3. Click **Save Settings**

The key is stored in your browser's `localStorage` only — never sent to any third party.

---

## 🏗️ Architecture

```
ai-meeting-assistant/
├── app/
│   ├── page.tsx                  # Main 3-column layout
│   ├── settings/page.tsx         # Settings UI
│   └── api/
│       ├── transcribe/route.ts   # Whisper Large V3 transcription
│       ├── suggest/route.ts      # 3 suggestions from recent transcript
│       └── chat/route.ts         # Streaming chat + suggestion expansion
├── components/
│   ├── MicRecorder.tsx           # Web Audio API, 30s rolling segments
│   ├── TranscriptPanel.tsx       # Left panel — timestamped transcript
│   ├── SuggestionsPanel.tsx      # Middle panel — auto-refreshing cards
│   ├── SuggestionCard.tsx        # Expand + send-to-chat per suggestion
│   ├── ChatPanel.tsx             # Right panel — streaming chat
│   └── ExportButton.tsx          # JSON session export
├── lib/
│   ├── groq.ts                   # Groq API fetch wrapper
│   ├── prompts.ts                # All prompt templates
│   ├── transcript.ts             # Token windowing + hash dedup
│   └── utils.ts                  # cn() utility
├── store/
│   └── useAppStore.ts            # Zustand store (settings persisted)
└── types/
    └── index.ts                  # Shared TypeScript types
```

---

## 🤖 AI Models

| Task | Model |
|------|-------|
| Speech Transcription | `whisper-large-v3` |
| Suggestions + Chat | `llama-3.3-70b-versatile` |

---

## 🧠 Prompt Strategy

### Live Suggestions
- Uses only the last ~1500 tokens of transcript (recent context)
- Enforces exactly 3 suggestions with diverse types
- Types: `question`, `talking_point`, `answer`, `fact_check`, `clarification`
- Retries once if output is malformed

### Suggestion Expansion
- Uses full transcript (up to ~6000 tokens)
- Returns structured bullet-point response (200–400 words)

### Chat
- Full transcript injected as system context
- Every answer is grounded in what was actually said
- Streaming responses for low latency

---

## ⚡ Performance

- Suggestions latency: < 2.5s
- Chat streaming: real-time token-by-token
- Duplicate prevention: transcript hash check before each suggestion call
- Audio: 30s rolling segments with complete blob per segment (no header corruption)

---

## 🔌 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | TailwindCSS 4 |
| State | Zustand (localStorage persist) |
| AI | Groq API (Whisper + Llama) |
| Audio | Web Audio API + MediaRecorder |
| Deployment | Vercel |

---

## 📦 Export Format

```json
{
  "exportedAt": "2025-01-01T10:00:00.000Z",
  "transcript": [
    { "id": "...", "text": "...", "timestamp": 1234567890 }
  ],
  "suggestionBatches": [
    {
      "id": "...",
      "timestamp": 1234567890,
      "suggestions": [
        { "type": "question", "title": "...", "preview": "..." }
      ]
    }
  ],
  "chatHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

---

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import `Live-Suggestion` repo
4. Set **Root Directory** to `ai-meeting-assistant`
5. Click **Deploy**

Vercel provides automatic HTTPS — microphone works without any workarounds.

### Environment Variables

No server-side environment variables required. The Groq API key is managed client-side via the Settings page.

---

## 🔒 Security Notes

- API key stored in `localStorage` only (client-side)
- No keys are logged or stored server-side
- For production teams, consider adding a backend proxy to avoid exposing keys in the browser

---

## 🛠️ Tradeoffs

| Decision | Reason |
|----------|--------|
| Client-side API key | Simplicity — no auth backend needed |
| 30s audio chunks | Balance between latency and transcription quality |
| No WebSocket | Simpler Vercel deployment with polling + intervals |
| Transcript hashing | Prevents duplicate suggestion API calls |
| Webpack over Turbopack | Turbopack had workspace root detection issues in monorepo layout |

---

## 📄 License

MIT
