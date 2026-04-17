"use client";

import { useRef, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { generateId } from "@/lib/transcript";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

const CHUNK_INTERVAL_MS = 30000; // 30 seconds

export default function MicRecorder() {
  const { isRecording, setIsRecording, addTranscriptEntry, settings } =
    useAppStore();

  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);

  // We keep a rolling MediaRecorder — stop/restart every 30s to get a complete blob
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  const transcribeBlob = useCallback(
    async (blob: Blob) => {
      if (!settings.groqApiKey || blob.size < 3000) return;
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const ext = mimeTypeRef.current.includes("ogg") ? "ogg" : "webm";
        const formData = new FormData();
        // Filename with extension is critical for Groq Whisper
        formData.append("file", blob, `recording.${ext}`);
        formData.append("model", "whisper-large-v3");
        formData.append("response_format", "json");
        formData.append("language", "en");
        formData.append("apiKey", settings.groqApiKey);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (data.text?.trim()) {
          addTranscriptEntry({
            id: generateId(),
            text: data.text.trim(),
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.error("[MicRecorder] transcription error:", err);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [settings.groqApiKey, addTranscriptEntry]
  );

  const startSegment = useCallback(() => {
    if (!streamRef.current) return;

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: mimeTypeRef.current,
    });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeTypeRef.current });
      transcribeBlob(blob);
    };

    recorder.start();
  }, [transcribeBlob]);

  const stopSegment = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!settings.groqApiKey) {
      alert("Please set your Groq API key in Settings first.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // Pick best supported mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg;codecs=opus";

      mimeTypeRef.current = mimeType;

      setIsRecording(true);
      startSegment();

      // Every 30s: stop current segment (triggers transcription) then start new one
      intervalRef.current = setInterval(() => {
        stopSegment();
        setTimeout(startSegment, 300);
      }, CHUNK_INTERVAL_MS);
    } catch (err) {
      console.error("[MicRecorder] start error:", err);
      alert("Microphone access denied. Please allow microphone permissions.");
    }
  }, [settings.groqApiKey, setIsRecording, startSegment, stopSegment]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopSegment();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  }, [setIsRecording, stopSegment]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
        isRecording
          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
          : "bg-emerald-600 hover:bg-emerald-700 text-white"
      )}
    >
      {isRecording ? (
        <>
          <MicOff className="w-4 h-4" />
          Stop Recording
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          Start Recording
        </>
      )}
    </button>
  );
}
