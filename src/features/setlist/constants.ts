import { LOVE_LIVE_SERIES } from "./data";
import type { LoveLiveSeries } from "./types";

export const ALL_UNITS_OPTION = "すべて";
export const GROUP_OPTIONS: LoveLiveSeries[] = LOVE_LIVE_SERIES;
export const ENABLED_GROUP: LoveLiveSeries = "蓮ノ空";
export const GROUP_PREVIEW_SONG_IDS: Partial<Record<LoveLiveSeries, string>> = {
  蓮ノ空: "dream-believers",
};
