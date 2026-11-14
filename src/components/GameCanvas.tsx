import { useEffect, useRef } from "react";
import { SchoolGame, type GameCallbacks } from "../game/engine";
import type { Difficulty } from "../game/map";

interface GameCanvasProps {
  difficulty: Difficulty;
  engineRef: { current: SchoolGame | null };
  onStats: GameCallbacks["onStats"];
  onNotebookOpen: GameCallbacks["onNotebookOpen"];
  onWin: GameCallbacks["onWin"];
  onLose: GameCallbacks["onLose"];
  onEvent: GameCallbacks["onEvent"];
}

export function GameCanvas({
  difficulty,
  engineRef,
  onStats,
  onNotebookOpen,
  onWin,
  onLose,
  onEvent,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacksRef = useRef({ onStats, onNotebookOpen, onWin, onLose, onEvent });
  callbacksRef.current = { onStats, onNotebookOpen, onWin, onLose, onEvent };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SchoolGame(canvas, difficulty, {
      onStats: (stats) => callbacksRef.current.onStats(stats),
      onNotebookOpen: (notebook) => callbacksRef.current.onNotebookOpen(notebook),
      onWin: (stats) => callbacksRef.current.onWin(stats),
      onLose: (stats) => callbacksRef.current.onLose(stats),
      onEvent: (event) => callbacksRef.current.onEvent(event),
    });

    engineRef.current = engine;
    (window as unknown as { __schoolGame?: SchoolGame }).__schoolGame = engine;
    engine.start();

    return () => {
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [difficulty, engineRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full touch-none select-none"
      aria-label="Игровое поле: коридоры школы от первого лица. Используйте WASD для движения и мышь для осмотра."
      role="img"
    />
  );
}
