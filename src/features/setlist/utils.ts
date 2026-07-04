import { ENABLED_GROUP } from "./constants";
import type { LoveLiveSeries, SetlistBreak, SetlistBreakType } from "./types";

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

export function isSetlistBreakType(value: unknown): value is SetlistBreakType {
  return value === "encore" || value === "mc" || value === "interlude";
}

export function getEncoreAftersFromBreaks(breaks: SetlistBreak[]) {
  return breaks
    .filter((breakItem) => breakItem.type === "encore")
    .map((breakItem) => breakItem.after);
}

export function getValidSetlistBreaks(
  values: SetlistBreak[],
  songCount: number,
) {
  const breaksByAfter = new Map<number, SetlistBreak>();

  for (const value of values) {
    if (
      !Number.isInteger(value.after) ||
      value.after < 0 ||
      value.after >= songCount - 1 ||
      !isSetlistBreakType(value.type) ||
      breaksByAfter.has(value.after)
    ) {
      continue;
    }

    breaksByAfter.set(value.after, value);
  }

  let encoreCount = 0;

  return Array.from(breaksByAfter.values())
    .sort((a, b) => a.after - b.after)
    .filter((breakItem) => {
      if (breakItem.type !== "encore") {
        return true;
      }

      encoreCount += 1;
      return encoreCount <= 2;
    });
}

export function reorderItems<T>(
  items: T[],
  fromIndex: number,
  toIndex: number,
) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

export function insertItem<T>(items: T[], index: number, item: T) {
  if (index < 0 || index > items.length) {
    return items;
  }

  return [...items.slice(0, index), item, ...items.slice(index)];
}

export function getSetlistBreaksAfterInsertedSong(
  breaks: SetlistBreak[],
  insertIndex: number,
  nextSongCount: number,
) {
  return getValidSetlistBreaks(
    breaks.map((breakItem) => ({
      ...breakItem,
      after:
        insertIndex <= breakItem.after ? breakItem.after + 1 : breakItem.after,
    })),
    nextSongCount,
  );
}

export function getEncoreLabel(order: number) {
  return order === 0 ? "ENCORE" : "DOUBLE ENCORE";
}

export function getEncoreAddLabel(count: number) {
  return count === 0 ? "アンコールを入れる" : "ダブルアンコールを入れる";
}

export function getSetlistBreakLabel(
  breakItem: SetlistBreak,
  visibleBreaks: SetlistBreak[],
) {
  if (breakItem.type === "mc") {
    return "MC";
  }

  if (breakItem.type === "interlude") {
    return "幕間";
  }

  const encoreOrder = visibleBreaks
    .filter((visibleBreak) => visibleBreak.type === "encore")
    .findIndex((visibleBreak) => visibleBreak.after === breakItem.after);

  return getEncoreLabel(encoreOrder);
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

export function parseStoredSetlistBreaks(description: string | null) {
  if (!description) {
    return [];
  }

  try {
    const parsed = JSON.parse(description) as {
      breaks?: unknown;
      encoreAfters?: unknown;
    };

    if (Array.isArray(parsed.breaks)) {
      return parsed.breaks.filter(
        (value): value is SetlistBreak =>
          typeof value === "object" &&
          value !== null &&
          Number.isInteger((value as SetlistBreak).after) &&
          isSetlistBreakType((value as SetlistBreak).type),
      );
    }

    if (Array.isArray(parsed.encoreAfters)) {
      return parsed.encoreAfters
        .filter(Number.isInteger)
        .map((after) => ({ after, type: "encore" as const }));
    }

    return [];
  } catch {
    return [];
  }
}
