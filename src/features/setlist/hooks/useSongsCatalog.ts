"use client";

import { useEffect, useMemo, useState } from "react";
import type { Song } from "../types";

type SongsResponse = {
  songs: Song[];
};

export function useSongsCatalog() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsError, setSongsError] = useState("");
  const [isSongsLoading, setIsSongsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadSongs() {
      setIsSongsLoading(true);

      try {
        const response = await fetch("/api/songs", {
          cache: "no-store",
        });
        const payload = (await response.json()) as SongsResponse;

        if (!response.ok) {
          throw new Error("Songs request failed");
        }

        if (isCancelled) {
          return;
        }

        setSongs(payload.songs);
        setSongsError("");
      } catch {
        if (isCancelled) {
          return;
        }

        setSongs([]);
        setSongsError("楽曲情報を取得できません");
      } finally {
        if (!isCancelled) {
          setIsSongsLoading(false);
        }
      }
    }

    void loadSongs();

    return () => {
      isCancelled = true;
    };
  }, []);

  const songMap = useMemo(
    () => new Map(songs.map((song) => [song.id, song])),
    [songs],
  );

  return {
    isSongsLoading,
    setSongsError,
    songMap,
    songs,
    songsError,
  };
}
