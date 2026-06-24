"use client";

import type { Song } from "../types";
import { SongMeta } from "./SongMeta";

type SongPreviewConfirmModalProps = {
  coverUrl: string | null;
  isLoading: boolean;
  isOpen: boolean;
  onBack: () => void;
  onConfirm: () => void;
  readOnly?: boolean;
  song: Song | null;
  title: string;
};

export function SongPreviewConfirmModal({
  coverUrl,
  isLoading,
  isOpen,
  onBack,
  onConfirm,
  readOnly = false,
  song,
  title,
}: SongPreviewConfirmModalProps) {
  if (!isOpen || !song) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-6">
      <div className="relative mx-auto flex h-full w-full max-w-4xl items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.22)_0%,rgba(0,0,0,0)_58%)]" />
        <div className="relative w-full overflow-hidden border-4 border-black bg-white shadow-[14px_14px_0_#e11d48]">
          <div className="absolute inset-x-0 top-0 h-3 bg-rose-600" />
          <div className="absolute -left-8 top-20 hidden h-40 w-20 -skew-y-12 bg-black lg:block" />
          <div className="absolute -right-12 top-0 hidden h-full w-24 skew-x-[-18deg] bg-black lg:block" />

          <div className="relative z-10 border-b-4 border-black bg-white px-4 pb-4 pt-6 sm:px-8">
            <p className="text-[11px] font-black tracking-[0.28em] text-rose-600">
              {readOnly ? "SONG PREVIEW" : "JACKET CHECK"}
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-[0.06em] text-zinc-950 sm:text-5xl">
              {readOnly ? "Listen" : "Confirm"}
            </h2>
          </div>

          <div className="relative z-10 grid gap-8 bg-white px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-center">
            <div className="mx-auto w-full max-w-[320px]">
              <div className="relative aspect-square w-full">
                <div className="absolute inset-0 rounded-full border-[18px] border-black bg-zinc-950 motion-reduce:animate-none motion-safe:animate-[spin_18s_linear_infinite]" />
                <div className="absolute inset-[7%] rounded-full border-[12px] border-rose-600 bg-white motion-reduce:animate-none motion-safe:animate-[spin_10s_linear_infinite_reverse]" />
                <div className="absolute inset-[14%] rounded-full border-4 border-black bg-zinc-200 shadow-[0_0_0_6px_#fff]" />
                <div className="absolute inset-[18%] overflow-hidden rounded-full border-4 border-black bg-zinc-100">
                  <div className="absolute inset-0 motion-reduce:animate-none motion-safe:animate-[spin_26s_linear_infinite]">
                    {coverUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${coverUrl})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,#18181b_0%,#3f3f46_48%,#e11d48_100%)]" />
                    )}
                    <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.04)_38%,rgba(0,0,0,0.22)_100%)]" />
                    <div className="absolute left-[16%] top-[12%] h-[34%] w-[18%] rotate-[24deg] rounded-full bg-white/25 blur-md" />
                  </div>
                  <div className="absolute inset-[41%] rounded-full border-4 border-black bg-white shadow-[0_0_0_5px_#e11d48]" />
                  <div className="absolute inset-[46%] rounded-full bg-zinc-950" />
                </div>
                <div className="pointer-events-none absolute inset-[4%] rounded-full border border-white/50" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-black tracking-[0.26em] text-zinc-500">
                SELECT TARGET
              </p>
              <h3 className="mt-2 break-words text-3xl font-black tracking-[0.04em] text-zinc-950 sm:text-5xl">
                {title}
              </h3>
              <div className="mt-4">
                <SongMeta song={song} accent="persona" />
              </div>
              <p className="mt-5 border-l-4 border-rose-600 pl-3 text-sm font-bold tracking-[0.12em] text-zinc-600">
                {isLoading
                  ? "ジャケット情報を読み込み中..."
                  : readOnly
                    ? "この画面では曲のプレビュー再生のみ利用できます。"
                    : coverUrl
                    ? "この曲を現在のスロットに反映します。"
                    : "ジャケット画像が見つからないため、プレースホルダーを表示しています。"}
              </p>

              <div className={`mt-8 grid gap-3 ${readOnly ? "" : "sm:grid-cols-2"}`}>
                {readOnly ? null : (
                  <button
                    type="button"
                    className="h-12 border-2 border-black bg-black px-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#e11d48] transition hover:bg-rose-600"
                    onClick={onConfirm}
                  >
                    選択する
                  </button>
                )}
                <button
                  type="button"
                  className="h-12 border-2 border-black bg-white px-4 text-sm font-black tracking-[0.18em] text-zinc-950 shadow-[6px_6px_0_#111] transition hover:bg-zinc-100"
                  onClick={onBack}
                >
                  {readOnly ? "閉じる" : "戻る"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
