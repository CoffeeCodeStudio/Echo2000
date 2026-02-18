import { useState } from "react";
import { ScribbleLobbyList } from "@/components/ScribbleLobbyList";
import { ScribbleGame } from "@/components/ScribbleGame";

export function GamesSection() {
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);

  if (activeLobbyId) {
    return <ScribbleGame lobbyId={activeLobbyId} onLeave={() => setActiveLobbyId(null)} />;
  }

  return <ScribbleLobbyList onJoinLobby={(id) => setActiveLobbyId(id)} />;
}
