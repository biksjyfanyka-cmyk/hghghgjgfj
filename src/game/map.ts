export const MAP_W = 31;
export const MAP_H = 21;

export const T = {
  FLOOR: 0,
  WALL: 1,
  DESK: 2,
  SHELF: 3,
  TABLE: 4,
  EXIT: 5,
  LOCKER: 6,
} as const;

export type Tile = (typeof T)[keyof typeof T];

export type Difficulty = "easy" | "classic" | "nightmare";

export interface Room {
  id: string;
  name: string;
  index: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tone: string;
}

export interface NotebookDef {
  id: number;
  title: string;
  subject: string;
  room: string;
  roomId: string;
  color: string;
  x: number;
  y: number;
}

export interface ItemDef {
  id: string;
  kind: "coffee" | "chalk";
  title: string;
  x: number;
  y: number;
}

export const ROOMS: Room[] = [
  { id: "101", name: "Кабинет 101", index: "101", x1: 1, y1: 1, x2: 8, y2: 6, tone: "#d5f43c" },
  { id: "lib", name: "Библиотека", index: "БИБ", x1: 10, y1: 1, x2: 19, y2: 6, tone: "#e7c96b" },
  { id: "cafe", name: "Столовая", index: "СТО", x1: 21, y1: 1, x2: 29, y2: 6, tone: "#d98c6a" },
  { id: "gym", name: "Спортзал", index: "СПО", x1: 1, y1: 11, x2: 8, y2: 19, tone: "#94c7b0" },
  { id: "sci", name: "Кабинет химии", index: "ХИМ", x1: 10, y1: 11, x2: 19, y2: 19, tone: "#9dc6d6" },
  { id: "202", name: "Кабинет 202", index: "202", x1: 21, y1: 11, x2: 29, y2: 19, tone: "#d9a3bd" },
];

export const NOTEBOOKS: NotebookDef[] = [
  {
    id: 0,
    title: "Алгебра",
    subject: "АЛГЕБРА",
    room: "Кабинет 101",
    roomId: "101",
    color: "#d5f43c",
    x: 7.25,
    y: 5.45,
  },
  {
    id: 1,
    title: "Геометрия",
    subject: "ГЕОМЕТРИЯ",
    room: "Библиотека",
    roomId: "lib",
    color: "#e6b74b",
    x: 10.45,
    y: 5.45,
  },
  {
    id: 2,
    title: "Логика",
    subject: "ЛОГИКА",
    room: "Столовая",
    roomId: "cafe",
    color: "#df8467",
    x: 21.45,
    y: 1.45,
  },
  {
    id: 3,
    title: "Дроби",
    subject: "ДРОБИ",
    room: "Спортзал",
    roomId: "gym",
    color: "#88cab1",
    x: 1.45,
    y: 18.45,
  },
  {
    id: 4,
    title: "Стереометрия",
    subject: "СТЕРЕОМЕТРИЯ",
    room: "Кабинет химии",
    roomId: "sci",
    color: "#94c5d8",
    x: 18.45,
    y: 18.45,
  },
];

export const ITEMS: ItemDef[] = [
  { id: "coffee-lib", kind: "coffee", title: "Горячий кофе", x: 18.45, y: 1.45 },
  { id: "chalk-cafe", kind: "chalk", title: "Кусок мела", x: 28.45, y: 5.45 },
  { id: "chalk-gym", kind: "chalk", title: "Кусок мела", x: 6.45, y: 11.45 },
  { id: "coffee-sci", kind: "coffee", title: "Горячий кофе", x: 10.45, y: 18.45 },
];

export const PLAYER_SPAWN = { x: 15.5, y: 8.55, angle: 0 };
export const TEACHER_SPAWN = { x: 25.5, y: 18.5 };
export const EXIT_POS = { x: 29.25, y: 8.55 };

function makeMap(): Tile[][] {
  const map: Tile[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => T.WALL as Tile)
  );

  const carve = (x1: number, y1: number, x2: number, y2: number) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        if (x > 0 && x < MAP_W - 1 && y > 0 && y < MAP_H - 1) map[y][x] = T.FLOOR;
      }
    }
  };

  for (const room of ROOMS) carve(room.x1, room.y1, room.x2, room.y2);

  // Central corridor. The old school is intentionally a single long spine.
  carve(1, 8, 29, 9);

  // Wide, open archways into every classroom.
  const doors = [
    [4, 7],
    [5, 7],
    [14, 7],
    [15, 7],
    [25, 7],
    [26, 7],
    [4, 10],
    [5, 10],
    [14, 10],
    [15, 10],
    [25, 10],
    [26, 10],
  ];
  for (const [x, y] of doors) map[y][x] = T.FLOOR;

  // Furniture. Everything here blocks movement and sight, like school furniture should.
  const desks: Array<[number, number]> = [
    [2, 2], [3, 2], [6, 2], [7, 2],
    [2, 4], [3, 4], [6, 4], [7, 4],
    [23, 2], [24, 2], [27, 2], [28, 2],
    [23, 4], [24, 4], [27, 4], [28, 4],
    [2, 13], [3, 13], [6, 13], [7, 13],
    [2, 16], [3, 16], [6, 16], [7, 16],
    [12, 12], [13, 12], [16, 12], [17, 12],
    [12, 15], [13, 15], [16, 15], [17, 15],
    [23, 12], [24, 12], [27, 12], [28, 12],
    [23, 15], [24, 15], [27, 15], [28, 15],
  ];
  for (const [x, y] of desks) map[y][x] = T.DESK;

  const shelves: Array<[number, number]> = [
    [11, 2], [12, 2], [16, 2], [17, 2],
    [11, 5], [12, 5], [16, 5], [17, 5],
  ];
  for (const [x, y] of shelves) map[y][x] = T.SHELF;

  for (let x = 1; x < MAP_W - 1; x++) {
    if (map[7][x] === T.WALL) map[7][x] = T.LOCKER;
    if (map[10][x] === T.WALL) map[10][x] = T.LOCKER;
  }

  // The only way out. Locked until every notebook is handed in.
  map[8][30] = T.EXIT;
  map[9][30] = T.EXIT;

  return map;
}

export const MAP = makeMap();

export function tileAt(x: number, y: number): Tile {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= MAP_W || gy >= MAP_H) return T.WALL;
  return MAP[gy][gx];
}

export function isWalkable(x: number, y: number): boolean {
  return tileAt(x, y) === T.FLOOR;
}

export function getRoomAt(x: number, y: number): Room | null {
  return (
    ROOMS.find(
      (room) => x >= room.x1 - 0.4 && x <= room.x2 + 1.4 && y >= room.y1 - 0.4 && y <= room.y2 + 1.4
    ) ?? null
  );
}

export const DIFFICULTIES: Record<
  Difficulty,
  { label: string; short: string; description: string; teacherSpeed: number; staminaDrain: number }
> = {
  easy: {
    label: "Спокойно",
    short: "После уроков",
    description: "Учитель устал. Времени на ошибки больше.",
    teacherSpeed: 1.28,
    staminaDrain: 0.8,
  },
  classic: {
    label: "Классика",
    short: "Ночная смена",
    description: "Задуманный баланс паники и математики.",
    teacherSpeed: 1.52,
    staminaDrain: 1,
  },
  nightmare: {
    label: "Кошмар",
    short: "Родительское собрание",
    description: "Он идёт быстрее. Тетради не простят ошибок.",
    teacherSpeed: 1.72,
    staminaDrain: 1.18,
  },
};
