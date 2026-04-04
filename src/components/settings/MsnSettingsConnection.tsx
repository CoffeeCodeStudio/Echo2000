/**
 * Connection settings tab — shows real connection status from auth session.
 */
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function MsnSettingsConnection() {
  const { session } = useAuth();
  const [debugMode, setDebugMode] = useState(false);
  const isConnected = debugMode ? !session : !!session;

  return (
    <>
      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Anslutningsstatus</h3>
        <div className="border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">
              {isConnected ? "Ansluten" : "Frånkopplad"}
            </span>
          </div>
          <div className="space-y-1 text-[10px] text-gray-600 dark:text-gray-400">
            <p>Server: echo2000.lovable.app</p>
            <p>Protokoll: HTTPS / WebSocket</p>
            {isConnected && <p>Session aktiv</p>}
          </div>
        </div>
      </div>

      <button
        onClick={() => setDebugMode(!debugMode)}
        className="mt-2 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
      >
        🔧 Debug: {debugMode ? 'Simulerar frånkoppling' : 'Normal läge'}
      </button>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Proxy-inställningar</h3>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Echo Messenger ansluter direkt till servern. Ingen proxy behövs.
        </p>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Filöverföring</h3>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Filöverföring via chattfönstret kommer snart. Stöd för bilder och dokument upp till 10 MB planeras.
        </p>
      </div>
    </>
  );
}
