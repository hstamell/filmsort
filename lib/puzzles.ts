import puzzlesData from '@/data/puzzles.json';
import type { Puzzle } from '@/types';

const puzzles = puzzlesData as Puzzle[];

export function getTodaysPuzzle(): Puzzle {
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...puzzles].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.find(p => p.date === today) ?? sorted[0];
}

export function getPuzzleNumber(date: string): number {
  const sorted = [...puzzles].sort((a, b) => a.date.localeCompare(b.date));
  const idx = sorted.findIndex(p => p.date === date);
  return idx === -1 ? 1 : idx + 1;
}
