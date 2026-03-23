import { getTodaysPuzzle, getPuzzleNumber } from '@/lib/puzzles';
import { getPosterUrl } from '@/lib/tmdb';
import GameBoard from '@/components/GameBoard';
import type { Movie } from '@/types';

export const revalidate = 3600;

export default function Home() {
  const puzzle = getTodaysPuzzle();
  const puzzleNumber = getPuzzleNumber(puzzle.date);

  const moviesWithPosters: Movie[] = puzzle.movies.map(m => ({
    ...m,
    posterUrl: getPosterUrl(m.posterPath),
  }));

  return (
    <main className="min-h-screen bg-zinc-900 py-8">
      <header className="text-center mb-8 px-4">
        <h1 className="text-amber-400 text-5xl font-black tracking-tight">FilmSort</h1>
        <p className="text-zinc-500 text-sm mt-1.5">
          #{puzzleNumber}&nbsp;·&nbsp;New puzzle every day
        </p>
      </header>

      <GameBoard
        puzzle={{ ...puzzle, movies: moviesWithPosters }}
        puzzleNumber={puzzleNumber}
      />
    </main>
  );
}
