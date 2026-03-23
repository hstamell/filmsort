/**
 * Generates N new daily puzzles using Claude (themes) + TMDB (movie data).
 *
 * Usage:
 *   npm run generate-puzzles           # generates 30 puzzles from today
 *   npm run generate-puzzles 60        # generates 60 puzzles
 *   npm run generate-puzzles 30 2026-05-01  # start from a specific date
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({ path: path.join(import.meta.dirname ?? __dirname, '../.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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

async function searchTMDB(title: string, year: number): Promise<MovieData | null> {
  if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY is not set');
  try {
    const url = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: Array<{ id: number; title: string; release_date?: string; poster_path?: string | null }> };

    const match =
      data.results?.find(r => {
        const y = r.release_date ? new Date(r.release_date).getFullYear() : null;
        return y !== null && Math.abs(y - year) <= 1;
      }) ?? data.results?.[0];

    if (!match) return null;

    const releaseDate = match.release_date ?? `${year}-01-01`;
    return {
      tmdbId: match.id,
      title: match.title,
      releaseDate,
      year: new Date(releaseDate).getFullYear(),
      posterPath: match.poster_path ? `${TMDB_IMAGE_BASE}${match.poster_path}` : null,
    };
  } catch (e) {
    console.error(`  TMDB search failed for "${title}" (${year}):`, e);
    return null;
  }
}

async function generateTheme(usedThemes: string[]): Promise<{
  theme: string;
  movies: Array<{ title: string; year: number }>;
}> {
  const avoidList = usedThemes.length > 0 ? `\nAvoid these already-used themes: ${usedThemes.join(', ')}` : '';

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Generate a creative theme for a daily movie ranking game called FilmSort.
Players see 4 movies and must sort them by release year (earliest to latest).

Pick exactly 4 movies that share a fun connection (same actor, director, franchise, setting, genre quirk, etc).

STRICT RULES:
- All 4 movies must have DIFFERENT release years (no year can repeat)
- Movies should span at least 10 years
- Be clever and fun — themes like "Movies with animals in the title", "Films directed by Spielberg", "Sequels that surpassed the original"
- Movies must be real, well-known films that exist on TMDB${avoidList}

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "theme": "Short catchy theme name",
  "movies": [
    { "title": "Exact Movie Title", "year": 1984 },
    { "title": "Exact Movie Title", "year": 1991 },
    { "title": "Exact Movie Title", "year": 1999 },
    { "title": "Exact Movie Title", "year": 2007 }
  ]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');

  // Strip any accidental markdown fences
  const cleaned = content.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned) as { theme: string; movies: Array<{ title: string; year: number }> };
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function main() {
  const count = parseInt(process.argv[2] ?? '30', 10);
  const startDate = process.argv[3] ?? new Date().toISOString().split('T')[0];

  const outputPath = path.join(import.meta.dirname ?? __dirname, '../data/puzzles.json');

  let existing: PuzzleData[] = [];
  if (fs.existsSync(outputPath)) {
    existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as PuzzleData[];
  }

  const existingDates = new Set(existing.map(p => p.date));
  const usedThemes = existing.map(p => p.theme);
  const newPuzzles: PuzzleData[] = [];

  let currentDate = startDate;
  let generated = 0;

  while (generated < count) {
    if (existingDates.has(currentDate)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    console.log(`\nGenerating puzzle for ${currentDate}…`);
    let puzzle: PuzzleData | null = null;
    let retries = 0;

    while (!puzzle && retries < 4) {
      retries++;
      try {
        const theme = await generateTheme([...usedThemes, ...newPuzzles.map(p => p.theme)]);
        console.log(`  Theme: ${theme.theme}`);
        console.log(`  Movies: ${theme.movies.map(m => `${m.title} (${m.year})`).join(', ')}`);

        const movieResults = await Promise.all(theme.movies.map(m => searchTMDB(m.title, m.year)));

        if (movieResults.some(m => m === null)) {
          console.log(`  ⚠  Some movies not found on TMDB, retrying…`);
          continue;
        }

        const sorted = (movieResults as MovieData[]).sort((a, b) =>
          a.releaseDate.localeCompare(b.releaseDate)
        );

        const years = sorted.map(m => m.year);
        if (new Set(years).size !== 4) {
          console.log(`  ⚠  Duplicate years after TMDB lookup, retrying…`);
          continue;
        }

        puzzle = {
          id: 0, // reassigned below
          date: currentDate,
          theme: theme.theme,
          movies: sorted,
        };
        console.log(`  ✓ ${sorted.map(m => `${m.title} (${m.year})`).join(' → ')}`);
      } catch (e) {
        console.error(`  Error (attempt ${retries}):`, e);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (puzzle) {
      newPuzzles.push(puzzle);
      usedThemes.push(puzzle.theme);
      generated++;
    } else {
      console.log(`  ✗ Skipping ${currentDate} after ${retries} failed attempts`);
    }

    currentDate = addDays(currentDate, 1);
    await new Promise(r => setTimeout(r, 300)); // gentle rate limiting
  }

  const allPuzzles = [...existing, ...newPuzzles].sort((a, b) => a.date.localeCompare(b.date));
  allPuzzles.forEach((p, i) => { p.id = i + 1; });

  fs.writeFileSync(outputPath, JSON.stringify(allPuzzles, null, 2));
  console.log(`\n✓ Generated ${newPuzzles.length} puzzles. Total in file: ${allPuzzles.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
