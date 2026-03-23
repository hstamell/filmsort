'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableMovieCard from './SortableMovieCard';
import ShareModal from './ShareModal';
import {
  MAX_ATTEMPTS,
  seededShuffle,
  checkAttempt,
  generateShareText,
  loadGameState,
  saveGameState,
} from '@/lib/game';
import type { AttemptResult, GameStatus, Movie, Puzzle } from '@/types';

interface GameBoardProps {
  puzzle: Puzzle;
  puzzleNumber: number;
}

export default function GameBoard({ puzzle, puzzleNumber }: GameBoardProps) {
  const [movies, setMovies] = useState<Movie[]>(() =>
    seededShuffle(puzzle.movies, puzzle.date)
  );
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [lastFeedback, setLastFeedback] = useState<boolean[] | null>(null);
  const [showYears, setShowYears] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Restore saved state after hydration
  useEffect(() => {
    const saved = loadGameState(puzzle.id);
    if (saved && saved.date === puzzle.date) {
      setAttempts(saved.attempts);
      setGameStatus(saved.status);
      if (saved.attempts.length > 0) {
        setLastFeedback(saved.attempts[saved.attempts.length - 1].correct);
      }
      if (saved.status !== 'playing') {
        setShowYears(true);
        if (saved.status === 'lost') {
          setMovies(puzzle.movies); // reveal correct order
        } else if (saved.finalOrder) {
          setMovies(saved.finalOrder.map(i => puzzle.movies[i]));
        }
      }
    }
    setHydrated(true);
  }, [puzzle]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMovies(prev => {
      const oldIdx = prev.findIndex(m => m.tmdbId === active.id);
      const newIdx = prev.findIndex(m => m.tmdbId === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });

    // Clear feedback dots when the user moves a card
    setLastFeedback(null);
  }

  function handleCheck() {
    if (gameStatus !== 'playing') return;

    const result = checkAttempt(movies, puzzle.movies);
    const newAttempts = [...attempts, result];
    setAttempts(newAttempts);
    setLastFeedback(result.correct);

    let newStatus: GameStatus = 'playing';
    if (result.allCorrect) {
      newStatus = 'won';
      setShowYears(true);
    } else if (newAttempts.length >= MAX_ATTEMPTS) {
      newStatus = 'lost';
      setShowYears(true);
      setMovies(puzzle.movies); // reveal correct order
    }

    setGameStatus(newStatus);

    saveGameState({
      puzzleId: puzzle.id,
      date: puzzle.date,
      attempts: newAttempts,
      status: newStatus,
      finalOrder:
        newStatus !== 'playing'
          ? movies.map(m => puzzle.movies.findIndex(c => c.tmdbId === m.tmdbId))
          : undefined,
    });

    if (newStatus !== 'playing') {
      setTimeout(() => setShowShare(true), 900);
    }
  }

  const shareText = generateShareText(puzzleNumber, puzzle.theme, attempts, gameStatus);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading today's puzzle…
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-10">
      {/* Theme */}
      <div className="text-center mb-6">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Today's Theme</p>
        <h2 className="text-white text-2xl font-bold">{puzzle.theme}</h2>
      </div>

      {/* Instructions */}
      {attempts.length === 0 && gameStatus === 'playing' && (
        <p className="text-zinc-500 text-sm text-center mb-5">
          Drag the movies into order — earliest release at the top, latest at the bottom.
        </p>
      )}

      {/* Attempt history */}
      {attempts.length > 0 && (
        <div className="flex flex-col gap-1 items-center mb-5">
          {attempts.map((attempt, i) => (
            <div key={i} className="flex gap-1 items-center">
              <span className="text-zinc-600 text-xs w-12 text-right mr-1">
                {i + 1}/{MAX_ATTEMPTS}
              </span>
              {attempt.correct.map((c, j) => (
                <span key={j} className="text-lg leading-none">
                  {c ? '🟩' : '🟥'}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Direction labels */}
      <div className="flex justify-between text-zinc-600 text-xs px-1 mb-1.5">
        <span>↑ EARLIEST</span>
        <span>LATEST ↓</span>
      </div>

      {/* Drag-and-drop list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={movies.map(m => m.tmdbId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {movies.map((movie, i) => (
              <SortableMovieCard
                key={movie.tmdbId}
                movie={movie}
                feedback={lastFeedback ? (lastFeedback[i] ? 'correct' : 'incorrect') : null}
                showYear={showYears}
                disabled={gameStatus !== 'playing'}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Result banner */}
      {gameStatus === 'won' && (
        <div className="mt-4 p-4 bg-green-950 border border-green-700 rounded-xl text-center">
          <p className="text-green-300 font-bold text-lg">You got it! 🎬</p>
          <p className="text-green-500 text-sm mt-0.5">
            Solved in {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div className="mt-4 p-4 bg-red-950 border border-red-800 rounded-xl text-center">
          <p className="text-red-300 font-bold text-lg">No more attempts!</p>
          <p className="text-red-500 text-sm mt-0.5">Correct order shown above</p>
        </div>
      )}

      {/* Check / Share buttons */}
      <div className="mt-4 flex flex-col gap-2">
        {gameStatus === 'playing' && (
          <>
            <p className="text-zinc-600 text-xs text-center">
              Attempt {attempts.length + 1} of {MAX_ATTEMPTS}
            </p>
            <button
              onClick={handleCheck}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-base rounded-xl transition-colors"
            >
              Check Order
            </button>
          </>
        )}

        {gameStatus !== 'playing' && (
          <button
            onClick={() => setShowShare(true)}
            className="w-full py-3.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white font-bold text-base rounded-xl transition-colors"
          >
            Share Results
          </button>
        )}
      </div>

      {showShare && (
        <ShareModal shareText={shareText} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
