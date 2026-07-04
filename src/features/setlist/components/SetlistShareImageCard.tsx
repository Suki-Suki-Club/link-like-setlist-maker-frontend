"use client";

import { forwardRef } from "react";
import type { LoveLiveSeries, SetlistBreak, Song } from "../types";
import { getSetlistBreakLabel } from "../utils";
import { SongMeta } from "./SongMeta";

type SetlistShareImageCardProps = {
  coverUrlBySongId: Record<string, string | null>;
  selectedGroup: LoveLiveSeries | null;
  selectedSongs: Song[];
  setlistTitle: string;
  visibleSetlistBreaks: SetlistBreak[];
};

const breakClassNames = {
  encore: "bg-amber-300",
  mc: "bg-sky-300",
  interlude: "bg-violet-300",
};

export const SetlistShareImageCard = forwardRef<
  HTMLDivElement,
  SetlistShareImageCardProps
>(function SetlistShareImageCard(
  {
    coverUrlBySongId,
    selectedGroup,
    selectedSongs,
    setlistTitle,
    visibleSetlistBreaks,
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className="relative w-[1080px] overflow-hidden border-4 border-black bg-white text-left text-zinc-700"
    >
      <div className="absolute inset-x-0 top-0 h-4 bg-rose-600" />
      <div className="absolute left-[-48px] top-24 h-44 w-24 -skew-y-12 bg-black" />
      <div className="absolute right-[-56px] top-0 h-full w-28 skew-x-[-18deg] bg-black" />

      <div className="relative z-10 border-b-4 border-black bg-white px-8 pb-6 pt-10">
        <p className="text-[13px] font-black tracking-[0.28em] text-rose-600">
          SHARED VIEW
        </p>
        <h2 className="mt-2 break-words text-6xl font-black uppercase tracking-[0.06em] text-zinc-950">
          {setlistTitle.trim() || "My Select Setlist"}
        </h2>
        <p className="mt-4 text-base font-bold tracking-[0.16em] text-zinc-500">
          {selectedGroup ?? "-"} / {selectedSongs.length} SONGS
        </p>
      </div>

      <div className="relative z-10 bg-zinc-100 px-8 py-8">
        {selectedSongs.length === 0 ? (
          <div className="border-2 border-dashed border-black bg-white px-6 py-12 text-center text-base font-black tracking-[0.14em] text-zinc-500">
            曲を追加してください
          </div>
        ) : (
          <ol className="space-y-5">
            {selectedSongs.map((song, index) => {
              const coverUrl = coverUrlBySongId[song.id] ?? null;
              const breakItem = visibleSetlistBreaks.find(
                (item) => item.after === index,
              );

              return (
                <li key={`${song.id}-${index}`}>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
                    <div className="flex h-24 items-center justify-center border-2 border-black bg-black text-2xl font-black tracking-[0.18em] text-white shadow-[4px_4px_0_#e11d48]">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="relative min-h-24 overflow-hidden border-2 border-black bg-white px-6 py-4 shadow-[6px_6px_0_#111] [clip-path:polygon(2%_0,100%_0,98%_100%,0_100%)]">
                      <span className="absolute inset-y-0 left-0 w-2 bg-rose-600" />
                      <span className="absolute -right-6 top-0 h-full w-9 skew-x-[-18deg] bg-black" />
                      <div className="relative z-10 flex min-w-0 items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden border-2 border-black bg-zinc-950 shadow-[3px_3px_0_rgba(0,0,0,0.35)]">
                          {coverUrl ? (
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${coverUrl})` }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-black text-xl font-black tracking-[0.08em] text-white">
                              ラ
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black tracking-[0.24em] text-rose-600">
                            SETLIST DATA
                          </p>
                          <h3 className="mt-1 break-words text-3xl font-black tracking-[0.05em] text-zinc-950">
                            {song.title}
                          </h3>
                          <SongMeta song={song} accent="persona" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {breakItem && index < selectedSongs.length - 1 ? (
                    <div className="my-4 flex items-center gap-3 text-sm font-black tracking-[0.2em] text-zinc-950">
                      <span className="h-0.5 flex-1 bg-black" />
                      <span
                        className={`border-2 border-black px-4 py-1 shadow-[4px_4px_0_#111] ${breakClassNames[breakItem.type]}`}
                      >
                        {getSetlistBreakLabel(breakItem, visibleSetlistBreaks)}
                      </span>
                      <span className="h-0.5 flex-1 bg-black" />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
});
