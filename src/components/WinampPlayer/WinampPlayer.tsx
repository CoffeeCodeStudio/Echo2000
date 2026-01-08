import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Settings, 
  Upload,
  Music,
  Palette,
  Zap,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MilkDropVisualizer } from "./MilkDropVisualizer";
import { WinampEqualizer } from "./WinampEqualizer";
import { WinampControls } from "./WinampControls";
import { useAudioAnalyzer, AudioData } from "@/hooks/useAudioAnalyzer";
import { useWinampSounds } from "@/hooks/useWinampSounds";

interface Track {
  name: string;
  artist: string;
  url: string;
  isRadio?: boolean;
}

interface RadioStation {
  id: string;
  name: string;
  url: string;
  genre: string;
}

interface WinampPlayerProps {
  onClose?: () => void;
  className?: string;
}

const RADIO_STATIONS: RadioStation[] = [
  { id: "starfm", name: "Star FM", url: "https://live-bauerse.sharp-stream.com/starfm_mp3", genre: "Rock/Pop" },
  { id: "nrj", name: "NRJ Sverige", url: "https://stream.nrj.se/nrj_se_mp3", genre: "Pop/Dance" },
  { id: "rixfm", name: "RIX FM", url: "https://live-bauerse.sharp-stream.com/rixfm_mp3", genre: "Pop" },
  { id: "mixmegapol", name: "Mix Megapol", url: "https://live-bauerse.sharp-stream.com/mixmegapol_mp3", genre: "Pop" },
  { id: "rockklassiker", name: "Rockklassiker", url: "https://live-bauerse.sharp-stream.com/rockklassiker_mp3", genre: "Classic Rock" },
  { id: "p3", name: "Sveriges Radio P3", url: "https://sverigesradio.se/topsy/direkt/164-hi-mp3.m3u", genre: "Hits" },
  { id: "bandit", name: "Bandit Rock", url: "https://live-bauerse.sharp-stream.com/banditrock_mp3", genre: "Rock" },
];

const VISUALIZATION_MODES = [
  { id: 0, name: "Waveform", icon: "〰️" },
  { id: 1, name: "Bars", icon: "📊" },
  { id: 2, name: "Psychedelic", icon: "🌀" },
  { id: 3, name: "Particles", icon: "✨" },
  { id: 4, name: "Circular", icon: "⭕" },
  { id: 5, name: "Mixed", icon: "🎆" },
];

const SKINS = [
  { id: "classic", name: "Classic Blue", primary: "#2a2a4a", accent: "#4a8aaa" },
  { id: "dark", name: "Midnight", primary: "#1a1a2a", accent: "#6a4a8a" },
  { id: "matrix", name: "Matrix", primary: "#0a1a0a", accent: "#00cc66" },
  { id: "sunset", name: "Sunset", primary: "#2a1a1a", accent: "#cc6633" },
  { id: "cyber", name: "Cyberpunk", primary: "#1a0a1a", accent: "#ff00ff" },
];

export function WinampPlayer({ onClose, className }: WinampPlayerProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [visualMode, setVisualMode] = useState(2);
  const [visualSpeed, setVisualSpeed] = useState(1);
  const [colorShift, setColorShift] = useState(0);
  const [currentSkin, setCurrentSkin] = useState(SKINS[0]);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRadio, setShowRadio] = useState(false);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number>();

  const { initializeAnalyzer, getAudioData, resumeContext, isInitialized } = useAudioAnalyzer();
  const { playSound, setEnabled: setSoundsActive } = useWinampSounds();

  // Play startup sound on mount
  useEffect(() => {
    if (soundsEnabled) {
      playSound("startup");
    }
  }, []);

  useEffect(() => {
    setSoundsActive(soundsEnabled);
  }, [soundsEnabled, setSoundsActive]);

  const updateAudioData = useCallback(() => {
    if (isPlaying) {
      const data = getAudioData();
      setAudioData(data);
    }
    animationRef.current = requestAnimationFrame(updateAudioData);
  }, [isPlaying, getAudioData]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateAudioData);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateAudioData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newTracks: Track[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("audio/")) {
        const url = URL.createObjectURL(file);
        const nameParts = file.name.replace(/\.[^/.]+$/, "").split(" - ");
        
        newTracks.push({
          name: nameParts.length > 1 ? nameParts[1] : nameParts[0],
          artist: nameParts.length > 1 ? nameParts[0] : "Unknown Artist",
          url,
        });
      }
    });

    if (newTracks.length > 0) {
      setPlaylist((prev) => [...prev, ...newTracks]);
      if (!currentTrack) {
        loadTrack(newTracks[0], 0);
      }
    }
  };

  const loadTrack = (track: Track, index: number) => {
    setCurrentTrack(track);
    setCurrentIndex(index);
    setIsRadioPlaying(track.isRadio || false);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
    }
  };

  const playRadioStation = async (station: RadioStation) => {
    const radioTrack: Track = {
      name: station.name,
      artist: station.genre,
      url: station.url,
      isRadio: true,
    };
    
    setCurrentTrack(radioTrack);
    setIsRadioPlaying(true);
    setShowRadio(false);
    
    if (audioRef.current) {
      audioRef.current.src = station.url;
      audioRef.current.load();
      
      if (!isInitialized) {
        initializeAnalyzer(audioRef.current);
      }
      
      await resumeContext();
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        playSound("play");
      } catch (e) {
        console.log("Could not play radio:", e);
      }
    }
  };

  const handlePlay = async () => {
    if (!audioRef.current) return;
    
    if (!isInitialized) {
      initializeAnalyzer(audioRef.current);
    }
    
    await resumeContext();
    await audioRef.current.play();
    setIsPlaying(true);
    playSound("play");
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    playSound("stop");
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    
    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    
    loadTrack(playlist[nextIndex], nextIndex);
    if (isPlaying) {
      setTimeout(() => handlePlay(), 100);
    }
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;
    
    let prevIndex: number;
    if (currentTime > 3) {
      // Restart current track if more than 3 seconds in
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }
    
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    }
    
    loadTrack(playlist[prevIndex], prevIndex);
    if (isPlaying) {
      setTimeout(() => handlePlay(), 100);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      playSound("seek");
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  };

  const handleButtonSound = () => {
    playSound("click");
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg overflow-hidden border-2 shadow-2xl transition-all duration-300",
        isMaximized ? "fixed inset-4 z-50" : "w-full max-w-md",
        className
      )}
      style={{
        backgroundColor: currentSkin.primary,
        borderColor: currentSkin.accent,
      }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Title bar */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ 
          background: `linear-gradient(to bottom, ${currentSkin.accent}40, ${currentSkin.primary})`,
          borderColor: `${currentSkin.accent}40`,
        }}
      >
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4" style={{ color: currentSkin.accent }} />
          <span className="text-sm font-bold tracking-wide">ECHO2000 PLAYER</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-red-500/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Visualizer */}
      <div className={cn(
        "relative transition-all duration-300",
        isMaximized ? "flex-1" : "h-48"
      )}>
        <MilkDropVisualizer
          audioData={audioData}
          isPlaying={isPlaying}
          mode={visualMode}
          speed={visualSpeed}
          colorShift={colorShift}
        />
        
        {/* Track info overlay */}
        {currentTrack && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded px-3 py-1.5">
            <p className="text-sm font-medium truncate">{currentTrack.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
        )}

        {/* Visualization mode buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          {VISUALIZATION_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setVisualMode(mode.id);
                handleButtonSound();
              }}
              title={mode.name}
              className={cn(
                "w-7 h-7 rounded text-sm flex items-center justify-center transition-all",
                visualMode === mode.id
                  ? "bg-white/30 scale-110"
                  : "bg-black/40 hover:bg-black/60"
              )}
            >
              {mode.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Equalizer display */}
      <div className="px-3 py-2">
        <WinampEqualizer audioData={audioData} isPlaying={isPlaying} />
      </div>

      {/* Controls */}
      <div className="px-3 pb-3">
        <WinampControls
          isPlaying={isPlaying}
          isRepeat={isRepeat}
          isShuffle={isShuffle}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onRepeatToggle={() => setIsRepeat(!isRepeat)}
          onShuffleToggle={() => setIsShuffle(!isShuffle)}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          onSeek={handleSeek}
          onButtonSound={handleButtonSound}
        />
      </div>

      {/* Action buttons */}
      <div 
        className="flex border-t"
        style={{ borderColor: `${currentSkin.accent}40` }}
      >
        <button
          onClick={() => {
            handleButtonSound();
            fileInputRef.current?.click();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 transition-colors hover:bg-white/5 border-r"
          style={{ borderColor: `${currentSkin.accent}40` }}
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm">Ladda upp</span>
        </button>
        
        <button
          onClick={() => {
            handleButtonSound();
            setShowRadio(!showRadio);
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 transition-colors hover:bg-white/5",
            showRadio && "bg-white/10"
          )}
        >
          <Radio className="w-4 h-4" />
          <span className="text-sm">Radio</span>
        </button>
      </div>

      {/* Radio stations panel */}
      {showRadio && (
        <div 
          className="border-t p-3 space-y-2"
          style={{ borderColor: `${currentSkin.accent}40` }}
        >
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4" style={{ color: currentSkin.accent }} />
            Radiokanaler
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {RADIO_STATIONS.map((station) => (
              <button
                key={station.id}
                onClick={() => {
                  handleButtonSound();
                  playRadioStation(station);
                }}
                className={cn(
                  "p-2 text-left rounded border transition-all hover:bg-white/10",
                  currentTrack?.name === station.name && isRadioPlaying
                    ? "bg-white/15 border-white/30"
                    : "border-white/10"
                )}
              >
                <p className="text-sm font-medium truncate">{station.name}</p>
                <p className="text-xs text-muted-foreground">{station.genre}</p>
                {currentTrack?.name === station.name && isPlaying && (
                  <span className="text-xs text-green-400 animate-pulse">▶ Live</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Playlist */}
      {playlist.length > 0 && (
        <div 
          className="max-h-32 overflow-y-auto border-t scrollbar-nostalgic"
          style={{ borderColor: `${currentSkin.accent}40` }}
        >
          {playlist.map((track, index) => (
            <button
              key={`${track.url}-${index}`}
              onClick={() => {
                handleButtonSound();
                loadTrack(track, index);
                handlePlay();
              }}
              className={cn(
                "w-full px-3 py-1.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2",
                currentIndex === index && "bg-white/5"
              )}
            >
              {currentIndex === index && isPlaying && (
                <span className="text-xs animate-pulse">▶</span>
              )}
              <span className="truncate flex-1">{track.artist} - {track.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div 
          className="border-t p-3 space-y-3"
          style={{ borderColor: `${currentSkin.accent}40` }}
        >
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Inställningar
          </h4>
          
          {/* Sounds toggle */}
          <label className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Retro-ljud
            </span>
            <button
              onClick={() => setSoundsEnabled(!soundsEnabled)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                soundsEnabled ? "bg-green-600" : "bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                  soundsEnabled ? "left-5" : "left-0.5"
                )}
              />
            </button>
          </label>

          {/* Visual speed */}
          <div className="space-y-1">
            <label className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Visualiseringshastighet
            </label>
            <input
              type="range"
              min={0.2}
              max={3}
              step={0.1}
              value={visualSpeed}
              onChange={(e) => setVisualSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Color shift */}
          <div className="space-y-1">
            <label className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Färgskiftning
            </label>
            <input
              type="range"
              min={0}
              max={360}
              value={colorShift}
              onChange={(e) => setColorShift(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Skins */}
          <div className="space-y-2">
            <label className="text-sm">Tema</label>
            <div className="flex flex-wrap gap-2">
              {SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => {
                    handleButtonSound();
                    setCurrentSkin(skin);
                  }}
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition-all",
                    currentSkin.id === skin.id
                      ? "ring-2 ring-white/50"
                      : "opacity-70 hover:opacity-100"
                  )}
                  style={{
                    backgroundColor: skin.primary,
                    borderColor: skin.accent,
                    color: skin.accent,
                  }}
                >
                  {skin.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
