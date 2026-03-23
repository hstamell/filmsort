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

export default function MovieCard({
  movie,
  isDragging,
  feedback,
  showYear,
  handleProps,
}: MovieCardProps) {
  const border =
    feedback === 'correct'
      ? 'border-green-500'
      : feedback === 'incorrect'
        ? 'border-red-500'
        : 'border-zinc-700';

  const bg =
    feedback === 'correct'
      ? 'bg-green-950'
      : feedback === 'incorrect'
        ? 'bg-red-950'
        : 'bg-zinc-800 hover:bg-zinc-750';

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all select-none
        ${border} ${bg}
        ${isDragging ? 'opacity-40 scale-105 shadow-2xl' : 'opacity-100 shadow-md'}`}
    >
      {/* Drag handle */}
      <div
        {...handleProps}
        className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 px-1 touch-none"
        aria-label="drag handle"
      >
        <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
          <circle cx="4" cy="4" r="2" />
          <circle cx="4" cy="10" r="2" />
          <circle cx="4" cy="16" r="2" />
          <circle cx="10" cy="4" r="2" />
          <circle cx="10" cy="10" r="2" />
          <circle cx="10" cy="16" r="2" />
        </svg>
      </div>

      {/* Poster */}
      <div className="w-11 h-16 flex-shrink-0 rounded-md overflow-hidden bg-zinc-700">
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
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-2xl">
            🎬
          </div>
        )}
      </div>

      {/* Title + year */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold leading-tight truncate">{movie.title}</p>
        {showYear ? (
          <p className="text-zinc-400 text-sm mt-0.5">{movie.year}</p>
        ) : (
          <p className="text-zinc-600 text-sm mt-0.5">????</p>
        )}
      </div>

      {/* Feedback icon */}
      {feedback && (
        <span className={`text-xl flex-shrink-0 ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
          {feedback === 'correct' ? '✓' : '✗'}
        </span>
      )}
    </div>
  );
}
