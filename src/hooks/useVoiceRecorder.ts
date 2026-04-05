/**
 * @module useVoiceRecorder
 * MediaRecorder-based voice message recording with auto-stop at 120s.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const MAX_DURATION_MS = 120_000; // 2 minutes
const MIN_DURATION_MS = 1_000;   // 1 second

export function useVoiceRecorder(onSendMessage: (content: string) => Promise<any>) {
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopAndSend = useCallback(async () => {
    if (!mediaRecorderRef.current || !user) return;

    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    return new Promise<void>((resolve) => {
      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);

        const duration = Date.now() - startTimeRef.current;
        if (duration < MIN_DURATION_MS) {
          toast("För kort inspelning", { description: "Spela in minst 1 sekund" });
          resolve();
          return;
        }

        setUploading(true);
        const mimeType = recorder.mimeType || "audio/webm";
        const ext = mimeType.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const timestamp = Date.now();
        const path = `${user.id}/${timestamp}_voice.${ext}`;

        const { error } = await supabase.storage
          .from("chat-files")
          .upload(path, blob, { cacheControl: "3600", contentType: mimeType });

        if (error) {
          console.error("Voice upload error:", error);
          toast.error("Kunde inte ladda upp röstmeddelandet");
          setUploading(false);
          resolve();
          return;
        }

        const { data: urlData } = await supabase.storage
          .from("chat-files")
          .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

        if (!urlData?.signedUrl) {
          toast.error("Kunde inte generera URL för röstmeddelandet");
          setUploading(false);
          resolve();
          return;
        }

        await onSendMessage(`[voice url="${urlData.signedUrl}"][/voice]`);
        setUploading(false);
        resolve();
      };

      recorder.stop();
    });
  }, [user, onSendMessage]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.start();
      setRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(secs);
        if (secs >= MAX_DURATION_MS / 1000) {
          toggleRecording();
        }
      }, 500);
    } catch (err) {
      console.error("Mic access denied:", err);
      toast.error("Kunde inte komma åt mikrofonen");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    setElapsed(0);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    await stopAndSend();
  }, [stopAndSend]);

  const toggleRecording = useCallback(async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    recording,
    uploading,
    elapsed,
    formattedTime: formatTime(elapsed),
    toggleRecording,
  };
}
