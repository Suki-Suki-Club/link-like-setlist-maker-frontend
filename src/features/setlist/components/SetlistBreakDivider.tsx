"use client";

import type { SetlistBreak } from "../types";
import { getSetlistBreakLabel } from "../utils";

type SetlistBreakDividerProps = {
  index: number;
  songCount: number;
  visibleBreaks: SetlistBreak[];
};

const breakClassNames = {
  encore: "bg-amber-300",
  mc: "bg-sky-300",
  interlude: "bg-violet-300",
};

export function SetlistBreakDivider({
  index,
  songCount,
  visibleBreaks,
}: SetlistBreakDividerProps) {
  const breakItem = visibleBreaks.find((item) => item.after === index);

  if (!breakItem || index >= songCount - 1) {
    return null;
  }

  return (
    <div className="my-3 flex items-center gap-2 text-xs font-black tracking-[0.2em] text-zinc-950">
      <span className="h-0.5 flex-1 bg-black" />
      <span
        className={`border-2 border-black px-3 py-1 shadow-[4px_4px_0_#111] ${breakClassNames[breakItem.type]}`}
      >
        {getSetlistBreakLabel(breakItem, visibleBreaks)}
      </span>
      <span className="h-0.5 flex-1 bg-black" />
    </div>
  );
}
