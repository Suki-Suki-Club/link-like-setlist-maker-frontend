"use client";

import { LOVE_LIVE_SERIES } from "./data";
import type { LoveLiveSeries, SetlistBreak } from "./types";
import {
  getEncoreAftersFromBreaks,
  getValidEncoreAfters,
  getValidSetlistBreaks,
  isSetlistBreakType,
} from "./utils";

export const SETLIST_DRAFT_STORAGE_KEY =
  "link-like-setlist-maker:setlist-draft";

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "removeItem" | "setItem">;

type StoredSetlistDraftPayload = {
  version: 1;
  selectedGroup: LoveLiveSeries | null;
  songIds: string[];
  encoreAfters: number[];
  breaks?: SetlistBreak[];
  savedAt: number;
};

export type SetlistDraft = Omit<
  StoredSetlistDraftPayload,
  "version" | "breaks"
> & {
  breaks: SetlistBreak[];
};
export type SetlistDraftInput = Omit<SetlistDraft, "savedAt" | "breaks"> & {
  breaks?: SetlistBreak[];
};

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLoveLiveSeries(value: unknown): value is LoveLiveSeries {
  return (
    typeof value === "string" &&
    LOVE_LIVE_SERIES.includes(value as LoveLiveSeries)
  );
}

export function parseStoredSetlistDraft(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isRecord(parsed) || parsed.version !== 1) {
      return null;
    }

    const { breaks, encoreAfters, savedAt, selectedGroup, songIds } = parsed;

    if (
      !(selectedGroup === null || isLoveLiveSeries(selectedGroup)) ||
      !Array.isArray(songIds) ||
      !songIds.every((songId) => typeof songId === "string") ||
      !Array.isArray(encoreAfters) ||
      !encoreAfters.every(Number.isInteger) ||
      !(
        breaks === undefined ||
        (Array.isArray(breaks) &&
          breaks.every(
            (breakItem) =>
              isRecord(breakItem) &&
              Number.isInteger(breakItem.after) &&
              isSetlistBreakType(breakItem.type),
          ))
      ) ||
      typeof savedAt !== "number" ||
      !Number.isFinite(savedAt)
    ) {
      return null;
    }

    const validBreaks = getValidSetlistBreaks(
      breaks === undefined
        ? getValidEncoreAfters(encoreAfters, songIds.length).map((after) => ({
            after,
            type: "encore" as const,
          }))
        : breaks,
      songIds.length,
    );

    return {
      selectedGroup,
      songIds,
      breaks: validBreaks,
      encoreAfters: getEncoreAftersFromBreaks(validBreaks),
      savedAt,
    } satisfies SetlistDraft;
  } catch {
    return null;
  }
}

export function readStoredSetlistDraft(
  storage: ReadableStorage | null = getBrowserStorage(),
) {
  if (!storage) {
    return null;
  }

  try {
    return parseStoredSetlistDraft(storage.getItem(SETLIST_DRAFT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function getRestorableSetlistDraft(
  draft: SetlistDraft,
  availableSongIds: ReadonlySet<string>,
) {
  const songIds = draft.songIds.filter((songId) =>
    availableSongIds.has(songId),
  );
  const sourceBreaks =
    draft.breaks ??
    getValidEncoreAfters(draft.encoreAfters, draft.songIds.length).map(
      (after) => ({
        after,
        type: "encore" as const,
      }),
    );
  const breaks = getValidSetlistBreaks(sourceBreaks, songIds.length);

  return {
    ...draft,
    songIds,
    breaks,
    encoreAfters: getEncoreAftersFromBreaks(breaks),
  } satisfies SetlistDraft;
}

export function writeStoredSetlistDraft(
  draft: SetlistDraftInput,
  storage: WritableStorage | null = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  const validBreaks = getValidSetlistBreaks(
    draft.breaks ??
      getValidEncoreAfters(draft.encoreAfters, draft.songIds.length).map(
        (after) => ({
          after,
          type: "encore" as const,
        }),
      ),
    draft.songIds.length,
  );

  const payload = {
    version: 1,
    selectedGroup: draft.selectedGroup,
    songIds: draft.songIds,
    breaks: validBreaks,
    encoreAfters: getEncoreAftersFromBreaks(validBreaks),
    savedAt: Date.now(),
  } satisfies StoredSetlistDraftPayload;

  try {
    storage.setItem(SETLIST_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Browsers can reject localStorage in private or restricted contexts.
  }
}

export function removeStoredSetlistDraft(
  storage: WritableStorage | null = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(SETLIST_DRAFT_STORAGE_KEY);
  } catch {
    // Browsers can reject localStorage in private or restricted contexts.
  }
}
