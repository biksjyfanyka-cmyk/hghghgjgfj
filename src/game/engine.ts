import { audio } from "./audio";
import {
  DIFFICULTIES,
  EXIT_POS,
  ITEMS,
  MAP,
  MAP_H,
  MAP_W,
  NOTEBOOKS,
  PLAYER_SPAWN,
  T,
  TEACHER_SPAWN,
  getRoomAt,
  isWalkable,
  tileAt,
  type Difficulty,
  type ItemDef,
  type NotebookDef,
} from "./map";

export type EventTone = "success" | "warning" | "danger" | "info";

export interface EngineEvent {
  kind: EventTone;
  message: string;
}

export interface NearTarget {
  kind: "notebook" | "item" | "exit";
  id: string;
  label: string;
  action: string;
}

export interface GameStats {
  elapsed: number;
  player: { x: number; y: number; angle: number };
  teacher: { x: number; y: number; active: boolean; stunned: boolean; distance: number; visible: boolean };
  notebooksCollected: number;
  completedIds: number[];
  chalk: number;
  stamina: number;
  staminaExhausted: boolean;
  sprinting: boolean;
  boost: number;
  correct: number;
  mistakes: number;
  room: string;
  danger: number;
  exitUnlocked: boolean;
  near: NearTarget | null;
}

export interface GameCallbacks {
  onStats: (stats: GameStats) => void;
  onNotebookOpen: (notebook: NotebookDef) => void;
  onWin: (stats: GameStats) => void;
  onLose: (stats: GameStats) => void;
  onEvent: (event: EngineEvent) => void;
}

interface Point {
  x: number;
  y: number;
}

interface RayHit {
  distance: number;
  side: number;
  tile: number;
  wallX: number;
  mapX: number;
  mapY: number;
}

const FOV = (72 * Math.PI) / 180;
const PLAYER_RADIUS = 0.21;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const WALL_COLORS: Record<number, [number, number, number]> = {
  [T.WALL]: [174, 181, 157],
  [T.LOCKER]: [101, 119, 89],
  [T.DESK]: [145, 112, 71],
  [T.SHELF]: [110, 79, 53],
  [T.TABLE]: [127, 96, 64],
  [T.EXIT]: [123, 48, 43],
};

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  return [canvas, ctx];
}

function createTeacherSprite(stunned = false): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(230, 470);
  c.lineCap = "round";
  c.lineJoin = "round";

  // Long shadow
  c.fillStyle = "rgba(0,0,0,0.3)";
  c.beginPath();
  c.ellipse(116, 447, 80, 13, 0, 0, Math.PI * 2);
  c.fill();

  // Long, sensible trousers
  c.fillStyle = "#40372b";
  c.fillRect(88, 316, 24, 103);
  c.fillRect(122, 316, 24, 103);
  c.fillStyle = "rgba(20,24,19,0.35)";
  c.fillRect(112, 316, 4, 103);
  c.fillStyle = "#191f19";
  c.beginPath();
  c.ellipse(93, 432, 27, 12, -0.07, 0, Math.PI * 2);
  c.ellipse(142, 432, 27, 12, 0.07, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#302a21";
  c.fillRect(83, 422, 24, 8);
  c.fillRect(126, 422, 24, 8);

  // Cardigan with unsettlingly long body
  c.fillStyle = "#6b3a33";
  c.strokeStyle = "#37201c";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(78, 151);
  c.bezierCurveTo(61, 218, 67, 290, 75, 337);
  c.quadraticCurveTo(116, 350, 159, 337);
  c.bezierCurveTo(168, 285, 174, 218, 156, 151);
  c.quadraticCurveTo(117, 137, 78, 151);
  c.fill();
  c.stroke();
  c.strokeStyle = "#4b2822";
  c.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.moveTo(84, 168 + i * 28);
    c.lineTo(128, 168 + i * 28);
    c.stroke();
  }
  c.fillStyle = "#55302a";
  c.fillRect(114, 160, 5, 170);

  // Shirt, tie and a small, terrible badge
  c.fillStyle = "#ddd2b6";
  c.beginPath();
  c.moveTo(99, 145);
  c.lineTo(137, 145);
  c.lineTo(125, 243);
  c.lineTo(116, 243);
  c.closePath();
  c.fill();
  c.fillStyle = "#253c2d";
  c.beginPath();
  c.moveTo(115, 148);
  c.lineTo(127, 148);
  c.lineTo(131, 181);
  c.lineTo(121, 197);
  c.lineTo(111, 181);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(113, 195);
  c.lineTo(129, 195);
  c.lineTo(125, 245);
  c.lineTo(112, 226);
  c.closePath();
  c.fill();
  c.fillStyle = "#d5f43c";
  c.beginPath();
  c.roundRect(83, 225, 23, 18, 3);
  c.fill();
  c.fillStyle = "#1b241c";
  c.font = "700 10px Manrope, Arial, sans-serif";
  c.textAlign = "center";
  c.fillText("13", 94.5, 238);

  // Legs of the cardigan
  c.strokeStyle = "#6b3a33";
  c.lineWidth = 24;
  c.beginPath();
  c.moveTo(84, 176);
  c.bezierCurveTo(48, 226, 51, 298, 66, 359);
  c.stroke();
  c.beginPath();
  c.moveTo(155, 176);
  c.bezierCurveTo(193, 220, 192, 281, 180, 324);
  c.stroke();
  c.strokeStyle = "#d4b694";
  c.lineWidth = 15;
  c.beginPath();
  c.moveTo(66, 353);
  c.lineTo(60, 380);
  c.stroke();
  c.beginPath();
  c.moveTo(181, 317);
  c.lineTo(186, 351);
  c.stroke();

  // The ruler. Educational purposes only.
  c.save();
  c.translate(188, 342);
  c.rotate(-0.23);
  c.fillStyle = "#c99a54";
  c.strokeStyle = "#4b3019";
  c.lineWidth = 4;
  c.beginPath();
  c.roundRect(-15, -185, 30, 219, 4);
  c.fill();
  c.stroke();
  c.strokeStyle = "rgba(65,40,19,0.5)";
  c.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    c.beginPath();
    c.moveTo(-10, -168 + i * 16);
    c.lineTo(i % 2 ? 1 : 8, -168 + i * 16);
    c.stroke();
  }
  c.restore();

  // Neck and small, high head
  c.fillStyle = "#d3b391";
  c.fillRect(104, 123, 25, 29);
  c.beginPath();
  c.ellipse(116, 88, 43, 51, -0.02, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#c5a781";
  c.beginPath();
  c.ellipse(149, 93, 7, 15, 0.08, 0, Math.PI * 2);
  c.fill();

  // Hair with an unforgivable side part
  c.fillStyle = "#241f1b";
  c.beginPath();
  c.moveTo(73, 87);
  c.quadraticCurveTo(65, 27, 113, 25);
  c.quadraticCurveTo(168, 24, 161, 82);
  c.quadraticCurveTo(150, 55, 130, 55);
  c.quadraticCurveTo(100, 57, 94, 42);
  c.quadraticCurveTo(87, 64, 73, 87);
  c.fill();

  // Round glasses, glowing with quiet menace
  for (const ex of [98, 137]) {
    if (!stunned) {
      const glow = c.createRadialGradient(ex, 91, 2, ex, 91, 19);
      glow.addColorStop(0, "rgba(246,243,213,0.95)");
      glow.addColorStop(0.8, "rgba(233,232,198,0.5)");
      glow.addColorStop(1, "rgba(233,232,198,0)");
      c.fillStyle = glow;
      c.beginPath();
      c.arc(ex, 91, 21, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = "#2c2620";
    c.lineWidth = 3.5;
    c.fillStyle = stunned ? "#efe9d4" : "#f7f5e5";
    c.beginPath();
    c.ellipse(ex, 91, 19, 15.5, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }
  c.strokeStyle = "#2c2620";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(116, 89);
  c.lineTo(119, 89);
  c.moveTo(79, 87);
  c.lineTo(71, 85);
  c.moveTo(156, 87);
  c.lineTo(164, 84);
  c.stroke();
  if (stunned) {
    for (const ex of [98, 137]) {
      c.strokeStyle = "#2c2620";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(ex - 7, 85);
      c.lineTo(ex + 7, 98);
      c.moveTo(ex + 7, 85);
      c.lineTo(ex - 7, 98);
      c.stroke();
    }
  } else {
    c.fillStyle = "#1a2018";
    c.beginPath();
    c.arc(98, 92, 3.3, 0, Math.PI * 2);
    c.arc(137, 92, 3.3, 0, Math.PI * 2);
    c.fill();
  }

  // Brows and a smile that has read the whole textbook
  c.strokeStyle = "#302620";
  c.lineWidth = 3.5;
  c.beginPath();
  c.moveTo(83, 71);
  c.lineTo(109, 68);
  c.moveTo(126, 68);
  c.lineTo(152, 72);
  c.stroke();
  c.strokeStyle = "#5b3f35";
  c.lineWidth = 3.5;
  c.beginPath();
  c.arc(116, 110, 23, 0.18, Math.PI - 0.18);
  c.stroke();
  c.fillStyle = "#e3d5b7";
  c.fillRect(107, 125, 18, 3);

  return canvas;
}

function createNotebookSprite(color: string, number: number): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(150, 164);
  c.lineCap = "round";

  c.fillStyle = "rgba(0,0,0,0.24)";
  c.beginPath();
  c.ellipse(76, 151, 52, 8, 0, 0, Math.PI * 2);
  c.fill();

  c.save();
  c.translate(8, 6);
  c.rotate(-0.045);
  c.fillStyle = "#20271f";
  c.beginPath();
  c.roundRect(9, 9, 124, 142, 7);
  c.fill();
  c.fillStyle = color;
  c.strokeStyle = "#141a15";
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(4, 4, 124, 142, 7);
  c.fill();
  c.stroke();
  c.fillStyle = "rgba(255,255,255,0.24)";
  c.fillRect(9, 9, 112, 7);
  c.fillStyle = "#f3eedf";
  c.beginPath();
  c.roundRect(27, 37, 78, 54, 3);
  c.fill();
  c.fillStyle = "#1d251e";
  c.font = "800 26px Unbounded, Arial Black, sans-serif";
  c.textAlign = "center";
  c.fillText(String(number + 1), 66, 76);
  c.font = "700 8px Manrope, Arial, sans-serif";
  c.fillText("МАТЕМАТИКА", 66, 85);
  c.fillStyle = "rgba(24,32,23,0.32)";
  for (let i = 0; i < 3; i++) {
    c.fillRect(34, 105 + i * 10, 58 - i * 12, 2);
  }
  c.fillStyle = "#bfc5b6";
  for (let i = 0; i < 7; i++) {
    c.strokeStyle = "#3a4038";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(5, 22 + i * 17, 8, -1.2, 1.2);
    c.stroke();
  }
  c.restore();
  return canvas;
}

function createItemSprite(kind: ItemDef["kind"]): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(110, 130);
  if (kind === "coffee") {
    c.fillStyle = "rgba(0,0,0,0.22)";
    c.beginPath();
    c.ellipse(55, 117, 30, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#efe6d3";
    c.strokeStyle = "#2d342b";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(29, 43);
    c.lineTo(81, 43);
    c.lineTo(74, 112);
    c.quadraticCurveTo(55, 120, 36, 112);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#344c3c";
    c.beginPath();
    c.roundRect(24, 36, 62, 15, 5);
    c.fill();
    c.stroke();
    c.fillStyle = "#d5f43c";
    c.fillRect(36, 73, 38, 23);
    c.fillStyle = "#1c251d";
    c.font = "800 14px Unbounded, Arial, sans-serif";
    c.textAlign = "center";
    c.fillText("13", 55, 89);
    c.strokeStyle = "rgba(238,232,216,0.6)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(43, 29);
    c.bezierCurveTo(35, 19, 49, 13, 44, 4);
    c.moveTo(66, 30);
    c.bezierCurveTo(58, 19, 72, 12, 66, 4);
    c.stroke();
  } else {
    c.fillStyle = "rgba(0,0,0,0.22)";
    c.beginPath();
    c.ellipse(55, 112, 33, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(213,244,60,0.2)";
    c.beginPath();
    c.ellipse(56, 66, 45, 45, 0, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.translate(55, 68);
    c.rotate(-0.38);
    c.fillStyle = "#f5f0df";
    c.strokeStyle = "#8a8c7d";
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(-15, -42, 30, 77, 5);
    c.fill();
    c.stroke();
    c.fillStyle = "#c9bfa5";
    c.fillRect(-8, -32, 16, 42);
    c.restore();
    c.fillStyle = "#f7f1dc";
    c.beginPath();
    c.arc(86, 56, 6, 0, Math.PI * 2);
    c.arc(74, 91, 3, 0, Math.PI * 2);
    c.fill();
  }
  return canvas;
}

function createExitSprite(): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(180, 310);
  c.fillStyle = "#48231f";
  c.beginPath();
  c.roundRect(4, 4, 172, 302, 5);
  c.fill();
  c.fillStyle = "#7b332d";
  c.fillRect(16, 16, 65, 274);
  c.fillRect(99, 16, 65, 274);
  c.strokeStyle = "#341a17";
  c.lineWidth = 4;
  c.strokeRect(16, 16, 65, 274);
  c.strokeRect(99, 16, 65, 274);
  c.fillStyle = "rgba(220,204,169,0.19)";
  c.fillRect(52, 37, 12, 121);
  c.fillRect(135, 37, 12, 121);
  c.fillStyle = "#c8bb9e";
  c.fillRect(30, 193, 37, 7);
  c.fillRect(113, 193, 37, 7);
  c.fillStyle = "#2a5639";
  c.strokeStyle = "#172f1f";
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(43, 24, 94, 39, 3);
  c.fill();
  c.stroke();
  c.fillStyle = "#e7f4c0";
  c.font = "800 16px Manrope, Arial, sans-serif";
  c.textAlign = "center";
  c.fillText("ВЫХОД", 90, 50);
  c.fillStyle = "rgba(0,0,0,0.16)";
  c.fillRect(16, 278, 148, 12);
  return canvas;
}

function rgbaColor([r, g, b]: [number, number, number], factor: number) {
  return `rgb(${Math.round(clamp(r * factor, 0, 255))},${Math.round(
    clamp(g * factor, 0, 255)
  )},${Math.round(clamp(b * factor, 0, 255))})`;
}

export class SchoolGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private difficulty: Difficulty;
  private callbacks: GameCallbacks;
  private W = 960;
  private H = 540;
  private horizon = 270;
  private projection = 560;
  private depthFade = 0;
  private dpr = 1;

  // Player state
  private px = PLAYER_SPAWN.x;
  private py = PLAYER_SPAWN.y;
  private angle = PLAYER_SPAWN.angle;
  private stamina = 100;
  private staminaExhausted = false;
  private boost = 0;
  private moving = false;
  private sprinting = false;
  private stepTimer = 0;
  private bobPhase = 0;

  // Run state
  private elapsed = 0;
  private paused = false;
  private over = false;
  private collected = new Set<number>();
  private takenItems = new Set<string>();
  private chalk = 0;
  private correctAnswers = 0;
  private mistakes = 0;
  private exitUnlocked = false;

  // Teacher state
  private teacherX = TEACHER_SPAWN.x;
  private teacherY = TEACHER_SPAWN.y;
  private teacherActive = false;
  private teacherStun = 0;
  private teacherGrace = 0;
  private teacherBuff = 0;
  private teacherPath: Point[] = [];
  private repathTimer = 0;

  // Loop and UI
  private near: NearTarget | null = null;
  private statTimer = 0;
  private raf = 0;
  private lastTime = 0;
  private running = false;
  private keys = new Set<string>();
  private virtual = new Set<string>();
  private dragging = false;
  private pointerX = 0;
  private zBuffer: Float32Array = new Float32Array(0);
  private interactCooldown = 0;
  private teacherVisible = false;
  private sprites: Record<string, HTMLCanvasElement> = {};
  private resizeObserver: ResizeObserver | null = null;
  private lastStepAt = -1;

  constructor(canvas: HTMLCanvasElement, difficulty: Difficulty, callbacks: GameCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D is unavailable");
    this.ctx = ctx;
    this.difficulty = difficulty;
    this.callbacks = callbacks;
    this.buildSprites();
    this.bindEvents();
    this.resize();
  }

  private buildSprites() {
    this.sprites.teacher = createTeacherSprite(false);
    this.sprites.teacherStunned = createTeacherSprite(true);
    NOTEBOOKS.forEach((notebook) => {
      this.sprites[`notebook-${notebook.id}`] = createNotebookSprite(notebook.color, notebook.id);
    });
    this.sprites.coffee = createItemSprite("coffee");
    this.sprites.chalk = createItemSprite("chalk");
    this.sprites.exit = createExitSprite();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.resize();
    this.raf = requestAnimationFrame(this.loop);
    audio.startAmbient();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.unbindEvents();
    if (this.resizeObserver) this.resizeObserver.disconnect();
    audio.stopAmbient();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (!paused) this.lastTime = performance.now();
  }

  setVirtual(control: string, pressed: boolean) {
    if (pressed) this.virtual.add(control);
    else this.virtual.delete(control);
    void audio.unlock();
  }

  interact() {
    if (this.paused || this.over || this.interactCooldown > 0) return;
    this.interactCooldown = 0.24;
    const near = this.findNearby();
    this.near = near;
    if (!near) return;
    void audio.unlock();

    if (near.kind === "notebook") {
      const notebook = NOTEBOOKS.find((book) => String(book.id) === near.id);
      if (!notebook) return;
      this.paused = true;
      audio.play("pickup");
      this.callbacks.onNotebookOpen(notebook);
      return;
    }

    if (near.kind === "item") {
      const item = ITEMS.find((entry) => entry.id === near.id);
      if (!item) return;
      this.takenItems.add(item.id);
      if (item.kind === "coffee") {
        this.boost = 7;
        this.stamina = 100;
        this.staminaExhausted = false;
        audio.play("pickup");
        this.notify("success", "Кофе выпит залпом. Бег ускорен на 7 секунд.");
      } else {
        this.chalk = Math.min(3, this.chalk + 1);
        audio.play("pickup");
        this.notify("success", `Мел в кармане. В запасе: ${this.chalk}. Q — оглушить учителя.`);
      }
      this.emitStats();
      return;
    }

    if (near.kind === "exit") {
      if (this.exitUnlocked) this.win();
      else {
        audio.play("locked");
        const missing = NOTEBOOKS.length - this.collected.size;
        this.notify("warning", `Дверь заперта. Осталось сдать тетрадей: ${missing}.`);
      }
    }
  }

  useChalk() {
    if (this.paused || this.over) return;
    if (this.chalk <= 0) {
      this.notify("warning", "Мел закончился. Ищи мелки в спортзале и столовой.");
      return;
    }
    if (!this.teacherActive) {
      this.notify("info", "Пока некого оглушать. Пусть мел подождёт.");
      return;
    }
    const distance = Math.hypot(this.teacherX - this.px, this.teacherY - this.py);
    if (distance > 8.5) {
      this.notify("info", "Слишком далеко. Подойди ближе, чтобы попасть.");
      return;
    }
    if (!this.hasLineOfSight(this.px, this.py, this.teacherX, this.teacherY)) {
      this.notify("warning", "Через стены мел не летает. Нужна прямая видимость.");
      return;
    }
    this.chalk -= 1;
    this.teacherStun = 5.5;
    audio.play("chalk");
    this.notify("success", "Попадание! Учитель ослеплён мелом на 5 секунд.");
    this.emitStats();
  }

  completeNotebook(notebookId: number, correct: number, mistakes: number) {
    if (this.collected.has(notebookId)) {
      this.paused = false;
      return;
    }
    this.collected.add(notebookId);
    this.correctAnswers += correct;
    this.mistakes += mistakes;
    this.paused = false;
    this.teacherBuff = 4;

    if (!this.teacherActive) {
      this.teacherActive = true;
      this.teacherGrace = 2.4;
      this.repathTimer = 0;
      audio.play("teacher");
      this.notify("danger", "Он услышал, как ты открыл тетрадь. Учитель вышел на охоту.");
    } else if (this.collected.size === NOTEBOOKS.length) {
      audio.play("unlock");
    } else {
      this.notify("success", "Тетрадь сдана. Он стал чуть быстрее — не задерживайся.");
    }

    if (this.collected.size === NOTEBOOKS.length) {
      this.exitUnlocked = true;
      audio.play("unlock");
      this.notify("success", "Все пять тетрадей сданы. Выход открыт — беги к главной двери.");
    }

    this.near = this.findNearby();
    this.emitStats();
  }

  abandonNotebook() {
    this.paused = false;
    this.emitStats();
  }

  snapshot(): GameStats {
    return this.buildStats();
  }

  private notify(kind: EventTone, message: string) {
    this.callbacks.onEvent({ kind, message });
  }

  private win() {
    if (this.over) return;
    this.over = true;
    audio.play("win");
    this.callbacks.onWin(this.buildStats());
  }

  private lose() {
    if (this.over) return;
    this.over = true;
    this.moving = false;
    audio.play("lose");
    this.callbacks.onLose(this.buildStats());
  }

  private buildStats(): GameStats {
    const teacherDistance = Math.hypot(this.teacherX - this.px, this.teacherY - this.py);
    const room = getRoomAt(this.px, this.py);
    return {
      elapsed: this.elapsed,
      player: { x: this.px, y: this.py, angle: this.angle },
      teacher: {
        x: this.teacherX,
        y: this.teacherY,
        active: this.teacherActive,
        stunned: this.teacherStun > 0,
        distance: teacherDistance,
        visible: this.teacherVisible,
      },
      notebooksCollected: this.collected.size,
      completedIds: [...this.collected],
      chalk: this.chalk,
      stamina: this.stamina,
      staminaExhausted: this.staminaExhausted,
      sprinting: this.sprinting,
      boost: this.boost,
      correct: this.correctAnswers,
      mistakes: this.mistakes,
      room: room ? room.name : "Коридор",
      danger: this.teacherActive ? clamp(1 - teacherDistance / 11, 0, 1) : 0,
      exitUnlocked: this.exitUnlocked,
      near: this.near,
    };
  }

  private emitStats() {
    this.callbacks.onStats(this.buildStats());
  }

  private bindEvents() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
    } else {
      window.addEventListener("resize", this.resize);
    }
  }

  private unbindEvents() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
    if (event.repeat) return;
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code) &&
      !this.paused
    ) {
      event.preventDefault();
    }
    this.keys.add(event.code);
    void audio.unlock();
    if (event.code === "KeyE") this.interact();
    if (event.code === "KeyQ") this.useChalk();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private onBlur = () => {
    this.keys.clear();
    this.virtual.clear();
  };

  private onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    this.dragging = true;
    this.pointerX = event.clientX;
    this.canvas.setPointerCapture?.(event.pointerId);
    void audio.unlock();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging || this.paused || this.over) return;
    const delta = event.clientX - this.pointerX;
    this.pointerX = event.clientX;
    this.angle += delta * 0.0043;
  };

  private onPointerUp = () => {
    this.dragging = false;
  };

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || 960));
    const height = Math.max(240, Math.round(rect.height || 540));
    this.dpr = clamp(window.devicePixelRatio || 1, 1, 1.5);
    if (this.canvas.width !== Math.round(width * this.dpr)) {
      this.canvas.width = Math.round(width * this.dpr);
    }
    if (this.canvas.height !== Math.round(height * this.dpr)) {
      this.canvas.height = Math.round(height * this.dpr);
    }
    this.W = width;
    this.H = height;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.zBuffer = new Float32Array(width + 1);
  };

  private isPressed(...codes: string[]) {
    return codes.some((code) => this.keys.has(code));
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const rawDelta = (now - this.lastTime) / 1000;
    const delta = clamp(rawDelta || 0.016, 0, 0.05);
    this.lastTime = now;

    if (!this.paused && !this.over) {
      this.elapsed += delta;
      this.update(delta);
    } else {
      this.moving = false;
      this.sprinting = false;
    }
    this.render(now / 1000);

    this.statTimer += delta;
    if (this.statTimer > 0.12) {
      this.statTimer = 0;
      this.emitStats();
    }

    this.raf = requestAnimationFrame(this.loop);
  };

  private update(delta: number) {
    this.interactCooldown = Math.max(0, this.interactCooldown - delta);

    const forward =
      (this.isPressed("KeyW", "ArrowUp") || this.virtual.has("forward") ? 1 : 0) -
      (this.isPressed("KeyS", "ArrowDown") || this.virtual.has("back") ? 1 : 0);
    const strafe =
      (this.isPressed("KeyD") || this.virtual.has("right") ? 1 : 0) -
      (this.isPressed("KeyA") || this.virtual.has("left") ? 1 : 0);
    const turn =
      (this.isPressed("ArrowLeft") || this.virtual.has("turnLeft") ? -1 : 0) +
      (this.isPressed("ArrowRight") || this.virtual.has("turnRight") ? 1 : 0);

    this.angle += turn * delta * 1.9;

    const wantsSprint =
      (this.isPressed("ShiftLeft", "ShiftRight") || this.virtual.has("sprint")) && !this.staminaExhausted;
    const moving = forward !== 0 || strafe !== 0;
    this.moving = moving;
    this.sprinting = moving && wantsSprint && this.stamina > 0;

    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - delta * 27 * DIFFICULTIES[this.difficulty].staminaDrain);
      if (this.stamina <= 0.5) {
        this.stamina = 0;
        this.staminaExhausted = true;
      }
    } else {
      this.stamina = Math.min(100, this.stamina + delta * (moving ? 11 : 18));
      if (this.staminaExhausted && this.stamina > 24) this.staminaExhausted = false;
    }

    if (this.boost > 0) this.boost = Math.max(0, this.boost - delta);

    if (moving) {
      const dirX = Math.cos(this.angle);
      const dirY = Math.sin(this.angle);
      const rightX = -Math.sin(this.angle);
      const rightY = Math.cos(this.angle);
      let moveX = dirX * forward + rightX * strafe;
      let moveY = dirY * forward + rightY * strafe;
      const length = Math.hypot(moveX, moveY) || 1;
      moveX /= length;
      moveY /= length;

      const baseSpeed = 2.55;
      const speed =
        baseSpeed * (this.sprinting ? 1.56 : 1) * (this.boost > 0 ? 1.27 : 1) * delta;
      this.tryMove(moveX * speed, moveY * speed);

      this.stepTimer -= delta;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sprinting ? 0.25 : 0.37;
        if (this.lastStepAt < 0 || this.elapsed - this.lastStepAt > 0.18) {
          audio.play("step");
          this.lastStepAt = this.elapsed;
        }
      }
      this.bobPhase += delta * (this.sprinting ? 11 : 7);
    } else {
      this.stepTimer = Math.min(this.stepTimer, 0.12);
    }

    this.updateTeacher(delta);
    this.teacherVisible =
      this.teacherActive &&
      Math.hypot(this.teacherX - this.px, this.teacherY - this.py) < 9 &&
      this.hasLineOfSight(this.px, this.py, this.teacherX, this.teacherY);
    this.near = this.findNearby();

    if (this.teacherActive && this.teacherStun <= 0) {
      const distance = Math.hypot(this.teacherX - this.px, this.teacherY - this.py);
      if (distance < 0.62 && this.hasLineOfSight(this.px, this.py, this.teacherX, this.teacherY)) {
        this.lose();
      }
    }
  }

  private tryMove(dx: number, dy: number) {
    const nextX = this.px + dx;
    const nextY = this.py + dy;
    if (this.isFree(nextX, nextY)) {
      this.px = nextX;
      this.py = nextY;
      return;
    }
    if (this.isFree(nextX, this.py)) this.px = nextX;
    if (this.isFree(this.px, nextY)) this.py = nextY;
  }

  private isFree(x: number, y: number) {
    const r = PLAYER_RADIUS;
    return (
      isWalkable(x - r, y - r) &&
      isWalkable(x + r, y - r) &&
      isWalkable(x - r, y + r) &&
      isWalkable(x + r, y + r) &&
      isWalkable(x, y)
    );
  }

  private hasLineOfSight(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    const steps = Math.ceil(distance / 0.12);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!isWalkable(x1 + dx * t, y1 + dy * t)) return false;
    }
    return true;
  }

  private updateTeacher(delta: number) {
    if (!this.teacherActive) return;
    this.teacherStun = Math.max(0, this.teacherStun - delta);
    this.teacherGrace = Math.max(0, this.teacherGrace - delta);
    this.teacherBuff = Math.max(0, this.teacherBuff - delta);
    if (this.teacherStun > 0 || this.teacherGrace > 0) return;

    this.repathTimer -= delta;
    if (this.repathTimer <= 0) {
      this.repathTimer = 0.4;
      this.teacherPath = this.findPath(
        Math.floor(this.teacherX),
        Math.floor(this.teacherY),
        Math.floor(this.px),
        Math.floor(this.py)
      );
    }

    const books = this.collected.size;
    const speed =
      (DIFFICULTIES[this.difficulty].teacherSpeed + books * 0.105 + (this.teacherBuff > 0 ? 0.2 : 0)) *
      delta;
    let remaining = speed;
    let guard = 0;

    while (remaining > 0 && this.teacherPath.length > 0 && guard < 8) {
      guard += 1;
      const next = this.teacherPath[0];
      const dx = next.x - this.teacherX;
      const dy = next.y - this.teacherY;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.035) {
        this.teacherPath.shift();
        continue;
      }
      const step = Math.min(distance, remaining);
      this.teacherX += (dx / distance) * step;
      this.teacherY += (dy / distance) * step;
      remaining -= step;
      if (step >= distance - 0.001) this.teacherPath.shift();
    }
  }

  private findPath(startX: number, startY: number, targetX: number, targetY: number): Point[] {
    const sx = clamp(startX, 0, MAP_W - 1);
    const sy = clamp(startY, 0, MAP_H - 1);
    const tx = clamp(targetX, 0, MAP_W - 1);
    const ty = clamp(targetY, 0, MAP_H - 1);
    if (sx === tx && sy === ty) return [];

    const size = MAP_W * MAP_H;
    const previous = new Int32Array(size).fill(-1);
    const visited = new Uint8Array(size);
    const queue = new Int32Array(size);
    let head = 0;
    let tail = 0;
    const start = sy * MAP_W + sx;
    const target = ty * MAP_W + tx;
    queue[tail++] = start;
    visited[start] = 1;
    const dirs = [1, -1, MAP_W, -MAP_W];

    while (head < tail) {
      const current = queue[head++];
      if (current === target) break;
      const cx = current % MAP_W;
      const cy = Math.floor(current / MAP_W);
      for (const offset of dirs) {
        const next = current + offset;
        if (next < 0 || next >= size || visited[next]) continue;
        const nx = next % MAP_W;
        const ny = Math.floor(next / MAP_W);
        if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
        if (MAP[ny][nx] !== T.FLOOR) continue;
        visited[next] = 1;
        previous[next] = current;
        queue[tail++] = next;
      }
    }

    if (!visited[target]) return [];
    const reversed: Point[] = [];
    let cursor = target;
    let safety = 0;
    while (cursor !== start && cursor >= 0 && safety < size) {
      safety += 1;
      reversed.push({ x: (cursor % MAP_W) + 0.5, y: Math.floor(cursor / MAP_W) + 0.5 });
      cursor = previous[cursor];
    }
    reversed.reverse();
    return reversed;
  }

  private findNearby(): NearTarget | null {
    const candidates: Array<{ distance: number; target: NearTarget }> = [];

    for (const notebook of NOTEBOOKS) {
      if (this.collected.has(notebook.id)) continue;
      const distance = Math.hypot(notebook.x - this.px, notebook.y - this.py);
      if (distance < 1.28) {
        candidates.push({
          distance,
          target: {
            kind: "notebook",
            id: String(notebook.id),
            label: `Тетрадь «${notebook.title}»`,
            action: "Забрать",
          },
        });
      }
    }

    for (const item of ITEMS) {
      if (this.takenItems.has(item.id)) continue;
      const distance = Math.hypot(item.x - this.px, item.y - this.py);
      if (distance < 1.0) {
        candidates.push({
          distance,
          target: { kind: "item", id: item.id, label: item.title, action: "Подобрать" },
        });
      }
    }

    const exitDistance = Math.hypot(EXIT_POS.x - this.px, EXIT_POS.y - this.py);
    if (exitDistance < 2.15 && this.px > 27) {
      candidates.push({
        distance: exitDistance + 0.1,
        target: {
          kind: "exit",
          id: "exit",
          label: this.exitUnlocked ? "Дверь на улицу" : "Запертый выход",
          action: this.exitUnlocked ? "Сбежать" : "Проверить",
        },
      });
    }

    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0]?.target ?? null;
  }

  private castRay(rayDirX: number, rayDirY: number): RayHit {
    let mapX = Math.floor(this.px);
    let mapY = Math.floor(this.py);
    const deltaX = Math.abs(rayDirX) < 0.0001 ? 1e30 : Math.abs(1 / rayDirX);
    const deltaY = Math.abs(rayDirY) < 0.0001 ? 1e30 : Math.abs(1 / rayDirY);
    const stepX = rayDirX < 0 ? -1 : 1;
    const stepY = rayDirY < 0 ? -1 : 1;
    let sideDistX =
      rayDirX < 0 ? (this.px - mapX) * deltaX : (mapX + 1 - this.px) * deltaX;
    let sideDistY =
      rayDirY < 0 ? (this.py - mapY) * deltaY : (mapY + 1 - this.py) * deltaY;
    let side = 0;
    let tile: number = T.WALL;
    let distance = 0;

    for (let i = 0; i < 80; i++) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaY;
        mapY += stepY;
        side = 1;
      }
      tile = tileAt(mapX, mapY);
      if (tile !== T.FLOOR) {
        distance =
          side === 0
            ? (mapX - this.px + (1 - stepX) / 2) / (rayDirX || 0.0001)
            : (mapY - this.py + (1 - stepY) / 2) / (rayDirY || 0.0001);
        break;
      }
      if (mapX < -1 || mapX > MAP_W + 1 || mapY < -1 || mapY > MAP_H + 1) break;
    }

    distance = Math.max(0.08, Math.abs(distance));
    let wallX =
      side === 0 ? this.py + distance * rayDirY : this.px + distance * rayDirX;
    wallX -= Math.floor(wallX);
    return { distance, side, tile, wallX, mapX, mapY };
  }

  private drawBillboard(
    sprite: HTMLCanvasElement,
    worldX: number,
    worldY: number,
    scale: number,
    elevation: number,
    glow: string | null,
    bob = 0
  ) {
    const ctx = this.ctx;
    const dirX = Math.cos(this.angle);
    const dirY = Math.sin(this.angle);
    const planeScale = Math.tan(FOV / 2);
    const planeX = -dirY * planeScale;
    const planeY = dirX * planeScale;
    const dx = worldX - this.px;
    const dy = worldY - this.py;
    const invDet = 1 / (planeX * dirY - dirX * planeY);
    const transformX = invDet * (dirY * dx - dirX * dy);
    const transformY = invDet * (-planeY * dx + planeX * dy);
    if (transformY < 0.18) return;

    const screenX = (this.W / 2) * (1 + transformX / transformY);
    const lineHeight = this.projection / transformY;
    const spriteHeight = lineHeight * scale;
    const spriteWidth = spriteHeight * (sprite.width / sprite.height);
    const bottom = this.horizon + lineHeight * 0.5 - elevation * lineHeight + bob;
    const top = bottom - spriteHeight;
    const left = screenX - spriteWidth / 2;
    const centerColumn = Math.round(screenX);

    if (
      glow &&
      centerColumn >= 0 &&
      centerColumn < this.W &&
      this.zBuffer[centerColumn] > transformY
    ) {
      const radius = Math.max(24, lineHeight * scale * 0.75);
      const gradient = ctx.createRadialGradient(screenX, bottom - spriteHeight * 0.5, 0, screenX, bottom - spriteHeight * 0.5, radius);
      gradient.addColorStop(0, glow);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(screenX, bottom - spriteHeight * 0.5, radius, radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const drawRun = (from: number, to: number) => {
      const sourceX = ((from - left) / spriteWidth) * sprite.width;
      const sourceWidth = ((to - from) / spriteWidth) * sprite.width;
      ctx.globalAlpha = clamp(1.12 - transformY * 0.024, 0.52, 1);
      ctx.drawImage(
        sprite,
        clamp(sourceX, 0, sprite.width),
        0,
        clamp(sourceWidth, 0.4, sprite.width),
        sprite.height,
        from,
        top,
        to - from,
        spriteHeight
      );
    };

    const start = Math.max(0, Math.floor(left));
    const end = Math.min(this.W, Math.ceil(left + spriteWidth));
    let runStart = -1;
    for (let x = start; x < end; x++) {
      const visible = this.zBuffer[x] > transformY;
      if (visible && runStart === -1) runStart = x;
      if ((!visible || x === end - 1) && runStart !== -1) {
        const runEnd = visible && x === end - 1 ? x + 1 : x;
        if (runEnd > runStart) drawRun(runStart, runEnd);
        runStart = -1;
      }
    }
    ctx.globalAlpha = 1;

    return { screenX, top, spriteHeight, transformY };
  }

  private render(time: number) {
    const ctx = this.ctx;
    const W = this.W;
    const H = this.H;
    const bob = this.moving ? Math.sin(this.bobPhase) * H * 0.006 : 0;
    this.horizon = H * 0.51 + bob;
    this.projection = H * 0.96;
    this.depthFade = clamp(this.projection * 0.5 - this.horizon + H * 0.07, 0, H * 0.2);

    // Ceiling and floor
    ctx.fillStyle = "#070c09";
    ctx.fillRect(0, 0, W, H);
    const ceiling = ctx.createLinearGradient(0, 0, 0, this.horizon);
    ceiling.addColorStop(0, "#050906");
    ceiling.addColorStop(0.62, "#14201a");
    ceiling.addColorStop(1, "#314138");
    ctx.fillStyle = ceiling;
    ctx.fillRect(0, 0, W, Math.max(0, this.horizon));

    const floor = ctx.createLinearGradient(0, this.horizon, 0, H);
    floor.addColorStop(0, "#334236");
    floor.addColorStop(0.25, "#263329");
    floor.addColorStop(0.7, "#161f18");
    floor.addColorStop(1, "#0c120e");
    ctx.fillStyle = floor;
    ctx.fillRect(0, this.horizon, W, H - this.horizon);

    // Two tired fluorescent lights above
    for (const spot of [-0.28, 0.18, 0.37]) {
      const gx = W / 2 + spot * W;
      const glow = ctx.createRadialGradient(gx, this.horizon - H * 0.24, 2, gx, this.horizon - H * 0.24, H * 0.42);
      glow.addColorStop(0, "rgba(224,235,184,0.18)");
      glow.addColorStop(0.25, "rgba(183,205,150,0.07)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, Math.max(0, this.horizon));
    }

    // Perspective seams on the linoleum
    for (let depth = 0.55; depth < 12; depth *= 1.31) {
      const y = this.horizon + (this.projection * 0.5) / depth;
      if (y < this.horizon || y > H) continue;
      ctx.strokeStyle = `rgba(210,224,187,${clamp(0.13 - depth * 0.009, 0.018, 0.12)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const planeScale = Math.tan(FOV / 2);
    const dirX = Math.cos(this.angle);
    const dirY = Math.sin(this.angle);
    const planeX = -dirY * planeScale;
    const planeY = dirX * planeScale;

    for (let x = 0; x < W; x++) {
      const cameraX = (2 * x) / W - 1;
      const rayX = dirX + planeX * cameraX;
      const rayY = dirY + planeY * cameraX;
      const hit = this.castRay(rayX, rayY);
      this.zBuffer[x] = hit.distance;
      const fullHeight = this.projection / hit.distance;
      const isFurniture = hit.tile === T.DESK || hit.tile === T.SHELF || hit.tile === T.TABLE;
      const heightScale = hit.tile === T.DESK ? 0.55 : hit.tile === T.TABLE ? 0.5 : hit.tile === T.SHELF ? 0.82 : 1;
      const lineHeight = fullHeight * heightScale;
      const bottom = this.horizon + fullHeight / 2;
      const top = bottom - lineHeight;
      const base = WALL_COLORS[hit.tile] ?? WALL_COLORS[T.WALL];
      const light = clamp(1.48 / (1 + hit.distance * 0.105), 0.26, 1.2);
      const sideShade = hit.side === 1 ? 0.76 : 1;
      ctx.fillStyle = rgbaColor(base, light * sideShade);
      ctx.fillRect(x, top, 1, lineHeight);
      if (this.depthFade > 0 && top < this.horizon - this.depthFade) {
        const fadeHeight = Math.min(lineHeight, this.horizon - this.depthFade - top);
        ctx.fillStyle = "rgba(5,10,7,0.42)";
        ctx.fillRect(x, top, 1, fadeHeight);
      }

      if (hit.tile === T.LOCKER) {
        if (hit.wallX < 0.07 || hit.wallX > 0.93) {
          ctx.fillStyle = `rgba(15,25,16,${0.62 * light})`;
          ctx.fillRect(x, top, 1, lineHeight);
        }
        if (hit.wallX > 0.45 && hit.wallX < 0.535) {
          ctx.fillStyle = `rgba(18,26,18,${0.62 * light})`;
          ctx.fillRect(x, top + lineHeight * 0.29, 1, lineHeight * 0.2);
          ctx.fillStyle = `rgba(226,229,196,${0.3 * light})`;
          ctx.fillRect(x, top + lineHeight * 0.3, 1, Math.max(1, lineHeight * 0.025));
        }
        if (hit.wallX > 0.22 && hit.wallX < 0.66 && hit.wallX * 100 % 4 < 2) {
          ctx.fillStyle = `rgba(25,37,25,${0.34 * light})`;
          ctx.fillRect(x, top + lineHeight * 0.17, 1, lineHeight * 0.045);
        }
        if (hit.wallX > 0.3 && hit.wallX < 0.58 && hit.wallX * 100 % 3 < 1) {
          ctx.fillStyle = `rgba(226,229,196,${0.18 * light})`;
          ctx.fillRect(x, top + lineHeight * 0.72, 1, lineHeight * 0.08);
        }
      } else if (hit.tile === T.SHELF) {
        const stripe = Math.floor(hit.wallX * 7);
        const colors = ["#5e3b2c", "#ad8353", "#31463b", "#9a4937", "#5a6649"];
        ctx.globalAlpha = 0.58;
        ctx.fillStyle = colors[stripe % colors.length];
        ctx.fillRect(x, top + lineHeight * 0.24, 1, lineHeight * 0.62);
        ctx.globalAlpha = 1;
      } else if (hit.tile === T.DESK || hit.tile === T.TABLE) {
        if (hit.wallX < 0.09 || hit.wallX > 0.91) {
          ctx.fillStyle = `rgba(55,35,19,${0.4 * light})`;
          ctx.fillRect(x, top, 1, lineHeight);
        }
        if (hit.wallX > 0.42 && hit.wallX < 0.48 && hit.side === 0) {
          ctx.fillStyle = `rgba(55,35,19,${0.24 * light})`;
          ctx.fillRect(x, top, 1, lineHeight);
        }
      }

      if (hit.tile === T.WALL && hit.side === 0) {
        const decor = (hit.mapX * 7 + hit.mapY * 13) % 7;
        if (decor === 0 || decor === 3) {
          if (hit.wallX > 0.2 && hit.wallX < 0.8) {
            const frame = ctx.createLinearGradient(0, top + lineHeight * 0.24, 0, top + lineHeight * 0.55);
            frame.addColorStop(0, decor === 0 ? "#6f4b3d" : "#2f4938");
            frame.addColorStop(1, decor === 0 ? "#3d2823" : "#17281c");
            ctx.fillStyle = frame;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(x, top + lineHeight * 0.24, 1, lineHeight * 0.31);
            ctx.globalAlpha = 1;
            if (decor === 0) {
              const stripe = Math.floor(hit.wallX * 18);
              if (stripe % 3 !== 0) {
                ctx.fillStyle = "rgba(232,225,196,0.42)";
                ctx.fillRect(x, top + lineHeight * (0.28 + (stripe % 4) * 0.045), 1, lineHeight * 0.06);
              }
            } else {
              const chalkMark = Math.floor(hit.wallX * 40) % 4 === 0;
              if (chalkMark) {
                ctx.fillStyle = "rgba(231,240,214,0.3)";
                ctx.fillRect(x, top + lineHeight * 0.34, 1, lineHeight * 0.13);
              }
            }
          }
          if (hit.wallX > 0.215 && hit.wallX < 0.225) {
            ctx.fillStyle = "rgba(23,34,24,0.7)";
            ctx.fillRect(x, top + lineHeight * 0.235, 1, lineHeight * 0.32);
          }
        }
      }

      // Baseboard and wall line. Old schools need both.
      ctx.fillStyle = `rgba(18,32,24,${0.7 * light})`;
      ctx.fillRect(x, bottom - lineHeight * 0.16, 1, lineHeight * 0.16);
      ctx.fillStyle = `rgba(225,226,192,${0.12 * light})`;
      ctx.fillRect(x, top + lineHeight * 0.16, 1, Math.max(1, lineHeight * 0.012));

      if (hit.tile === T.EXIT) {
        ctx.fillStyle = `rgba(33,16,14,${0.5 * light})`;
        ctx.fillRect(x, top, 1, lineHeight * 0.13);
      }
    }

    // World objects, painted from far to near.
    type Drawable = {
      distance: number;
      sprite: HTMLCanvasElement;
      x: number;
      y: number;
      scale: number;
      elevation: number;
      glow: string | null;
      bob: number;
      kind: string;
    };
    const drawables: Drawable[] = [];

    for (const notebook of NOTEBOOKS) {
      if (this.collected.has(notebook.id)) continue;
      drawables.push({
        distance: Math.hypot(notebook.x - this.px, notebook.y - this.py),
        sprite: this.sprites[`notebook-${notebook.id}`],
        x: notebook.x,
        y: notebook.y,
        scale: 0.3,
        elevation: 0.37,
        glow: `${notebook.color}55`,
        bob: Math.sin(time * 2.4 + notebook.id) * this.H * 0.007,
        kind: "notebook",
      });
    }

    for (const item of ITEMS) {
      if (this.takenItems.has(item.id)) continue;
      drawables.push({
        distance: Math.hypot(item.x - this.px, item.y - this.py),
        sprite: this.sprites[item.kind],
        x: item.x,
        y: item.y,
        scale: 0.25,
        elevation: 0.1,
        glow: item.kind === "coffee" ? "rgba(213,244,60,0.22)" : "rgba(225,244,200,0.25)",
        bob: Math.sin(time * 2 + item.x) * this.H * 0.003,
        kind: "item",
      });
    }

    drawables.push({
      distance: Math.hypot(EXIT_POS.x - this.px, EXIT_POS.y - this.py),
      sprite: this.sprites.exit,
      x: 29.65,
      y: 8.55,
      scale: 0.92,
      elevation: 0,
      glow: this.exitUnlocked ? "rgba(213,244,60,0.28)" : "rgba(214,78,64,0.1)",
      bob: 0,
      kind: "exit",
    });

    const teacherDistance = Math.hypot(this.teacherX - this.px, this.teacherY - this.py);
    drawables.push({
      distance: teacherDistance,
      sprite: this.teacherStun > 0 ? this.sprites.teacherStunned : this.sprites.teacher,
      x: this.teacherX,
      y: this.teacherY,
      scale: 0.94,
      elevation: 0,
      glow: this.teacherActive ? "rgba(180,48,40,0.14)" : null,
      bob: Math.sin(time * 7) * this.H * 0.002,
      kind: "teacher",
    });

    drawables.sort((a, b) => b.distance - a.distance);
    for (const item of drawables) {
      this.drawBillboard(item.sprite, item.x, item.y, item.scale, item.elevation, item.glow, item.bob);
    }

    // Darkness, with a little tunnel of light down the corridor.
    const vignette = ctx.createRadialGradient(
      W / 2,
      H * 0.51,
      Math.min(W, H) * 0.17,
      W / 2,
      H * 0.51,
      Math.max(W, H) * 0.78
    );
    vignette.addColorStop(0, "rgba(2,7,4,0)");
    vignette.addColorStop(0.55, "rgba(2,7,4,0.2)");
    vignette.addColorStop(1, "rgba(1,4,2,0.76)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    const danger = this.teacherActive
      ? clamp(1 - teacherDistance / 9, 0, 1)
      : 0;
    if (danger > 0.35) {
      const pulse = 0.7 + Math.sin(time * 5.2) * 0.3;
      const red = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.2,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.7
      );
      red.addColorStop(0, "rgba(128,20,18,0)");
      red.addColorStop(1, `rgba(126,23,18,${0.42 * danger * pulse})`);
      ctx.fillStyle = red;
      ctx.fillRect(0, 0, W, H);
    }

    if (this.teacherStun > 0) {
      const flash = clamp(this.teacherStun / 5.5, 0, 1);
      ctx.fillStyle = `rgba(241,232,190,${flash * 0.06})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Crosshair
    if (!this.over) {
      ctx.strokeStyle = "rgba(238,241,211,0.52)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(213,244,60,0.85)";
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    this.renderPrompt();
  }

  private renderPrompt() {
    if (!this.near || this.paused || this.over || this.W < 560) return;
    const ctx = this.ctx;
    const W = this.W;
    const H = this.H;
    const label = `${this.near.action} · ${this.near.label}`;
    ctx.font = "600 13px Manrope, Arial, sans-serif";
    const textWidth = ctx.measureText(label).width;
    const boxWidth = Math.min(W - 28, textWidth + 74);
    const x = (W - boxWidth) / 2;
    const y = H - 58;
    ctx.fillStyle = "rgba(7,13,9,0.88)";
    ctx.strokeStyle = "rgba(213,244,60,0.36)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, 36, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#d5f43c";
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, 24, 20, 4);
    ctx.fill();
    ctx.fillStyle = "#0b110e";
    ctx.font = "800 11px Unbounded, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("E", x + 20, y + 22);

    ctx.fillStyle = "#f2eddd";
    ctx.font = "600 13px Manrope, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 41, y + 23);
    ctx.textAlign = "left";
  }

  // Retained for future decoration; safe under tree-shaking and useful for debugging maps.
  static gridInfo() {
    return { width: MAP_W, height: MAP_H, teacherStart: [TEACHER_SPAWN.x, TEACHER_SPAWN.y] };
  }
}
