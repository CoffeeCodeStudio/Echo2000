import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const FONT = "Verdana, Tahoma, sans-serif";

interface Bubble {
  name: string;
  msg: string;
  self: boolean;
  delay: number;
}

const MESSAGES: Bubble[] = [
  { name: "Lisa_93", msg: "Hej! Har du sett nya klotterplanket? 😄", self: false, delay: 10 },
  { name: "Du", msg: "Nej! Visar du?", self: true, delay: 25 },
  { name: "Lisa_93", msg: "Kolla, jag ritade en katt 🐱", self: false, delay: 40 },
  { name: "Du", msg: "Haha snygg! Jag ritar en hund sen", self: true, delay: 55 },
  { name: "Lisa_93", msg: "Deal! 🤝", self: false, delay: 68 },
];

export const ChatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#e5e5e5" }}>
      {/* Scene label */}
      <div style={{
        position: "absolute", top: 40, right: 80,
        fontFamily: FONT, fontSize: 16, color: "#999",
        letterSpacing: 4, textTransform: "uppercase",
        opacity: labelOpacity,
      }}>
        💬 Chatt
      </div>

      {/* Chat window */}
      <div style={{
        position: "absolute",
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: 700, height: 600,
        border: "1px solid #999",
        backgroundColor: "white",
        display: "flex", flexDirection: "column",
      }}>
        {/* Title bar */}
        <div style={{
          background: "linear-gradient(180deg, #5a5a5a, #444)",
          padding: "6px 12px",
          borderBottom: "2px solid #ff6600",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: "bold", color: "white" }}>
            Echo Messenger — Lisa_93
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {["_", "□", "×"].map((c) => (
              <div key={c} style={{
                width: 18, height: 18, backgroundColor: "#666",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "white", fontFamily: FONT,
              }}>{c}</div>
            ))}
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, padding: 16, overflowY: "hidden" }}>
          {MESSAGES.map((bubble, i) => {
            const s = spring({ frame: frame - bubble.delay, fps, config: { damping: 14, stiffness: 150 } });
            const opacity = interpolate(frame, [bubble.delay, bubble.delay + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const y = interpolate(s, [0, 1], [15, 0]);

            return (
              <div key={i} style={{
                display: "flex",
                justifyContent: bubble.self ? "flex-end" : "flex-start",
                marginBottom: 10,
                opacity,
                transform: `translateY(${y}px)`,
              }}>
                <div style={{
                  maxWidth: 400,
                  padding: "8px 12px",
                  backgroundColor: bubble.self ? "#fff3e6" : "#f0f0f0",
                  border: `1px solid ${bubble.self ? "#ff6600" : "#ccc"}`,
                }}>
                  <div style={{
                    fontFamily: FONT, fontSize: 10, fontWeight: "bold",
                    color: bubble.self ? "#ff6600" : "#555",
                    marginBottom: 4,
                  }}>
                    {bubble.name}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 13, color: "#333" }}>
                    {bubble.msg}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input bar */}
        <div style={{
          borderTop: "1px solid #ccc", padding: "8px 12px",
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <div style={{
            flex: 1, height: 30,
            border: "1px solid #999", backgroundColor: "#fafafa",
            display: "flex", alignItems: "center", paddingLeft: 8,
            fontFamily: FONT, fontSize: 12, color: "#999",
          }}>
            Skriv ett meddelande...
          </div>
          <div style={{
            padding: "4px 16px",
            backgroundColor: "#ff6600",
            color: "white",
            fontFamily: FONT, fontSize: 12, fontWeight: "bold",
            border: "1px solid #cc5500",
          }}>
            Skicka
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
