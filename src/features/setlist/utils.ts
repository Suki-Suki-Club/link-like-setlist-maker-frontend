import { ENABLED_GROUP } from "./constants";
import type { LoveLiveSeries } from "./types";

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function isGroupSelectable(group: LoveLiveSeries) {
  return group === ENABLED_GROUP;
}

export function createSharePath(setlistId: string) {
  return `/shared/${encodeURIComponent(setlistId)}`;
}

export function getValidEncoreAfters(values: number[], songCount: number) {
  return Array.from(
    new Set(
      values.filter(
        (value) =>
          Number.isInteger(value) && value >= 0 && value < songCount - 1,
      ),
    ),
  )
    .sort((a, b) => a - b)
    .slice(0, 2);
}

export function getEncoreLabel(order: number) {
  return order === 0 ? "ENCORE" : "DOUBLE ENCORE";
}

export function getEncoreAddLabel(count: number) {
  return count === 0
    ? "アンコールをここに入れる"
    : "ダブルアンコールをここに入れる";
}

export function parseStoredEncoreAfters(description: string | null) {
  if (!description) {
    return [];
  }

  try {
    const parsed = JSON.parse(description) as { encoreAfters?: unknown };
    if (!Array.isArray(parsed.encoreAfters)) {
      return [];
    }

    return parsed.encoreAfters.filter(Number.isInteger);
  } catch {
    return [];
  }
}
