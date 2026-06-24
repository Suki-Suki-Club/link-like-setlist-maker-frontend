"use client";

import type { LoveLiveSeries } from "../types";

type ShareCommandPanelProps = {
  canSaveShareUrl: boolean;
  hasIssuedShareUrl: boolean;
  onBackToSongs: () => void;
  onCopyShareUrl: () => void;
  onSaveShareUrl: () => void;
  selectedGroup: LoveLiveSeries | null;
  shareStatus: string;
  shareUrl: string;
  songCount: number;
};

export function ShareCommandPanel({
  canSaveShareUrl,
  hasIssuedShareUrl,
  onBackToSongs,
  onCopyShareUrl,
  onSaveShareUrl,
  selectedGroup,
  shareStatus,
  shareUrl,
  songCount,
}: ShareCommandPanelProps) {
  return (
    <div className="relative z-10 border-t-4 border-black bg-white px-4 py-5 sm:px-8">
      <div className="grid gap-4">
        <div className="grid gap-3">
          <p className="text-[11px] font-black tracking-[0.28em] text-rose-600">
            SHARE COMMAND
          </p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="border-2 border-black bg-zinc-100 p-3 shadow-[4px_4px_0_#111]">
              <dt className="text-[10px] font-black tracking-[0.2em] text-zinc-500">
                GROUP
              </dt>
              <dd className="mt-1 truncate text-base font-black text-zinc-950">
                {selectedGroup ?? "-"}
              </dd>
            </div>
            <div className="border-2 border-black bg-zinc-100 p-3 shadow-[4px_4px_0_#111]">
              <dt className="text-[10px] font-black tracking-[0.2em] text-zinc-500">
                SONGS
              </dt>
              <dd className="mt-1 text-base font-black text-zinc-950">
                {songCount}
              </dd>
            </div>
          </dl>
          <div className="border-2 border-black bg-white p-3 shadow-[4px_4px_0_#111]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500">
                SAVE STATUS
              </p>
              <span
                className={`border-2 border-black px-2 py-1 text-[10px] font-black tracking-[0.16em] ${
                  hasIssuedShareUrl
                    ? "bg-emerald-300 text-zinc-950"
                    : "bg-amber-200 text-zinc-950"
                }`}
              >
                {hasIssuedShareUrl ? "SAVED" : "UNSAVED"}
              </span>
            </div>
            <p className="mt-3 border-l-4 border-rose-600 pl-3 text-sm font-bold leading-6 tracking-[0.08em] text-zinc-600">
              保存すると現在のセットリストをサーバーに保存し、編集できない共有URLをコピーします。
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            className="h-14 border-2 border-black bg-black px-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#e11d48] transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none"
            disabled={!canSaveShareUrl}
            onClick={onSaveShareUrl}
          >
            保存してURLをコピー
          </button>
          {hasIssuedShareUrl ? (
            <div className="grid gap-3">
              <input
                className="h-12 border-2 border-black bg-zinc-100 px-3 text-sm font-bold text-zinc-700 outline-none"
                value={shareUrl}
                readOnly
              />
              <button
                type="button"
                className="h-11 border-2 border-black bg-white px-3 text-xs font-black tracking-[0.18em] text-zinc-950 shadow-[4px_4px_0_#111] transition hover:bg-zinc-50"
                onClick={onCopyShareUrl}
              >
                共有URLを再コピー
              </button>
            </div>
          ) : null}

          {shareStatus ? (
            <p className="border-2 border-black bg-emerald-100 px-3 py-2 text-sm font-black tracking-[0.08em] text-emerald-900 shadow-[4px_4px_0_#111]">
              {shareStatus}
            </p>
          ) : null}

          <button
            type="button"
            className="h-11 border-2 border-black bg-white px-3 text-xs font-black tracking-[0.18em] text-zinc-950 shadow-[4px_4px_0_#111] transition hover:bg-zinc-50"
            onClick={onBackToSongs}
          >
            曲選択へ戻る
          </button>
        </div>
      </div>
    </div>
  );
}
