"use client";

import type { DragEvent } from "react";
import type { Song } from "../types";

type SetlistSlotRowProps = {
  index: number;
  song: Song | null;
  coverUrl?: string | null;
  onOpen: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  onSongDragEnd?: () => void;
  onSongDragLeave?: () => void;
  onSongDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onSongDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onSongDrop?: (event: DragEvent<HTMLButtonElement>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
};

function MiniControl({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="h-8 min-w-8 border border-black bg-white px-2 text-[11px] font-black tracking-[0.14em] text-zinc-950 transition hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function SetlistSlotRow({
  index,
  song,
  coverUrl = null,
  onOpen,
  onMoveUp,
  onMoveDown,
  onRemove,
  onSongDragEnd,
  onSongDragLeave,
  onSongDragOver,
  onSongDragStart,
  onSongDrop,
  canMoveUp = false,
  canMoveDown = false,
  isDragging = false,
  isDropTarget = false,
}: SetlistSlotRowProps) {
  const isEmpty = song === null;
  const canDrag = !isEmpty;

  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 sm:grid-cols-[72px_minmax(0,1fr)_auto]">
      <div className="flex h-16 items-center justify-center border-2 border-black bg-black text-base font-black tracking-[0.18em] text-white shadow-[4px_4px_0_#e11d48] sm:h-20 sm:text-lg">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <button
          type="button"
          aria-grabbed={canDrag ? isDragging : undefined}
          className={`group/slot relative min-h-16 overflow-hidden border-2 px-4 py-3 text-left shadow-[6px_6px_0_#111] transition-all duration-200 ease-out [clip-path:polygon(2%_0,100%_0,98%_100%,0_100%)] sm:min-h-20 ${
            isEmpty
              ? "border-black bg-white hover:border-rose-600 hover:shadow-[10px_10px_0_#e11d48]"
              : "border-black bg-rose-600 text-white hover:shadow-[10px_10px_0_#111]"
          } ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${
            isDragging ? "opacity-45" : ""
          } ${
            isDropTarget
              ? "translate-x-1 outline-4 outline-offset-2 outline-rose-600"
              : ""
          }`}
          draggable={canDrag}
          onDragEnd={onSongDragEnd}
          onDragLeave={onSongDragLeave}
          onDragOver={onSongDragOver}
          onDragStart={onSongDragStart}
          onDrop={onSongDrop}
          onClick={onOpen}
        >
          <span className="absolute inset-y-0 left-0 w-2 bg-black" />
          <span className="absolute -right-6 top-0 h-full w-9 skew-x-[-18deg] bg-black" />
          <div className="relative z-10 flex h-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {isEmpty ? null : (
                <div
                  aria-hidden="true"
                  className="relative h-12 w-12 shrink-0 overflow-hidden border-2 border-black bg-zinc-950 shadow-[3px_3px_0_rgba(0,0,0,0.35)] sm:h-14 sm:w-14"
                >
                  {coverUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${coverUrl})` }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-black text-lg font-black tracking-[0.08em] text-white">
                      ラ
                    </div>
                  )}
                </div>
              )}
              <div className="min-w-0">
                <p
                  className={`text-[10px] font-black tracking-[0.2em] ${
                    isEmpty ? "text-rose-600" : "text-white/75"
                  }`}
                >
                  {isEmpty ? "SELECT MUSIC" : "MUSIC DATA"}
                </p>
                <p
                  className={`mt-1 truncate text-lg font-black tracking-[0.05em] sm:text-xl ${
                    isEmpty ? "text-zinc-950" : "text-white"
                  }`}
                >
                  {song?.title ?? "空欄を選択"}
                </p>
                <p
                  className={`mt-1 truncate text-xs font-bold tracking-[0.14em] ${
                    isEmpty ? "text-zinc-500" : "text-white/80"
                  }`}
                >
                  {song?.unit ?? "TAP TO OPEN"}
                </p>
              </div>
            </div>
            <span
              aria-hidden="true"
              className={`shrink-0 text-2xl font-black ${
                isEmpty ? "text-rose-600" : "text-white"
              }`}
            >
              +
            </span>
          </div>
        </button>

        {isEmpty ? null : (
          <div className="flex items-center gap-2 sm:flex-col sm:justify-center">
            <MiniControl
              label="UP"
              disabled={!canMoveUp}
              onClick={onMoveUp}
            />
            <MiniControl
              label="DN"
              disabled={!canMoveDown}
              onClick={onMoveDown}
            />
            <MiniControl label="DEL" onClick={onRemove} />
          </div>
        )}
      </div>
    </div>
  );
}
