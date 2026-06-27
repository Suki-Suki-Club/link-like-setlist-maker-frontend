import { backendApiBaseUrl, createBackendHeaders } from "../backend";

export type SongPreviewResponse = {
  status: "found" | "not_found" | "unavailable";
  preview: {
    deezerTrackId?: number;
    coverUrl?: string | null;
    title: string;
    previewUrl: string;
  } | null;
};

export async function fetchSongPreview(songId: string, refresh = false) {
  const searchParams = new URLSearchParams();
  if (refresh) {
    searchParams.set("refresh", "true");
  }

  const query = searchParams.toString();

  return fetch(
    `${backendApiBaseUrl}/api/songs/${encodeURIComponent(songId)}/preview${query ? `?${query}` : ""}`,
    {
      cache: "no-store",
      headers: createBackendHeaders(),
    },
  );
}
