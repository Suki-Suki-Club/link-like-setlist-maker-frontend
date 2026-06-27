"use client";

import type { Song } from "../types";
import { SongMeta } from "./SongMeta";

type ReviewSongRowProps = {
  coverUrl?: string | null;
  index: number;
  onBeginReadOnlyPreview: (songId: string, pointerType?: string) => void;
  onOpenPreview: (songId: string) => void;
  readOnly: boolean;
  song: Song;
};

export function ReviewSongRow({
  coverUrl = null,
  index,
  onBeginReadOnlyPreview,
  onOpenPreview,
  readOnly,
  song,
}: ReviewSongRowProps) {
  const jacket = (
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
  );

  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 sm:grid-cols-[72px_minmax(0,1fr)]">
      <div className="flex h-16 items-center justify-center border-2 border-black bg-black text-base font-black tracking-[0.18em] text-white shadow-[4px_4px_0_#e11d48] sm:h-20 sm:text-lg">
        {String(index + 1).padStart(2, "0")}
      </div>
      {readOnly ? (
        <button
          type="button"
          className="group relative min-h-16 overflow-hidden border-2 border-black bg-white px-4 py-3 text-left shadow-[6px_6px_0_#111] transition hover:-translate-x-1 hover:border-rose-600 hover:shadow-[10px_10px_0_#111] [clip-path:polygon(2%_0,100%_0,98%_100%,0_100%)] sm:min-h-20 sm:px-5"
          onClick={() => onOpenPreview(song.id)}
          onPointerDown={(event) =>
            onBeginReadOnlyPreview(song.id, event.pointerType)
          }
        >
          <span className="absolute inset-y-0 left-0 w-2 bg-rose-600 transition-all duration-200 group-hover:w-4" />
          <span className="absolute -right-6 top-0 h-full w-9 skew-x-[-18deg] bg-black" />
          <div className="relative z-10 flex min-w-0 items-center gap-3">
            {jacket}
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[0.24em] text-rose-600">
                TAP TO LISTEN
              </p>
              <h3 className="mt-1 break-words text-lg font-black tracking-[0.05em] text-zinc-950 sm:text-xl">
                {song.title}
              </h3>
              <SongMeta song={song} accent="persona" />
            </div>
          </div>
        </button>
      ) : (
        <div className="relative min-h-16 overflow-hidden border-2 border-black bg-white px-4 py-3 shadow-[6px_6px_0_#111] [clip-path:polygon(2%_0,100%_0,98%_100%,0_100%)] sm:min-h-20 sm:px-5">
          <span className="absolute inset-y-0 left-0 w-2 bg-rose-600" />
          <span className="absolute -right-6 top-0 h-full w-9 skew-x-[-18deg] bg-black" />
          <div className="relative z-10 flex min-w-0 items-center gap-3">
            {jacket}
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[0.24em] text-rose-600">
                SETLIST DATA
              </p>
              <h3 className="mt-1 break-words text-lg font-black tracking-[0.05em] text-zinc-950 sm:text-xl">
                {song.title}
              </h3>
              <SongMeta song={song} accent="persona" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
