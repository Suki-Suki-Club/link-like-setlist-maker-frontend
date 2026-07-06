"use client";

import { stepSoundVolume } from "../sound-preference";

type SoundVolumeControlProps = {
  isVisible: boolean;
  onVolumeChange: (volume: number) => void;
  volume: number;
};

export function SoundVolumeControl({
  isVisible,
  onVolumeChange,
  volume,
}: SoundVolumeControlProps) {
  if (!isVisible) {
    return null;
  }

  const volumePercent = Math.round(volume * 100);

  return (
    <aside className="fixed bottom-3 left-3 z-50 text-left sm:bottom-auto sm:left-auto sm:right-4 sm:top-4">
      <div className="grid grid-cols-[34px_64px_34px] overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0_#111]">
        <button
          type="button"
          aria-label="音量を下げる"
          className="h-10 border-r-2 border-black bg-white text-lg font-black text-zinc-950 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200 active:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
          disabled={volume === 0}
          onClick={() => onVolumeChange(stepSoundVolume(volume, -1))}
        >
          -
        </button>
        <div
          aria-label={`音量 ${volumePercent}%`}
          className="flex h-10 flex-col items-center justify-center bg-white leading-none"
          role="status"
        >
          <span className="text-[9px] font-black tracking-[0.18em] text-rose-600">
            音量
          </span>
          <span className="mt-1 text-sm font-black tabular-nums text-zinc-950">
            {volumePercent}
          </span>
        </div>
        <button
          type="button"
          aria-label="音量を上げる"
          className="h-10 border-l-2 border-black bg-black text-lg font-black text-white transition hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 active:bg-rose-600 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
          disabled={volume === 1}
          onClick={() => onVolumeChange(stepSoundVolume(volume, 1))}
        >
          +
        </button>
      </div>
    </aside>
  );
}
