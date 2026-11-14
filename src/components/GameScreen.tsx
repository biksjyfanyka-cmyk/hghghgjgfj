import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "./Icons";
import { GameCanvas } from "./GameCanvas";
import { MiniMap } from "./MiniMap";
import { QuizModal } from "./QuizModal";
import { ResultOverlay } from "./ResultOverlay";
import { audio } from "../game/audio";
import {
  DIFFICULTIES,
  NOTEBOOKS,
  PLAYER_SPAWN,
  TEACHER_SPAWN,
  type Difficulty,
  type NotebookDef,
} from "../game/map";
import { SchoolGame, type EngineEvent, type GameStats } from "../game/engine";

interface GameScreenProps {
  difficulty: Difficulty;
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
}

type Toast = EngineEvent & { id: number };
type ResultState = { type: "win" | "lose"; stats: GameStats } | null;

const initialStats = (): GameStats => ({
  elapsed: 0,
  player: { x: PLAYER_SPAWN.x, y: PLAYER_SPAWN.y, angle: PLAYER_SPAWN.angle },
  teacher: {
    x: TEACHER_SPAWN.x,
    y: TEACHER_SPAWN.y,
    active: false,
    stunned: false,
    distance: 99,
    visible: false,
  },
  notebooksCollected: 0,
  completedIds: [],
  chalk: 0,
  stamina: 100,
  staminaExhausted: false,
  sprinting: false,
  boost: 0,
  correct: 0,
  mistakes: 0,
  room: "Коридор",
  danger: 0,
  exitUnlocked: false,
  near: null,
});

const fmtTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

function NotebookRow({
  notebook,
  complete,
  nearest,
}: {
  notebook: NotebookDef;
  complete: boolean;
  nearest: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors ${
        complete
          ? "border-white/[0.06] bg-white/[0.015] opacity-55"
          : nearest
            ? "border-lime/30 bg-lime/[0.06]"
            : "border-white/[0.07] bg-white/[0.02]"
      }`}
    >
      <span
        className="relative block h-7 w-5 shrink-0 rounded-[2px] border border-black/40 shadow-[1px_1px_0_rgba(0,0,0,0.45)]"
        style={{ backgroundColor: complete ? "#4c5a4f" : notebook.color }}
      >
        <span className="absolute left-0 top-0 h-full w-[3px] bg-black/20" />
        <span className="absolute inset-x-1 top-2 h-2 bg-cream/75" />
      </span>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-[11px] font-bold ${complete ? "line-through decoration-cream/30" : "text-cream/85"}`}>
          {notebook.title}
        </div>
        <div className="mt-0.5 truncate font-mono text-[7px] uppercase tracking-[0.07em] text-mint/35">
          {notebook.room}
        </div>
      </div>
      {complete ? (
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-lime/15 text-lime">
          <Icon name="check" size={11} />
        </span>
      ) : nearest ? (
        <span className="shrink-0 font-mono text-[7px] uppercase tracking-[0.06em] text-lime/70">цель</span>
      ) : (
        <span className="size-1.5 shrink-0 rounded-full bg-cream/15" />
      )}
    </div>
  );
}

export function GameScreen({ difficulty, muted, onToggleMute, onExit }: GameScreenProps) {
  const engineRef = useRef<SchoolGame | null>(null);
  const [runId, setRunId] = useState(0);
  const [stats, setStats] = useState<GameStats>(initialStats);
  const [quizNotebook, setQuizNotebook] = useState<NotebookDef | null>(null);
  const [result, setResult] = useState<ResultState>(null);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        setToast({
          id: 1,
          kind: "info",
          message: "Смена началась. Найди первую тетрадь — учитель пока не знает, что ты здесь.",
        }),
      500
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const frozen = paused || Boolean(quizNotebook) || Boolean(result);
  useEffect(() => {
    engineRef.current?.setPaused(frozen);
  }, [frozen, runId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (quizNotebook || result) return;
      if (event.key === "Escape" || event.code === "KeyP") {
        event.preventDefault();
        setPaused((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [quizNotebook, result]);

  const completed = new Set(stats.completedIds);
  const remainingNotebooks = NOTEBOOKS.filter((notebook) => !completed.has(notebook.id));
  const nearestNotebook = [...remainingNotebooks].sort(
    (a, b) =>
      Math.hypot(a.x - stats.player.x, a.y - stats.player.y) -
      Math.hypot(b.x - stats.player.x, b.y - stats.player.y)
  )[0];

  const pauseGame = () => {
    setPaused(true);
    audio.play("click");
  };

  const restart = () => {
    setResult(null);
    setQuizNotebook(null);
    setPaused(false);
    setToast(null);
    setStats(initialStats());
    setRunId((current) => current + 1);
    audio.play("click");
  };

  const toggleMute = () => {
    onToggleMute();
    audio.play("click");
  };

  const holdControl =
    (control: string, pressed: boolean) => (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (pressed) event.currentTarget.setPointerCapture?.(event.pointerId);
      engineRef.current?.setVirtual(control, pressed);
    };

  const teacherStatus = !stats.teacher.active
    ? "Ещё не знает"
    : stats.teacher.stunned
      ? "Оглушён мелом"
      : stats.danger > 0.72
        ? "Совсем рядом"
        : stats.danger > 0.35
          ? "Слышит тебя"
          : "Идёт по следу";

  const dangerTone =
    stats.danger > 0.72 ? "text-[#ff8f80]" : stats.danger > 0.35 ? "text-[#f0c674]" : "text-lime";

  return (
    <div className="grain flex min-h-screen flex-col bg-ink text-cream">
      <header className="relative z-40 border-b border-white/10 bg-ink/95">
        <div className="mx-auto flex h-[62px] max-w-[1660px] items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={pauseGame}
              className="grid size-9 shrink-0 -rotate-2 place-items-center rounded-[3px] border border-ink bg-lime font-display text-sm font-black text-ink shadow-[2px_2px_0_rgba(242,237,221,0.8)]"
              aria-label="Пауза и меню"
            >
              13
            </button>
            <div className="min-w-0 leading-none">
              <div className="truncate font-display text-[12px] font-extrabold tracking-[-0.03em] sm:text-sm">
                ШКОЛА №13
              </div>
              <div className="mt-1 hidden font-mono text-[8px] uppercase tracking-[0.19em] text-mint/40 sm:block">
                После звонка · смена 01
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 md:flex">
              <span className="size-1.5 animate-pulse rounded-full bg-oxblood" />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-cream/60">
                {fmtTime(stats.elapsed)}
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-mint/45">
                {DIFFICULTIES[difficulty].label}
              </span>
            </span>
            <span className="hidden items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.06] px-3 py-1.5 sm:flex">
              <Icon name="book" size={12} className="text-lime" />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-cream/75">
                {stats.notebooksCollected} / 5
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="grid size-9 place-items-center rounded-full border border-white/10 text-cream/65 transition-colors hover:border-lime/40 hover:text-lime"
              aria-label={muted ? "Включить звук" : "Выключить звук"}
              title={muted ? "Включить звук" : "Выключить звук"}
            >
              <Icon name={muted ? "mute" : "sound"} size={15} />
            </button>
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              className="flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 text-cream/75 transition-colors hover:border-white/30 hover:text-cream"
              aria-label="Пауза"
            >
              <Icon name="pause" size={13} />
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em]">Пауза</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1660px] flex-1 gap-3 px-2 py-2 sm:px-4 sm:py-3 lg:gap-4 lg:px-5">
        <aside className="hidden w-[244px] shrink-0 flex-col gap-2.5 xl:flex">
          <div className="rounded-xl border border-lime/20 bg-panel p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-lime">
                <span className="h-px w-4 bg-lime" /> Основная цель
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-mint/30">
                {stats.notebooksCollected}/5
              </span>
            </div>
            <h1 className="mt-3 font-display text-[19px] font-extrabold leading-[1.08] tracking-[-0.045em]">
              Собери и сдай
              <br />
              все тетради.
            </h1>
            <p className="mt-2 text-[10px] leading-relaxed text-mint/45">
              В каждой тетради три примера. После последней откроется главный выход.
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-lime transition-[width] duration-500"
                style={{ width: `${(stats.notebooksCollected / 5) * 100}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[
                [`${stats.notebooksCollected}/5`, "тетради"],
                [`${stats.correct}/15`, "примеры"],
                [stats.exitUnlocked ? "01" : "00", "выход"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md border border-white/[0.07] bg-ink/35 px-1.5 py-1.5">
                  <div className={`font-display text-xs font-bold ${label === "выход" && stats.exitUnlocked ? "text-lime" : "text-cream/80"}`}>
                    {value}
                  </div>
                  <div className="mt-0.5 font-mono text-[6.5px] uppercase tracking-[0.1em] text-mint/35">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-panel p-2.5">
            <div className="mb-2 flex items-center justify-between px-0.5">
              <span className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-cream/70">
                <Icon name="book" size={11} className="text-mint/45" />
                Тетради
              </span>
              <span className="font-mono text-[7px] uppercase tracking-[0.05em] text-mint/25">5 предметов</span>
            </div>
            <div className="space-y-1.5">
              {NOTEBOOKS.map((notebook) => (
                <NotebookRow
                  key={notebook.id}
                  notebook={notebook}
                  complete={completed.has(notebook.id)}
                  nearest={nearestNotebook?.id === notebook.id}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-panel p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-cream/60">
                Карманы
              </span>
              <Icon name="run" size={11} className="text-mint/30" />
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-cream/75">
                  <Icon name="chalk" size={13} />
                </span>
                <div>
                  <div className="text-[10px] font-bold">Мел</div>
                  <div className="font-mono text-[7px] uppercase tracking-[0.06em] text-mint/30">Q · оглушение</div>
                </div>
              </div>
              <span className="font-display text-sm font-bold text-lime">{stats.chalk}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${
                  stats.staminaExhausted ? "bg-oxblood" : stats.sprinting ? "bg-lime" : "bg-mint/60"
                }`}
                style={{ width: `${stats.stamina}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[6.5px] uppercase tracking-[0.08em] text-mint/30">
              <span>Выносливость</span>
              <span>{stats.boost > 0 ? "кофе!" : "Shift"}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={pauseGame}
            className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 py-2.5 font-mono text-[8px] uppercase tracking-[0.12em] text-cream/35 transition-colors hover:border-lime/30 hover:text-lime/70"
          >
            <Icon name="menu" size={11} /> Управление и пауза
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-xl border border-white/15 bg-[#0b120e] shadow-[0_22px_60px_rgba(0,0,0,0.34)]">
            <div className="flex h-8 items-center justify-between gap-2 border-b border-white/10 bg-[#101a14] px-2.5 sm:h-9 sm:px-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.13em] text-cream/55">
                  <span className="size-1.5 animate-pulse rounded-full bg-oxblood" />
                  REC
                </span>
                <span className="h-3 w-px bg-white/10" />
                <span className="truncate font-mono text-[7px] uppercase tracking-[0.08em] text-mint/35">
                  CAM 02 · 2 этаж · {stats.room}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-mint/35">
                  {fmtTime(stats.elapsed)}
                </span>
                <span className="h-3 w-px bg-white/10" />
                <span className="font-mono text-[7px] font-semibold uppercase tracking-[0.08em] text-cream/55">
                  {stats.notebooksCollected}/5
                </span>
              </div>
            </div>

            <div className="relative h-[58vh] min-h-[390px] w-full overflow-hidden bg-[#0a100c] sm:aspect-[16/10] sm:h-auto sm:min-h-0 lg:h-[clamp(500px,calc(100dvh-175px),860px)] lg:min-h-0 lg:aspect-auto">
              <GameCanvas
                key={`${difficulty}-${runId}`}
                difficulty={difficulty}
                engineRef={engineRef}
                onStats={setStats}
                onNotebookOpen={(notebook) => {
                  setQuizNotebook(notebook);
                  setToast(null);
                }}
                onWin={(finalStats) => {
                  setStats(finalStats);
                  setResult({ type: "win", stats: finalStats });
                  setToast(null);
                }}
                onLose={(finalStats) => {
                  setStats(finalStats);
                  setResult({ type: "lose", stats: finalStats });
                  setToast(null);
                }}
                onEvent={(event) => setToast({ ...event, id: Date.now() + Math.random() })}
              />

              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2.5 sm:p-3">
                <div className="flex flex-col gap-1.5">
                  <span className="flex w-fit items-center gap-1.5 rounded border border-white/10 bg-ink/65 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.1em] text-cream/65 backdrop-blur-sm">
                    <Icon name="map" size={9} className="text-lime/80" />
                    {stats.room}
                  </span>
                  <span className="flex w-fit items-center gap-1.5 rounded border border-white/10 bg-ink/55 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.08em] text-cream/40 backdrop-blur-sm">
                    <Icon name="compass" size={9} />
                    {nearestNotebook ? `цель: ${nearestNotebook.title}` : "цель: выход"}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {stats.exitUnlocked && (
                    <span className="flex items-center gap-1.5 rounded border border-lime/35 bg-lime/15 px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-lime backdrop-blur-sm">
                      <Icon name="exit" size={9} /> выход открыт
                    </span>
                  )}
                  <span
                    className={`flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[7px] uppercase tracking-[0.08em] backdrop-blur-sm ${
                      stats.danger > 0.55
                        ? "animate-pulse-red border-oxblood/40 bg-oxblood/20 text-[#ffb1a7]"
                        : "border-white/10 bg-ink/55 text-cream/45"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${stats.teacher.active ? "bg-oxblood" : "bg-mint/40"}`} />
                    {teacherStatus}
                  </span>
                </div>
              </div>

              {toast && (
                <div
                  key={toast.id}
                  className="pointer-events-none absolute inset-x-0 top-[58px] z-20 flex justify-center px-3 sm:top-14"
                  role="status"
                  aria-live="polite"
                >
                  <div
                    className={`animate-rise flex max-w-[92%] items-center gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur-md ${
                      toast.kind === "danger"
                        ? "border-oxblood/45 bg-[#381d1a]/95 text-[#ffc2b9]"
                        : toast.kind === "success"
                          ? "border-lime/35 bg-[#192418]/95 text-[#e3f3ab]"
                          : toast.kind === "warning"
                            ? "border-[#d2a756]/40 bg-[#2a2417]/95 text-[#f2d79c]"
                            : "border-white/15 bg-ink/90 text-cream/75"
                    }`}
                  >
                    <Icon
                      name={
                        toast.kind === "success"
                          ? "check"
                          : toast.kind === "info"
                            ? "eye"
                            : "warning"
                      }
                      size={13}
                      className="shrink-0"
                    />
                    <span className="text-[10px] font-semibold leading-snug sm:text-[11px]">{toast.message}</span>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden items-center gap-2 lg:flex">
                <span className="rounded border border-white/10 bg-ink/60 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.08em] text-cream/40 backdrop-blur-sm">
                  перетащи мышь — осмотреться
                </span>
                <span className="rounded border border-white/10 bg-ink/60 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.08em] text-cream/40 backdrop-blur-sm">
                  Q — мел
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-3 lg:hidden">
                <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1">
                  <button
                    type="button"
                    aria-label="Идти вперёд"
                    className="col-start-2 row-start-1 grid size-11 touch-none place-items-center rounded-lg border border-white/20 bg-ink/75 text-cream shadow-lg backdrop-blur active:bg-lime active:text-ink"
                    onPointerDown={holdControl("forward", true)}
                    onPointerUp={holdControl("forward", false)}
                    onPointerLeave={holdControl("forward", false)}
                    onPointerCancel={holdControl("forward", false)}
                  >
                    <Icon name="arrow-right" size={17} className="-rotate-90" />
                  </button>
                  <button
                    type="button"
                    aria-label="Идти влево"
                    className="col-start-1 row-start-2 grid size-11 touch-none place-items-center rounded-lg border border-white/20 bg-ink/75 text-cream shadow-lg backdrop-blur active:bg-lime active:text-ink"
                    onPointerDown={holdControl("left", true)}
                    onPointerUp={holdControl("left", false)}
                    onPointerLeave={holdControl("left", false)}
                    onPointerCancel={holdControl("left", false)}
                  >
                    <Icon name="arrow-right" size={17} className="rotate-180" />
                  </button>
                  <span className="col-start-2 row-start-2 grid size-11 place-items-center rounded-lg border border-white/10 bg-ink/50 text-mint/35">
                    <span className="size-2 rounded-full border border-mint/40" />
                  </span>
                  <button
                    type="button"
                    aria-label="Идти вправо"
                    className="col-start-3 row-start-2 grid size-11 touch-none place-items-center rounded-lg border border-white/20 bg-ink/75 text-cream shadow-lg backdrop-blur active:bg-lime active:text-ink"
                    onPointerDown={holdControl("right", true)}
                    onPointerUp={holdControl("right", false)}
                    onPointerLeave={holdControl("right", false)}
                    onPointerCancel={holdControl("right", false)}
                  >
                    <Icon name="arrow-right" size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label="Идти назад"
                    className="col-start-2 row-start-3 grid size-11 touch-none place-items-center rounded-lg border border-white/20 bg-ink/75 text-cream shadow-lg backdrop-blur active:bg-lime active:text-ink"
                    onPointerDown={holdControl("back", true)}
                    onPointerUp={holdControl("back", false)}
                    onPointerLeave={holdControl("back", false)}
                    onPointerCancel={holdControl("back", false)}
                  >
                    <Icon name="arrow-right" size={17} className="rotate-90" />
                  </button>
                </div>

                <div className="pointer-events-auto flex flex-col items-end gap-2">
                  {stats.near && !result && !paused && !quizNotebook && (
                    <span className="max-w-[170px] truncate rounded-full border border-lime/25 bg-ink/80 px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.07em] text-lime/90 backdrop-blur">
                      {stats.near.action} · {stats.near.label}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Бежать"
                    className="flex h-9 touch-none items-center gap-1.5 rounded-full border border-white/20 bg-ink/75 px-3 text-cream/75 backdrop-blur active:bg-lime active:text-ink"
                    onPointerDown={holdControl("sprint", true)}
                    onPointerUp={holdControl("sprint", false)}
                    onPointerLeave={holdControl("sprint", false)}
                    onPointerCancel={holdControl("sprint", false)}
                  >
                    <Icon name="run" size={13} />
                    <span className="font-mono text-[7px] uppercase tracking-[0.06em]">бег</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => engineRef.current?.useChalk()}
                      className="relative grid size-11 place-items-center rounded-full border border-white/20 bg-ink/80 text-cream shadow-lg backdrop-blur active:scale-95"
                      aria-label="Бросить мел"
                    >
                      <Icon name="chalk" size={16} />
                      <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-cream font-mono text-[7px] font-bold text-ink">
                        {stats.chalk}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => engineRef.current?.interact()}
                      className="grid size-14 place-items-center rounded-full border-2 border-ink bg-lime font-display text-[13px] font-black text-ink shadow-[0_4px_18px_rgba(0,0,0,0.4)] active:scale-95"
                      aria-label={`Действие: ${stats.near ? stats.near.action : "осмотреться"}`}
                    >
                      E
                    </button>
                  </div>
                </div>
              </div>

              {paused && !result && !quizNotebook && (
                <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-ink/82 p-3 backdrop-blur-md">
                  <div className="my-auto w-full max-w-[430px] rounded-xl border border-white/15 bg-panel p-4 shadow-2xl sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-lime">
                          Расписание приостановлено
                        </div>
                        <h2 className="mt-1.5 font-display text-[28px] font-black leading-none tracking-[-0.06em]">
                          ПЕРЕМЕНА.
                        </h2>
                        <p className="mt-2 text-[11px] leading-relaxed text-mint/45">
                          Он тоже отдыхает. Но недолго. Вернись, пока звонок не прозвенел.
                        </p>
                      </div>
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime/10 text-lime">
                        <Icon name="pause" size={20} />
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-1.5">
                      {[
                        [`${stats.notebooksCollected}/5`, "тетради"],
                        [fmtTime(stats.elapsed), "в школе"],
                        [String(stats.mistakes).padStart(2, "0"), "ошибки"],
                      ].map(([value, label]) => (
                        <div key={label} className="rounded-md border border-white/10 bg-ink/40 px-2 py-2">
                          <div className="font-display text-xs font-bold">{value}</div>
                          <div className="mt-0.5 font-mono text-[6.5px] uppercase tracking-[0.08em] text-mint/35">{label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg border border-white/10 bg-ink/30 p-3">
                      <div className="mb-2 font-mono text-[7px] font-bold uppercase tracking-[0.13em] text-mint/40">
                        Управление
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[7px] uppercase tracking-[0.05em] text-cream/55">
                        <span className="flex items-center gap-1.5"><kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 text-[7px]">WASD</kbd> ходить</span>
                        <span className="flex items-center gap-1.5"><kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 text-[7px]">мышь</kbd> осмотреться</span>
                        <span className="flex items-center gap-1.5"><kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 text-[7px]">E</kbd> действие</span>
                        <span className="flex items-center gap-1.5"><kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 text-[7px]">Q</kbd> бросить мел</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPaused(false);
                        audio.play("click");
                      }}
                      className="mt-3 flex w-full items-center justify-between rounded-lg border-2 border-lime bg-lime px-4 py-3 text-ink transition-colors hover:bg-[#e4ff6a]"
                    >
                      <span className="font-display text-[12px] font-black uppercase">Вернуться в школу</span>
                      <Icon name="arrow-right" size={16} />
                    </button>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={restart}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 py-2 font-mono text-[8px] uppercase tracking-[0.08em] text-cream/60 transition-colors hover:border-white/30 hover:text-cream"
                      >
                        <Icon name="restart" size={11} /> Заново
                      </button>
                      <button
                        type="button"
                        onClick={onExit}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 py-2 font-mono text-[8px] uppercase tracking-[0.08em] text-cream/60 transition-colors hover:border-oxblood/40 hover:text-[#f0a99e]"
                      >
                        <Icon name="home" size={11} /> В меню
                      </button>
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="grid size-[33px] place-items-center rounded-md border border-white/15 text-cream/60 transition-colors hover:border-white/30 hover:text-cream"
                        aria-label={muted ? "Включить звук" : "Выключить звук"}
                      >
                        <Icon name={muted ? "mute" : "sound"} size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex h-8 items-center justify-between gap-3 border-t border-white/10 bg-[#101a14] px-2.5 sm:h-9 sm:px-3">
              <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-mint/30">
                Запись ведётся · не для учителей
              </span>
              <span className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.08em] text-mint/30">
                <span className="hidden sm:inline">тетрадей:</span>
                {NOTEBOOKS.map((notebook) => (
                  <span
                    key={notebook.id}
                    className={`block size-2 rounded-[1px] ${completed.has(notebook.id) ? "bg-lime" : "bg-cream/15"}`}
                  />
                ))}
              </span>
            </div>
          </div>

          <div className="mt-2 grid gap-2 lg:hidden">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {NOTEBOOKS.map((notebook) => {
                const complete = completed.has(notebook.id);
                return (
                  <div
                    key={notebook.id}
                    className={`flex min-w-[118px] flex-1 items-center gap-2 rounded-lg border px-2 py-1.5 ${
                      complete
                        ? "border-white/[0.06] bg-white/[0.02] opacity-50"
                        : nearestNotebook?.id === notebook.id
                          ? "border-lime/30 bg-lime/[0.06]"
                          : "border-white/10 bg-panel"
                    }`}
                  >
                    <span className="h-5 w-3.5 shrink-0 rounded-[1px] border border-black/40" style={{ backgroundColor: complete ? "#4c5a4f" : notebook.color }} />
                    <div className="min-w-0">
                      <div className={`truncate text-[9px] font-bold ${complete ? "line-through" : ""}`}>{notebook.title}</div>
                      <div className="font-mono text-[6px] uppercase tracking-[0.06em] text-mint/30">
                        {complete ? "сдано" : notebook.room}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-panel px-3 py-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.06em] text-cream/50">
                  <Icon name="chalk" size={11} className="text-mint/50" /> мел: <b className="text-lime">{stats.chalk}</b>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.06em] text-cream/50">
                  <Icon name="clock" size={11} className="text-mint/50" /> {fmtTime(stats.elapsed)}
                </span>
                <span className="font-mono text-[7px] uppercase tracking-[0.06em] text-cream/50">
                  ошибки: <b className={stats.mistakes ? "text-[#f0a99e]" : "text-lime"}>{stats.mistakes}</b>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPaused(true)}
                className="flex items-center gap-1 rounded border border-white/15 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.08em] text-cream/50"
              >
                <Icon name="pause" size={9} /> пауза
              </button>
            </div>
          </div>
        </main>

        <aside className="hidden w-[252px] shrink-0 flex-col gap-2.5 lg:flex">
          <MiniMap stats={stats} />

          <div className="rounded-xl border border-white/10 bg-panel p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-cream/65">
                <Icon name="eye" size={11} className="text-oxblood/70" />
                Учитель
              </span>
              <span
                className={`flex items-center gap-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] ${
                  stats.teacher.active ? "text-[#f0a99e]" : "text-mint/35"
                }`}
              >
                <span className={`size-1.5 rounded-full ${stats.teacher.active ? "animate-pulse bg-oxblood" : "bg-mint/30"}`} />
                {stats.teacher.active ? "на охоте" : "не активен"}
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                <div className={`font-display text-[13px] font-bold leading-tight ${dangerTone}`}>
                  {teacherStatus}
                </div>
                <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.06em] text-mint/30">
                  {stats.teacher.active
                    ? stats.teacher.stunned
                      ? "ещё 5 секунд форы"
                      : `дистанция ≈ ${Math.max(1, Math.round(stats.teacher.distance * 1.8))} м`
                    : "услышит первую тетрадь"}
                </div>
              </div>
              <span className="text-oxblood/35">
                <Icon name="warning" size={19} />
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${stats.danger > 0.65 ? "bg-oxblood" : stats.danger > 0.35 ? "bg-[#dfb45d]" : "bg-lime/70"}`}
                style={{ width: `${Math.max(2, stats.danger * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-panel p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-cream/60">Успеваемость</span>
              <Icon name="book" size={11} className="text-mint/30" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-[26px] font-black leading-none text-lime">{stats.correct}</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-mint/35">/ 15 верно</span>
            </div>
            <div className="mt-2 flex h-1 gap-0.5">
              {Array.from({ length: 15 }).map((_, index) => (
                <span key={index} className={`h-full flex-1 ${index < stats.correct ? "bg-lime" : "bg-white/10"}`} />
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[7px] uppercase tracking-[0.06em]">
              <span className="text-mint/30">ошибки: <b className={stats.mistakes ? "text-[#f0a99e]" : "text-cream/60"}>{stats.mistakes}</b></span>
              <span className={stats.exitUnlocked ? "text-lime" : "text-mint/30"}>
                {stats.exitUnlocked ? "выход открыт" : "дверь заперта"}
              </span>
            </div>
          </div>

          <div className={`rounded-xl border p-3 ${stats.exitUnlocked ? "border-lime/30 bg-lime/[0.07]" : "border-white/10 bg-white/[0.025]"}`}>
            <div className={`flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] ${stats.exitUnlocked ? "text-lime" : "text-cream/55"}`}>
              <Icon name={stats.exitUnlocked ? "exit" : "lock"} size={12} />
              {stats.exitUnlocked ? "Дверь открыта" : "Главный выход"}
            </div>
            <p className={`mt-1.5 text-[10px] leading-relaxed ${stats.exitUnlocked ? "text-lime/70" : "text-mint/40"}`}>
              {stats.exitUnlocked
                ? "Не жди звонка. Иди в восточное крыло и открывай дверь."
                : `Сдай оставшиеся тетради: ${5 - stats.notebooksCollected}. Затем выход в восточном крыле.`}
            </p>
          </div>

          <div className="mt-auto rounded-lg border border-dashed border-white/10 px-3 py-2">
            <p className="font-mono text-[7px] uppercase leading-relaxed tracking-[0.08em] text-mint/25">
              Совет: мел работает только в прямой видимости. Не трать его на стены.
            </p>
          </div>
        </aside>
      </div>

      {quizNotebook && (
        <QuizModal
          notebook={quizNotebook}
          difficulty={difficulty}
          onClose={() => {
            setQuizNotebook(null);
            engineRef.current?.abandonNotebook();
          }}
          onFinish={(correct, mistakes) => {
            const notebook = quizNotebook;
            setQuizNotebook(null);
            if (notebook) engineRef.current?.completeNotebook(notebook.id, correct, mistakes);
          }}
        />
      )}

      {result && (
        <ResultOverlay
          result={result.type}
          stats={result.stats}
          difficulty={difficulty}
          onRetry={restart}
          onMenu={onExit}
        />
      )}
    </div>
  );
}
