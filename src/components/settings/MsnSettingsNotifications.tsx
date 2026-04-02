/**
 * Notifications settings tab — toggle alerts.
 * Persists to localStorage.
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "echo-settings-notifications";

function loadNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { msgAlerts: true, nudgeAlerts: true, signInAlerts: true, mailAlerts: true };
}

export function MsnSettingsNotifications() {
  const [settings, setSettings] = useState(loadNotifications);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggle = (key: string) =>
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Meddelanden</h3>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={settings.msgAlerts}
            onClick={() => toggle("msgAlerts")}
          />
          Visa avisering vid nytt meddelande
        </label>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={settings.nudgeAlerts}
            onClick={() => toggle("nudgeAlerts")}
          />
          Visa avisering vid nudge
        </label>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Kontakter</h3>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={settings.signInAlerts}
            onClick={() => toggle("signInAlerts")}
          />
          Visa när en kontakt loggar in
        </label>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Mejl</h3>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={settings.mailAlerts}
            onClick={() => toggle("mailAlerts")}
          />
          Visa avisering vid nytt mejl
        </label>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Förhandsvisning</h3>
        <p className="msn-settings-hint">
          Aviseringar visas som en kort popup i hörnet av skärmen, precis som i Echo Messenger.
        </p>
      </div>
    </>
  );
}
