"use client";

import { useRef, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { generateId } from "@/lib/transcript";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CHUNK_INTERVAL_MS = 30000; // 30 seconds

export default function MicRecorder() {
  const { isRecording, setIsRecording, addTranscriptEntry, settings } =
    useAppStore();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);

  const processChunk = useCallback(
    async (blob: Blob) => {
      if (!settings.groqApiKey || blob.size < 1000) return;
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const formData = new FormData();
        formData.append("audio", blob);
        formData.append("apiKey", settings.groqApiKey);
        formData.append("mimeType", mimeTypeRef.current);

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

  const flushChunks = useCallback(() => {
    if (chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
    chunksRef.current = [];
    processChunk(blob);
  }, [processChunk]);

  const startRecording = useCallback(async () => {
    if (!settings.groqApiKey) {
      alert("Please set your Groq API key in Settings first.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000); // collect data every 1s
      setIsRecording(true);

      // Flush every 30s
      intervalRef.current = setInterval(flushChunks, CHUNK_INTERVAL_MS);
    } catch (err) {
      console.error("[MicRecorder] start error:", err);
      alert(
        "Microphone access denied. Please allow microphone permissions and try again."
      );
    }
  }, [settings.groqApiKey, setIsRecording, flushChunks]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }

    // Flush remaining audio
    setTimeout(() => {
      flushChunks();
    }, 500);

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  }, [setIsRecording, flushChunks]);

  // Cleanup on unmount
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
