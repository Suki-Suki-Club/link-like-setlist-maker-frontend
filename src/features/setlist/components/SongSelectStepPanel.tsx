"use client";

import { useState, type DragEvent } from "react";
import type {
  LoveLiveSeries,
  SetlistBreak,
  SetlistBreakType,
  Song,
} from "../types";
import type { SetlistSlot } from "../hooks/useSetlistEditor";
import { SetlistBreakControl } from "./SetlistBreakControl";
import { SetlistSlotRow } from "./SetlistSlotRow";
import { SongPickerOverlay } from "./SongPickerOverlay";
import { SongPreviewConfirmModal } from "./SongPreviewConfirmModal";

type SongSelectStepPanelProps = {
  activeSlotIndex: number | null;
  errorMessage: string;
  filteredSongs: Song[];
  isPreviewConfirmOpen: boolean;
  isSelectedPreviewLoading: boolean;
  isSongPickerOpen: boolean;
  isSongsLoading: boolean;
  keyword: string;
  coverUrlBySongId: Record<string, string | null>;
  onBackToGroup: () => void;
  onBeginSongConfirm: (songId: string) => void;
  onClearSetlistBreak: (index: number) => void;
  onClearSetlist: () => void;
  onCloseSongPicker: () => void;
  onCloseSongPreviewConfirm: () => void;
  onComplete: () => void;
  onConfirmPreviewSong: () => void;
  onHoverSongEnd: (songId: string) => void;
  onHoverSongStart: (songId: string) => void;
  onKeywordChange: (value: string) => void;
  onMoveSong: (index: number, direction: -1 | 1) => void;
  onOpenSongConfirm: (songId: string) => void;
  onOpenSongPicker: (slotIndex: number) => void;
  onPlaceSetlistBreak: (index: number, type: SetlistBreakType) => void;
  onRemoveSong: (index: number) => void;
  onReorderSong: (fromIndex: number, toIndex: number) => void;
  onUnitChange: (value: string) => void;
  previewCoverUrl: string | null;
  previewSong: Song | null;
  previewTitle: string;
  selectedGroup: LoveLiveSeries | null;
  selectedSongsCount: number;
  selectedUnit: string;
  setlistSlots: SetlistSlot[];
  songCount: number;
  unitOptions: string[];
  visibleEncoreAfters: number[];
  visibleSetlistBreaks: SetlistBreak[];
};

export function SongSelectStepPanel({
  activeSlotIndex,
  errorMessage,
  filteredSongs,
  isPreviewConfirmOpen,
  isSelectedPreviewLoading,
  isSongPickerOpen,
  isSongsLoading,
  keyword,
  coverUrlBySongId,
  onBackToGroup,
  onBeginSongConfirm,
  onClearSetlistBreak,
  onClearSetlist,
  onCloseSongPicker,
  onCloseSongPreviewConfirm,
  onComplete,
  onConfirmPreviewSong,
  onHoverSongEnd,
  onHoverSongStart,
  onKeywordChange,
  onMoveSong,
  onOpenSongConfirm,
  onOpenSongPicker,
  onPlaceSetlistBreak,
  onRemoveSong,
  onReorderSong,
  onUnitChange,
  previewCoverUrl,
  previewSong,
  previewTitle,
  selectedGroup,
  selectedSongsCount,
  selectedUnit,
  setlistSlots,
  songCount,
  unitOptions,
  visibleEncoreAfters,
  visibleSetlistBreaks,
}: SongSelectStepPanelProps) {
  const [draggedSongIndex, setDraggedSongIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  function resetSongDrag() {
    setDraggedSongIndex(null);
    setDropTargetIndex(null);
  }

  function startSongDrag(
    event: DragEvent<HTMLButtonElement>,
    slotIndex: number,
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(slotIndex));
    setDraggedSongIndex(slotIndex);
    setDropTargetIndex(null);
  }

  function dragSongOver(
    event: DragEvent<HTMLButtonElement>,
    slotIndex: number,
  ) {
    if (draggedSongIndex === null || draggedSongIndex === slotIndex) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetIndex(slotIndex);
  }

  function dropSong(event: DragEvent<HTMLButtonElement>, slotIndex: number) {
    event.preventDefault();

    if (draggedSongIndex !== null && draggedSongIndex !== slotIndex) {
      onReorderSong(draggedSongIndex, slotIndex);
    }

    resetSongDrag();
  }

  return (
    <>
      <section className="relative overflow-hidden border-4 border-black bg-white shadow-[14px_14px_0_#111]">
        <div className="absolute inset-x-0 top-0 h-4 bg-rose-600" />
        <div className="absolute left-[-48px] top-20 hidden h-40 w-24 -skew-y-12 bg-black sm:block" />
        <div className="absolute right-[-56px] top-0 hidden h-full w-28 skew-x-[-18deg] bg-black sm:block" />
        <div className="relative z-10 border-b-4 border-black bg-white px-4 pb-4 pt-7 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black tracking-[0.28em] text-rose-600">
                SETLIST COMMAND
              </p>
              <h2 className="mt-1 text-3xl font-black uppercase tracking-[0.06em] text-zinc-950 sm:text-5xl">
                Song Select
              </h2>
              <p className="mt-3 text-sm font-bold tracking-[0.16em] text-zinc-500">
                {selectedGroup} / SLOT INPUT
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="h-11 border-2 border-black bg-white px-4 text-sm font-black tracking-[0.12em] text-zinc-950 shadow-[5px_5px_0_#111] transition hover:bg-zinc-100"
                onClick={onBackToGroup}
              >
                グループ選択へ戻る
              </button>
              <button
                type="button"
                className="h-11 border-2 border-black bg-black px-4 text-sm font-black tracking-[0.18em] text-white shadow-[5px_5px_0_#e11d48] transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none"
                disabled={selectedSongsCount === 0}
                onClick={onComplete}
              >
                完了
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-zinc-100 px-4 py-5 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black tracking-[0.24em] text-zinc-500">
                  ACTIVE LIST
                </p>
                <p className="mt-1 text-lg font-black tracking-[0.05em] text-zinc-950">
                  現在 {selectedSongsCount} 曲
                </p>
              </div>
              <button
                type="button"
                className="h-10 border-2 border-black bg-white px-3 text-xs font-black tracking-[0.18em] text-zinc-950 shadow-[4px_4px_0_#111] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none"
                disabled={songCount === 0}
                onClick={onClearSetlist}
              >
                CLEAR
              </button>
            </div>

            <div className="space-y-4">
              {setlistSlots.map((slot) => (
                <div
                  key={`slot-${slot.index}-${slot.song?.id ?? "empty"}`}
                  className="space-y-3"
                >
                  <SetlistSlotRow
                    coverUrl={
                      slot.song ? (coverUrlBySongId[slot.song.id] ?? null) : null
                    }
                    index={slot.index}
                    isDragging={draggedSongIndex === slot.index}
                    isDropTarget={dropTargetIndex === slot.index}
                    song={slot.song}
                    canMoveDown={slot.index < selectedSongsCount - 1}
                    canMoveUp={slot.index > 0 && slot.song !== null}
                    onMoveDown={
                      slot.song === null
                        ? undefined
                        : () => onMoveSong(slot.index, 1)
                    }
                    onMoveUp={
                      slot.song === null
                        ? undefined
                        : () => onMoveSong(slot.index, -1)
                    }
                    onOpen={() => onOpenSongPicker(slot.index)}
                    onRemove={
                      slot.song === null
                        ? undefined
                        : () => onRemoveSong(slot.index)
                    }
                    onSongDragEnd={resetSongDrag}
                    onSongDragLeave={() => {
                      if (dropTargetIndex === slot.index) {
                        setDropTargetIndex(null);
                      }
                    }}
                    onSongDragOver={
                      slot.song === null
                        ? undefined
                        : (event) => dragSongOver(event, slot.index)
                    }
                    onSongDragStart={
                      slot.song === null
                        ? undefined
                        : (event) => startSongDrag(event, slot.index)
                    }
                    onSongDrop={
                      slot.song === null
                        ? undefined
                        : (event) => dropSong(event, slot.index)
                    }
                  />
                  {slot.song ? (
                    <SetlistBreakControl
                      index={slot.index}
                      onClear={onClearSetlistBreak}
                      onPlace={onPlaceSetlistBreak}
                      songCount={songCount}
                      visibleBreaks={visibleSetlistBreaks}
                      visibleEncoreAfters={visibleEncoreAfters}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SongPickerOverlay
        activeSlotIndex={activeSlotIndex}
        coverUrlBySongId={coverUrlBySongId}
        errorMessage={errorMessage}
        isLoading={isSongsLoading}
        isOpen={isSongPickerOpen}
        keyword={keyword}
        onBeginSongConfirm={onBeginSongConfirm}
        onClose={onCloseSongPicker}
        onOpenSongConfirm={onOpenSongConfirm}
        onHoverSongEnd={onHoverSongEnd}
        onHoverSongStart={onHoverSongStart}
        onKeywordChange={onKeywordChange}
        onUnitChange={onUnitChange}
        selectedUnit={selectedUnit}
        songs={filteredSongs}
        unitOptions={unitOptions}
      />
      <SongPreviewConfirmModal
        coverUrl={previewCoverUrl}
        isLoading={isSelectedPreviewLoading}
        isOpen={isPreviewConfirmOpen}
        onBack={onCloseSongPreviewConfirm}
        onConfirm={onConfirmPreviewSong}
        song={previewSong}
        title={previewTitle}
      />
    </>
  );
}
