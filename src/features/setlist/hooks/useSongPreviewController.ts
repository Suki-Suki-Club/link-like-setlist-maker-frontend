"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getCachedPreview,
  isPreviewCacheFresh,
  readPreviewCache,
  setCachedPreview,
  type CachedSongPreview,
  type SongPreviewStatus,
} from "../preview-cache";
import type { Song } from "../types";

type SongPreviewPayload = {
  coverUrl?: string | null;
  deezerTrackId?: number;
  previewUrl?: string | null;
  title: string;
};

type SongPreviewResponse = {
  status: SongPreviewStatus;
  preview: SongPreviewPayload | null;
};

type SongPreviewRequestResult = {
  cachedPreview: CachedSongPreview;
  fromCache: boolean;
  payload: SongPreviewResponse | null;
  responseOk: boolean;
};

type SongPreviewRequestOptions = {
  backgroundRefresh?: boolean;
  forceRefresh?: boolean;
  withLoadingState?: boolean;
};

type UseSongPreviewControllerOptions = {
  canPlaySound: boolean;
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

export function useSongPreviewController({
  canPlaySound,
  songMap,
  soundVolume,
  songs,
}: UseSongPreviewControllerOptions) {
  const [selectedPreviewSongId, setSelectedPreviewSongId] = useState<
    string | null
  >(null);
  const [previewBySongId, setPreviewBySongId] = useState<
    Record<string, CachedSongPreview>
  >(() => readPreviewCache());
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
  const previewRequestMapRef = useRef<
    Map<string, Promise<SongPreviewRequestResult>>
  >(new Map());
  canPlaySoundRef.current = canPlaySound;
  soundVolumeRef.current = soundVolume;

  const prefetchSongPreview = useEffectEvent((songId: string) =>
    fetchSongPreviewAndCache(songId),
  );

  useEffect(() => {
    if (songs.length === 0) {
      return;
    }

    const missingPreviewSongIds = songs
      .map((song) => song.id)
      .filter((songId) => !previewBySongId[songId] && !getCachedPreview(songId));

    if (missingPreviewSongIds.length === 0) {
      return;
    }

    void Promise.allSettled(
      missingPreviewSongIds.map((songId) => prefetchSongPreview(songId)),
    );
  }, [previewBySongId, songs]);

  const selectedPreviewSong = useMemo(
    () =>
      selectedPreviewSongId ? songMap.get(selectedPreviewSongId) ?? null : null,
    [selectedPreviewSongId, songMap],
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
      getCachedPreview(songId)?.title ??
      songMap.get(songId)?.title ??
      ""
    );
  }

  function cachePreview(songId: string, preview: CachedSongPreview) {
    setPreviewBySongId((current) => ({
      ...current,
      [songId]: preview,
    }));
    setCachedPreview(songId, preview);
    return preview;
  }

  function hydrateCachedPreview(songId: string) {
    const cachedPreview = previewBySongId[songId] ?? getCachedPreview(songId);

    if (!cachedPreview) {
      return null;
    }

    if (!previewBySongId[songId]) {
      setPreviewBySongId((current) => ({
        ...current,
        [songId]: cachedPreview,
      }));
    }

    return cachedPreview;
  }

  function createCachedPreview(
    songId: string,
    status: SongPreviewStatus,
    preview: SongPreviewPayload | null,
  ) {
    return {
      coverUrl: preview?.coverUrl ?? null,
      previewUrl: preview?.previewUrl ?? null,
      status,
      title: preview?.title ?? getFallbackPreviewTitle(songId),
      cachedAt: Date.now(),
    } satisfies CachedSongPreview;
  }

  function createPreviewApiUrl(songId: string, forceRefresh = false) {
    return `/api/song-previews/${encodeURIComponent(songId)}${forceRefresh ? "?refresh=true" : ""}`;
  }

  async function fetchSongPreviewAndCache(
    songId: string,
    options?: SongPreviewRequestOptions,
  ) {
    const requestKey = `${songId}:${options?.forceRefresh ? "refresh" : "default"}`;
    const existingRequest = previewRequestMapRef.current.get(requestKey);

    if (existingRequest) {
      return existingRequest;
    }

    const requestPromise = (async () => {
      try {
        const response = await fetch(
          createPreviewApiUrl(songId, options?.forceRefresh),
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as SongPreviewResponse;
        const cachedPreview = cachePreview(
          songId,
          createCachedPreview(songId, payload.status, payload.preview),
        );

        return {
          cachedPreview,
          fromCache: false,
          payload,
          responseOk: response.ok,
        } satisfies SongPreviewRequestResult;
      } catch {
        const cachedPreview = hydrateCachedPreview(songId);

        if (cachedPreview) {
          return {
            cachedPreview,
            fromCache: true,
            payload: null,
            responseOk: false,
          } satisfies SongPreviewRequestResult;
        }

        return {
          cachedPreview: cachePreview(
            songId,
            createCachedPreview(songId, "unavailable", null),
          ),
          fromCache: false,
          payload: null,
          responseOk: false,
        } satisfies SongPreviewRequestResult;
      } finally {
        previewRequestMapRef.current.delete(requestKey);
      }
    })();

    previewRequestMapRef.current.set(requestKey, requestPromise);
    return requestPromise;
  }

  async function requestSongPreview(
    songId: string,
    options?: SongPreviewRequestOptions,
  ) {
    if (options?.withLoadingState) {
      setPreviewLoadingSongId(songId);
    }

    try {
      const cachedPreview = !options?.forceRefresh
        ? hydrateCachedPreview(songId)
        : null;

      if (cachedPreview) {
        if (options?.backgroundRefresh) {
          void fetchSongPreviewAndCache(songId);
        }

        return {
          cachedPreview,
          fromCache: true,
          payload: null,
          responseOk: cachedPreview.status === "found",
        } satisfies SongPreviewRequestResult;
      }

      return await fetchSongPreviewAndCache(songId, options);
    } finally {
      if (options?.withLoadingState) {
        setPreviewLoadingSongId((current) =>
          current === songId ? null : current,
        );
      }
    }
  }

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
    if (!canPlaySound) {
      stopPreviewAudio();
    }
  }, [canPlaySound]);

  useEffect(() => {
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
      const startedFromCache = await tryPlayPreviewUrl(
        songId,
        cachedPreview.previewUrl,
        loop,
      );

      if (startedFromCache) {
        void fetchSongPreviewAndCache(songId, {
          forceRefresh: !isPreviewCacheFresh(cachedPreview.cachedAt),
        });

        return true;
      }
    }

    const result = await requestSongPreview(songId, {
      forceRefresh: Boolean(cachedPreview),
    });

    if (
      result.cachedPreview.status !== "found" ||
      !result.cachedPreview.previewUrl
    ) {
      return false;
    }

    return tryPlayPreviewUrl(songId, result.cachedPreview.previewUrl, loop);
  }

  async function playSongHoverPreview(songId: string) {
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
      const previewResult = await requestSongPreview(songId, {
        backgroundRefresh: true,
      });

      if (
        hoverPreviewRequestSongIdRef.current !== songId ||
        previewResult.cachedPreview.status !== "found" ||
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

    if (previewBySongId[songId]) {
      void fetchSongPreviewAndCache(songId);
      return;
    }

    if (getCachedPreview(songId)) {
      void requestSongPreview(songId, { backgroundRefresh: true });
    } else {
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
    selectedPreview,
    selectedPreviewSong,
    selectedPreviewSongId,
    stopSongHoverPreview,
  };
}
