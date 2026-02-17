import { useEffect, useRef, useState } from "react";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Users,
  Maximize2, Minimize2
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";
import type { CallType } from "@/hooks/useWebRTC";

interface CallWindowProps {
  callType: CallType;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isVideoOff: boolean;
  contactName: string;
  participants: string[];
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onInvite: () => void;
}

export function CallWindow({
  callType,
  localStream,
  remoteStreams,
  isMuted,
  isVideoOff,
  contactName,
  participants,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onInvite,
}: CallWindowProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Call timer
  useEffect(() => {
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const hasVideo = callType === "video" || callType === "screenshare";
  const remoteEntries = Array.from(remoteStreams.entries());

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 flex flex-col bg-gradient-to-b from-[#0a1628] to-[#1a2a4a]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#1e4c8a] to-[#2d5aa0]">
        <div className="flex items-center gap-2 text-white">
          <span className="text-sm font-bold">
            {callType === "voice" ? "🎤 Röstsamtal" : callType === "video" ? "📹 Videosamtal" : "🖥️ Skärmdelning"}
          </span>
          <span className="text-xs text-white/60">med {contactName}</span>
          {participants.length > 0 && (
            <span className="text-xs text-white/60">+{participants.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-white">
          <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded">{formatDuration(callDuration)}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Video / Audio area */}
      <div className="flex-1 flex items-center justify-center p-4 gap-3 overflow-hidden">
        {hasVideo ? (
          <div className={cn(
            "grid gap-2 w-full h-full",
            remoteEntries.length === 0 ? "grid-cols-1" :
            remoteEntries.length === 1 ? "grid-cols-2" :
            "grid-cols-2 grid-rows-2"
          )}>
            {/* Remote streams */}
            {remoteEntries.map(([peerId, stream]) => (
              <RemoteVideo key={peerId} stream={stream} />
            ))}

            {/* Local video (picture-in-picture style if there are remotes) */}
            {remoteEntries.length > 0 ? (
              <div className="absolute bottom-20 right-6 w-40 h-28 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn("w-full h-full object-cover", isVideoOff && "hidden")}
                />
                {isVideoOff && (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <VideoOff className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden bg-gray-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn("w-full h-full object-cover", isVideoOff && "hidden")}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar name={contactName} size="xl" />
                  </div>
                )}
                <span className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded">Du</span>
              </div>
            )}
          </div>
        ) : (
          /* Voice call - show avatars */
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border-2 border-blue-400/50 animate-pulse">
                <Avatar name={contactName} size="xl" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-lg">{contactName}</h3>
              <p className="text-white/60 text-sm">Röstsamtal pågår...</p>
            </div>
            {/* Audio visualizer bars */}
            <div className="flex items-end gap-1 h-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-blue-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-4 bg-black/30">
        <CallControlButton
          icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          label={isMuted ? "Avtystat" : "Mikrofon"}
          onClick={onToggleMute}
          active={!isMuted}
        />
        {hasVideo && (
          <CallControlButton
            icon={isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            label={isVideoOff ? "Video av" : "Video"}
            onClick={onToggleVideo}
            active={!isVideoOff}
          />
        )}
        <CallControlButton
          icon={<Users className="w-5 h-5" />}
          label="Bjud in"
          onClick={onInvite}
          active={false}
          disabled={participants.length >= 3}
        />
        <button
          onClick={onEndCall}
          className="flex flex-col items-center gap-1 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 transition-colors text-white"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-[9px]">Avsluta</span>
        </button>
      </div>
    </div>
  );
}

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-900">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
    </div>
  );
}

function CallControlButton({
  icon,
  label,
  onClick,
  active,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2.5 rounded-full transition-colors",
        active
          ? "bg-white/20 text-white hover:bg-white/30"
          : "bg-white/10 text-white/60 hover:bg-white/20",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {icon}
      <span className="text-[9px]">{label}</span>
    </button>
  );
}
