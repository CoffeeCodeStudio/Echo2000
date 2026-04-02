import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";

const FONT = "Verdana, Tahoma, sans-serif";

export const ChatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow pan across the chat screenshot
  const scale = interpolate(frame, [0, 95], [1.2, 1.3], { extrapolateRight: "clamp" });
  const panX = interpolate(frame, [0, 95], [20, -30], { extrapolateRight: "clamp" });
  const panY = interpolate(frame, [0, 95], [30, -20], { extrapolateRight: "clamp" });

  const labelOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const labelScale = spring({ frame, fps, config: { damping: 15 } });

  // Typing indicator
  const typingDots = Math.floor(frame / 8) % 4;
  const typingOpacity = interpolate(frame, [40, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a" }}>
      {/* Screenshot with pan */}
      <AbsoluteFill style={{
        transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
        transformOrigin: "center center",
      }}>
        <Img
          src={staticFile("images/chat-demo.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Vignette */}
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
      }} />

      {/* Scene label */}
      <div style={{
        position: "absolute", top: 40, right: 60,
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: "8px 20px",
        opacity: labelOpacity,
        transform: `scale(${labelScale})`,
      }}>
        <span style={{
          fontFamily: FONT, fontSize: 22, fontWeight: "bold",
          color: "#ff6600", textTransform: "uppercase", letterSpacing: 3,
        }}>
          💬 Chatt i realtid
        </span>
      </div>

      {/* Typing indicator overlay */}
      <div style={{
        position: "absolute", bottom: 120, left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0,0,0,0.75)",
        padding: "8px 18px",
        border: "1px solid #ff6600",
        opacity: typingOpacity,
      }}>
        <span style={{ fontFamily: FONT, fontSize: 14, color: "#ccc" }}>
          Lisa_93 skriver{".".repeat(typingDots)}
        </span>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        backgroundColor: "#ff6600",
      }} />
    </AbsoluteFill>
  );
};
