'use client';

import Image from 'next/image';
import type { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  isDragging?: boolean;
  feedback?: 'correct' | 'incorrect' | null;
  showYear?: boolean;
  handleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default function MovieCard({ movie, isDragging, feedback, showYear, handleProps }: MovieCardProps) {
  const borderColor =
    feedback === 'correct'
      ? '#22c55e'
      : feedback === 'incorrect'
        ? '#ef4444'
        : 'var(--border)';

  const bgColor =
    feedback === 'correct'
      ? 'rgba(34,197,94,0.07)'
      : feedback === 'incorrect'
        ? 'rgba(239,68,68,0.07)'
        : 'var(--card)';

  return (
    <div
      className="card-shadow flex items-center gap-3 p-3 rounded-xl border transition-all select-none"
      style={{
        background: bgColor,
        borderColor,
        borderWidth: '1.5px',
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(1.04)' : 'scale(1)',
      }}
    >
      {/* Drag handle */}
      <div
        {...handleProps}
        className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0 px-1"
        style={{ color: 'var(--text-muted)' }}
        aria-label="drag handle"
      >
        <svg width="10" height="18" viewBox="0 0 10 18" fill="currentColor">
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="3" cy="9" r="1.5" />
          <circle cx="3" cy="15" r="1.5" />
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="9" r="1.5" />
          <circle cx="8" cy="15" r="1.5" />
        </svg>
      </div>

      {/* Poster */}
      <div
        className="w-11 h-16 flex-shrink-0 rounded-lg overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            width={44}
            height={64}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl" style={{ color: 'var(--text-muted)' }}>
            🎬
          </div>
        )}
      </div>

      {/* Title + year */}
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold leading-tight truncate"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          {movie.title}
        </p>
        {showYear ? (
          <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--gold-dim)' }}>
            {movie.year}
          </p>
        ) : (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            ????
          </p>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <span className="text-lg flex-shrink-0" style={{ color: feedback === 'correct' ? '#22c55e' : '#ef4444' }}>
          {feedback === 'correct' ? '✓' : '✗'}
        </span>
      )}
    </div>
  );
}
