"use client";

import { useMemo, useState } from "react";
import { ALL_UNITS_OPTION } from "../constants";
import type { LoveLiveSeries, SetlistPrediction, Song } from "../types";
import {
  getValidEncoreAfters,
  isGroupSelectable,
  normalizeText,
} from "../utils";

export type SetlistSlot = {
  index: number;
  song: Song | null;
};

type UseSetlistEditorOptions = {
  onDirty: () => void;
  songMap: Map<string, Song>;
  songs: Song[];
};

export function useSetlistEditor({
  onDirty,
  songMap,
  songs,
}: UseSetlistEditorOptions) {
  const [selectedGroup, setSelectedGroup] = useState<LoveLiveSeries | null>(
    null,
  );
  const [pendingGroup, setPendingGroup] = useState<LoveLiveSeries | null>(null);
  const [selectedUnit, setSelectedUnit] = useState(ALL_UNITS_OPTION);
  const [keyword, setKeyword] = useState("");
  const [songIds, setSongIds] = useState<string[]>([]);
  const [encoreAfters, setEncoreAfters] = useState<number[]>([]);
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const selectedSongs = useMemo(
    () =>
      songIds
        .map((songId) => songMap.get(songId) ?? null)
        .filter((song): song is Song => Boolean(song)),
    [songIds, songMap],
  );

  const unitOptions = useMemo(() => {
    if (!selectedGroup) {
      return [ALL_UNITS_OPTION];
    }

    const units = songs
      .filter((song) => song.series === selectedGroup)
      .map((song) => song.unit);

    return [ALL_UNITS_OPTION, ...Array.from(new Set(units))];
  }, [selectedGroup, songs]);

  const filteredSongs = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }

    const query = normalizeText(keyword);

    return songs.filter((song) => {
      const matchesGroup = song.series === selectedGroup;
      const matchesUnit =
        selectedUnit === ALL_UNITS_OPTION || song.unit === selectedUnit;
      const haystack = normalizeText(
        `${song.title} ${song.titleJa ?? ""} ${song.series} ${song.unit} ${song.tags.join(" ")}`,
      );

      return (
        matchesGroup && matchesUnit && (!query || haystack.includes(query))
      );
    });
  }, [keyword, selectedGroup, selectedUnit, songs]);

  const setlistSlots = useMemo<SetlistSlot[]>(
    () => [
      ...songIds.map((songId, index) => ({
        index,
        song: songMap.get(songId) ?? null,
      })),
      {
        index: songIds.length,
        song: null,
      },
    ],
    [songIds, songMap],
  );

  const prediction = useMemo<SetlistPrediction>(
    () => ({
      songIds,
      encoreAfters: getValidEncoreAfters(encoreAfters, songIds.length),
    }),
    [encoreAfters, songIds],
  );

  const visibleEncoreAfters = prediction.encoreAfters;
  const canConfirmGroupSelection =
    pendingGroup !== null && isGroupSelectable(pendingGroup);

  function openGroupSelection() {
    setPendingGroup(
      selectedGroup && isGroupSelectable(selectedGroup) ? selectedGroup : null,
    );
    setIsSongPickerOpen(false);
    setActiveSlotIndex(null);
  }

  function chooseGroup(group: LoveLiveSeries) {
    if (!isGroupSelectable(group)) {
      return;
    }

    setSelectedGroup(group);
    setPendingGroup(group);
    setSelectedUnit(ALL_UNITS_OPTION);
    setKeyword("");
    setIsSongPickerOpen(false);
    setActiveSlotIndex(null);
    onDirty();
  }

  function openSongPicker(slotIndex: number) {
    setActiveSlotIndex(slotIndex);
    setIsSongPickerOpen(true);
  }

  function closeSongPicker() {
    setIsSongPickerOpen(false);
    setActiveSlotIndex(null);
  }

  function assignSongToSlot(songId: string) {
    if (activeSlotIndex === null) {
      return;
    }

    setSongIds((current) => {
      if (activeSlotIndex >= current.length) {
        return [...current, songId];
      }

      const next = [...current];
      next[activeSlotIndex] = songId;
      return next;
    });
    onDirty();
    closeSongPicker();
  }

  function removeSong(index: number) {
    setSongIds((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setEncoreAfters((current) =>
      getValidEncoreAfters(
        current
          .filter(
            (encoreAfter) =>
              index !== encoreAfter && index !== encoreAfter + 1,
          )
          .map((encoreAfter) =>
            index < encoreAfter ? encoreAfter - 1 : encoreAfter,
          ),
        songIds.length - 1,
      ),
    );
    onDirty();
  }

  function placeEncoreAfter(index: number) {
    const [nextEncoreAfter] = getValidEncoreAfters([index], songIds.length);

    if (nextEncoreAfter === undefined) {
      return;
    }

    setEncoreAfters((current) => {
      if (current.includes(nextEncoreAfter)) {
        return current;
      }

      return getValidEncoreAfters([...current, nextEncoreAfter], songIds.length);
    });
    onDirty();
  }

  function clearEncore(index: number) {
    if (!encoreAfters.includes(index)) {
      return;
    }

    setEncoreAfters((current) =>
      getValidEncoreAfters(
        current.filter((encoreAfter) => encoreAfter !== index),
        songIds.length,
      ),
    );
    onDirty();
  }

  function moveSong(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= songIds.length) {
      return;
    }

    setSongIds((current) => {
      const next = [...current];
      const target = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = target;
      return next;
    });
    onDirty();
  }

  function clearSetlist() {
    setSongIds([]);
    setEncoreAfters([]);
    closeSongPicker();
    onDirty();
  }

  function applySharedSetlist(nextSongIds: string[], nextEncoreAfters: number[]) {
    const firstSong = songMap.get(nextSongIds[0] ?? "");

    setSongIds(nextSongIds);
    setEncoreAfters(getValidEncoreAfters(nextEncoreAfters, nextSongIds.length));
    if (firstSong) {
      setSelectedGroup(firstSong.series);
      setPendingGroup(
        isGroupSelectable(firstSong.series) ? firstSong.series : null,
      );
    }
  }

  return {
    activeSlotIndex,
    applySharedSetlist,
    assignSongToSlot,
    canConfirmGroupSelection,
    chooseGroup,
    clearEncore,
    clearSetlist,
    closeSongPicker,
    encoreAfters,
    filteredSongs,
    isSongPickerOpen,
    keyword,
    moveSong,
    openGroupSelection,
    openSongPicker,
    pendingGroup,
    placeEncoreAfter,
    prediction,
    removeSong,
    selectedGroup,
    selectedSongs,
    selectedUnit,
    setKeyword,
    setPendingGroup,
    setSelectedUnit,
    setlistSlots,
    songIds,
    unitOptions,
    visibleEncoreAfters,
  };
}
