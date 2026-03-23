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
    <main className="min-h-screen py-10" style={{ background: "var(--bg)" }}>
      <header className="text-center mb-10 px-4">
        <h1
          className="title-glow text-6xl font-black tracking-wide"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--gold)" }}
        >
          FilmSort
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
          #{puzzleNumber}&nbsp;&nbsp;·&nbsp;&nbsp;New puzzle every day
        </p>
        <div className="mt-4 mx-auto w-24 h-px" style={{ background: "linear-gradient(to right, transparent, var(--gold-dim), transparent)" }} />
      </header>

      <GameBoard
        puzzle={{ ...puzzle, movies: moviesWithPosters }}
        puzzleNumber={puzzleNumber}
      />
    </main>
  );
}
