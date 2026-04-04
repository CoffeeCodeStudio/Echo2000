/**
 * @module useSignInNotifications
 * Shows toast notifications when friends come online or go offline,
 * using presence sync events. Debounces per-contact to avoid duplicate toasts.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useMsnSounds } from "./useMsnSounds";

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
 * Call this hook once (e.g. in MsnContactList).
 * Pass the current online user map and a list of friend contacts.
 */
export function useSignInNotifications(
  onlineUsers: Map<string, string>,
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

    // Find newly online users (sign-in)
    for (const userId of currentOnline) {
      if (!previousOnlineRef.current.has(userId)) {
        const lastNotified = lastNotifiedRef.current.get(userId) || 0;
        if (now - lastNotified < DEBOUNCE_MS) continue;

        const contact = contacts.find((c) => c.id === userId);
        if (!contact) continue;

        lastNotifiedRef.current.set(userId, now);
        playSound("online");
        toast(`${contact.name} loggade in`, {
          description: "Din vän är nu online",
          duration: 4000,
        });
      }
    }

    // Find users who went offline (sign-out)
    for (const userId of previousOnlineRef.current) {
      if (!currentOnline.has(userId)) {
        const lastNotified = lastNotifiedRef.current.get(userId) || 0;
        if (now - lastNotified < DEBOUNCE_MS) continue;

        const contact = contacts.find((c) => c.id === userId);
        if (!contact) continue;

        lastNotifiedRef.current.set(userId, now);
        playSound("offline");
        toast(`${contact.name} loggade ut`, {
          description: "Din vän är nu offline",
          duration: 4000,
        });
      }
    }

    previousOnlineRef.current = currentOnline;
  }, [onlineUsers, contacts, playSound]);
}
