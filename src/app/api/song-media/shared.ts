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
