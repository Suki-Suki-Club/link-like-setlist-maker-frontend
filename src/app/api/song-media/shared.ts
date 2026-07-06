import { backendApiBaseUrl, createBackendHeaders } from "../backend";

type CloudflareFetchInit = RequestInit & {
  cf?: {
    cacheEverything?: boolean;
    cacheTtl?: number;
  };
};

const songMediaCacheTtlSeconds = 60 * 60;

export type SongMediaResponse = {
  songId: string;
  status: "available" | "unavailable";
  media: {
    deezerTrackId: number;
    title: string;
    artistName: string;
    albumTitle: string | null;
    duration: number | null;
    coverUrl: string;
    previewUrl: string;
    trackLink: string | null;
    isrc: string | null;
    rank: number | null;
  } | null;
};

export async function fetchSongMedia(songId: string) {
  const requestInit: CloudflareFetchInit = {
    cf: {
      cacheEverything: true,
      cacheTtl: songMediaCacheTtlSeconds,
    },
    headers: createBackendHeaders(),
  };

  return fetch(
    `${backendApiBaseUrl}/api/song-media/${encodeURIComponent(songId)}`,
    requestInit,
  );
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 1,
): Promise<Response> {
  let lastResponse: Response | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError;
}
