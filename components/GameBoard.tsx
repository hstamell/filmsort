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
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
        Loading today's puzzle…
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-12">
      {/* Theme */}
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-muted)' }}>
          Today's Theme
        </p>
        <h2
          className="text-2xl font-bold leading-snug"
          style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--text-primary)' }}
        >
          {puzzle.theme}
        </h2>
      </div>

      {/* Instructions */}
      {attempts.length === 0 && gameStatus === 'playing' && (
        <p className="text-sm text-center mb-5 italic" style={{ color: 'var(--text-secondary)' }}>
          Drag to order from earliest to latest release
        </p>
      )}

      {/* Attempt history */}
      {attempts.length > 0 && (
        <div className="flex flex-col gap-1.5 items-center mb-5">
          {attempts.map((attempt, i) => (
            <div key={i} className="flex gap-1 items-center">
              <span className="text-xs w-10 text-right mr-1" style={{ color: 'var(--text-muted)' }}>
                {i + 1}/{MAX_ATTEMPTS}
              </span>
              {attempt.correct.map((c, j) => (
                <span key={j} className="text-base leading-none">{c ? '🟩' : '🟥'}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Direction labels */}
      <div className="flex justify-between text-xs px-1 mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        <span>↑ Earliest</span>
        <span>Latest ↓</span>
      </div>

      {/* Drag-and-drop list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={movies.map(m => m.tmdbId)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
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
        <div
          className="mt-5 p-4 rounded-xl text-center"
          style={{ background: 'rgba(34,197,94,0.07)', border: '1.5px solid rgba(34,197,94,0.3)' }}
        >
          <p className="font-bold text-lg" style={{ color: '#4ade80', fontFamily: 'var(--font-playfair), serif' }}>
            Bravo! 🎬
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(74,222,128,0.7)' }}>
            Solved in {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div
          className="mt-5 p-4 rounded-xl text-center"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.25)' }}
        >
          <p className="font-bold text-lg" style={{ color: '#f87171', fontFamily: 'var(--font-playfair), serif' }}>
            Better luck tomorrow
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(248,113,113,0.65)' }}>Correct order shown above</p>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-5 flex flex-col gap-2">
        {gameStatus === 'playing' && (
          <>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Attempt {attempts.length + 1} of {MAX_ATTEMPTS}
            </p>
            <button
              onClick={handleCheck}
              className="btn-gold w-full py-3.5 font-bold text-base rounded-xl transition-all"
              style={{ color: 'var(--bg)', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              Check Order
            </button>
          </>
        )}

        {gameStatus !== 'playing' && (
          <button
            onClick={() => setShowShare(true)}
            className="w-full py-3.5 font-bold text-base rounded-xl transition-all"
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--gold-dim)',
              color: 'var(--gold)',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            Share Results
          </button>
        )}
      </div>

      {showShare && <ShareModal shareText={shareText} onClose={() => setShowShare(false)} />}
    </div>
  );
}
