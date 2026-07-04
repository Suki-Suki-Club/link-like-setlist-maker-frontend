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
import type {
  LoveLiveSeries,
  SetlistBreak,
  SetlistBreakType,
  SetlistPrediction,
  Song,
} from "../types";
import {
  getEncoreAftersFromBreaks,
  getSetlistBreaksAfterInsertedSong,
  getValidSetlistBreaks,
  insertItem,
  isGroupSelectable,
  normalizeText,
  reorderItems,
} from "../utils";

export type SetlistSlotAction = "replace" | "insert" | "append";

export type SetlistSlot =
  | {
      action: "insert";
      index: number;
      song: null;
    }
  | {
      action: "replace";
      index: number;
      song: Song | null;
    }
  | {
      action: "append";
      index: number;
      song: null;
    };

type ActiveSetlistSlot = {
  index: number;
  action: SetlistSlotAction;
};

type UseSetlistEditorOptions = {
  enableDraftStorage?: boolean;
  onDraftRestored?: (draft: SetlistDraft) => void;
  onDirty: () => void;
  resetStoredDraftOnLoad?: boolean;
  songMap: Map<string, Song>;
  songs: Song[];
};

export function useSetlistEditor({
  enableDraftStorage = true,
  onDraftRestored,
  onDirty,
  resetStoredDraftOnLoad = false,
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
  const [setlistBreaks, setSetlistBreaks] = useState<SetlistBreak[]>([]);
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<ActiveSetlistSlot | null>(null);
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
    setSetlistBreaks(draft.breaks);
    setIsSongPickerOpen(false);
    setActiveSlot(null);
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

  const setlistSlots = useMemo<SetlistSlot[]>(() => {
    if (songIds.length === 0) {
      return [{ action: "append", index: 0, song: null }];
    }

    return [
      ...songIds.flatMap<SetlistSlot>((songId, index) => [
        {
          action: "insert",
          index,
          song: null,
        },
        {
          action: "replace",
          index,
          song: songMap.get(songId) ?? null,
        },
      ]),
      {
        action: "append",
        index: songIds.length,
        song: null,
      },
    ];
  }, [songIds, songMap]);

  const prediction = useMemo<SetlistPrediction>(
    () => {
      const breaks = getValidSetlistBreaks(setlistBreaks, songIds.length);

      return {
        songIds,
        breaks,
        encoreAfters: getEncoreAftersFromBreaks(breaks),
      };
    },
    [setlistBreaks, songIds],
  );

  const visibleEncoreAfters = prediction.encoreAfters;
  const visibleSetlistBreaks = prediction.breaks;
  const canConfirmGroupSelection =
    pendingGroup !== null && isGroupSelectable(pendingGroup);

  function saveDraft(
    nextSelectedGroup: LoveLiveSeries | null,
    nextSongIds: string[],
    nextSetlistBreaks: SetlistBreak[],
  ) {
    if (!enableDraftStorage) {
      return;
    }

    writeStoredSetlistDraft({
      selectedGroup: nextSelectedGroup,
      songIds: nextSongIds,
      breaks: nextSetlistBreaks,
      encoreAfters: getEncoreAftersFromBreaks(
        getValidSetlistBreaks(nextSetlistBreaks, nextSongIds.length),
      ),
    });
  }

  useEffect(() => {
    if (!enableDraftStorage || hasRestoredDraftRef.current || songs.length === 0) {
      return;
    }

    hasRestoredDraftRef.current = true;

    if (resetStoredDraftOnLoad) {
      removeStoredSetlistDraft();
      return;
    }

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
  }, [enableDraftStorage, resetStoredDraftOnLoad, songs]);

  function openGroupSelection() {
    setPendingGroup(
      selectedGroup && isGroupSelectable(selectedGroup) ? selectedGroup : null,
    );
    setIsSongPickerOpen(false);
    setActiveSlot(null);
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
    setActiveSlot(null);
    saveDraft(group, songIds, setlistBreaks);
    onDirty();
  }

  function openSongPicker(
    slotIndex: number,
    action: SetlistSlotAction = "replace",
  ) {
    setActiveSlot({ index: slotIndex, action });
    setIsSongPickerOpen(true);
  }

  function closeSongPicker() {
    setIsSongPickerOpen(false);
    setActiveSlot(null);
  }

  function assignSongToSlot(songId: string) {
    if (activeSlot === null) {
      return;
    }

    const nextSongIds =
      activeSlot.action === "insert"
        ? insertItem(songIds, activeSlot.index, songId)
        : activeSlot.action === "append" || activeSlot.index >= songIds.length
          ? [...songIds, songId]
          : songIds.map((currentSongId, currentIndex) =>
              currentIndex === activeSlot.index ? songId : currentSongId,
            );
    const nextSetlistBreaks =
      activeSlot.action === "insert" && nextSongIds !== songIds
        ? getSetlistBreaksAfterInsertedSong(
            setlistBreaks,
            activeSlot.index,
            nextSongIds.length,
          )
        : setlistBreaks;

    setSongIds(nextSongIds);
    setSetlistBreaks(nextSetlistBreaks);
    saveDraft(selectedGroup, nextSongIds, nextSetlistBreaks);
    onDirty();
    closeSongPicker();
  }

  function removeSong(index: number) {
    const nextSongIds = songIds.filter(
      (_, currentIndex) => currentIndex !== index,
    );
    const nextSetlistBreaks = getValidSetlistBreaks(
      setlistBreaks
        .filter(
          (breakItem) =>
            index !== breakItem.after && index !== breakItem.after + 1,
        )
        .map((breakItem) => ({
          ...breakItem,
          after: index < breakItem.after ? breakItem.after - 1 : breakItem.after,
        })),
      nextSongIds.length,
    );

    setSongIds(nextSongIds);
    setSetlistBreaks(nextSetlistBreaks);
    saveDraft(selectedGroup, nextSongIds, nextSetlistBreaks);
    onDirty();
  }

  function placeSetlistBreakAfter(index: number, type: SetlistBreakType) {
    const [nextBreak] = getValidSetlistBreaks(
      [{ after: index, type }],
      songIds.length,
    );

    if (!nextBreak) {
      return;
    }

    const currentBreak = visibleSetlistBreaks.find(
      (breakItem) => breakItem.after === nextBreak.after,
    );

    if (currentBreak?.type === nextBreak.type) {
      return;
    }

    if (
      nextBreak.type === "encore" &&
      currentBreak?.type !== "encore" &&
      visibleEncoreAfters.length >= 2
    ) {
      return;
    }

    const nextSetlistBreaks = getValidSetlistBreaks(
      [
        ...setlistBreaks.filter(
          (breakItem) => breakItem.after !== nextBreak.after,
        ),
        nextBreak,
      ],
      songIds.length,
    );

    setSetlistBreaks(nextSetlistBreaks);
    saveDraft(selectedGroup, songIds, nextSetlistBreaks);
    onDirty();
  }

  function placeEncoreAfter(index: number) {
    placeSetlistBreakAfter(index, "encore");
  }

  function clearSetlistBreak(index: number) {
    if (!visibleSetlistBreaks.some((breakItem) => breakItem.after === index)) {
      return;
    }

    const nextSetlistBreaks = getValidSetlistBreaks(
      setlistBreaks.filter((breakItem) => breakItem.after !== index),
      songIds.length,
    );

    setSetlistBreaks(nextSetlistBreaks);
    saveDraft(selectedGroup, songIds, nextSetlistBreaks);
    onDirty();
  }

  function clearEncore(index: number) {
    clearSetlistBreak(index);
  }

  function moveSong(index: number, direction: -1 | 1) {
    reorderSong(index, index + direction);
  }

  function reorderSong(fromIndex: number, toIndex: number) {
    const nextSongIds = reorderItems(songIds, fromIndex, toIndex);

    if (nextSongIds === songIds) {
      return;
    }

    setSongIds(nextSongIds);
    saveDraft(selectedGroup, nextSongIds, setlistBreaks);
    onDirty();
  }

  function clearSetlist() {
    setSongIds([]);
    setSetlistBreaks([]);
    closeSongPicker();
    if (enableDraftStorage) {
      removeStoredSetlistDraft();
    }
    onDirty();
  }

  function applySharedSetlist(
    nextSongIds: string[],
    nextSetlistBreaks: SetlistBreak[],
  ) {
    const firstSong = songMap.get(nextSongIds[0] ?? "");

    setSongIds(nextSongIds);
    setSetlistBreaks(
      getValidSetlistBreaks(nextSetlistBreaks, nextSongIds.length),
    );
    if (firstSong) {
      setSelectedGroup(firstSong.series);
      setPendingGroup(
        isGroupSelectable(firstSong.series) ? firstSong.series : null,
      );
    }
  }

  return {
    activeSlotIndex: activeSlot?.index ?? null,
    applySharedSetlist,
    assignSongToSlot,
    canConfirmGroupSelection,
    chooseGroup,
    clearEncore,
    clearSetlistBreak,
    clearSetlist,
    closeSongPicker,
    encoreAfters: visibleEncoreAfters,
    filteredSongs,
    isSongPickerOpen,
    keyword,
    moveSong,
    openGroupSelection,
    openSongPicker,
    pendingGroup,
    placeEncoreAfter,
    placeSetlistBreakAfter,
    prediction,
    removeSong,
    reorderSong,
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
    visibleSetlistBreaks,
  };
}
