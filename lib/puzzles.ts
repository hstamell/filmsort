import puzzlesData from '@/data/puzzles.json';
import type { Puzzle } from '@/types';

const puzzles = (puzzlesData as Puzzle[]).sort((a, b) => a.date.localeCompare(b.date));

export function getTodaysPuzzle(): Puzzle {
  const today = new Date().toISOString().split('T')[0];
  return puzzles.find(p => p.date === today) ?? puzzles[0];
}

export function getPuzzleByDate(date: string): Puzzle | null {
  return puzzles.find(p => p.date === date) ?? null;
}

export function getPuzzleNumber(date: string): number {
  const idx = puzzles.findIndex(p => p.date === date);
  return idx === -1 ? 1 : idx + 1;
}

export function getAllPastPuzzles(): Puzzle[] {
  const today = new Date().toISOString().split('T')[0];
  return [...puzzles].filter(p => p.date <= today).reverse(); // newest first
}
