"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Song } from "../types";

export type SongMediaStatus = "available" | "unavailable";

export type SongMediaPayload = {
  albumTitle: string | null;
  artistName: string;
  coverUrl: string;
  deezerTrackId: number;
  duration: number | null;
  isrc: string | null;
  previewUrl: string;
  rank: number | null;
  title: string;
  trackLink: string | null;
};

export type SongMediaResponse = {
  media: SongMediaPayload | null;
  songId: string;
  status: SongMediaStatus;
};

export type CachedSongPreview = {
  cachedAt: number;
  coverUrl: string | null;
  previewUrl: string | null;
  status: SongMediaStatus;
  title: string;
};

type SongPreviewRequestResult = {
  cachedPreview: CachedSongPreview;
  fromCache: boolean;
  payload: SongMediaResponse | null;
  responseOk: boolean;
};

type SongPreviewRequestOptions = {
  withLoadingState?: boolean;
};

type UseSongPreviewControllerOptions = {
  bootstrapPreviewBySongId?: Record<string, CachedSongPreview>;
  canPlaySound: boolean;
  prefetchPreviews: boolean;
  prefetchSongIds?: string[];
  songMap: Map<string, Song>;
  soundVolume: number;
  songs: Song[];
};

export function shouldReuseActivePreviewAudio(
  audio: Pick<HTMLAudioElement, "ended" | "paused"> | null,
  activePreviewSongId: string | null,
  songId: string,
) {
  return Boolean(
    audio &&
      activePreviewSongId === songId &&
      !audio.paused &&
      !audio.ended,
  );
}

export function mergeCachedSongPreview(
  current: CachedSongPreview | null | undefined,
  next: CachedSongPreview,
) {
  const coverUrl = next.coverUrl ?? current?.coverUrl ?? null;
  const previewUrl = next.previewUrl ?? current?.previewUrl ?? null;
  const status =
    next.status === "available" || !current || (!coverUrl && !previewUrl)
      ? next.status
      : current.status;

  return {
    ...next,
    coverUrl,
    previewUrl,
    status,
  } satisfies CachedSongPreview;
}

function isProxiedCoverUrl(coverUrl: string | null | undefined) {
  return typeof coverUrl === "string" && coverUrl.startsWith("/api/song-media/");
}

function isProxiedAudioUrl(previewUrl: string | null | undefined) {
  return typeof previewUrl === "string" && previewUrl.startsWith("/api/song-media/");
}

function hasDisplayReadyPreview(preview: CachedSongPreview | null | undefined) {
  if (!preview) {
    return false;
  }

  return preview.status === "available"
    ? isProxiedAudioUrl(preview.previewUrl) &&
        isProxiedCoverUrl(preview.coverUrl)
    : true;
}

function isResolvedForPrefetch(preview: CachedSongPreview | null | undefined) {
  return hasDisplayReadyPreview(preview);
}

function mergePreviewRecordsByFreshness(
  current: Record<string, CachedSongPreview>,
  incoming: Record<string, CachedSongPreview> | undefined,
) {
  if (!incoming || Object.keys(incoming).length === 0) {
    return current;
  }

  const next = { ...current };

  for (const [songId, preview] of Object.entries(incoming)) {
    if (!next[songId] || preview.cachedAt >= next[songId].cachedAt) {
      next[songId] = preview;
    }
  }

  return next;
}

export function getMissingPreviewSongIds({
  cachedPreviewBySongId,
  getFallbackPreviewBySongId,
  songIds,
}: {
  cachedPreviewBySongId: Record<string, CachedSongPreview>;
  getFallbackPreviewBySongId: (songId: string) => CachedSongPreview | null;
  songIds: string[];
}) {
  return songIds.filter((songId) => {
    const preview =
      cachedPreviewBySongId[songId] ?? getFallbackPreviewBySongId(songId);
    return !isResolvedForPrefetch(preview);
  });
}

function getCoverProxyUrl(songId: string) {
  return `/api/song-media/${encodeURIComponent(songId)}/cover`;
}

function getAudioProxyUrl(songId: string) {
  return `/api/song-media/${encodeURIComponent(songId)}/audio`;
}

function createCachedPreviewFromMediaResponse(
  songId: string,
  response: SongMediaResponse,
  cachedAt: number,
  getFallbackTitle: (songId: string) => string,
) {
  return {
    cachedAt,
    coverUrl: response.media?.coverUrl ? getCoverProxyUrl(songId) : null,
    previewUrl: response.media?.previewUrl ? getAudioProxyUrl(songId) : null,
    status: response.status,
    title: response.media?.title ?? getFallbackTitle(songId),
  } satisfies CachedSongPreview;
}

export function createCachedPreviewsFromMediaBySongId(
  mediaBySongId: Record<string, SongMediaResponse>,
  cachedAt: number,
  getFallbackTitle: (songId: string) => string,
) {
  return Object.fromEntries(
    Object.entries(mediaBySongId).map(([songId, response]) => [
      songId,
      createCachedPreviewFromMediaResponse(
        songId,
        response,
        cachedAt,
        getFallbackTitle,
      ),
    ]),
  );
}

export function useSongPreviewController({
  bootstrapPreviewBySongId,
  canPlaySound,
  prefetchPreviews,
  prefetchSongIds,
  songMap,
  soundVolume,
  songs,
}: UseSongPreviewControllerOptions) {
  const [selectedPreviewSongId, setSelectedPreviewSongId] = useState<
    string | null
  >(null);
  const [storedPreviewBySongId, setStoredPreviewBySongId] = useState<
    Record<string, CachedSongPreview>
  >({});
  const [previewLoadingSongId, setPreviewLoadingSongId] = useState<
    string | null
  >(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const activePreviewSongIdRef = useRef<string | null>(null);
  const hoverPreviewRequestSongIdRef = useRef<string | null>(null);
  const previewConfirmSongIdRef = useRef<string | null>(null);
  const pendingPreviewConfirmSongIdRef = useRef<string | null>(null);
  const canPlaySoundRef = useRef(canPlaySound);
  const soundVolumeRef = useRef(soundVolume);
  const prefetchPreviewRequestSongIdsRef = useRef<Set<string>>(new Set());
  const previewRequestMapRef = useRef<
    Map<string, Promise<SongPreviewRequestResult>>
  >(new Map());

  const selectedPreviewSong = useMemo(
    () =>
      selectedPreviewSongId ? songMap.get(selectedPreviewSongId) ?? null : null,
    [selectedPreviewSongId, songMap],
  );
  const previewBySongId = useMemo(
    () =>
      mergePreviewRecordsByFreshness(
        storedPreviewBySongId,
        bootstrapPreviewBySongId,
      ),
    [bootstrapPreviewBySongId, storedPreviewBySongId],
  );
  const selectedPreview = selectedPreviewSongId
    ? previewBySongId[selectedPreviewSongId] ?? null
    : null;
  const isPreviewConfirmOpen = selectedPreviewSongId !== null;
  const isSelectedPreviewLoading =
    selectedPreviewSongId !== null &&
    previewLoadingSongId === selectedPreviewSongId;

  function getFallbackPreviewTitle(songId: string) {
    return (
      previewBySongId[songId]?.title ??
      songMap.get(songId)?.title ??
      ""
    );
  }

  function cachePreview(songId: string, preview: CachedSongPreview) {
    const existingPreview = previewBySongId[songId];
    const nextPreview = mergeCachedSongPreview(existingPreview, preview);

    setStoredPreviewBySongId((current) => ({
      ...current,
      [songId]: mergeCachedSongPreview(current[songId], nextPreview),
    }));
    return nextPreview;
  }

  function hydrateCachedPreview(songId: string) {
    return previewBySongId[songId] ?? null;
  }

  function createUnavailablePreview(songId: string) {
    return {
      cachedAt: Date.now(),
      coverUrl: null,
      previewUrl: null,
      status: "unavailable",
      title: getFallbackPreviewTitle(songId),
    } satisfies CachedSongPreview;
  }

  async function fetchSongMediaAndCache(
    songId: string,
    options?: SongPreviewRequestOptions,
  ) {
    const existingRequest = previewRequestMapRef.current.get(songId);

    if (existingRequest) {
      if (options?.withLoadingState) {
        return existingRequest.finally(() => {
          setPreviewLoadingSongId((current) =>
            current === songId ? null : current,
          );
        });
      }

      return existingRequest;
    }

    const requestPromise = (async () => {
      try {
        const response = await fetch(
          `/api/song-media/${encodeURIComponent(songId)}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Song media request failed");
        }

        const payload = (await response.json()) as SongMediaResponse;
        const cachedPreview = cachePreview(
          songId,
          createCachedPreviewFromMediaResponse(
            songId,
            payload,
            Date.now(),
            getFallbackPreviewTitle,
          ),
        );

        return {
          cachedPreview,
          fromCache: false,
          payload,
          responseOk: payload.status === "available",
        } satisfies SongPreviewRequestResult;
      } catch {
        const cachedPreview = hydrateCachedPreview(songId);

        if (cachedPreview) {
          return {
            cachedPreview,
            fromCache: true,
            payload: null,
            responseOk: cachedPreview.status === "available",
          } satisfies SongPreviewRequestResult;
        }

        return {
          cachedPreview: cachePreview(songId, createUnavailablePreview(songId)),
          fromCache: false,
          payload: null,
          responseOk: false,
        } satisfies SongPreviewRequestResult;
      } finally {
        previewRequestMapRef.current.delete(songId);
        if (options?.withLoadingState) {
          setPreviewLoadingSongId((current) =>
            current === songId ? null : current,
          );
        }
      }
    })();

    previewRequestMapRef.current.set(songId, requestPromise);
    return requestPromise;
  }

  async function requestSongPreview(
    songId: string,
    options?: SongPreviewRequestOptions,
  ) {
    if (options?.withLoadingState) {
      setPreviewLoadingSongId(songId);
    }

    const cachedPreview = hydrateCachedPreview(songId);

    if (cachedPreview) {
      if (options?.withLoadingState) {
        setPreviewLoadingSongId((current) =>
          current === songId ? null : current,
        );
      }

      return {
        cachedPreview,
        fromCache: true,
        payload: null,
        responseOk: cachedPreview.status === "available",
      } satisfies SongPreviewRequestResult;
    }

    return fetchSongMediaAndCache(songId, options);
  }

  function loadSongPreviewForDisplay(songId: string) {
    const cachedPreview = previewBySongId[songId];

    if (hasDisplayReadyPreview(cachedPreview)) {
      return;
    }

    if (prefetchPreviewRequestSongIdsRef.current.has(songId)) {
      return;
    }

    prefetchPreviewRequestSongIdsRef.current.add(songId);
    void requestSongPreview(songId);
  }

  async function loadSongPreviewsForDisplay(songIds: string[]) {
    const missingSongIds = songIds.filter((songId) => {
      const cachedPreview = previewBySongId[songId];
      return !isResolvedForPrefetch(cachedPreview);
    });

    if (missingSongIds.length === 0) {
      return;
    }

    await Promise.all(
      missingSongIds.map(async (songId) => {
        prefetchPreviewRequestSongIdsRef.current.add(songId);

        try {
          await requestSongPreview(songId);
        } catch {
          prefetchPreviewRequestSongIdsRef.current.delete(songId);
        }
      }),
    );
  }

  const prefetchSongPreviews = useEffectEvent((songIds: string[]) =>
    loadSongPreviewsForDisplay(songIds),
  );

  useEffect(() => {
    if (!prefetchPreviews || songs.length === 0) {
      return;
    }

    const targetSongIds = prefetchSongIds ?? songs.map((song) => song.id);
    const missingPreviewSongIds = getMissingPreviewSongIds({
      cachedPreviewBySongId: previewBySongId,
      getFallbackPreviewBySongId: () => null,
      songIds: targetSongIds,
    });

    if (missingPreviewSongIds.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void prefetchSongPreviews(missingPreviewSongIds);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [prefetchPreviews, prefetchSongIds, previewBySongId, songs]);

  function stopPreviewAudio() {
    const audio = previewAudioRef.current;

    if (!audio) {
      return;
    }

    activePreviewSongIdRef.current = null;
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();
  }

  useEffect(() => {
    canPlaySoundRef.current = canPlaySound;

    if (!canPlaySound) {
      stopPreviewAudio();
    }
  }, [canPlaySound]);

  useEffect(() => {
    soundVolumeRef.current = soundVolume;
    const audio = previewAudioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = soundVolume;
  }, [soundVolume]);

  async function tryPlayPreviewUrl(
    songId: string,
    previewUrl: string,
    loop: boolean,
  ) {
    const audio = previewAudioRef.current;

    if (!audio || !canPlaySoundRef.current) {
      return false;
    }

    if (
      shouldReuseActivePreviewAudio(
        audio,
        activePreviewSongIdRef.current,
        songId,
      )
    ) {
      audio.loop = loop;
      audio.volume = soundVolumeRef.current;
      return true;
    }

    activePreviewSongIdRef.current = songId;
    audio.loop = loop;
    audio.volume = soundVolumeRef.current;
    audio.src = previewUrl;
    audio.currentTime = 0;

    try {
      await audio.play();
      return true;
    } catch {
      if (activePreviewSongIdRef.current === songId) {
        activePreviewSongIdRef.current = null;
      }

      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return false;
    }
  }

  async function playSongPreviewAudio(
    songId: string,
    options?: { loop?: boolean },
  ) {
    if (!canPlaySoundRef.current) {
      stopPreviewAudio();
      return false;
    }

    const cachedPreview = hydrateCachedPreview(songId);
    const loop = options?.loop ?? false;

    if (cachedPreview?.previewUrl) {
      return tryPlayPreviewUrl(songId, cachedPreview.previewUrl, loop);
    }

    const result = cachedPreview
      ? {
          cachedPreview,
          fromCache: true,
          payload: null,
          responseOk: cachedPreview.status === "available",
        }
      : await requestSongPreview(songId);

    if (
      result.cachedPreview.status !== "available" ||
      !result.cachedPreview.previewUrl
    ) {
      return false;
    }

    return tryPlayPreviewUrl(songId, result.cachedPreview.previewUrl, loop);
  }

  async function playSongHoverPreview(songId: string) {
    loadSongPreviewForDisplay(songId);

    const audio = previewAudioRef.current;

    if (
      !audio ||
      !canPlaySoundRef.current ||
      activePreviewSongIdRef.current === songId
    ) {
      return;
    }

    stopPreviewAudio();
    hoverPreviewRequestSongIdRef.current = songId;

    try {
      const previewResult = await requestSongPreview(songId);

      if (
        hoverPreviewRequestSongIdRef.current !== songId ||
        previewResult.cachedPreview.status !== "available" ||
        !canPlaySoundRef.current
      ) {
        return;
      }

      await playSongPreviewAudio(songId, { loop: true });
    } catch (error) {
      if (activePreviewSongIdRef.current === songId) {
        activePreviewSongIdRef.current = null;
      }

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        return;
      }
    }
  }

  function stopSongHoverPreview(songId: string) {
    if (
      previewConfirmSongIdRef.current === songId ||
      pendingPreviewConfirmSongIdRef.current === songId
    ) {
      return;
    }

    if (
      activePreviewSongIdRef.current !== songId &&
      hoverPreviewRequestSongIdRef.current !== songId
    ) {
      return;
    }

    hoverPreviewRequestSongIdRef.current = null;
    stopPreviewAudio();
  }

  function resetPreviewInteraction() {
    hoverPreviewRequestSongIdRef.current = null;
    previewConfirmSongIdRef.current = null;
    pendingPreviewConfirmSongIdRef.current = null;
    setSelectedPreviewSongId(null);
    stopPreviewAudio();
  }

  function clearPreviewSelection() {
    previewConfirmSongIdRef.current = null;
    pendingPreviewConfirmSongIdRef.current = null;
    setSelectedPreviewSongId(null);
  }

  function beginSongPreviewConfirm(songId: string) {
    pendingPreviewConfirmSongIdRef.current = songId;
  }

  function beginReadOnlySongPreview(songId: string, pointerType?: string) {
    pendingPreviewConfirmSongIdRef.current = songId;

    if (pointerType && pointerType !== "mouse" && canPlaySoundRef.current) {
      void playSongPreviewAudio(songId, { loop: true });
    }
  }

  function openSongPreviewConfirm(songId: string) {
    previewConfirmSongIdRef.current = songId;
    setSelectedPreviewSongId(songId);

    if (canPlaySoundRef.current) {
      void playSongPreviewAudio(songId, { loop: true });
    }

    if (!previewBySongId[songId]) {
      void requestSongPreview(songId, { withLoadingState: true });
    }
  }

  function closeSongPreviewConfirm() {
    const previewSongId = selectedPreviewSongId;

    previewConfirmSongIdRef.current = null;
    pendingPreviewConfirmSongIdRef.current = null;
    setSelectedPreviewSongId(null);

    if (
      previewSongId &&
      (activePreviewSongIdRef.current === previewSongId ||
        hoverPreviewRequestSongIdRef.current === previewSongId)
    ) {
      hoverPreviewRequestSongIdRef.current = null;
      stopPreviewAudio();
    }
  }

  return {
    audioRef: previewAudioRef,
    beginReadOnlySongPreview,
    beginSongPreviewConfirm,
    clearPreviewSelection,
    closeSongPreviewConfirm,
    isPreviewConfirmOpen,
    isSelectedPreviewLoading,
    openSongPreviewConfirm,
    playSongPreviewAudio,
    playSongHoverPreview,
    resetPreviewInteraction,
    previewBySongId,
    selectedPreview,
    selectedPreviewSong,
    selectedPreviewSongId,
    stopSongHoverPreview,
  };
}
