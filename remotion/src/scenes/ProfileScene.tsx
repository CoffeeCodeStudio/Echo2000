import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const FONT = "Verdana, Tahoma, sans-serif";

function WindowBox({ title, children, x, y, w, h, delay, frame, fps }: {
  title: string; children: React.ReactNode;
  x: number; y: number; w: number; h: number; delay: number;
  frame: number; fps: number;
}) {
  const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 120 } });
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      border: "1px solid #999", backgroundColor: "white",
      opacity, transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
    }}>
      <div style={{
        background: "linear-gradient(180deg, #5a5a5a, #444)",
        padding: "4px 8px",
        borderBottom: "2px solid #ff6600",
      }}>
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: "bold", color: "white", textTransform: "uppercase" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

export const ProfileScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelY = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#e5e5e5" }}>
      {/* Scene label */}
      <div style={{
        position: "absolute", top: 40, left: 80,
        fontFamily: FONT, fontSize: 16, color: "#999",
        letterSpacing: 4, textTransform: "uppercase",
        transform: `translateY(${interpolate(labelY, [0, 1], [-20, 0])}px)`,
      }}>
        📖 Profilsida
      </div>

      {/* Avatar box */}
      <WindowBox title="Profilbild" x={80} y={100} w={300} h={320} delay={5} frame={frame} fps={fps}>
        <div style={{
          width: 200, height: 200,
          border: "1px solid #999", backgroundColor: "#eee",
          margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 80,
        }}>
          👤
        </div>
        <div style={{ textAlign: "center", fontFamily: FONT, fontSize: 18, fontWeight: "bold", color: "#333", marginTop: 12 }}>
          CoolKid99
        </div>
      </WindowBox>

      {/* Info box */}
      <WindowBox title="Om mig" x={420} y={100} w={500} h={200} delay={15} frame={frame} fps={fps}>
        {[
          { label: "Ålder:", value: "24" },
          { label: "Stad:", value: "Stockholm" },
          { label: "Intressen:", value: "Musik, gaming, film" },
          { label: "Lyssnar på:", value: "Kent, The Hives" },
        ].map((row, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            borderBottom: "1px solid #ddd", padding: "6px 0",
            fontFamily: FONT, fontSize: 13,
          }}>
            <span style={{ color: "#666" }}>{row.label}</span>
            <span style={{ color: "#333", fontWeight: "bold" }}>{row.value}</span>
          </div>
        ))}
      </WindowBox>

      {/* Guestbook box */}
      <WindowBox title="Gästbok" x={420} y={340} w={500} h={280} delay={25} frame={frame} fps={fps}>
        {[
          { name: "Lisa_93", msg: "Kul profil! Adda mig! 😊", time: "igår" },
          { name: "DjMartin", msg: "Najs musiksmak!", time: "2 dagar sedan" },
          { name: "PixelGirl", msg: "Hej! Vill du chatta?", time: "3 dagar sedan" },
        ].map((entry, i) => {
          const entryDelay = 30 + i * 10;
          const entryOpacity = interpolate(frame, [entryDelay, entryDelay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              borderBottom: "1px solid #eee", padding: "8px 0",
              opacity: entryOpacity, fontFamily: FONT,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: "bold", color: "#ff6600" }}>{entry.name}</span>
                <span style={{ fontSize: 10, color: "#999" }}>{entry.time}</span>
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{entry.msg}</div>
            </div>
          );
        })}
      </WindowBox>

      {/* Friends sidebar */}
      <WindowBox title="Vänner (12)" x={960} y={100} w={300} h={520} delay={20} frame={frame} fps={fps}>
        {["Lisa_93", "DjMartin", "PixelGirl", "Robansen", "SunnyDay", "Koansen2k"].map((name, i) => {
          const friendDelay = 25 + i * 5;
          const friendX = interpolate(frame, [friendDelay, friendDelay + 10], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const friendOpacity = interpolate(frame, [friendDelay, friendDelay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 0", borderBottom: "1px solid #eee",
              opacity: friendOpacity, transform: `translateX(${friendX}px)`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                backgroundColor: "#eee", border: "1px solid #ccc",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: "bold", color: "#666",
              }}>
                {name[0]}
              </div>
              <span style={{ fontFamily: FONT, fontSize: 12, color: "#333" }}>{name}</span>
              <span style={{ fontSize: 8, color: "#339900", marginLeft: "auto" }}>●</span>
            </div>
          );
        })}
      </WindowBox>

      {/* Bottom accent */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        backgroundColor: "#ff6600",
      }} />
    </AbsoluteFill>
  );
};
