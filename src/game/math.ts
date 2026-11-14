import type { Difficulty } from "./map";

export interface MathQuestion {
  id: string;
  prompt: string;
  answer: number;
  options: number[];
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

function makeOptions(answer: number): number[] {
  const options = new Set<number>([answer]);
  let guard = 0;
  while (options.size < 4 && guard < 100) {
    guard += 1;
    const spread = Math.max(2, Math.round(Math.abs(answer) * 0.22));
    const delta = rand(1, spread + 3) * (Math.random() > 0.5 ? 1 : -1);
    const candidate = answer + delta;
    if (candidate >= 0 && candidate !== answer) options.add(candidate);
    if (guard > 30) options.add(answer + options.size * 3 + 1);
  }
  return shuffle([...options]);
}

function buildQuestion(notebookId: number, difficulty: Difficulty, seed: number): MathQuestion {
  let prompt = "";
  let answer = 0;
  const hard = difficulty === "nightmare";

  switch (notebookId) {
    case 0: {
      const a = rand(hard ? 17 : 8, hard ? 49 : 26);
      const b = rand(3, hard ? 29 : 17);
      if (seed % 2 === 0) {
        prompt = `${a} + ${b} = ?`;
        answer = a + b;
      } else {
        prompt = `${a + b} − ${b} = ?`;
        answer = a;
      }
      break;
    }
    case 1: {
      const a = rand(3, hard ? 12 : 9);
      const b = rand(3, hard ? 11 : 8);
      prompt = `${a} × ${b} = ?`;
      answer = a * b;
      break;
    }
    case 2: {
      const a = rand(3, 9);
      const b = rand(2, hard ? 9 : 6);
      const c = rand(2, hard ? 19 : 12);
      prompt = `${a} × ${b} + ${c} = ?`;
      answer = a * b + c;
      break;
    }
    case 3: {
      const b = rand(2, hard ? 12 : 9);
      const answerValue = rand(2, hard ? 15 : 11);
      const a = b * answerValue;
      prompt = `${a} ÷ ${b} = ?`;
      answer = answerValue;
      break;
    }
    default: {
      const a = rand(2, hard ? 12 : 9);
      const b = rand(2, hard ? 9 : 6);
      const c = rand(2, hard ? 25 : 14);
      if (seed % 2 === 0) {
        prompt = `${a} × (${b} + ${c}) = ?`;
        answer = a * (b + c);
      } else {
        prompt = `${a * b} ÷ ${a} + ${c} = ?`;
        answer = b + c;
      }
      break;
    }
  }

  return {
    id: `q-${notebookId}-${seed}-${Math.random().toString(36).slice(2, 7)}`,
    prompt,
    answer,
    options: makeOptions(answer),
  };
}

export function generateQuiz(notebookId: number, difficulty: Difficulty): MathQuestion[] {
  return [0, 1, 2].map((seed) => buildQuestion(notebookId, difficulty, seed));
}

export const NUMBER_LABELS = ["А", "Б", "В", "Г"];
