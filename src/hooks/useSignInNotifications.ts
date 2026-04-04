/**
 * @module useSignInNotifications
 * Shows toast notifications when friends come online, using presence sync events.
 * Debounces per-contact to avoid duplicate toasts on reconnects.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useMsnSounds } from "./useMsnSounds";

type SoundType = "message" | "nudge" | "online" | "offline" | "send" | "error" | "login";

const NOTIFICATION_STORAGE_KEY = "echo-settings-notifications";
const DEBOUNCE_MS = 60_000; // 1 minute per contact

function getNotificationSettings() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { signInAlerts: true };
}

interface ContactInfo {
  id: string;
  name: string;
  avatar?: string;
}

/**
 * Call this hook once (e.g. in SharedLayout or a top-level component).
 * Pass the current online user map and a list of friend contacts.
 */
export function useSignInNotifications(
  onlineUsers: Map<string, string>, // userId → status
  contacts: ContactInfo[]
) {
  const { playSound } = useMsnSounds();
  const previousOnlineRef = useRef<Set<string>>(new Set());
  const lastNotifiedRef = useRef<Map<string, number>>(new Map());
  const initialSyncRef = useRef(true);

  useEffect(() => {
    // Skip the very first sync to avoid toasting everyone already online
    if (initialSyncRef.current) {
      const initialSet = new Set<string>();
      for (const [userId, status] of onlineUsers) {
        if (status === "online" || status === "away") {
          initialSet.add(userId);
        }
      }
      previousOnlineRef.current = initialSet;
      initialSyncRef.current = false;
      return;
    }

    const settings = getNotificationSettings();
    if (!settings.signInAlerts) return;

    const now = Date.now();
    const currentOnline = new Set<string>();

    for (const [userId, status] of onlineUsers) {
      if (status === "online" || status === "away") {
        currentOnline.add(userId);
      }
    }

    // Find newly online users
    for (const userId of currentOnline) {
      if (!previousOnlineRef.current.has(userId)) {
        // This user just came online
        const lastNotified = lastNotifiedRef.current.get(userId) || 0;
        if (now - lastNotified < DEBOUNCE_MS) continue;

        const contact = contacts.find((c) => c.id === userId);
        if (!contact) continue;

        lastNotifiedRef.current.set(userId, now);
        playSound("online" as SoundType);
        toast(`${contact.name} loggade in`, {
          description: "Din vän är nu online",
          duration: 4000,
        });
      }
    }

    previousOnlineRef.current = currentOnline;
  }, [onlineUsers, contacts, playSound]);
}
