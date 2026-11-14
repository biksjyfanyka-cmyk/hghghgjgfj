import { useState } from "react";
import { StartScreen } from "./components/StartScreen";
import { GameScreen } from "./components/GameScreen";
import { audio } from "./game/audio";
import type { Difficulty } from "./game/map";

export default function App() {
  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("classic");
  const [muted, setMuted] = useState(audio.muted);
  const [session, setSession] = useState(0);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio.setMuted(next);
    if (!next) {
      void audio.unlock();
      audio.play("click");
    }
  };

  const startGame = () => {
    void audio.unlock();
    setSession((current) => current + 1);
    setScreen("game");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const exitGame = () => {
    audio.stopAmbient();
    setScreen("menu");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  if (screen === "game") {
    return (
      <GameScreen
        key={session}
        difficulty={difficulty}
        muted={muted}
        onToggleMute={toggleMute}
        onExit={exitGame}
      />
    );
  }

  return (
    <StartScreen
      difficulty={difficulty}
      onDifficultyChange={setDifficulty}
      onStart={startGame}
      muted={muted}
      onToggleMute={toggleMute}
    />
  );
}
