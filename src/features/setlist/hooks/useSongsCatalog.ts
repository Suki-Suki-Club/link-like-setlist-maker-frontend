"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCoverUrlsForGroup,
  preloadImageUrls,
} from "../song-catalog-loading";
import type { LoveLiveSeries, Song } from "../types";
import {
  createCachedPreviewsFromMediaBySongId,
  type CachedSongPreview,
  type SongMediaResponse,
} from "./useSongPreviewController";

type CatalogBootstrapResponse = {
  mediaBySongId?: Record<string, SongMediaResponse>;
  songs: Song[];
};

type UseSongsCatalogOptions = {
  autoLoad?: boolean;
};

export function useSongsCatalog({ autoLoad = false }: UseSongsCatalogOptions = {}) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [bootstrapPreviewBySongId, setBootstrapPreviewBySongId] = useState<
    Record<string, CachedSongPreview>
  >({});
  const [songsError, setSongsError] = useState("");
  const [isSongsLoading, setIsSongsLoading] = useState(autoLoad);
  const loadRequestIdRef = useRef(0);

  const loadSongsCatalog = useCallback(
    async (selectedGroup: LoveLiveSeries | null = null) => {
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;

      setIsSongsLoading(true);
      setSongsError("");

      try {
        const response = await fetch("/api/catalog/bootstrap", {
          cache: "no-store",
        });
        const payload = (await response.json()) as CatalogBootstrapResponse;

        if (!response.ok) {
          throw new Error("Catalog bootstrap request failed");
        }

        const titleBySongId = new Map(
          payload.songs.map((song) => [song.id, song.title]),
        );
        const previewBySongId = createCachedPreviewsFromMediaBySongId(
          payload.mediaBySongId ?? {},
          Date.now(),
          (songId) => titleBySongId.get(songId) ?? "",
        );
        await preloadImageUrls(
          getCoverUrlsForGroup({
            previewBySongId,
            selectedGroup,
            songs: payload.songs,
          }),
        );

        if (loadRequestIdRef.current !== requestId) {
          return false;
        }

        setSongs(payload.songs);
        setBootstrapPreviewBySongId(previewBySongId);
        setSongsError("");
        return true;
      } catch {
        if (loadRequestIdRef.current !== requestId) {
          return false;
        }

        setSongs([]);
        setBootstrapPreviewBySongId({});
        setSongsError("楽曲情報を取得できません");
        return false;
      } finally {
        if (loadRequestIdRef.current === requestId) {
          setIsSongsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadSongsCatalog();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoLoad, loadSongsCatalog]);

  const songMap = useMemo(
    () => new Map(songs.map((song) => [song.id, song])),
    [songs],
  );

  return {
    bootstrapPreviewBySongId,
    isSongsLoading,
    loadSongsCatalog,
    setSongsError,
    songMap,
    songs,
    songsError,
  };
}
