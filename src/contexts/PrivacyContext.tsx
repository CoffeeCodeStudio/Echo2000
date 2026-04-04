import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface PrivacySettings {
  allowAll: boolean;
  showOnline: boolean;
  showActivity: boolean;
}

const STORAGE_KEY = "echo-settings-privacy";

const defaultSettings: PrivacySettings = {
  allowAll: true,
  showOnline: true,
  showActivity: true,
};

function loadPrivacy(): PrivacySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

const PrivacyContext = createContext<{
  settings: PrivacySettings;
  updateSettings: (updates: Partial<PrivacySettings>) => void;
}>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PrivacySettings>(loadPrivacy);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<PrivacySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <PrivacyContext.Provider value={{ settings, updateSettings }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyContext);
