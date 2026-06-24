"use client";

import type { LoveLiveSeries } from "../types";
import { isGroupSelectable } from "../utils";
import { GroupOptionButton } from "./GroupOptionButton";

type GroupStepPanelProps = {
  canConfirmGroupSelection: boolean;
  groupOptions: LoveLiveSeries[];
  onConfirm: () => void;
  onGroupSelect: (group: LoveLiveSeries) => void;
  pendingGroup: LoveLiveSeries | null;
};

export function GroupStepPanel({
  canConfirmGroupSelection,
  groupOptions,
  onConfirm,
  onGroupSelect,
  pendingGroup,
}: GroupStepPanelProps) {
  return (
    <section className="w-full max-w-md bg-white">
      <h2 className="relative inline-block -rotate-1 text-left text-3xl font-black tracking-tight text-zinc-950 after:absolute after:-bottom-1 after:left-0 after:-z-10 after:h-3 after:w-full after:-skew-x-12 after:bg-rose-500 after:content-['']">
        グループを選択
      </h2>
      <div className="mt-6 flex flex-col gap-4">
        {groupOptions.map((group) => (
          <GroupOptionButton
            key={group}
            group={group}
            selected={pendingGroup === group}
            disabled={!isGroupSelectable(group)}
            onSelect={onGroupSelect}
          />
        ))}
      </div>
      <button
        type="button"
        className="mt-6 h-14 w-full border-2 border-black bg-black px-6 text-lg font-black tracking-[0.16em] text-white shadow-[6px_6px_0_#e11d48] transition-all duration-200 ease-out [clip-path:polygon(3%_0,100%_0,97%_100%,0_100%)] hover:bg-rose-600 hover:shadow-[10px_10px_0_#111] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 active:translate-y-1 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none"
        disabled={!canConfirmGroupSelection}
        onClick={onConfirm}
      >
        決定
      </button>
    </section>
  );
}
