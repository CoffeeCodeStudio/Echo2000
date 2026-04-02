import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const FONT = "Verdana, Tahoma, sans-serif";
  const title = "Echo2000";
  const visibleChars = Math.min(Math.floor(frame / 3), title.length);
  const typedText = title.slice(0, visibleChars);

  const cursorBlink = Math.floor(frame / 10) % 2 === 0;

  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [30, 50], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const bgScale = interpolate(frame, [0, 100], [1.05, 1], { extrapolateRight: "clamp" });

  const starScale = spring({ frame: frame - 60, fps, config: { damping: 12 } });
  const starOpacity = interpolate(frame, [58, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#e5e5e5", transform: `scale(${bgScale})` }}>
      {/* Decorative border frame */}
      <div style={{
        position: "absolute", inset: 40,
        border: "2px solid #999",
      }} />

      {/* Center content */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          {/* Logo text */}
          <div style={{
            fontFamily: FONT,
            fontSize: 120,
            fontWeight: "bold",
            letterSpacing: -2,
          }}>
            <span style={{ color: "#ff6600" }}>
              {typedText.slice(0, 4)}
            </span>
            <span style={{ color: "#555" }}>
              {typedText.slice(4)}
            </span>
            {frame < 30 && (
              <span style={{ color: cursorBlink ? "#ff6600" : "transparent" }}>|</span>
            )}
          </div>

          {/* Tagline */}
          <div style={{
            fontFamily: FONT,
            fontSize: 28,
            color: "#555",
            marginTop: 16,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}>
            Community för oss som minns 56K-modem
          </div>

          {/* Star decoration */}
          <div style={{
            marginTop: 30,
            fontSize: 18,
            color: "#ff6600",
            letterSpacing: 8,
            opacity: starOpacity,
            transform: `scale(${starScale})`,
          }}>
            ★ ★ ★
          </div>
        </div>
      </AbsoluteFill>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 4,
        backgroundColor: "#ff6600",
        transform: `scaleX(${interpolate(frame, [0, 40], [0, 1], { extrapolateRight: "clamp" })})`,
        transformOrigin: "left",
      }} />
    </AbsoluteFill>
  );
};
