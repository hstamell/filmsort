// posterPath stores the full poster URL (from OMDb or any source)
export function getPosterUrl(posterPath: string | null | undefined): string | null {
  if (!posterPath || posterPath === 'N/A') return null;
  return posterPath;
}

// Used in the generation / enrichment scripts (server-side only)
export async function fetchOmdbPoster(
  title: string,
  year: number,
  apiKey: string
): Promise<string | null> {
  try {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&y=${year}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { Poster?: string; Response?: string };
    if (data.Response === 'False' || !data.Poster || data.Poster === 'N/A') return null;
    return data.Poster;
  } catch {
    return null;
  }
}
