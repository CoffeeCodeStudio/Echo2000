import { useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { useDjTracks } from "@/hooks/useDjTracks";
import { cn } from "@/lib/utils";
import "./pixel-dj.css";

export function PixelDj({ compact = false }: { compact?: boolean }) {
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
      {/* Animated pixel DJ */}
      <div className="pixel-dj-booth">
        <div className={cn("pixel-dj-avatar", isPlaying && "pixel-dj-spinning")} />
        <div className={cn("pixel-dj-disc", isPlaying && "pixel-dj-disc-spin")} />
      </div>

      {/* Track info */}
      <div className="pixel-dj-info">
        <div className="pixel-dj-now-playing">
          <span className="pixel-dj-label">DJ Echo spelar</span>
          <span className="pixel-dj-title">{currentTrack?.title}</span>
          <span className="pixel-dj-artist">{currentTrack?.artist}</span>
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
      </div>
    </div>
  );
}
