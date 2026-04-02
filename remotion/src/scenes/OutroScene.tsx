import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const FONT = "Verdana, Tahoma, sans-serif";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const taglineOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [20, 40], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ctaOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaScale = spring({ frame: frame - 45, fps, config: { damping: 14 } });

  const featureIcons = ["📖", "💬", "🎨", "❤️", "📡"];

  // Pulse the orange bar
  const pulseScale = 1 + Math.sin(frame * 0.15) * 0.01;

  return (
    <AbsoluteFill style={{ backgroundColor: "#e5e5e5" }}>
      {/* Border frame */}
      <div style={{
        position: "absolute", inset: 40,
        border: "2px solid #999",
      }} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          {/* Echo2000 logo */}
          <div style={{
            fontFamily: FONT, fontSize: 90, fontWeight: "bold",
            transform: `scale(${titleScale})`,
          }}>
            <span style={{ color: "#ff6600" }}>Echo</span>
            <span style={{ color: "#555" }}>2000</span>
          </div>

          {/* CTA */}
          <div style={{
            fontFamily: FONT, fontSize: 36, color: "#333",
            marginTop: 20,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}>
            Gå med idag. Helt gratis.
          </div>

          {/* Feature icons */}
          <div style={{
            display: "flex", gap: 20, justifyContent: "center",
            marginTop: 30,
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
          }}>
            {featureIcons.map((icon, i) => {
              const iconDelay = 50 + i * 4;
              const iconOpacity = interpolate(frame, [iconDelay, iconDelay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{
                  width: 50, height: 50,
                  border: "1px solid #999", backgroundColor: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                  opacity: iconOpacity,
                }}>{icon}</div>
              );
            })}
          </div>

          {/* Sub-tagline */}
          <div style={{
            fontFamily: FONT, fontSize: 16, color: "#999",
            marginTop: 30, letterSpacing: 2,
            opacity: interpolate(frame, [65, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            Inga algoritmer. Ingen reklam. Bara folk som vill hänga.
          </div>
        </div>
      </AbsoluteFill>

      {/* Bottom accent bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 6,
        backgroundColor: "#ff6600",
        transform: `scaleX(${pulseScale})`,
      }} />
    </AbsoluteFill>
  );
};
