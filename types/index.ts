export interface Movie {
  tmdbId: number;
  title: string;
  year: number;
  releaseDate: string;
  posterPath: string | null;
  posterUrl?: string | null;
}

export interface Puzzle {
  id: number;
  date: string; // YYYY-MM-DD
  theme: string;
  movies: Movie[]; // Stored in correct chronological order (earliest → latest)
}

export interface AttemptResult {
  correct: boolean[]; // true = movie was in the correct position
  allCorrect: boolean;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface SavedGameState {
  puzzleId: number;
  date: string;
  attempts: AttemptResult[];
  status: GameStatus;
  finalOrder?: number[]; // indices into puzzle.movies when game ended
  hintsUsed: number;
  revealedPosters: number[]; // tmdbIds of revealed posters
}
