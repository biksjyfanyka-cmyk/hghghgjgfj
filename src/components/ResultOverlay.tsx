import { useEffect, useRef } from "react";
import { Icon } from "./Icons";
import type { GameStats } from "../game/engine";
import type { Difficulty } from "../game/map";
import { DIFFICULTIES } from "../game/map";
import { cn } from "../utils/cn";

interface ResultOverlayProps {
  result: "win" | "lose";
  stats: GameStats;
  difficulty: Difficulty;
  onRetry: () => void;
  onMenu: () => void;
}

const fmtTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export function ResultOverlay({ result, stats, difficulty, onRetry, onMenu }: ResultOverlayProps) {
  const retryRef = useRef<HTMLButtonElement>(null);
  const won = result === "win";
  const grade = won ? (stats.mistakes <= 2 ? "5" : stats.mistakes <= 6 ? "4" : "3") : "2";

  useEffect(() => {
    const timer = window.setTimeout(() => retryRef.current?.focus(), 350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-ink/90 p-3 backdrop-blur-lg sm:p-7">
      <div
        className="relative my-auto w-full max-w-[820px] overflow-hidden rounded-[22px] border border-white/15 bg-panel shadow-[0_40px_120px_rgba(0,0,0,0.75)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        {won && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 16 }).map((_, index) => (
              <span
                key={index}
                className="absolute top-0 h-3 w-1.5 animate-[rise_1s_ease-out_both]"
                style={{
                  left: `${(index * 17 + 8) % 100}%`,
                  backgroundColor: ["#d5f43c", "#f2eddd", "#df8467", "#88cab1"][index % 4],
                  transform: `rotate(${index * 37}deg)`,
                  opacity: 0.75,
                }}
              />
            ))}
          </div>
        )}

        <div className={cn("grid gap-0 md:grid-cols-[1fr_250px]", won && "md:grid-cols-[1fr_220px]")}>
          <div className="relative z-10 p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em]",
                  won
                    ? "border-lime/30 bg-lime/10 text-lime"
                    : "border-oxblood/35 bg-oxblood/10 text-[#f0a99e]"
                )}
              >
                <span className={cn("size-1.5 rounded-full", won ? "bg-lime" : "animate-pulse bg-oxblood")} />
                {won ? "Смена закрыта" : "Смена провалена"}
              </span>
              <span className="rounded-full border border-white/10 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-cream/35">
                {DIFFICULTIES[difficulty].label}
              </span>
            </div>

            <h2
              id="result-title"
              className="mt-5 font-display text-[clamp(2.6rem,7vw,4.8rem)] font-black leading-[0.85] tracking-[-0.075em]"
            >
              {won ? (
                <>
                  ТЫ <span className="text-lime">СБЕЖАЛ.</span>
                </>
              ) : (
                <>
                  ТЫ <span className="text-oxblood">НЕ СДАЛ.</span>
                </>
              )}
            </h2>
            <p className="mt-4 max-w-[450px] text-[13px] leading-relaxed text-mint/60">
              {won
                ? "Дверь закрылась за спиной. В руках — пять тетрадей и очень странное чувство, что завтра придётся вернуться. Но завтра — не сегодня."
                : "Он догнал тебя в коридоре. Линейка не понадобилась: достаточно было одного взгляда. Двойка выставлена. Смена ещё не закончена."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Тетради", `${stats.notebooksCollected} / 5`],
                ["Верно", `${stats.correct} / 15`],
                ["Ошибки", String(stats.mistakes).padStart(2, "0")],
                ["Время", fmtTime(stats.elapsed)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-ink/40 px-3 py-2.5">
                  <div className="font-display text-base font-bold leading-tight text-cream">{value}</div>
                  <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.12em] text-mint/40">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                ref={retryRef}
                type="button"
                onClick={onRetry}
                className={cn(
                  "group flex flex-1 items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 transition-colors",
                  won
                    ? "border-lime bg-lime text-ink hover:bg-[#e4ff6a]"
                    : "border-lime bg-lime text-ink hover:bg-[#e4ff6a]"
                )}
              >
                <span>
                  <span className="block font-display text-[12px] font-black uppercase">
                    {won ? "Ещё один забег" : "Попробовать снова"}
                  </span>
                  <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.09em] opacity-50">
                    Начнётся новая смена
                  </span>
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-lime">
                  <Icon name="restart" size={14} />
                </span>
              </button>
              <button
                type="button"
                onClick={onMenu}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-cream/65 transition-colors hover:border-white/30 hover:text-cream"
              >
                <Icon name="home" size={14} />
                В меню
              </button>
            </div>
          </div>

          <div
            className={cn(
              "relative z-10 flex flex-col justify-between overflow-hidden border-t border-white/10 p-5 md:border-l md:border-t-0",
              won ? "bg-[#1b2b20]" : "bg-[#241815]"
            )}
          >
            {won ? (
              <>
                <div>
                  <div className="font-mono text-[8px] uppercase leading-relaxed tracking-[0.13em] text-mint/40">
                    Выписка из журнала
                    <br />
                    успеваемости
                  </div>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="font-display text-[76px] font-black leading-none tracking-[-0.1em] text-lime">
                      {grade}
                    </span>
                    <span className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-cream/45">
                      из 5
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-20 bg-lime" />
                  <p className="mt-5 text-[10px] leading-relaxed text-mint/50">
                    Домашнее задание на завтра: никому не рассказывать, что было в кабинете химии.
                  </p>
                </div>
                <div className="mt-6">
                  <div className="font-display text-[15px] font-bold leading-tight text-cream/90">
                    Школа №13
                  </div>
                  <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.13em] text-mint/35">
                    До следующего звонка
                  </div>
                  <div className="mt-3 inline-block -rotate-3 border-2 border-lime/60 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-lime">
                    Зачёт
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="relative mx-auto mb-4 w-[130px] overflow-hidden rounded-sm border border-cream/25 sm:w-[150px]">
                  <img
                    src="/images/teacher.png"
                    alt="Учитель математики"
                    className="aspect-[4/5] w-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#241815] via-transparent to-transparent" />
                </div>
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#f0a99e]/60">
                    Замечание классного руководителя
                  </p>
                  <p className="mt-2 font-display text-[14px] font-semibold leading-snug text-cream/90">
                    «Ты забыл постучаться. И поздороваться. И решить третье задание».
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-cream/35">
                      А. П.
                    </span>
                    <span className="font-display text-[13px] font-bold text-oxblood">ОЦЕНКА: 2</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
