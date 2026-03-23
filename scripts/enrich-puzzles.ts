/**
 * Fetches real poster paths from TMDB for any movies in puzzles.json
 * that currently have posterPath: null.
 *
 * Usage:  npm run enrich-puzzles
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({ path: path.join(import.meta.dirname ?? __dirname, '../.env.local') });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface MovieData {
  tmdbId: number;
  title: string;
  year: number;
  releaseDate: string;
  posterPath: string | null;
}

interface PuzzleData {
  id: number;
  date: string;
  theme: string;
  movies: MovieData[];
}

async function fetchPosterPath(tmdbId: number): Promise<string | null> {
  if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY is not set');
  try {
    const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { poster_path?: string | null };
    return data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : null;
  } catch {
    return null;
  }
}

async function main() {
  const outputPath = path.join(import.meta.dirname ?? __dirname, '../data/puzzles.json');
  const puzzles = JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as PuzzleData[];

  let enriched = 0;

  for (const puzzle of puzzles) {
    for (const movie of puzzle.movies) {
      if (!movie.posterPath) {
        const posterPath = await fetchPosterPath(movie.tmdbId);
        if (posterPath) {
          movie.posterPath = posterPath;
          console.log(`✓ ${movie.title} (${movie.year})`);
          enriched++;
        } else {
          console.log(`✗ ${movie.title} (tmdbId: ${movie.tmdbId}) – not found`);
        }
        await new Promise(r => setTimeout(r, 150));
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(puzzles, null, 2));
  console.log(`\nDone. Enriched ${enriched} movies.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
