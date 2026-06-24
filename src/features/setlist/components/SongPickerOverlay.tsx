"use client";

import type { Song } from "../types";
import { SongMeta } from "./SongMeta";

type SongPickerOverlayProps = {
  activeSlotIndex: number | null;
  errorMessage: string;
  onBeginSongConfirm: (songId: string) => void;
  isLoading: boolean;
  isOpen: boolean;
  keyword: string;
  onClose: () => void;
  onOpenSongConfirm: (songId: string) => void;
  onHoverSongEnd: (songId: string) => void;
  onHoverSongStart: (songId: string) => void;
  onKeywordChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  selectedUnit: string;
  songs: Song[];
  unitOptions: string[];
};

export function SongPickerOverlay({
  activeSlotIndex,
  errorMessage,
  isLoading,
  isOpen,
  keyword,
  onBeginSongConfirm,
  onClose,
  onOpenSongConfirm,
  onHoverSongEnd,
  onHoverSongStart,
  onKeywordChange,
  onUnitChange,
  selectedUnit,
  songs,
  unitOptions,
}: SongPickerOverlayProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 px-3 py-3 backdrop-blur-[2px] sm:px-6 sm:py-6">
      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden border-4 border-black bg-white shadow-[14px_14px_0_#e11d48]">
        <div className="absolute inset-y-0 left-0 hidden w-24 bg-black sm:block" />
        <div className="absolute inset-x-0 top-0 h-3 bg-rose-600" />
        <div className="absolute right-[-56px] top-0 hidden h-full w-24 skew-x-[-18deg] bg-black sm:block" />

        <div className="relative z-10 flex items-start justify-between gap-4 border-b-4 border-black bg-white px-4 py-4 sm:px-8">
          <div>
            <p className="text-[11px] font-black tracking-[0.28em] text-rose-600">
              COMMAND MODE
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-[0.06em] text-zinc-950 sm:text-5xl">
              Select Song
            </h2>
            <p className="mt-2 text-sm font-bold tracking-[0.16em] text-zinc-500">
              SLOT {activeSlotIndex === null ? "--" : String(activeSlotIndex + 1).padStart(2, "0")}
            </p>
          </div>
          <button
            type="button"
            className="h-11 border-2 border-black bg-black px-4 text-sm font-black tracking-[0.18em] text-white shadow-[5px_5px_0_#e11d48] transition hover:bg-rose-600"
            onClick={onClose}
          >
            CLOSE
          </button>
        </div>

        <div className="relative z-10 grid gap-4 border-b-4 border-black bg-white px-4 py-4 sm:grid-cols-2 sm:px-8">
          <label className="grid gap-1 text-xs font-black tracking-[0.16em] text-zinc-700">
            UNIT FILTER
            <select
              className="h-12 border-2 border-black bg-white px-3 text-sm font-bold text-zinc-950 outline-none focus:border-rose-600"
              value={selectedUnit}
              onChange={(event) => onUnitChange(event.target.value)}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-black tracking-[0.16em] text-zinc-700">
            KEYWORD
            <input
              className="h-12 border-2 border-black bg-white px-3 text-sm font-bold text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-rose-600"
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="曲名・ユニット・タグ"
            />
          </label>
        </div>

        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-8 sm:py-6">
          {isLoading ? (
            <div className="border-2 border-dashed border-black bg-zinc-100 px-6 py-10 text-center text-sm font-bold tracking-[0.14em] text-zinc-500">
              楽曲情報を読み込み中...
            </div>
          ) : errorMessage ? (
            <div className="border-2 border-dashed border-rose-600 bg-rose-50 px-6 py-10 text-center text-sm font-bold tracking-[0.14em] text-rose-700">
              {errorMessage}
            </div>
          ) : songs.length === 0 ? (
            <div className="border-2 border-dashed border-black bg-zinc-100 px-6 py-10 text-center text-sm font-bold tracking-[0.14em] text-zinc-500">
              条件に合う曲がありません
            </div>
          ) : (
            <div className="space-y-3">
              {songs.map((song, index) => (
                <button
                  key={`${song.id}-${index}`}
                  type="button"
                  className="group/song relative w-full overflow-hidden border-2 border-black bg-white px-4 py-4 text-left shadow-[6px_6px_0_#111] transition-all duration-200 [clip-path:polygon(2%_0,100%_0,98%_100%,0_100%)] hover:-translate-x-1 hover:border-rose-600 hover:bg-rose-600 hover:text-white hover:shadow-[10px_10px_0_#111] sm:px-5"
                  onBlur={() => onHoverSongEnd(song.id)}
                  onClick={() => onOpenSongConfirm(song.id)}
                  onFocus={() => onHoverSongStart(song.id)}
                  onPointerCancel={() => onHoverSongEnd(song.id)}
                  onPointerDown={(event) => {
                    onBeginSongConfirm(song.id)

                    // Touch devices do not emit hover events, so start preview work
                    // while the pointer gesture is still active.
                    if (event.pointerType !== "mouse") {
                      onHoverSongStart(song.id)
                    }
                  }}
                  onPointerEnter={() => onHoverSongStart(song.id)}
                  onPointerLeave={() => onHoverSongEnd(song.id)}
                >
                  <span className="absolute inset-y-0 left-0 w-2 bg-black transition-all duration-200 group-hover/song:w-4" />
                  <span className="absolute -right-8 top-0 h-full w-12 skew-x-[-18deg] bg-black" />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black tracking-[0.24em] text-rose-600 transition-colors duration-200 group-hover/song:text-white/75">
                        CANDIDATE {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-black tracking-[0.05em] text-zinc-950 transition-colors duration-200 group-hover/song:text-white sm:text-xl">
                        {song.title}
                      </h3>
                      <SongMeta song={song} accent="persona" />
                    </div>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-2xl font-black text-rose-600 transition-colors duration-200 group-hover/song:text-white"
                    >
                      +
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
