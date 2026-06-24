"use client";

import { useEffect, useEffectEvent } from "react";
import type { Song } from "../types";
import { getValidEncoreAfters, parseStoredEncoreAfters } from "../utils";

type BackendSetlistResponse = {
  setlist?: {
    description: string | null;
    items: Array<{
      position: number;
      songId: string;
    }>;
  };
};

type UseSharedSetlistLoaderOptions = {
  enabled: boolean;
  onError: (message: string) => void;
  onLoaded: (songIds: string[], encoreAfters: number[]) => void;
  sharedSetlistId?: string;
  songs: Song[];
};

export function useSharedSetlistLoader({
  enabled,
  onError,
  onLoaded,
  sharedSetlistId,
  songs,
}: UseSharedSetlistLoaderOptions) {
  const handleLoaded = useEffectEvent(onLoaded);
  const handleError = useEffectEvent(onError);

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
        const nextEncoreAfters = getValidEncoreAfters(
          parseStoredEncoreAfters(payload.setlist.description),
          nextSongIds.length,
        );

        handleLoaded(nextSongIds, nextEncoreAfters);
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
