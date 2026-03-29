import { useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, List, User } from "lucide-react";
import { useDjTracks } from "@/hooks/useDjTracks";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import "./pixel-dj.css";

const DJ_USERNAME = "El-Magnifico";
const DJ_AVATAR_URL = null; // Will be fetched from tracks' added_by profile

export function PixelDj({ compact = false }: { compact?: boolean }) {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const navigate = useNavigate();
  const {
    tracks, currentTrack, isPlaying, progress, duration,
    togglePlay, nextTrack, prevTrack, volume, changeVolume,
  } = useDjTracks();

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-4 opacity-60">
        <div className="pixel-dj-idle w-10 h-10 mb-2" />
        <p className="text-xs text-muted-foreground font-mono">DJ Echo laddar spellistan...</p>
      </div>
    );
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className={cn("pixel-dj-container", compact && "pixel-dj-compact")}>
      {/* DJ credit header */}
      <div className="pixel-dj-credit">
        <button
          onClick={() => navigate(`/profile/${DJ_USERNAME}`)}
          className="pixel-dj-credit-link"
          title={`Besök ${DJ_USERNAME}s profil`}
        >
          <DjAvatar />
          <span>made by <strong>{DJ_USERNAME}</strong></span>
        </button>
        <button
          onClick={() => setShowPlaylist(!showPlaylist)}
          className={cn("pixel-dj-btn pixel-dj-btn-list", showPlaylist && "pixel-dj-btn-active")}
          aria-label="Visa spellista"
        >
          <List className="w-3 h-3" />
        </button>
      </div>

      {/* Now playing */}
      <div className="pixel-dj-now-row">
        <div className={cn("pixel-dj-disc-mini", isPlaying && "pixel-dj-disc-spin")} />
        <div className="pixel-dj-info">
          <span className="pixel-dj-title">{currentTrack?.title}</span>
          <span className="pixel-dj-artist">{currentTrack?.artist}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="pixel-dj-progress">
        <div className="pixel-dj-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Controls */}
      <div className="pixel-dj-controls">
        <button onClick={prevTrack} className="pixel-dj-btn" aria-label="Föregående">
          <SkipBack className="w-3 h-3" />
        </button>
        <button onClick={togglePlay} className="pixel-dj-btn pixel-dj-btn-play" aria-label={isPlaying ? "Pausa" : "Spela"}>
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button onClick={nextTrack} className="pixel-dj-btn" aria-label="Nästa">
          <SkipForward className="w-3 h-3" />
        </button>
        {!compact && (
          <div className="pixel-dj-volume">
            <Volume2 className="w-3 h-3 text-muted-foreground" />
            <input
              type="range" min="0" max="1" step="0.05"
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="pixel-dj-volume-slider"
            />
          </div>
        )}
      </div>

      {/* Playlist */}
      {showPlaylist && (
        <div className="pixel-dj-playlist">
          <div className="pixel-dj-playlist-header">
            <span>🎵 Spellista ({tracks.length} låtar)</span>
          </div>
          <div className="pixel-dj-playlist-list">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className={cn(
                  "pixel-dj-playlist-item",
                  currentTrack?.id === track.id && "pixel-dj-playlist-active"
                )}
              >
                <span className="pixel-dj-playlist-num">{i + 1}.</span>
                <span className="pixel-dj-playlist-name">{track.title}</span>
                <span className="pixel-dj-playlist-artist">{track.artist}</span>
                {currentTrack?.id === track.id && isPlaying && (
                  <span className="pixel-dj-playlist-playing">▶</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DjAvatar() {
  // Fetch El-Magnifico's avatar from profiles
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("username", DJ_USERNAME)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          setLoaded(true);
        });
    });
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={DJ_USERNAME}
        className="pixel-dj-profile-pic"
      />
    );
  }

  return <User className="w-4 h-4 text-primary" />;
}
