"use client";

import { getEncoreAddLabel, getEncoreLabel } from "../utils";

type EncoreControlProps = {
  index: number;
  onClear: (index: number) => void;
  onPlace: (index: number) => void;
  songCount: number;
  visibleEncoreAfters: number[];
};

export function EncoreControl({
  index,
  onClear,
  onPlace,
  songCount,
  visibleEncoreAfters,
}: EncoreControlProps) {
  if (index >= songCount - 1) {
    return null;
  }

  const encoreOrder = visibleEncoreAfters.indexOf(index);

  if (encoreOrder !== -1) {
    return (
      <div className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-amber-700">
        <span className="h-px flex-1 bg-amber-300" />
        <span className="border-2 border-amber-500 bg-amber-100 px-3 py-1 text-amber-800 shadow-[3px_3px_0_#f59e0b]">
          {getEncoreLabel(encoreOrder)}
        </span>
        <button
          type="button"
          className="h-8 border-2 border-amber-500 bg-white px-3 text-[11px] font-black tracking-[0.14em] text-amber-800 shadow-[3px_3px_0_#f59e0b] transition hover:bg-amber-100"
          onClick={() => onClear(index)}
        >
          削除
        </button>
        <span className="h-px flex-1 bg-amber-300" />
      </div>
    );
  }

  if (visibleEncoreAfters.length >= 2) {
    return null;
  }

  return (
    <button
      type="button"
      className="mx-auto flex h-9 w-full max-w-xs items-center justify-center border-2 border-dashed border-amber-500 bg-white px-3 text-[11px] font-black tracking-[0.14em] text-amber-700 transition hover:border-black hover:bg-amber-100 hover:text-zinc-950"
      onClick={() => onPlace(index)}
    >
      {getEncoreAddLabel(visibleEncoreAfters.length)}
    </button>
  );
}
