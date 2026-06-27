"use client";

import type { LoveLiveSeries, SetlistBreak, Song } from "../types";
import { SetlistBreakDivider } from "./SetlistBreakDivider";
import { ReviewSongRow } from "./ReviewSongRow";
import { ShareCommandPanel } from "./ShareCommandPanel";

type ReviewStepPanelProps = {
  canSaveShareUrl: boolean;
  coverUrlBySongId: Record<string, string | null>;
  hasIssuedShareUrl: boolean;
  onBackToSongs: () => void;
  onBeginReadOnlyPreview: (songId: string, pointerType?: string) => void;
  onCopyShareUrl: () => void;
  onOpenPreview: (songId: string) => void;
  onSetlistTitleChange: (value: string) => void;
  onSaveShareUrl: () => void;
  readOnly: boolean;
  selectedGroup: LoveLiveSeries | null;
  selectedSongs: Song[];
  setlistTitle: string;
  shareStatus: string;
  shareUrl: string;
  visibleSetlistBreaks: SetlistBreak[];
};

export function ReviewStepPanel({
  canSaveShareUrl,
  coverUrlBySongId,
  hasIssuedShareUrl,
  onBackToSongs,
  onBeginReadOnlyPreview,
  onCopyShareUrl,
  onOpenPreview,
  onSetlistTitleChange,
  onSaveShareUrl,
  readOnly,
  selectedGroup,
  selectedSongs,
  setlistTitle,
  shareStatus,
  shareUrl,
  visibleSetlistBreaks,
}: ReviewStepPanelProps) {
  return (
    <section className="relative overflow-hidden border-4 border-black bg-white shadow-[14px_14px_0_#111]">
      <div className="absolute inset-x-0 top-0 h-4 bg-rose-600" />
      <div className="absolute left-[-48px] top-24 hidden h-44 w-24 -skew-y-12 bg-black sm:block" />
      <div className="absolute right-[-56px] top-0 hidden h-full w-28 skew-x-[-18deg] bg-black sm:block" />

      <div className="relative z-10 border-b-4 border-black bg-white px-4 pb-4 pt-7 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black tracking-[0.28em] text-rose-600">
              {readOnly ? "SHARED VIEW" : "SAVE PREVIEW"}
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-[0.06em] text-zinc-950 sm:text-5xl">
              {readOnly ? setlistTitle : "Final Setlist"}
            </h2>
            <p className="mt-3 text-sm font-bold tracking-[0.16em] text-zinc-500">
              {selectedGroup ?? "-"} / {selectedSongs.length} SONGS
            </p>
          </div>
          {readOnly ? null : (
            <button
              type="button"
              className="h-11 border-2 border-black bg-white px-4 text-sm font-black tracking-[0.12em] text-zinc-950 shadow-[5px_5px_0_#111] transition hover:bg-zinc-100"
              onClick={onBackToSongs}
            >
              曲選択へ戻る
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 bg-zinc-100 px-4 py-5 sm:px-8 sm:py-8">
        {selectedSongs.length === 0 ? (
          <div className="border-2 border-dashed border-black bg-white px-6 py-10 text-center text-sm font-black tracking-[0.14em] text-zinc-500">
            曲を追加してください
          </div>
        ) : (
          <ol className="space-y-4">
            {selectedSongs.map((song, index) => (
              <li key={`${song.id}-${index}`}>
                <ReviewSongRow
                  coverUrl={coverUrlBySongId[song.id] ?? null}
                  index={index}
                  onBeginReadOnlyPreview={onBeginReadOnlyPreview}
                  onOpenPreview={onOpenPreview}
                  readOnly={readOnly}
                  song={song}
                />
                <SetlistBreakDivider
                  index={index}
                  songCount={selectedSongs.length}
                  visibleBreaks={visibleSetlistBreaks}
                />
              </li>
            ))}
          </ol>
        )}
      </div>

      {readOnly ? null : (
        <ShareCommandPanel
          canSaveShareUrl={canSaveShareUrl}
          hasIssuedShareUrl={hasIssuedShareUrl}
          onBackToSongs={onBackToSongs}
          onCopyShareUrl={onCopyShareUrl}
          onSetlistTitleChange={onSetlistTitleChange}
          onSaveShareUrl={onSaveShareUrl}
          selectedGroup={selectedGroup}
          setlistTitle={setlistTitle}
          shareStatus={shareStatus}
          shareUrl={shareUrl}
          songCount={selectedSongs.length}
        />
      )}
    </section>
  );
}
