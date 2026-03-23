/**
 * Generates N new daily puzzles using Claude (themes + movie data).
 * TMDB is optional — if TMDB_API_KEY is set, posters are fetched too.
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
const OMDB_API_KEY = process.env.OMDB_API_KEY ?? null;

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

async function fetchPoster(title: string, year: number): Promise<string | null> {
  if (!OMDB_API_KEY) return null;
  try {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&y=${year}&apikey=${OMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { Poster?: string; Response?: string };
    if (data.Response === 'False' || !data.Poster || data.Poster === 'N/A') return null;
    return data.Poster;
  } catch {
    return null;
  }
}

async function generateTheme(usedThemes: string[]): Promise<{
  theme: string;
  movies: Array<{ title: string; year: number; releaseDate: string }>;
}> {
  const avoidList = usedThemes.length > 0 ? `\nAvoid these already-used themes: ${usedThemes.join(', ')}` : '';

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 768,
    messages: [
      {
        role: 'user',
        content: `Generate a creative theme for a daily movie ranking game called FilmSort.
Players see 4 movies and must sort them by release year (earliest to latest).

Pick exactly 4 movies that share a fun connection (same actor, director, franchise, setting, genre quirk, etc).

STRICT RULES:
- All 4 movies must have DIFFERENT release years (no year can repeat)
- Movies should span at least 10 years
- Be clever and fun — themes like "Movies set in space", "Films directed by Spielberg", "Sequels that surpassed the original"
- Movies must be real, well-known films
- Include the exact release date (YYYY-MM-DD) for each film — be precise${avoidList}

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "theme": "Short catchy theme name",
  "movies": [
    { "title": "Exact Movie Title", "year": 1984, "releaseDate": "1984-06-22" },
    { "title": "Exact Movie Title", "year": 1991, "releaseDate": "1991-07-03" },
    { "title": "Exact Movie Title", "year": 1999, "releaseDate": "1999-05-19" },
    { "title": "Exact Movie Title", "year": 2007, "releaseDate": "2007-05-04" }
  ]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');

  const cleaned = content.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned) as { theme: string; movies: Array<{ title: string; year: number; releaseDate: string }> };
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

        const years = theme.movies.map(m => m.year);
        if (new Set(years).size !== 4) {
          console.log(`  ⚠  Duplicate years in Claude response, retrying…`);
          continue;
        }

        // Sort by release date and optionally fetch posters
        const sorted = [...theme.movies].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
        const movies: MovieData[] = await Promise.all(
          sorted.map(async (m, i) => ({
            tmdbId: i + 1, // placeholder ID, unique within this puzzle
            title: m.title,
            year: m.year,
            releaseDate: m.releaseDate,
            posterPath: await fetchPoster(m.title, m.year),
          }))
        );

        puzzle = {
          id: 0, // reassigned below
          date: currentDate,
          theme: theme.theme,
          movies,
        };
        console.log(`  ✓ ${movies.map(m => `${m.title} (${m.year})`).join(' → ')}`);
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
