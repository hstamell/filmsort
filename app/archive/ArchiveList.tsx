'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Puzzle } from '@/types';
import type { SavedGameState } from '@/types';

interface ArchiveListProps {
  puzzles: Array<{ id: number; date: string; theme: string; puzzleNumber: number }>;
}

function getStatus(puzzle: { id: number; date: string }): 'won' | 'lost' | 'played' | null {
  try {
    const raw = localStorage.getItem(`filmsort_puzzle_${puzzle.id}`);
    if (!raw) return null;
    const state = JSON.parse(raw) as SavedGameState;
    if (state.date !== puzzle.date) return null;
    if (state.status === 'won') return 'won';
    if (state.status === 'lost') return 'lost';
    if (state.attempts.length > 0) return 'played';
    return null;
  } catch {
    return null;
  }
}

export default function ArchiveList({ puzzles }: ArchiveListProps) {
  const [statuses, setStatuses] = useState<Record<number, 'won' | 'lost' | 'played' | null>>({});

  useEffect(() => {
    const result: Record<number, 'won' | 'lost' | 'played' | null> = {};
    puzzles.forEach(p => { result[p.id] = getStatus(p); });
    setStatuses(result);
  }, [puzzles]);

  return (
    <div className="flex flex-col gap-2">
      {puzzles.map(puzzle => {
        const status = statuses[puzzle.id];
        const displayDate = new Date(puzzle.date + 'T12:00:00').toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        });

        return (
          <Link
            key={puzzle.id}
            href={`/puzzle/${puzzle.date}`}
            className="flex items-center gap-4 p-4 rounded-xl border transition-all group"
            style={{
              background: 'var(--card)',
              borderColor: status === 'won' ? 'rgba(212,168,83,0.3)' : 'var(--border)',
            }}
          >
            {/* Puzzle number */}
            <span
              className="text-sm font-bold w-10 flex-shrink-0 text-right"
              style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--gold-dim)' }}
            >
              #{puzzle.puzzleNumber}
            </span>

            {/* Divider */}
            <div className="w-px h-8 flex-shrink-0" style={{ background: 'var(--border)' }} />

            {/* Theme + date */}
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold truncate transition-colors group-hover:opacity-90"
                style={{ color: 'var(--text-primary)' }}
              >
                {puzzle.theme}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {displayDate}
              </p>
            </div>

            {/* Status badge */}
            <div className="flex-shrink-0">
              {status === 'won' && (
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: 'rgba(212,168,83,0.15)', color: 'var(--gold)' }}
                >
                  ✓ Solved
                </span>
              )}
              {status === 'lost' && (
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                >
                  ✗ Failed
                </span>
              )}
              {status === 'played' && (
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
                >
                  In progress
                </span>
              )}
              {!status && (
                <span
                  className="text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Play →
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
