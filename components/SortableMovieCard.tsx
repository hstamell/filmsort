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
}

export default function SortableMovieCard({
  movie,
  feedback,
  showYear,
  disabled,
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
        handleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
