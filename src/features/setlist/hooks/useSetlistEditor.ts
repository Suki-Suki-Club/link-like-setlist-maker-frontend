"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { ALL_UNITS_OPTION } from "../constants";
import {
  getRestorableSetlistDraft,
  readStoredSetlistDraft,
  removeStoredSetlistDraft,
  writeStoredSetlistDraft,
  type SetlistDraft,
} from "../setlist-draft";
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
  enableDraftStorage?: boolean;
  onDraftRestored?: (draft: SetlistDraft) => void;
  onDirty: () => void;
  songMap: Map<string, Song>;
  songs: Song[];
};

export function useSetlistEditor({
  enableDraftStorage = true,
  onDraftRestored,
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
  const hasRestoredDraftRef = useRef(false);
  const restoreDraftState = useEffectEvent((draft: SetlistDraft) => {
    setSelectedGroup(draft.selectedGroup);
    setPendingGroup(
      draft.selectedGroup && isGroupSelectable(draft.selectedGroup)
        ? draft.selectedGroup
        : null,
    );
    setSelectedUnit(ALL_UNITS_OPTION);
    setKeyword("");
    setSongIds(draft.songIds);
    setEncoreAfters(draft.encoreAfters);
    setIsSongPickerOpen(false);
    setActiveSlotIndex(null);
    onDraftRestored?.(draft);
  });

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

  function saveDraft(
    nextSelectedGroup: LoveLiveSeries | null,
    nextSongIds: string[],
    nextEncoreAfters: number[],
  ) {
    if (!enableDraftStorage) {
      return;
    }

    writeStoredSetlistDraft({
      selectedGroup: nextSelectedGroup,
      songIds: nextSongIds,
      encoreAfters: nextEncoreAfters,
    });
  }

  useEffect(() => {
    if (!enableDraftStorage || hasRestoredDraftRef.current || songs.length === 0) {
      return;
    }

    hasRestoredDraftRef.current = true;

    const storedDraft = readStoredSetlistDraft();

    if (!storedDraft) {
      return;
    }

    const restoredDraft = getRestorableSetlistDraft(
      storedDraft,
      new Set(songs.map((song) => song.id)),
    );

    if (!restoredDraft.selectedGroup && restoredDraft.songIds.length === 0) {
      return;
    }

    queueMicrotask(() => restoreDraftState(restoredDraft));
  }, [enableDraftStorage, songs]);

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
    saveDraft(group, songIds, encoreAfters);
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

    const nextSongIds =
      activeSlotIndex >= songIds.length
        ? [...songIds, songId]
        : songIds.map((currentSongId, currentIndex) =>
            currentIndex === activeSlotIndex ? songId : currentSongId,
          );

    setSongIds(nextSongIds);
    saveDraft(selectedGroup, nextSongIds, encoreAfters);
    onDirty();
    closeSongPicker();
  }

  function removeSong(index: number) {
    const nextSongIds = songIds.filter(
      (_, currentIndex) => currentIndex !== index,
    );
    const nextEncoreAfters = getValidEncoreAfters(
      encoreAfters
        .filter(
          (encoreAfter) => index !== encoreAfter && index !== encoreAfter + 1,
        )
        .map((encoreAfter) =>
          index < encoreAfter ? encoreAfter - 1 : encoreAfter,
        ),
      nextSongIds.length,
    );

    setSongIds(nextSongIds);
    setEncoreAfters(nextEncoreAfters);
    saveDraft(selectedGroup, nextSongIds, nextEncoreAfters);
    onDirty();
  }

  function placeEncoreAfter(index: number) {
    const [nextEncoreAfter] = getValidEncoreAfters([index], songIds.length);

    if (nextEncoreAfter === undefined) {
      return;
    }

    if (encoreAfters.includes(nextEncoreAfter)) {
      return;
    }

    const nextEncoreAfters = getValidEncoreAfters(
      [...encoreAfters, nextEncoreAfter],
      songIds.length,
    );

    setEncoreAfters(nextEncoreAfters);
    saveDraft(selectedGroup, songIds, nextEncoreAfters);
    onDirty();
  }

  function clearEncore(index: number) {
    if (!encoreAfters.includes(index)) {
      return;
    }

    const nextEncoreAfters = getValidEncoreAfters(
      encoreAfters.filter((encoreAfter) => encoreAfter !== index),
      songIds.length,
    );

    setEncoreAfters(nextEncoreAfters);
    saveDraft(selectedGroup, songIds, nextEncoreAfters);
    onDirty();
  }

  function moveSong(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= songIds.length) {
      return;
    }

    const nextSongIds = [...songIds];
    const target = nextSongIds[index];
    nextSongIds[index] = nextSongIds[nextIndex];
    nextSongIds[nextIndex] = target;

    setSongIds(nextSongIds);
    saveDraft(selectedGroup, nextSongIds, encoreAfters);
    onDirty();
  }

  function clearSetlist() {
    setSongIds([]);
    setEncoreAfters([]);
    closeSongPicker();
    if (enableDraftStorage) {
      removeStoredSetlistDraft();
    }
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
