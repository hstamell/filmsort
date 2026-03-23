/**
 * Fetches poster URLs from OMDb for any movies in puzzles.json
 * that currently have posterPath: null.
 *
 * Usage:  npm run enrich-puzzles
 * Sign up for a free OMDb key at: https://www.omdbapi.com/apikey.aspx
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { fetchOmdbPoster } from '../lib/tmdb.js';

config({ path: path.join(import.meta.dirname ?? __dirname, '../.env.local') });

const OMDB_API_KEY = process.env.OMDB_API_KEY;

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

async function main() {
  if (!OMDB_API_KEY) {
    console.error('OMDB_API_KEY is not set in .env.local');
    process.exit(1);
  }

  const outputPath = path.join(import.meta.dirname ?? __dirname, '../data/puzzles.json');
  const puzzles = JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as PuzzleData[];

  let enriched = 0;

  for (const puzzle of puzzles) {
    for (const movie of puzzle.movies) {
      if (!movie.posterPath) {
        const poster = await fetchOmdbPoster(movie.title, movie.year, OMDB_API_KEY);
        if (poster) {
          movie.posterPath = poster;
          console.log(`✓ ${movie.title} (${movie.year})`);
          enriched++;
        } else {
          console.log(`✗ ${movie.title} (${movie.year}) – not found`);
        }
        await new Promise(r => setTimeout(r, 200));
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
