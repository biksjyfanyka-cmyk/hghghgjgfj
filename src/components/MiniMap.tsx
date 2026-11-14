import { memo } from "react";
import { Icon } from "./Icons";
import {
  EXIT_POS,
  MAP,
  MAP_H,
  MAP_W,
  NOTEBOOKS,
  ROOMS,
  T,
} from "../game/map";
import type { GameStats } from "../game/engine";

const wallPath = (() => {
  const parts: string[] = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (MAP[y][x] !== T.FLOOR) {
        if (MAP[y][x] === T.DESK || MAP[y][x] === T.SHELF || MAP[y][x] === T.TABLE) continue;
        parts.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }
  return parts.join(" ");
})();

const furniturePath = (() => {
  const parts: string[] = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = MAP[y][x];
      if (tile === T.DESK || tile === T.SHELF || tile === T.TABLE) {
        parts.push(`M${x + 0.16} ${y + 0.18}h0.68v0.64h-0.68z`);
      }
    }
  }
  return parts.join(" ");
})();

const normalizeAngle = (angle: number) => {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
};

function distanceToTarget(stats: GameStats) {
  const remaining = NOTEBOOKS.filter((notebook) => !stats.completedIds.includes(notebook.id));
  if (remaining.length > 0) {
    return [...remaining].sort(
      (a, b) =>
        Math.hypot(a.x - stats.player.x, a.y - stats.player.y) -
        Math.hypot(b.x - stats.player.x, b.y - stats.player.y)
    )[0];
  }
  return { id: -1, title: "Выход", x: EXIT_POS.x, y: EXIT_POS.y, color: "#f2eddd" };
}

export const MiniMap = memo(function MiniMap({ stats }: { stats: GameStats }) {
  const target = distanceToTarget(stats);
  const dx = target.x - stats.player.x;
  const dy = target.y - stats.player.y;
  const targetAngle = Math.atan2(dy, dx);
  const relative = normalizeAngle(targetAngle - stats.player.angle);
  const targetDistance = Math.hypot(dx, dy);
  const relativeDegrees = (relative * 180) / Math.PI;
  const direction =
    Math.abs(relativeDegrees) < 25
      ? "прямо"
      : Math.abs(relativeDegrees) > 155
        ? "позади"
        : relativeDegrees > 0
          ? "справа"
          : "слева";

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-cream text-ink shadow-[0_8px_28px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between border-b border-ink/15 px-3 py-2">
        <span className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em]">
          <Icon name="map" size={11} />
          План эвакуации
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink/35">2 этаж</span>
      </div>

      <div className="relative bg-[#ddd6c3] p-2">
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(11,17,14,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(11,17,14,.4)_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="relative overflow-hidden rounded-sm border border-ink/25 bg-[#f1ecdd]">
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block h-auto w-full" aria-hidden="true">
            <rect width={MAP_W} height={MAP_H} fill="#f1ecdd" />
            <rect x="1" y="8" width="28.8" height="2" fill="#ddd5bf" />
            <path d={wallPath} fill="#617265" />
            <path d={furniturePath} fill="#af9567" opacity="0.72" />
            <path d={`M29 7.6h1.7v2.8H29z`} fill="#b94e40" />
            {ROOMS.map((room) => (
              <text
                key={room.id}
                x={(room.x1 + room.x2 + 1) / 2}
                y={(room.y1 + room.y2 + 1) / 2 + 2.2}
                textAnchor="middle"
                fontFamily="Manrope, Arial, sans-serif"
                fontSize="0.62"
                fontWeight="700"
                fill="#2e3d31"
                opacity="0.38"
              >
                {room.index}
              </text>
            ))}
            <text x="14.5" y="9.65" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="0.55" fill="#405143" opacity="0.65">
              КОРИДОР
            </text>

            {NOTEBOOKS.map((notebook) => {
              const complete = stats.completedIds.includes(notebook.id);
              const isTarget = target.id === notebook.id;
              return (
                <g key={notebook.id} transform={`translate(${notebook.x} ${notebook.y})`}>
                  {isTarget && (
                    <circle r="0.72" fill="none" stroke={notebook.color} strokeWidth="0.12" opacity="0.8">
                      <animate attributeName="r" values="0.42;0.8;0.42" dur="2.1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.12;0.8" dur="2.1s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle r="0.43" fill={complete ? "#7b8a7d" : notebook.color} stroke="#28352b" strokeWidth="0.1" />
                  {complete ? (
                    <path d="M-0.17 0.03l0.13 0.15l0.24-0.31" fill="none" stroke="#f2eddd" strokeWidth="0.11" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <text textAnchor="middle" y="0.17" fontFamily="Manrope, Arial, sans-serif" fontSize="0.48" fontWeight="800" fill="#263128">
                      {notebook.id + 1}
                    </text>
                  )}
                </g>
              );
            })}

            <g transform={`translate(${EXIT_POS.x} ${EXIT_POS.y})`}>
              <circle r="0.4" fill={stats.exitUnlocked ? "#d5f43c" : "#b94e40"} stroke="#28352b" strokeWidth="0.1" />
              {!stats.exitUnlocked && <path d="M-0.12 -0.1v-0.14a0.14 0.14 0 0 1 0.28 0v0.14M-0.18 -0.08h0.36v0.27h-0.36z" fill="#f2eddd" />}
            </g>

            {stats.teacher.active && stats.teacher.visible && (
              <g transform={`translate(${stats.teacher.x} ${stats.teacher.y})`} className={stats.teacher.stunned ? "" : "animate-pulse"}>
                <circle r="0.78" fill="none" stroke="#b94e40" strokeWidth="0.12" opacity="0.45" />
                <circle r="0.44" fill="#b94e40" stroke="#2d1613" strokeWidth="0.1" />
                <path d="M0 -0.22v0.26M0 0.17v0.04" stroke="#f2eddd" strokeWidth="0.13" strokeLinecap="round" />
              </g>
            )}

            <g transform={`translate(${stats.player.x} ${stats.player.y})`}>
              <circle r="0.84" fill="#d5f43c" opacity="0.18" />
              <g transform={`rotate(${(stats.player.angle * 180) / Math.PI})`}>
                <path d="M0.56 0L-0.32 -0.37L-0.16 0L-0.32 0.37Z" fill="#263128" stroke="#d5f43c" strokeWidth="0.1" />
              </g>
            </g>

            <g transform={`translate(${MAP_W - 1.2} 1.07)`}>
              <path d="M0 -0.32L0.14 0.15L0 0.04L-0.14 0.15Z" fill="#304235" />
              <text y="0.65" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="0.42" fontWeight="700" fill="#304235">
                С
              </text>
            </g>
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-ink/10 px-3 py-2">
        <div className="flex items-center gap-3 font-mono text-[7px] uppercase tracking-[0.07em] text-ink/45">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-ink" /> Вы
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-oxblood" /> Опасность
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-lime-dark" /> Выход
          </span>
        </div>
        <span className="font-mono text-[7px] uppercase tracking-[0.06em] text-ink/30">М 1:100</span>
      </div>

      <div className="border-t border-ink/10 bg-[#e4ddcc] px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-7 shrink-0 place-items-center rounded-full border border-ink/15 bg-ink text-lime transition-transform"
            style={{ transform: `rotate(${relativeDegrees - 90}deg)` }}
          >
            <Icon name="arrow-right" size={13} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-bold leading-tight">
              {target.title}
              <span className="ml-1 font-mono text-[8px] font-medium uppercase text-ink/35">
                {direction}
              </span>
            </div>
            <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink/40">
              ≈ {Math.max(1, Math.round(targetDistance * 1.8))} м · этаж 2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
