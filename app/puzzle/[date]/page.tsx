import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPuzzleByDate, getPuzzleNumber, getAllPastPuzzles } from '@/lib/puzzles';
import { getPosterUrl } from '@/lib/tmdb';
import GameBoard from '@/components/GameBoard';
import type { Movie } from '@/types';

export function generateStaticParams() {
  return getAllPastPuzzles().map(p => ({ date: p.date }));
}

export const revalidate = 3600;

export default function PuzzlePage({ params }: { params: { date: string } }) {
  const today = new Date().toISOString().split('T')[0];
  const puzzle = getPuzzleByDate(params.date);

  if (!puzzle || puzzle.date > today) notFound();

  const puzzleNumber = getPuzzleNumber(puzzle.date);
  const moviesWithPosters: Movie[] = puzzle.movies.map(m => ({
    ...m,
    posterUrl: getPosterUrl(m.posterPath),
  }));

  const displayDate = new Date(puzzle.date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <main className="min-h-screen py-10" style={{ background: 'var(--bg)' }}>
      <header className="text-center mb-10 px-4">
        <Link
          href="/archive"
          className="inline-block text-xs uppercase tracking-widest mb-4 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Archive
        </Link>
        <h1
          className="title-glow text-6xl font-black tracking-wide"
          style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--gold)' }}
        >
          FilmSort
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          #{puzzleNumber}&nbsp;&nbsp;·&nbsp;&nbsp;{displayDate}
        </p>
        <div
          className="mt-4 mx-auto w-24 h-px"
          style={{ background: 'linear-gradient(to right, transparent, var(--gold-dim), transparent)' }}
        />
      </header>

      <GameBoard
        puzzle={{ ...puzzle, movies: moviesWithPosters }}
        puzzleNumber={puzzleNumber}
      />
    </main>
  );
}
