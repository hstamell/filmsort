import type { AttemptResult, GameStatus, Movie, SavedGameState } from '@/types';

export const MAX_ATTEMPTS = 3;
export const MAX_HINTS = 3;

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  // If shuffle produced the exact correct order, rotate by one so the answer isn't trivial
  const isCorrectOrder = result.every((item, idx) => (item as unknown as Movie).tmdbId === (arr[idx] as unknown as Movie).tmdbId);
  if (isCorrectOrder && result.length > 1) {
    result.push(result.shift()!);
  }
  return result;
}

export function checkAttempt(userOrder: Movie[], correctOrder: Movie[]): AttemptResult {
  const correct = userOrder.map((m, i) => m.tmdbId === correctOrder[i].tmdbId);
  return { correct, allCorrect: correct.every(Boolean) };
}

export function generateShareText(
  puzzleNumber: number,
  theme: string,
  attempts: AttemptResult[],
  status: GameStatus,
  hintsUsed: number
): string {
  const header = `🎬 FilmSort #${puzzleNumber}`;
  const themeLine = `"${theme}"`;
  const rows = attempts.map(
    (a, i) =>
      `${i + 1}/${MAX_ATTEMPTS}  ${a.correct.map(c => (c ? '🟩' : '🟥')).join('')}${a.allCorrect ? ' ✓' : ''}`
  );
  const hintLine = hintsUsed === 0
    ? '👁 No hints used'
    : `👁 ${hintsUsed}/${MAX_HINTS} hint${hintsUsed !== 1 ? 's' : ''} used`;
  const footer = status === 'lost' ? 'Better luck tomorrow! 🎬' : '';
  return [header, themeLine, '', ...rows, '', hintLine, ...(footer ? ['', footer] : []), '', 'filmsort.app'].join('\n');
}

const storageKey = (puzzleId: number) => `filmsort_puzzle_${puzzleId}`;

export function loadGameState(puzzleId: number): SavedGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(puzzleId));
    return raw ? (JSON.parse(raw) as SavedGameState) : null;
  } catch {
    return null;
  }
}

export function saveGameState(state: SavedGameState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(state.puzzleId), JSON.stringify(state));
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}
