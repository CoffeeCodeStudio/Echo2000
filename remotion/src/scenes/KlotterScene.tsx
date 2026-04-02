import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const FONT = "Verdana, Tahoma, sans-serif";

// Simple SVG path for a cat drawing
const CAT_PATH = "M 50 180 Q 50 120 80 100 L 60 50 L 90 80 Q 110 60 130 80 L 160 50 L 140 100 Q 170 120 170 180 Z";
const WHISKERS = [
  "M 85 130 L 40 120", "M 85 140 L 40 145",
  "M 135 130 L 180 120", "M 135 140 L 180 145",
];
const CAT_EYES = [
  { cx: 95, cy: 115, r: 5 },
  { cx: 125, cy: 115, r: 5 },
];

export const KlotterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Stroke animation progress
  const strokeProgress = interpolate(frame, [10, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const whiskerProgress = interpolate(frame, [45, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eyeScale = spring({ frame: frame - 55, fps, config: { damping: 10 } });

  // Gallery items fade in
  const galleryItems = [
    { emoji: "🌈", label: "Regnbåge", delay: 20 },
    { emoji: "🏠", label: "Hus", delay: 30 },
    { emoji: "🌻", label: "Blomma", delay: 40 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#e5e5e5" }}>
      {/* Scene label */}
      <div style={{
        position: "absolute", top: 40, left: 80,
        fontFamily: FONT, fontSize: 16, color: "#999",
        letterSpacing: 4, textTransform: "uppercase",
        opacity: labelOpacity,
      }}>
        🎨 Klotterplanket
      </div>

      {/* Main canvas area */}
      <div style={{
        position: "absolute", left: 80, top: 100,
        width: 800, height: 550,
        border: "1px solid #999", backgroundColor: "white",
      }}>
        <div style={{
          background: "linear-gradient(180deg, #5a5a5a, #444)",
          padding: "4px 8px",
          borderBottom: "2px solid #ff6600",
        }}>
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: "bold", color: "white", textTransform: "uppercase" }}>
            Klotterplank — Rita fritt!
          </span>
        </div>

        {/* Drawing area */}
        <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100% - 30px)" }}>
          <svg width="220" height="220" viewBox="0 0 220 220">
            {/* Cat body */}
            <path
              d={CAT_PATH}
              fill="none"
              stroke="#333"
              strokeWidth={3}
              strokeDasharray={600}
              strokeDashoffset={600 * (1 - strokeProgress)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Whiskers */}
            {WHISKERS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#666"
                strokeWidth={2}
                strokeDasharray={60}
                strokeDashoffset={60 * (1 - whiskerProgress)}
              />
            ))}
            {/* Eyes */}
            {CAT_EYES.map((eye, i) => (
              <circle
                key={i}
                cx={eye.cx}
                cy={eye.cy}
                r={eye.r * eyeScale}
                fill="#333"
              />
            ))}
            {/* Mouth */}
            <path
              d="M 105 145 Q 110 155 115 145"
              fill="none"
              stroke="#333"
              strokeWidth={2}
              opacity={eyeScale}
            />
          </svg>

          {/* Artist credit */}
          <div style={{
            position: "absolute", bottom: 30, left: 40,
            fontFamily: FONT, fontSize: 11, color: "#999",
            opacity: interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            Ritat av: Lisa_93 🐱
          </div>
        </div>
      </div>

      {/* Gallery sidebar */}
      <div style={{
        position: "absolute", right: 80, top: 100,
        width: 280, display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{
          border: "1px solid #999", backgroundColor: "white",
        }}>
          <div style={{
            background: "linear-gradient(180deg, #5a5a5a, #444)",
            padding: "4px 8px",
            borderBottom: "2px solid #ff6600",
          }}>
            <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: "bold", color: "white", textTransform: "uppercase" }}>
              Senaste klotter
            </span>
          </div>
          <div style={{ padding: 8 }}>
            {galleryItems.map((item, i) => {
              const itemOpacity = interpolate(frame, [item.delay, item.delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const itemX = interpolate(frame, [item.delay, item.delay + 12], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 0", borderBottom: i < galleryItems.length - 1 ? "1px solid #eee" : "none",
                  opacity: itemOpacity, transform: `translateX(${itemX}px)`,
                }}>
                  <div style={{
                    width: 40, height: 40,
                    border: "1px solid #ccc", backgroundColor: "#fafafa",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>{item.emoji}</div>
                  <span style={{ fontFamily: FONT, fontSize: 12, color: "#555" }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        backgroundColor: "#ff6600",
      }} />
    </AbsoluteFill>
  );
};
