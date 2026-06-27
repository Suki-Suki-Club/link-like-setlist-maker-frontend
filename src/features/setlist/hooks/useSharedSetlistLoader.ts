"use client";

import { useEffect, useEffectEvent } from "react";
import type { SetlistBreak, Song } from "../types";
import { getValidSetlistBreaks, parseStoredSetlistBreaks } from "../utils";

type BackendSetlistResponse = {
  setlist?: {
    description: string | null;
    items: Array<{
      position: number;
      songId: string;
    }>;
    title?: string | null;
  };
};

type UseSharedSetlistLoaderOptions = {
  enabled: boolean;
  onError: (message: string) => void;
  onLoaded: (songIds: string[], breaks: SetlistBreak[]) => void;
  onTitleLoaded?: (title: string) => void;
  sharedSetlistId?: string;
  songs: Song[];
};

export function useSharedSetlistLoader({
  enabled,
  onError,
  onLoaded,
  onTitleLoaded,
  sharedSetlistId,
  songs,
}: UseSharedSetlistLoaderOptions) {
  const handleLoaded = useEffectEvent(onLoaded);
  const handleError = useEffectEvent(onError);
  const handleTitleLoaded = useEffectEvent((title: string) => {
    onTitleLoaded?.(title);
  });

  useEffect(() => {
    if (!enabled || !sharedSetlistId || songs.length === 0) {
      return;
    }

    const setlistId = sharedSetlistId;
    let isCancelled = false;

    async function loadSharedSetlist() {
      try {
        const response = await fetch(
          `/api/setlists/${encodeURIComponent(setlistId)}`,
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as BackendSetlistResponse;

        if (!response.ok || !payload.setlist) {
          throw new Error("Shared setlist request failed");
        }

        if (isCancelled) {
          return;
        }

        const availableSongIdSet = new Set(songs.map((song) => song.id));
        const nextSongIds = payload.setlist.items
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((item) => item.songId)
          .filter((songId) => availableSongIdSet.has(songId));
        const nextBreaks = getValidSetlistBreaks(
          parseStoredSetlistBreaks(payload.setlist.description),
          nextSongIds.length,
        );

        handleLoaded(nextSongIds, nextBreaks);
        if (payload.setlist.title?.trim()) {
          handleTitleLoaded(payload.setlist.title);
        }
        handleError("");
      } catch {
        if (!isCancelled) {
          handleLoaded([], []);
          handleError("共有セットリストを取得できません");
        }
      }
    }

    void loadSharedSetlist();

    return () => {
      isCancelled = true;
    };
  }, [enabled, sharedSetlistId, songs]);
}
