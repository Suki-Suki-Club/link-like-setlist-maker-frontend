"use client";

import { useState, useSyncExternalStore } from "react";
import type { SetlistPrediction } from "../types";
import { createSharePath } from "../utils";

type BackendSetlistResponse = {
  setlist?: {
    id: string;
  };
};

export const DEFAULT_SETLIST_TITLE = "My Select Setlist";

function subscribeToOrigin() {
  return () => undefined;
}

function getClientOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return "";
}

export function createSetlistSavePayload(
  prediction: SetlistPrediction,
  setlistTitle: string,
) {
  return {
    description: JSON.stringify({
      breaks: prediction.breaks,
      encoreAfters: prediction.encoreAfters,
    }),
    items: prediction.songIds.map((songId, index) => ({
      position: index + 1,
      songId,
    })),
    title: setlistTitle.trim() || DEFAULT_SETLIST_TITLE,
  };
}

export function useShareSetlist() {
  const [shareStatus, setShareStatus] = useState("");
  const [issuedSharePath, setIssuedSharePath] = useState<string | null>(null);
  const [hasIssuedShareUrl, setHasIssuedShareUrl] = useState(false);
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getClientOrigin,
    getServerOrigin,
  );

  const shareUrl =
    issuedSharePath === null
      ? ""
      : origin
        ? `${origin}${issuedSharePath}`
        : issuedSharePath;

  function resetShareState() {
    setShareStatus("");
    setIssuedSharePath(null);
    setHasIssuedShareUrl(false);
  }

  async function copyIssuedShareUrl() {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("共有URLをコピーしました");
    } catch {
      window.prompt("共有URL", shareUrl);
      setShareStatus("共有URLを表示しました");
    }
  }

  async function saveShareUrl(
    prediction: SetlistPrediction,
    setlistTitle: string,
  ) {
    if (prediction.songIds.length === 0) {
      return;
    }

    try {
      const response = await fetch("/api/setlists", {
        body: JSON.stringify(createSetlistSavePayload(prediction, setlistTitle)),
        cache: "no-store",
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as BackendSetlistResponse;

      if (!response.ok || !payload.setlist?.id) {
        throw new Error("Setlist save failed");
      }

      const nextSharePath = createSharePath(payload.setlist.id);
      const nextShareUrl = origin ? `${origin}${nextSharePath}` : nextSharePath;

      setIssuedSharePath(nextSharePath);
      setHasIssuedShareUrl(true);
      try {
        await navigator.clipboard.writeText(nextShareUrl);
        setShareStatus("保存しました。共有URLをコピーしました");
      } catch {
        window.prompt("共有URL", nextShareUrl);
        setShareStatus("保存しました。共有URLを表示しました");
      }
    } catch {
      setShareStatus("共有URLを発行できませんでした");
    }
  }

  return {
    copyIssuedShareUrl,
    hasIssuedShareUrl,
    resetShareState,
    saveShareUrl,
    shareStatus,
    shareUrl,
  };
}
