/**
 * @module useBotCall
 * Simulates a voice call with a bot contact using Web Speech API (TTS).
 * When a user "calls" a bot, this hook auto-answers after a delay,
 * generates responses via the bot-respond edge function, and speaks them.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CallType } from "@/hooks/useWebRTC";

interface BotCallState {
  active: boolean;
  botName: string;
  duration: number;
  isSpeaking: boolean;
}

interface UseBotCallOptions {
  userId: string;
  onBotMessage?: (text: string) => void;
}

// Conversation prompts BotAdam uses during calls
const CALL_GREETINGS = [
  "Tjena! Kul att du ringde, vad händer?",
  "Hej! Aa jag sitter ba här, vad tänkte du?",
  "Tja! Skönt att snacka lite, hur e läget?",
  "Yo! Perfekt timing, jag va precis ledig haha",
];

const CALL_RESPONSES = [
  "Haha aa exakt, jag fattar vad du menar!",
  "Mm, det e typ det bästa med Echo2000 tbh, nostalgin liksom",
  "Aa men vi hade det bra förr, MSN-tider va nåt annat",
  "Nä men seriöst, jag sitter och chillar, du då?",
  "Hah, aa det e la så det e... men det e mysigt ändå",
  "Mm, jag tänkte faktiskt på det igår, random",
  "Aa precis, det e nice att kunna snacka lite sådär ba",
  "Haha, ja du vet, vuxenlivet e inte alltid action direkt",
  "Jag satt och lyssnade på Kent hela kvällen igår, classic",
  "Aa men typ... det e ändå kul att hänga här, nostalgi on max haha",
];

export function useBotCall({ userId, onBotMessage }: UseBotCallOptions) {
  const [botCall, setBotCall] = useState<BotCallState>({
    active: false,
    botName: "",
    duration: 0,
    isSpeaking: false,
  });
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseIndexRef = useRef(0);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "sv-SE";
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    
    // Try to find a Swedish voice
    const voices = window.speechSynthesis.getVoices();
    const svVoice = voices.find(v => v.lang.startsWith("sv")) || voices[0];
    if (svVoice) utterance.voice = svVoice;
    
    utterance.onstart = () => setBotCall(prev => ({ ...prev, isSpeaking: true }));
    utterance.onend = () => setBotCall(prev => ({ ...prev, isSpeaking: false }));
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    onBotMessage?.(text);
  }, [onBotMessage]);

  const scheduleNextResponse = useCallback(() => {
    const delay = 8000 + Math.random() * 12000; // 8-20 seconds between responses
    responseTimerRef.current = setTimeout(() => {
      if (!botCall.active) return;
      const idx = responseIndexRef.current % CALL_RESPONSES.length;
      responseIndexRef.current++;
      speak(CALL_RESPONSES[idx]);
      scheduleNextResponse();
    }, delay);
  }, [botCall.active, speak]);

  const startBotCall = useCallback((botName: string, _callType: CallType) => {
    // Simulate ringing delay (1-2 seconds), then bot "answers"
    setTimeout(() => {
      setBotCall({
        active: true,
        botName,
        duration: 0,
        isSpeaking: false,
      });

      // Start call duration timer
      timerRef.current = setInterval(() => {
        setBotCall(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      // Bot greets after a short moment
      setTimeout(() => {
        const greeting = CALL_GREETINGS[Math.floor(Math.random() * CALL_GREETINGS.length)];
        speak(greeting);

        // Schedule ongoing responses
        responseIndexRef.current = 0;
        const scheduleNext = () => {
          const delay = 8000 + Math.random() * 12000;
          responseTimerRef.current = setTimeout(() => {
            setBotCall(prev => {
              if (!prev.active) return prev;
              const idx = responseIndexRef.current % CALL_RESPONSES.length;
              responseIndexRef.current++;
              speak(CALL_RESPONSES[idx]);
              scheduleNext();
              return prev;
            });
          }, delay);
        };
        scheduleNext();
      }, 1500);
    }, 1500);
  }, [speak]);

  const endBotCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setBotCall({ active: false, botName: "", duration: 0, isSpeaking: false });
  }, []);

  return {
    botCall,
    startBotCall,
    endBotCall,
  };
}
