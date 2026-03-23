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

export function getAllPuzzles(): Puzzle[] {
  return [...puzzles]; // all puzzles, chronological
}

export function getAllPastPuzzles(): Puzzle[] {
  const today = new Date().toISOString().split('T')[0];
  // Show all puzzles up to today. If no puzzles are in the past yet
  // (e.g. all dates are future), show them all so the archive isn't empty.
  const past = [...puzzles].filter(p => p.date <= today);
  const list = past.length > 0 ? past : [...puzzles];
  return list.reverse(); // newest first
}
