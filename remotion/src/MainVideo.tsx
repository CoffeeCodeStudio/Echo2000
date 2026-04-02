import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { IntroScene } from "./scenes/IntroScene";
import { ProfileScene } from "./scenes/ProfileScene";
import { ChatScene } from "./scenes/ChatScene";
import { KlotterScene } from "./scenes/KlotterScene";
import { OutroScene } from "./scenes/OutroScene";

const TRANSITION_FRAMES = 15;

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Scanline overlay
  const scanlineOpacity = interpolate(frame, [0, 30], [0, 0.06], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={95}>
          <ProfileScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={95}>
          <ChatScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={95}>
          <KlotterScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={110}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Scanline overlay */}
      <AbsoluteFill style={{ opacity: scanlineOpacity, pointerEvents: "none" }}>
        <div style={{
          width: "100%",
          height: "100%",
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
        }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
