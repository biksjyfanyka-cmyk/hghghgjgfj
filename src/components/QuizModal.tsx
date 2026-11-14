import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { audio } from "../game/audio";
import { generateQuiz, NUMBER_LABELS } from "../game/math";
import type { Difficulty, NotebookDef } from "../game/map";
import { cn } from "../utils/cn";

interface QuizModalProps {
  notebook: NotebookDef;
  difficulty: Difficulty;
  onFinish: (correct: number, mistakes: number) => void;
  onClose: () => void;
}

export function QuizModal({ notebook, difficulty, onFinish, onClose }: QuizModalProps) {
  const [quiz] = useState(() => generateQuiz(notebook.id, difficulty));
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [selection, setSelection] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "wrong" | "correct">("idle");
  const [completed, setCompleted] = useState(false);
  const question = quiz[index];
  const isLast = index === quiz.length - 1;

  const chooseAnswer = (value: number) => {
    if (status === "correct" || completed) return;
    setSelection(value);
    if (value === question.answer) {
      setStatus("correct");
      audio.play("correct");
    } else {
      setStatus("wrong");
      setMistakes((current) => current + 1);
      audio.play("wrong");
    }
  };

  const next = () => {
    if (status !== "correct") return;
    if (isLast) {
      setCompleted(true);
      audio.play("pickup");
      return;
    }
    setIndex((current) => current + 1);
    setSelection(null);
    setStatus("idle");
    audio.play("click");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (completed) onFinish(3, mistakes);
        else onClose();
        return;
      }
      if (completed) return;
      if (status === "correct" && (event.key === "Enter" || event.code === "Space")) {
        event.preventDefault();
        next();
        return;
      }
      const numeric = Number(event.key);
      if (numeric >= 1 && numeric <= 4) {
        event.preventDefault();
        chooseAnswer(question.options[numeric - 1]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/85 p-3 backdrop-blur-md sm:p-6">
      <div
        className="relative my-auto w-full max-w-[760px] overflow-hidden rounded-[20px] border-2 border-ink bg-cream text-ink shadow-[0_35px_100px_rgba(0,0,0,0.65),10px_10px_0_rgba(213,244,60,0.85)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-ink px-4 py-3 text-cream sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-oxblood" />
            <span className="truncate font-mono text-[9px] uppercase tracking-[0.17em] text-cream/55">
              Контрольная работа
            </span>
            <span className="hidden text-cream/20 sm:inline">/</span>
            <span className="hidden truncate font-mono text-[9px] uppercase tracking-[0.12em] text-cream/55 sm:inline">
              {notebook.room}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="hidden rounded-full px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-ink sm:inline"
              style={{ backgroundColor: notebook.color }}
            >
              Тетрадь {notebook.id + 1} / 5
            </span>
            <button
              type="button"
              onClick={completed ? () => onFinish(3, mistakes) : onClose}
              className="grid size-8 place-items-center rounded-full border border-white/20 text-cream/65 transition-colors hover:border-cream/50 hover:text-cream"
              aria-label="Отложить тетрадь"
              title="Отложить тетрадь (Esc)"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-[152px_1fr]">
          <aside
            className="relative hidden flex-col justify-between overflow-hidden p-4 sm:flex"
            style={{ backgroundColor: notebook.color }}
          >
            <div className="pointer-events-none absolute inset-y-0 left-2 flex flex-col justify-around">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="block size-2 rounded-full border border-ink/60 bg-cream/60" />
              ))}
            </div>
            <div className="pl-5">
              <div className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-ink/55">
                Школа №13
              </div>
              <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-ink/45">
                Математика · {String(notebook.id + 1).padStart(2, "0")}
              </div>
              <div className="mt-8 font-display text-[22px] font-black leading-[0.98] tracking-[-0.06em]">
                {notebook.title.toUpperCase()}
              </div>
            </div>
            <div className="relative pl-5">
              <div className="inline-block -rotate-3 border-2 border-ink/45 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.09em] text-ink/60">
                Фамилия: ты
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-display text-[52px] font-black leading-none tracking-[-0.09em] text-ink/20">
                  {String(notebook.id + 1).padStart(2, "0")}
                </span>
                <span className="mb-1.5 font-mono text-[7px] uppercase leading-tight tracking-[0.08em] text-ink/45">
                  заданий
                  <br />
                  внутри: 03
                </span>
              </div>
            </div>
          </aside>

          <div className="relative min-h-[420px] paper-texture p-4 sm:min-h-[500px] sm:p-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-oxblood/25" />
            {completed ? (
              <div className="flex h-full min-h-[390px] flex-col items-center justify-center text-center sm:min-h-[450px]">
                <div className="animate-stamp grid size-28 place-items-center rounded-full border-[3px] border-[#41603f] text-[#315331] sm:size-32">
                  <div>
                    <div className="font-display text-xl font-black tracking-[-0.05em] sm:text-2xl">СДАНО</div>
                    <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em]">без права возврата</div>
                  </div>
                </div>
                <h2 id="quiz-title" className="mt-5 font-display text-[26px] font-black leading-tight tracking-[-0.055em]">
                  Тетрадь закрыта.
                </h2>
                <p className="mt-2 max-w-[330px] text-[12px] leading-relaxed text-ink/55">
                  Три верных ответа. Учитель сделал пометку в журнале. Похоже, он уже идёт
                  проверять остальные.
                </p>
                <div className="mt-6 grid w-full max-w-[330px] grid-cols-2 gap-2">
                  <div className="rounded-lg border border-ink/15 bg-cream/70 p-3">
                    <div className="font-display text-xl font-bold text-[#315331]">3 / 3</div>
                    <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-ink/40">
                      верных ответов
                    </div>
                  </div>
                  <div className={cn("rounded-lg border p-3", mistakes > 0 ? "border-oxblood/25 bg-oxblood/5" : "border-ink/15 bg-cream/70")}>
                    <div className={cn("font-display text-xl font-bold", mistakes > 0 ? "text-oxblood-dark" : "text-[#315331]")}>
                      {mistakes}
                    </div>
                    <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-ink/40">
                      ошибок
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onFinish(3, mistakes)}
                  className="group mt-6 flex w-full max-w-[330px] items-center justify-between rounded-lg border-2 border-ink bg-ink px-4 py-3 text-cream transition-colors hover:bg-[#263b2e]"
                >
                  <span className="font-display text-[12px] font-bold uppercase">Забрать тетрадь</span>
                  <Icon name="arrow-right" size={16} className="text-lime transition-transform group-hover:translate-x-0.5" />
                </button>
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-ink/35">
                  <Icon name="warning" size={10} /> после этого он станет быстрее
                </p>
              </div>
            ) : (
              <div className="flex min-h-[388px] flex-col sm:min-h-[452px]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-ink/40">
                      {notebook.subject}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {quiz.map((item, itemIndex) => (
                        <span
                          key={item.id}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            itemIndex === index
                              ? "w-8 bg-ink"
                              : itemIndex < index
                                ? "w-4 bg-[#516b48]"
                                : "w-4 bg-ink/15"
                          )}
                        />
                      ))}
                      <span className="ml-1 font-mono text-[8px] uppercase tracking-[0.08em] text-ink/35">
                        {index + 1} / 3
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-ink/35">
                      ошибки
                    </div>
                    <div className={cn("font-display text-lg font-black leading-none", mistakes > 0 ? "text-oxblood" : "text-ink/35")}>
                      {String(mistakes).padStart(2, "0")}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-center py-5 sm:py-7">
                  <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/40">
                    Вычисли значение
                  </div>
                  <h2
                    id="quiz-title"
                    className="font-display text-[clamp(2.1rem,5.8vw,3.4rem)] font-black leading-[1] tracking-[-0.06em] text-ink"
                  >
                    {question.prompt}
                  </h2>

                  <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-2.5" role="group" aria-label="Варианты ответа">
                    {question.options.map((option, optionIndex) => {
                      const chosen = selection === option;
                      const isRight = option === question.answer;
                      const showCorrect = status === "correct" && chosen && isRight;
                      const showWrong = status === "wrong" && chosen && !isRight;
                      return (
                        <button
                          key={`${option}-${optionIndex}`}
                          type="button"
                          disabled={status === "correct"}
                          onClick={() => chooseAnswer(option)}
                          className={cn(
                            "group relative flex items-center gap-2.5 rounded-lg border-2 px-3 py-3 text-left transition-all sm:px-4 sm:py-3.5",
                            showCorrect
                              ? "border-[#426641] bg-[#dcebb7]"
                              : showWrong
                                ? "border-oxblood bg-oxblood/10"
                                : "border-ink/15 bg-cream/75 hover:-translate-y-0.5 hover:border-ink/50 hover:bg-[#e8e4d3]",
                            status === "correct" && !showCorrect && "opacity-45"
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[9px] font-bold",
                              showCorrect
                                ? "border-[#426641] bg-[#426641] text-cream"
                                : showWrong
                                  ? "border-oxblood bg-oxblood text-cream"
                                  : "border-ink/20 text-ink/40 group-hover:border-ink/40 group-hover:text-ink"
                            )}
                          >
                            {showCorrect ? <Icon name="check" size={12} /> : showWrong ? <Icon name="close" size={11} /> : NUMBER_LABELS[optionIndex]}
                          </span>
                          <span className="font-display text-[17px] font-bold tracking-[-0.02em] sm:text-lg">{option}</span>
                          <span className="ml-auto hidden font-mono text-[8px] text-ink/25 sm:inline">
                            {optionIndex + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 min-h-[46px]" aria-live="polite">
                    {status === "wrong" && (
                      <div className="animate-rise flex items-center gap-2 rounded-lg bg-oxblood/10 px-3 py-2 text-[11px] font-semibold text-oxblood-dark">
                        <Icon name="warning" size={14} />
                        Не сходится. Он услышал, как ты сомневаешься. Попробуй ещё.
                      </div>
                    )}
                    {status === "correct" && (
                      <div className="animate-rise flex items-center justify-between gap-2 rounded-lg bg-[#e1ecc7] px-3 py-2">
                        <span className="flex items-center gap-2 text-[11px] font-semibold text-[#315331]">
                          <Icon name="check" size={14} /> Верно. Продолжай, пока он не передумал.
                        </span>
                        <button
                          type="button"
                          onClick={next}
                          className="flex shrink-0 items-center gap-1 rounded-md bg-ink px-2.5 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-lime"
                        >
                          {isLast ? "Сдать" : "Дальше"}
                          <Icon name="arrow-right" size={11} />
                        </button>
                      </div>
                    )}
                    {status === "idle" && (
                      <div className="flex items-center gap-2 px-0.5 text-[10px] text-ink/35">
                        <Icon name="eye" size={13} />
                        Учитель не двигается, пока ты считаешь. Это временно.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-ink/35 transition-colors hover:text-oxblood"
                  >
                    <Icon name="arrow-left" size={11} /> отложить
                  </button>
                  <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink/25">
                    Нажми 1—4 для ответа
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
