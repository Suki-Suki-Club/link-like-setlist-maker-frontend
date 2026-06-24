"use client";

export type SongPreviewStatus = "found" | "not_found" | "unavailable";

export type CachedSongPreview = {
  status: SongPreviewStatus;
  title: string;
  coverUrl: string | null;
  previewUrl: string | null;
  cachedAt: number;
};

type PreviewCacheRecord = Record<string, CachedSongPreview>;

type PreviewCachePayload = {
  version: 1;
  previews: PreviewCacheRecord;
};

const previewCacheKey = "setlist-maker.song-previews";
const previewCacheVersion = 1;
const previewCacheTtlMs = 7 * 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCachedSongPreview(value: unknown): value is CachedSongPreview {
  if (!isRecord(value)) {
    return false;
  }

  const { cachedAt, coverUrl, previewUrl, status, title } = value;

  return (
    (status === "found" || status === "not_found" || status === "unavailable") &&
    typeof title === "string" &&
    (coverUrl === null || typeof coverUrl === "string") &&
    (previewUrl === null || typeof previewUrl === "string") &&
    typeof cachedAt === "number" &&
    Number.isFinite(cachedAt)
  );
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function isPreviewCacheFresh(cachedAt: number) {
  return Date.now() - cachedAt <= previewCacheTtlMs;
}

export function readPreviewCache(): PreviewCacheRecord {
  const storage = getStorage();

  if (!storage) {
    return {};
  }

  try {
    const raw = storage.getItem(previewCacheKey);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!isRecord(parsed) || parsed.version !== previewCacheVersion) {
      return {};
    }

    const previews = parsed.previews;

    if (!isRecord(previews)) {
      return {};
    }

    const next: PreviewCacheRecord = {};

    for (const [songId, preview] of Object.entries(previews)) {
      if (isCachedSongPreview(preview)) {
        next[songId] = preview;
      }
    }

    return next;
  } catch {
    return {};
  }
}

export function writePreviewCache(next: PreviewCacheRecord) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const payload: PreviewCachePayload = {
    version: previewCacheVersion,
    previews: next,
  };

  try {
    storage.setItem(previewCacheKey, JSON.stringify(payload));
  } catch {
    return;
  }
}

export function getCachedPreview(songId: string) {
  const cache = readPreviewCache();
  return cache[songId] ?? null;
}

export function setCachedPreview(songId: string, preview: CachedSongPreview) {
  const cache = readPreviewCache();
  writePreviewCache({
    ...cache,
    [songId]: preview,
  });
}
