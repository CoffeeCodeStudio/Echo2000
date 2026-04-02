import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";

const FONT = "Verdana, Tahoma, sans-serif";

export const ProfileScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom into the screenshot slowly
  const scale = interpolate(frame, [0, 95], [1.15, 1.35], { extrapolateRight: "clamp" });
  const panX = interpolate(frame, [0, 95], [0, -80], { extrapolateRight: "clamp" });
  const panY = interpolate(frame, [0, 95], [0, -40], { extrapolateRight: "clamp" });

  // Label animation
  const labelScale = spring({ frame, fps, config: { damping: 15 } });
  const labelOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Feature callouts
  const callouts = [
    { text: "📖 Gästbok", x: 1350, y: 750, delay: 20 },
    { text: "❤️ Vänner", x: 1550, y: 350, delay: 35 },
    { text: "👤 Profilbild", x: 300, y: 250, delay: 50 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a" }}>
      {/* Screenshot with zoom/pan */}
      <AbsoluteFill style={{
        transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
        transformOrigin: "center center",
      }}>
        <Img
          src={staticFile("images/profile-demo.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Darkening vignette */}
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
          📖 Profilsida
        </span>
      </div>

      {/* Feature callouts */}
      {callouts.map((c, i) => {
        const cOpacity = interpolate(frame, [c.delay, c.delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const cScale = spring({ frame: frame - c.delay, fps, config: { damping: 12 } });
        return (
          <div key={i} style={{
            position: "absolute", left: c.x, top: c.y,
            backgroundColor: "rgba(0,0,0,0.75)",
            padding: "6px 14px",
            border: "1px solid #ff6600",
            opacity: cOpacity,
            transform: `scale(${cScale})`,
          }}>
            <span style={{ fontFamily: FONT, fontSize: 16, color: "white" }}>{c.text}</span>
          </div>
        );
      })}

      {/* Bottom accent */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        backgroundColor: "#ff6600",
      }} />
    </AbsoluteFill>
  );
};
