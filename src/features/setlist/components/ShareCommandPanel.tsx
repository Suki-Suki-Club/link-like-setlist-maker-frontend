"use client";

import type { LoveLiveSeries } from "../types";
import {
  createXShareUrl,
  getShareSaveButtonLabel,
} from "../hooks/useShareSetlist";

type ShareCommandPanelProps = {
  canSaveShareUrl: boolean;
  hasIssuedShareUrl: boolean;
  imageSaveStatus: string;
  isSavingImage: boolean;
  onBackToSongs: () => void;
  onCopyShareUrl: () => void;
  onSaveImage: () => void;
  onSetlistTitleChange: (value: string) => void;
  onSaveShareUrl: () => void;
  selectedGroup: LoveLiveSeries | null;
  setlistTitle: string;
  shareStatus: string;
  shareUrl: string;
  songCount: number;
};

export function ShareCommandPanel({
  canSaveShareUrl,
  hasIssuedShareUrl,
  imageSaveStatus,
  isSavingImage,
  onBackToSongs,
  onCopyShareUrl,
  onSaveImage,
  onSetlistTitleChange,
  onSaveShareUrl,
  selectedGroup,
  setlistTitle,
  shareStatus,
  shareUrl,
  songCount,
}: ShareCommandPanelProps) {
  const xShareUrl = createXShareUrl(shareUrl, setlistTitle, selectedGroup);

  return (
    <div className="relative z-10 border-t-4 border-black bg-white px-4 py-5 sm:px-8">
      <div className="grid gap-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black tracking-[0.28em] text-rose-600">
              SAVE & SHARE
            </p>
            <p className="mt-1 text-sm font-bold tracking-[0.12em] text-zinc-500">
              {selectedGroup ?? "-"} / {songCount} SONGS
            </p>
          </div>
          <span
            className={`w-fit border-2 border-black px-2 py-1 text-[10px] font-black tracking-[0.16em] ${
              hasIssuedShareUrl
                ? "bg-emerald-300 text-zinc-950"
                : "bg-amber-200 text-zinc-950"
            }`}
          >
            {hasIssuedShareUrl ? "SAVED" : "UNSAVED"}
          </span>
        </div>

        <label className="grid gap-2 text-xs font-black tracking-[0.16em] text-zinc-700">
          SETLIST NAME
          <input
            className="h-12 border-2 border-black bg-white px-3 text-sm font-bold text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-rose-600"
            maxLength={80}
            onChange={(event) => onSetlistTitleChange(event.target.value)}
            placeholder="セットリスト名"
            value={setlistTitle}
          />
        </label>

        <div className="grid gap-4">
          <section className="grid gap-3 border-2 border-black bg-zinc-50 p-3 shadow-[5px_5px_0_#111]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-black tracking-[0.2em] text-rose-600">
                STEP 1 / データを保存
              </p>
              <span className="text-[10px] font-black tracking-[0.16em] text-zinc-500">
                SHARE URL
              </span>
            </div>
            <button
              type="button"
              className="h-14 w-full border-2 border-black bg-black px-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#e11d48] transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none"
              disabled={
                hasIssuedShareUrl ||
                !canSaveShareUrl ||
                setlistTitle.trim().length === 0
              }
              onClick={onSaveShareUrl}
            >
              {getShareSaveButtonLabel(hasIssuedShareUrl)}
            </button>
            {hasIssuedShareUrl ? (
              <div className="grid gap-2 border-2 border-black bg-white p-3">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    className="h-11 border-2 border-black bg-zinc-100 px-3 text-sm font-bold text-zinc-700 outline-none"
                    value={shareUrl}
                    readOnly
                  />
                  <button
                    type="button"
                    className="h-11 border-2 border-black bg-white px-3 text-xs font-black tracking-[0.18em] text-zinc-950 shadow-[4px_4px_0_#111] transition hover:bg-zinc-50"
                    onClick={onCopyShareUrl}
                  >
                    再コピー
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="grid gap-3 border-2 border-black bg-zinc-50 p-3 shadow-[5px_5px_0_#111]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-black tracking-[0.2em] text-rose-600">
                STEP 2 / 画像を保存
              </p>
              <span className="text-[10px] font-black tracking-[0.16em] text-zinc-500">
                PNG IMAGE
              </span>
            </div>
            <button
              type="button"
              className="h-14 w-full border-2 border-black bg-white px-4 text-sm font-black tracking-[0.18em] text-zinc-950 shadow-[6px_6px_0_#111] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none"
              disabled={!canSaveShareUrl || isSavingImage}
              onClick={onSaveImage}
            >
              {isSavingImage ? "作成中..." : "画像保存"}
            </button>
            <p className="text-xs font-bold leading-5 tracking-[0.08em] text-zinc-500">
              X投稿画面で添付する画像を端末に保存します。
            </p>
          </section>

          <section className="grid gap-3 border-2 border-black bg-zinc-50 p-3 shadow-[5px_5px_0_#111]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-black tracking-[0.2em] text-rose-600">
                STEP 3 / Xで共有
              </p>
              <span className="text-[10px] font-black tracking-[0.16em] text-zinc-500">
                POST
              </span>
            </div>
            <a
              aria-disabled={!xShareUrl}
              className={`flex h-14 items-center justify-center border-2 px-4 text-sm font-black tracking-[0.18em] shadow-[6px_6px_0_#111] transition ${
                xShareUrl
                  ? "border-black bg-white text-zinc-950 hover:bg-zinc-50"
                  : "pointer-events-none border-zinc-300 bg-zinc-100 text-zinc-400 shadow-none"
              }`}
              href={xShareUrl || undefined}
              rel="noopener noreferrer"
              target="_blank"
            >
              Xで共有する
            </a>
            <p className="text-xs font-bold leading-5 tracking-[0.08em] text-zinc-500">
              開いた投稿画面でSTEP 2の画像を添付してください。
            </p>
          </section>
        </div>

        {shareStatus ? (
          <p className="border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm font-black tracking-[0.08em] text-emerald-900">
            {shareStatus}
          </p>
        ) : null}

        {imageSaveStatus ? (
          <p className="border-l-4 border-sky-500 bg-sky-50 px-3 py-2 text-sm font-black tracking-[0.08em] text-sky-900">
            {imageSaveStatus}
          </p>
        ) : null}

        <div className="flex justify-start">
          <button
            type="button"
            className="h-10 border-2 border-black bg-white px-3 text-xs font-black tracking-[0.18em] text-zinc-950 transition hover:bg-zinc-50"
            onClick={onBackToSongs}
          >
            曲選択へ戻る
          </button>
        </div>
      </div>
    </div>
  );
}
