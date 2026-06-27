"use client";

import type { SetlistBreak, SetlistBreakType } from "../types";
import { getEncoreAddLabel, getSetlistBreakLabel } from "../utils";

type SetlistBreakControlProps = {
  index: number;
  onClear: (index: number) => void;
  onPlace: (index: number, type: SetlistBreakType) => void;
  songCount: number;
  visibleBreaks: SetlistBreak[];
  visibleEncoreAfters: number[];
};

const breakToneClassNames = {
  encore: {
    line: "bg-amber-300",
    text: "text-amber-700",
    label:
      "border-amber-500 bg-amber-100 text-amber-800 shadow-[3px_3px_0_#f59e0b]",
    button:
      "border-amber-500 text-amber-800 shadow-[3px_3px_0_#f59e0b] hover:bg-amber-100",
  },
  mc: {
    line: "bg-sky-300",
    text: "text-sky-700",
    label: "border-sky-500 bg-sky-100 text-sky-800 shadow-[3px_3px_0_#0ea5e9]",
    button:
      "border-sky-500 text-sky-800 shadow-[3px_3px_0_#0ea5e9] hover:bg-sky-100",
  },
  interlude: {
    line: "bg-violet-300",
    text: "text-violet-700",
    label:
      "border-violet-500 bg-violet-100 text-violet-800 shadow-[3px_3px_0_#8b5cf6]",
    button:
      "border-violet-500 text-violet-800 shadow-[3px_3px_0_#8b5cf6] hover:bg-violet-100",
  },
} satisfies Record<
  SetlistBreakType,
  { button: string; label: string; line: string; text: string }
>;

export function SetlistBreakControl({
  index,
  onClear,
  onPlace,
  songCount,
  visibleBreaks,
  visibleEncoreAfters,
}: SetlistBreakControlProps) {
  if (index >= songCount - 1) {
    return null;
  }

  const activeBreak = visibleBreaks.find(
    (breakItem) => breakItem.after === index,
  );

  if (activeBreak) {
    const tone = breakToneClassNames[activeBreak.type];

    return (
      <div
        className={`flex items-center gap-2 text-xs font-black tracking-[0.2em] ${tone.text}`}
      >
        <span className={`h-px flex-1 ${tone.line}`} />
        <span className={`border-2 px-3 py-1 ${tone.label}`}>
          {getSetlistBreakLabel(activeBreak, visibleBreaks)}
        </span>
        <button
          type="button"
          className={`h-8 border-2 bg-white px-3 text-[11px] font-black tracking-[0.14em] transition ${tone.button}`}
          onClick={() => onClear(index)}
        >
          削除
        </button>
        <span className={`h-px flex-1 ${tone.line}`} />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-xl grid-cols-3 gap-2">
      <button
        type="button"
        className="h-9 border-2 border-dashed border-sky-500 bg-white px-2 text-[11px] font-black tracking-[0.12em] text-sky-700 transition hover:border-black hover:bg-sky-100 hover:text-zinc-950"
        onClick={() => onPlace(index, "mc")}
      >
        MCを入れる
      </button>
      <button
        type="button"
        className="h-9 border-2 border-dashed border-violet-500 bg-white px-2 text-[11px] font-black tracking-[0.12em] text-violet-700 transition hover:border-black hover:bg-violet-100 hover:text-zinc-950"
        onClick={() => onPlace(index, "interlude")}
      >
        幕間を入れる
      </button>
      <button
        type="button"
        className="h-9 border-2 border-dashed border-amber-500 bg-white px-2 text-[11px] font-black tracking-[0.12em] text-amber-700 transition hover:border-black hover:bg-amber-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400"
        disabled={visibleEncoreAfters.length >= 2}
        onClick={() => onPlace(index, "encore")}
      >
        {getEncoreAddLabel(visibleEncoreAfters.length)}
      </button>
    </div>
  );
}
