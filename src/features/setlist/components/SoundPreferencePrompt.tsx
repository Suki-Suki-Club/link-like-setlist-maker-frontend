"use client";

type SoundPreferencePromptProps = {
  isOpen: boolean;
  onDisableSound: () => void;
  onEnableSound: () => void;
};

export function SoundPreferencePrompt({
  isOpen,
  onDisableSound,
  onEnableSound,
}: SoundPreferencePromptProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-6">
      <div className="relative mx-auto flex h-full w-full max-w-2xl items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.24)_0%,rgba(0,0,0,0)_60%)]" />
        <section
          aria-labelledby="sound-preference-title"
          aria-modal="true"
          className="relative w-full overflow-hidden border-4 border-black bg-white shadow-[14px_14px_0_#e11d48]"
          role="dialog"
        >
          <div className="absolute inset-x-0 top-0 h-3 bg-rose-600" />
          <div className="absolute -left-8 top-20 hidden h-40 w-20 -skew-y-12 bg-black sm:block" />
          <div className="absolute -right-12 top-0 hidden h-full w-24 skew-x-[-18deg] bg-black sm:block" />

          <div className="relative z-10 border-b-4 border-black bg-white px-4 pb-5 pt-7 sm:px-8">
            <p className="text-[11px] font-black tracking-[0.28em] text-rose-600">
              SOUND CHECK
            </p>
            <h2
              id="sound-preference-title"
              className="mt-1 text-3xl font-black uppercase tracking-[0.06em] text-zinc-950 sm:text-5xl"
            >
              音が出ます
            </h2>
          </div>

          <div className="relative z-10 bg-white px-4 py-6 sm:px-8">
            <div className="grid gap-6 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
              <div className="mx-auto flex h-28 w-28 items-end justify-center gap-2 border-4 border-black bg-zinc-950 p-4 shadow-[8px_8px_0_#e11d48]">
                <span className="h-8 w-4 bg-white" />
                <span className="h-16 w-4 bg-rose-500 motion-safe:animate-pulse" />
                <span className="h-12 w-4 bg-white" />
                <span className="h-20 w-4 bg-rose-500 motion-safe:animate-pulse" />
              </div>

              <div className="min-w-0">
                <p className="border-l-4 border-rose-600 pl-3 text-base font-black leading-7 tracking-[0.08em] text-zinc-800">
                  このサイトでは、グループ選択や曲の確認中にプレビュー音声が再生されることがあります。
                </p>
                <p className="mt-4 text-sm font-bold leading-6 tracking-[0.08em] text-zinc-600">
                  音声ありがおすすめです。あとからブラウザのサイトデータを削除すると、再度選び直せます。
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="h-14 border-2 border-black bg-black px-4 text-sm font-black tracking-[0.14em] text-white shadow-[6px_6px_0_#e11d48] transition hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 active:translate-y-1"
                onClick={onEnableSound}
              >
                音を出す（推奨）
              </button>
              <button
                type="button"
                className="h-14 border-2 border-black bg-white px-4 text-sm font-black tracking-[0.14em] text-zinc-950 shadow-[6px_6px_0_#111] transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200 active:translate-y-1"
                onClick={onDisableSound}
              >
                音を出さない
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
