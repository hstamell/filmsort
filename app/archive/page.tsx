import Link from 'next/link';
import { getAllPastPuzzles, getPuzzleNumber } from '@/lib/puzzles';
import ArchiveList from './ArchiveList';

export const revalidate = 3600;

export default function ArchivePage() {
  const puzzles = getAllPastPuzzles().map(p => ({
    id: p.id,
    date: p.date,
    theme: p.theme,
    puzzleNumber: getPuzzleNumber(p.date),
  }));

  return (
    <main className="min-h-screen py-10" style={{ background: 'var(--bg)' }}>
      <header className="text-center mb-10 px-4">
        <Link
          href="/"
          className="inline-block text-xs uppercase tracking-widest mb-4 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Today's Puzzle
        </Link>
        <h1
          className="title-glow text-6xl font-black tracking-wide"
          style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--gold)' }}
        >
          FilmSort
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          Archive
        </p>
        <div
          className="mt-4 mx-auto w-24 h-px"
          style={{ background: 'linear-gradient(to right, transparent, var(--gold-dim), transparent)' }}
        />
      </header>

      <div className="w-full max-w-md mx-auto px-4 pb-12">
        <p className="text-sm text-center mb-6 italic" style={{ color: 'var(--text-secondary)' }}>
          {puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''} played so far
        </p>
        <ArchiveList puzzles={puzzles} />
      </div>
    </main>
  );
}
