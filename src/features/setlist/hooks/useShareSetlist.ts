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

export function canSaveShareUrlOnce({
  hasIssuedShareUrl,
  prediction,
}: {
  hasIssuedShareUrl: boolean;
  prediction: SetlistPrediction;
}) {
  return !hasIssuedShareUrl && prediction.songIds.length > 0;
}

export function getShareSaveButtonLabel(hasIssuedShareUrl: boolean) {
  return hasIssuedShareUrl ? "保存済み" : "保存してURLをコピー";
}

export function createXShareUrl(shareUrl: string, setlistTitle: string) {
  if (!shareUrl) {
    return "";
  }

  const text = `${setlistTitle.trim() || DEFAULT_SETLIST_TITLE}\n${shareUrl}\n#リンクライクセトリメーカー #ラブライブセトリメーカー #Myセトリメーカー`;

  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function getSharedSetlistFreshCreateAction() {
  return {
    href: "/home?fresh=1",
    label: "マイセトリを考える",
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
    if (!canSaveShareUrlOnce({ hasIssuedShareUrl, prediction })) {
      return;
    }

    let nextShareUrl: string;

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
      nextShareUrl = origin ? `${origin}${nextSharePath}` : nextSharePath;

      setIssuedSharePath(nextSharePath);
      setHasIssuedShareUrl(true);
    } catch (error) {
      console.error(error);
      setShareStatus("共有URLを発行できませんでした");
      return;
    }

    // The setlist is already saved at this point, so a clipboard/prompt
    // failure here (e.g. iOS Safari's stricter clipboard permission timing)
    // must not be reported as a save failure.
    try {
      await navigator.clipboard.writeText(nextShareUrl);
      setShareStatus("保存しました。共有URLをコピーしました");
    } catch (error) {
      console.error(error);

      try {
        window.prompt("共有URL", nextShareUrl);
      } catch (promptError) {
        console.error(promptError);
      }

      setShareStatus("保存しました。共有URLを表示しました");
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
