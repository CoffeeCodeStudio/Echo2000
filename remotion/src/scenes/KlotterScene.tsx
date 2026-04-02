import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";

const FONT = "Verdana, Tahoma, sans-serif";

export const KlotterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom into the klotter canvas
  const scale = interpolate(frame, [0, 95], [1.1, 1.4], { extrapolateRight: "clamp" });
  const panX = interpolate(frame, [0, 95], [0, 60], { extrapolateRight: "clamp" });
  const panY = interpolate(frame, [0, 95], [0, -30], { extrapolateRight: "clamp" });

  const labelOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const labelScale = spring({ frame, fps, config: { damping: 15 } });

  // Drawing cursor simulation
  const cursorX = interpolate(frame, [30, 80], [600, 1100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(frame, [30, 80], [400, 550], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorOpacity = interpolate(frame, [25, 30, 75, 80], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a" }}>
      {/* Screenshot with zoom */}
      <AbsoluteFill style={{
        transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
        transformOrigin: "center center",
      }}>
        <Img
          src={staticFile("images/klotter-demo.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Vignette */}
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
      }} />

      {/* Scene label */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: "8px 20px",
        opacity: labelOpacity,
        transform: `scale(${labelScale})`,
      }}>
        <span style={{
          fontFamily: FONT, fontSize: 22, fontWeight: "bold",
          color: "#ff6600", textTransform: "uppercase", letterSpacing: 3,
        }}>
          🎨 Klotterplanket
        </span>
      </div>

      {/* Animated cursor */}
      <div style={{
        position: "absolute",
        left: cursorX, top: cursorY,
        width: 20, height: 20,
        borderRadius: "50%",
        backgroundColor: "#ff6600",
        boxShadow: "0 0 12px rgba(255, 102, 0, 0.6)",
        opacity: cursorOpacity,
        transform: "translate(-50%, -50%)",
      }} />

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        backgroundColor: "#ff6600",
      }} />
    </AbsoluteFill>
  );
};
