"use client";

import { getEncoreLabel } from "../utils";

type EncoreDividerProps = {
  index: number;
  songCount: number;
  visibleEncoreAfters: number[];
};

export function EncoreDivider({
  index,
  songCount,
  visibleEncoreAfters,
}: EncoreDividerProps) {
  const encoreOrder = visibleEncoreAfters.indexOf(index);

  if (encoreOrder === -1 || index >= songCount - 1) {
    return null;
  }

  return (
    <div className="my-3 flex items-center gap-2 text-xs font-black tracking-[0.2em] text-zinc-950">
      <span className="h-0.5 flex-1 bg-black" />
      <span className="border-2 border-black bg-amber-300 px-3 py-1 shadow-[4px_4px_0_#111]">
        {getEncoreLabel(encoreOrder)}
      </span>
      <span className="h-0.5 flex-1 bg-black" />
    </div>
  );
}
