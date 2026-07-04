import type { CachedSongPreview } from "./hooks/useSongPreviewController";
import type { LoveLiveSeries, Song } from "./types";

type PreloadableImage = Pick<HTMLImageElement, "onerror" | "onload" | "src">;

type GetCoverUrlsForGroupInput = {
  previewBySongId: Record<string, CachedSongPreview>;
  selectedGroup: LoveLiveSeries | null;
  songs: Song[];
};

export function getCoverUrlsForGroup({
  previewBySongId,
  selectedGroup,
  songs,
}: GetCoverUrlsForGroupInput) {
  const urls = new Set<string>();

  for (const song of songs) {
    if (selectedGroup && song.series !== selectedGroup) {
      continue;
    }

    const coverUrl = previewBySongId[song.id]?.coverUrl;
    if (coverUrl) {
      urls.add(coverUrl);
    }
  }

  return Array.from(urls);
}

export async function preloadImageUrls(
  urls: string[],
  createImage: () => PreloadableImage = () => new Image(),
) {
  await Promise.all(
    Array.from(new Set(urls)).map(
      (url) =>
        new Promise<void>((resolve) => {
          let image: PreloadableImage;

          try {
            image = createImage();
          } catch {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = url;
        }),
    ),
  );
}
