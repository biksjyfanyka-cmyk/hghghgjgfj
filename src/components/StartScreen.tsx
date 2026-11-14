import { Icon } from "./Icons";
import { DIFFICULTIES, NOTEBOOKS, type Difficulty } from "../game/map";
import { audio } from "../game/audio";
import { cn } from "../utils/cn";

interface StartScreenProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStart: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

const difficultyOrder: Difficulty[] = ["easy", "classic", "nightmare"];

const ticker = [
  "ЗВОНОК",
  "НЕ ЗАБУДЬ ТЕТРАДЬ",
  "УЧИТЕЛЬ УЖЕ ИДЁТ",
  "МЕЛ РЕШАЕТ",
  "ВЫХОД ОТКРОЕТСЯ ПОСЛЕ ПЯТОЙ",
  "НЕ БЕГИ В СТОЛОВУЮ",
  "МАТЕМАТИКА — ЦАРИЦА НАУК",
];

export function StartScreen({
  difficulty,
  onDifficultyChange,
  onStart,
  muted,
  onToggleMute,
}: StartScreenProps) {
  const begin = () => {
    void audio.unlock();
    audio.play("click");
    onStart();
  };

  return (
    <div className="grain min-h-screen overflow-hidden bg-ink text-cream">
      <header className="relative z-40 border-b border-white/10 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-5 px-5 lg:px-10">
          <a href="#top" className="group flex items-center gap-3" aria-label="Школа №13 — на главную">
            <span className="relative grid size-11 shrink-0 -rotate-3 place-items-center rounded-[4px] border-2 border-ink bg-lime font-display text-xl font-black text-ink shadow-[3px_3px_0_#f2eddd] transition-transform group-hover:rotate-0">
              13
              <span className="absolute -right-1.5 -top-1.5 size-2.5 rounded-full border border-ink bg-oxblood" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[15px] font-black tracking-[-0.04em]">
                ШКОЛА №13
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.33em] text-mint/60">
                После звонка
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.16em] text-cream/65 lg:flex">
            <a className="transition-colors hover:text-lime" href="#rules">
              Правила
            </a>
            <a className="transition-colors hover:text-lime" href="#items">
              Инвентарь
            </a>
            <a className="transition-colors hover:text-lime" href="#start">
              Смена
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="grid size-10 place-items-center rounded-full border border-white/15 text-cream/75 transition-colors hover:border-lime/60 hover:text-lime"
              aria-label={muted ? "Включить звук" : "Выключить звук"}
              title={muted ? "Включить звук" : "Выключить звук"}
            >
              <Icon name={muted ? "mute" : "sound"} size={17} />
            </button>
            <button
              type="button"
              onClick={begin}
              className="group flex items-center gap-3 rounded-full border border-lime bg-lime px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.02em] text-ink transition-colors hover:bg-cream sm:px-5"
            >
              <span className="hidden sm:inline">Начать смену</span>
              <span className="sm:hidden">Играть</span>
              <span className="grid size-6 place-items-center rounded-full bg-ink text-lime transition-transform group-hover:translate-x-0.5">
                <Icon name="arrow-right" size={13} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative">
          <div className="pointer-events-none absolute -left-48 top-20 size-[520px] rounded-full bg-forest/50 blur-[110px]" />
          <div className="pointer-events-none absolute right-0 top-0 h-[700px] w-[55%] bg-[radial-gradient(ellipse_at_top_right,rgba(213,244,60,0.07),transparent_62%)]" />
          <div className="pointer-events-none absolute left-[42%] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />

          <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 pb-14 pt-10 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-10 lg:pb-20 lg:pt-20">
            <div className="relative z-10 flex flex-col">
              <div className="mb-6 flex flex-wrap items-center gap-3 animate-rise">
                <span className="inline-flex items-center gap-2 rounded-full border border-oxblood/40 bg-oxblood/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#f0a99e]">
                  <span className="size-1.5 animate-pulse rounded-full bg-oxblood" />
                  Ночная смена · сезон 1
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
                  Хоррор-комедия · 12+
                </span>
              </div>

              <h1 className="font-adventure font-black leading-[0.86] tracking-[-0.055em]">
                <span className="block text-[clamp(3.1rem,7.6vw,6.7rem)]">
                  ШКОЛА{" "}
                  <span className="relative inline-block text-lime">
                    №13
                    <svg
                      viewBox="0 0 200 19"
                      className="absolute -bottom-1 left-1 h-3 w-[98%] text-lime/55"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M3 13C50 4 112 2 197 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <path d="M10 18C63 11 129 9 176 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </span>
                <span className="mt-2 block text-[clamp(2.45rem,6.2vw,5.4rem)] text-cream">
                  ПОСЛЕ ЗВОНКА
                </span>
              </h1>

              <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
                <p className="max-w-[540px] text-balance text-[15px] leading-relaxed text-mint/80 sm:text-base">
                  Ты остался после уроков. Учитель математики тоже.{" "}
                  <span className="text-cream">Пять тетрадей, пятнадцать примеров</span> и одна
                  дверь, которую очень хочется открыть. Считай быстро. Оглядывайся ещё быстрее.
                </p>
                <div className="hidden rotate-2 border border-cream/20 bg-cream px-3 py-2 text-ink shadow-[3px_3px_0_rgba(242,237,221,0.16)] sm:block">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-oxblood text-cream">
                      <Icon name="warning" size={12} />
                    </span>
                    <span className="font-mono text-[9px] font-bold uppercase leading-tight tracking-[0.08em]">
                      Тихо!
                      <br />
                      Идёт урок
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid max-w-[590px] grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-4">
                {[
                  ["05", "тетрадей"],
                  ["15", "примеров"],
                  ["01", "выход"],
                ].map(([number, label]) => (
                  <div key={label} className="px-4 first:pl-0">
                    <span className="font-display text-2xl font-extrabold text-lime sm:text-[28px]">
                      {number}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-mint/55">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div
                id="start"
                className="mt-8 max-w-[640px] scroll-mt-24 rounded-2xl border border-white/12 bg-panel/75 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon name="bell" size={15} className="text-lime" />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cream">
                      Выбери смену
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-mint/45">
                    ≈ 10–15 мин
                  </span>
                </div>

                <div className="grid gap-1.5 sm:grid-cols-3">
                  {difficultyOrder.map((key) => {
                    const item = DIFFICULTIES[key];
                    const selected = difficulty === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          onDifficultyChange(key);
                          audio.play("click");
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left transition-all",
                          selected
                            ? "border-lime/80 bg-lime text-ink shadow-[inset_0_0_0_1px_rgba(11,17,14,0.1)]"
                            : "border-white/10 bg-white/[0.025] text-cream hover:border-lime/40 hover:bg-white/[0.05]"
                        )}
                      >
                        <span className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold">{item.label}</span>
                          <span
                            className={cn(
                              "size-2 rounded-full border",
                              selected ? "border-ink bg-ink" : "border-cream/30"
                            )}
                          />
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block truncate text-[9px] font-medium",
                            selected ? "text-ink/65" : "text-mint/45"
                          )}
                        >
                          {item.short}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={begin}
                  className="group mt-2 flex w-full items-center justify-between gap-4 rounded-xl border border-lime bg-lime px-4 py-3.5 text-left text-ink transition-colors hover:bg-[#e3ff5a]"
                >
                  <span>
                    <span className="block font-display text-[13px] font-black uppercase tracking-[-0.01em]">
                      Войти в школу
                    </span>
                    <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.11em] text-ink/55">
                      Начать смену · {DIFFICULTIES[difficulty].label}
                    </span>
                  </span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lime transition-transform group-hover:translate-x-1 group-active:scale-95">
                    <Icon name="arrow-right" size={18} />
                  </span>
                </button>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-mint/45">
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[8px] text-cream/70">WASD</kbd>
                    движение
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-cream/60">мышь</span>
                    осмотреться
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[8px] text-cream/70">E</kbd>
                    действие
                  </span>
                </div>
              </div>
            </div>

            <aside className="relative mx-auto w-full max-w-[470px] lg:mx-0 lg:max-w-none">
              <div className="absolute -right-3 -top-4 z-20 rotate-6 bg-oxblood px-4 py-2 font-mono text-[9px] font-bold uppercase leading-tight tracking-[0.11em] text-cream shadow-[3px_3px_0_rgba(6,12,8,0.7)]">
                Не сдал?
                <br />
                Двойка навсегда
              </div>

              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] sm:aspect-[4/5.1] border border-lime/25 bg-forest shadow-[0_30px_90px_rgba(0,0,0,0.4)] sm:aspect-[5/6]">
                <img
                  src="/images/hallway.jpg"
                  alt="Пустой школьный коридор ночью с зелёными шкафчиками и красной дверью"
                  className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-[center_62%] opacity-90 animate-drift"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink/35 via-transparent to-transparent" />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
                  <span className="border border-cream/25 bg-ink/55 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-cream/80 backdrop-blur-sm">
                    Коридор 2 этаж
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-ink/55 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.09em] text-[#f0a99e] backdrop-blur-sm">
                    <span className="size-1.5 animate-pulse rounded-full bg-oxblood" />
                    Rec
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 pb-6 sm:py-6 sm:pl-[160px] sm:pr-6 lg:pl-[168px]">
                  <p className="max-w-[300px] font-display text-[clamp(1.45rem,2.8vw,2rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-cream">
                    НЕ ОБОРАЧИВАЙСЯ.
                    <br />
                    <span className="text-lime">ОН СЧИТАЕТ ШАГИ.</span>
                  </p>
                  <div className="mt-4 flex items-center gap-3 border-t border-white/20 pt-3 sm:mt-3 sm:pt-2.5">
                    <span className="grid size-7 place-items-center rounded-full border border-cream/25 text-cream/80">
                      <Icon name="clock" size={13} />
                    </span>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-cream/55">
                        Текущее время
                      </div>
                      <div className="font-mono text-[11px] font-semibold tracking-[0.08em] text-cream">
                        19:47 · ПУСТАЯ ШКОЛА
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-8 bottom-[-14px] z-20 hidden w-[148px] -rotate-3 overflow-hidden rounded-sm border-2 border-cream/80 bg-forest shadow-[6px_6px_0_rgba(6,12,8,0.7)] sm:block lg:-left-16 lg:w-[168px]">
                <div className="flex items-center justify-between border-b border-cream/25 px-2.5 py-1.5 font-mono text-[7px] uppercase tracking-[0.16em] text-cream/75">
                  <span>Личное дело</span>
                  <span>№013</span>
                </div>
                <div className="relative aspect-[4/5] overflow-hidden bg-forest">
                  <img
                    src="/images/teacher.png"
                    alt="Портрет высокого учителя в бордовом кардигане с деревянной линейкой"
                    className="h-full w-full object-cover object-top"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent px-2.5 pb-2 pt-8">
                    <p className="font-mono text-[7px] uppercase leading-tight tracking-[0.07em] text-cream/60">
                      Учитель математики
                    </p>
                    <p className="font-display text-[10px] font-bold leading-tight">
                      АРКАДИЙ ПЕТРОВИЧ
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-cream px-2.5 py-1 text-ink">
                  <span className="font-mono text-[7px] font-bold uppercase tracking-[0.04em]">Не сдал</span>
                  <span className="font-display text-[9px] font-black text-oxblood-dark">2</span>
                </div>
              </div>

              <div className="absolute -bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-ink/85 px-3.5 py-2 backdrop-blur-md">
                {NOTEBOOKS.map((notebook) => (
                  <span
                    key={notebook.id}
                    className="block h-4 w-3 -skew-y-3 rounded-[1px] border border-black/40"
                    style={{ backgroundColor: notebook.color }}
                  />
                ))}
                <span className="ml-1 font-mono text-[8px] uppercase tracking-[0.1em] text-cream/55">
                  Собери все
                </span>
              </div>
            </aside>
          </div>
        </section>

        <div className="relative overflow-hidden border-y border-ink/20 bg-lime py-3 text-ink">
          <div className="marquee-track flex w-max items-center gap-8">
            {[...ticker, ...ticker].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="flex items-center gap-8 whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
              >
                {item}
                <span className="text-[14px]">✦</span>
              </span>
            ))}
          </div>
        </div>

        <section id="rules" className="relative scroll-mt-24 border-b border-white/10">
          <div className="mx-auto max-w-[1440px] px-5 py-16 lg:px-10 lg:py-24">
            <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-lime">
                  <span className="h-px w-7 bg-lime" />
                  Инструкция №13
                </div>
                <h2 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-extrabold leading-[0.98] tracking-[-0.06em]">
                  Три правила,
                  <br />
                  чтобы дожить до утра.
                </h2>
              </div>
              <p className="max-w-[320px] text-sm leading-relaxed text-mint/60">
                Ты не сдал итоговую. Теперь придётся договариваться. С учителем, с математикой и
                с собственной нервной системой.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Найди тетради",
                  text: "Обыщи шесть кабинетов. В пяти из них лежат разноцветные тетради. Не перепутай со школьным обедом.",
                  icon: "book" as const,
                  theme: "bg-cream text-ink",
                  detail: "5 / 5 тетрадей",
                  color: "#d5f43c",
                },
                {
                  n: "02",
                  title: "Реши примеры",
                  text: "В каждой тетради по три задания. Ошибка не отнимет тетрадь, но учитель услышит твою неуверенность.",
                  icon: "chalk" as const,
                  theme: "bg-[#22362a] text-cream",
                  detail: "15 / 15 примеров",
                  color: "#df8467",
                },
                {
                  n: "03",
                  title: "Сбеги",
                  text: "После пятой тетради главная дверь откроется. Беги. Не оборачивайся. И не спрашивай, почему коридор стал длиннее.",
                  icon: "exit" as const,
                  theme: "bg-oxblood text-cream",
                  detail: "01 / 01 выход",
                  color: "#f2eddd",
                },
              ].map((card) => (
                <article
                  key={card.n}
                  className={cn(
                    "group relative flex min-h-[270px] flex-col overflow-hidden rounded-2xl border border-ink/20 p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6",
                    card.theme
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-display text-[56px] font-black leading-none tracking-[-0.08em] opacity-15">
                      {card.n}
                    </span>
                    <span className="grid size-9 place-items-center rounded-full border border-current/20">
                      <Icon name={card.icon} size={16} />
                    </span>
                  </div>
                  <div className="mt-auto pt-8">
                    <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] opacity-55">
                      <span className="size-1.5 rounded-full" style={{ background: card.color }} />
                      {card.detail}
                    </div>
                    <h3 className="font-display text-xl font-bold tracking-[-0.035em] sm:text-[22px]">
                      {card.title}
                    </h3>
                    <p className="mt-2 max-w-[300px] text-[12px] leading-relaxed opacity-65">
                      {card.text}
                    </p>
                  </div>
                  <span
                    className="absolute -bottom-4 right-4 font-display text-[80px] font-black leading-none opacity-[0.05] transition-transform duration-300 group-hover:-translate-y-1"
                    aria-hidden="true"
                  >
                    {card.n}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="items" className="relative scroll-mt-24 border-b border-white/10">
          <div className="mx-auto grid max-w-[1440px] gap-4 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:px-10 lg:py-24">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-panel p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-oxblood/10 blur-3xl" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mint/50">
                  Досье ученика
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-lime/25 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-lime/80">
                  <Icon name="eye" size={10} />
                  Под наблюдением
                </span>
              </div>
              <blockquote className="mt-12 max-w-[560px] font-display text-[clamp(1.5rem,3.2vw,2.55rem)] font-medium leading-[1.12] tracking-[-0.04em]">
                «Мне всё равно, насколько ты быстрый.
                <br />
                <span className="text-lime">Важно, насколько хорошо ты считаешь.</span>»
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-mint/45">
                  А. П. · учитель математики · стаж 31 год
                </span>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["05", "тетрадей"],
                  ["06", "кабинетов"],
                  ["1.96", "рост, м"],
                  ["0", "жалости"],
                ].map(([n, label]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-ink/35 px-3 py-3">
                    <div className="font-display text-lg font-bold text-cream">{n}</div>
                    <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-mint/45">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-2xl border border-white/10 bg-cream p-5 text-ink sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink/40">
                      Инвентарь 01
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.03em]">
                      Горячий кофе
                    </h3>
                  </div>
                  <span className="grid size-12 place-items-center rounded-full bg-ink text-lime">
                    <Icon name="coffee" size={21} />
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-ink/60">
                  Восстанавливает силы и добавляет скорости на несколько секунд. Найди в
                  библиотеке или кабинете химии.
                </p>
                <div className="mt-4 flex items-center gap-2 border-t border-ink/10 pt-3 font-mono text-[8px] uppercase tracking-[0.12em] text-ink/45">
                  <Icon name="run" size={12} /> Автоматически при подборе
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#20372b] p-5 text-cream sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-mint/40">
                      Инвентарь 02
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.03em]">
                      Кусок мела
                    </h3>
                  </div>
                  <span className="grid size-12 place-items-center rounded-full bg-cream text-forest">
                    <Icon name="chalk" size={21} />
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-mint/65">
                  Мел не только для доски. Брось его кнопкой Q, чтобы оглушить учителя на пять
                  секунд. Целься, пока он не видит.
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-mint/45">
                    <Icon name="spark" size={12} /> Оглушение · 5 сек
                  </span>
                  <kbd className="rounded border border-white/20 bg-white/5 px-2 py-1 font-mono text-[9px] text-cream/70">
                    Q
                  </kbd>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-lime text-ink">
          <div className="pointer-events-none absolute -right-12 top-1/2 -translate-y-1/2 select-none font-display text-[clamp(10rem,30vw,28rem)] font-black leading-none tracking-[-0.1em] opacity-[0.055]">
            13
          </div>
          <div className="relative mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-5 py-14 sm:px-10 lg:flex-row lg:items-end lg:py-20">
            <div>
              <div className="mb-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/55">
                <span className="h-px w-7 bg-ink/40" />
                Смена начинается сейчас
              </div>
              <h2 className="font-display text-[clamp(2.2rem,6vw,4.9rem)] font-black leading-[0.9] tracking-[-0.065em]">
                ПОРА НА УРОК.
                <br />
                ОН УЖЕ ЖДЁТ.
              </h2>
              <p className="mt-4 max-w-[450px] text-[13px] font-medium leading-relaxed text-ink/65">
                У тебя есть всё, что нужно: ноги, голова и пять пустых тетрадей. Ну, почти всё.
              </p>
            </div>
            <button
              type="button"
              onClick={begin}
              className="group flex w-full max-w-[340px] items-center justify-between gap-4 rounded-xl border-2 border-ink bg-ink px-5 py-4 text-left text-cream shadow-[5px_5px_0_rgba(242,237,221,0.45)] transition-transform hover:-translate-y-0.5 lg:w-auto"
            >
              <span>
                <span className="block font-display text-sm font-bold uppercase tracking-[-0.01em]">
                  Начать смену
                </span>
                <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-mint/50">
                  {DIFFICULTIES[difficulty].label} · ≈ 10–15 минут
                </span>
              </span>
              <span className="grid size-10 place-items-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-1">
                <Icon name="arrow-right" size={18} />
              </span>
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-ink">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-[3px] border border-white/20 bg-lime font-display text-sm font-black text-ink">
              13
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-cream/35">
              Школа №13 · После звонка · Минобразования не одобряет
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5 font-mono text-[9px] uppercase tracking-[0.1em] text-cream/30">
            <span>© 2026</span>
            <span>Все оценки вымышлены</span>
            <button type="button" onClick={onToggleMute} className="transition-colors hover:text-lime">
              Звук: {muted ? "выкл" : "вкл"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
