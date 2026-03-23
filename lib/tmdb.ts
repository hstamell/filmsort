const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_API_BASE = 'https://api.themoviedb.org/3';

export function getPosterUrl(posterPath: string | null | undefined): string | null {
  if (!posterPath) return null;
  if (posterPath.startsWith('http')) return posterPath;
  return `${TMDB_IMAGE_BASE}${posterPath}`;
}

// Used in the generation / enrichment scripts (server-side only)
export async function searchMovie(
  title: string,
  year: number,
  apiKey: string
): Promise<{ tmdbId: number; title: string; releaseDate: string; year: number; posterPath: string | null } | null> {
  try {
    const url = `${TMDB_API_BASE}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}&year=${year}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const match =
      data.results?.find((r: { release_date?: string }) => {
        const y = r.release_date ? new Date(r.release_date).getFullYear() : null;
        return y !== null && Math.abs(y - year) <= 1;
      }) ?? data.results?.[0];

    if (!match) return null;
    return {
      tmdbId: match.id,
      title: match.title,
      releaseDate: match.release_date ?? `${year}-01-01`,
      year: match.release_date ? new Date(match.release_date).getFullYear() : year,
      posterPath: match.poster_path ?? null,
    };
  } catch {
    return null;
  }
}
