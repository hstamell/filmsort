'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MovieCard from './MovieCard';
import type { Movie } from '@/types';

interface SortableMovieCardProps {
  movie: Movie;
  feedback?: 'correct' | 'incorrect' | null;
  showYear?: boolean;
  disabled?: boolean;
  posterRevealed?: boolean;
  canReveal?: boolean;
  onReveal?: () => void;
}

export default function SortableMovieCard({
  movie,
  feedback,
  showYear,
  disabled,
  posterRevealed,
  canReveal,
  onReveal,
}: SortableMovieCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: movie.tmdbId,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? ('relative' as const) : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <MovieCard
        movie={movie}
        isDragging={isDragging}
        feedback={feedback}
        showYear={showYear}
        posterRevealed={posterRevealed}
        canReveal={canReveal}
        onReveal={onReveal}
        handleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
