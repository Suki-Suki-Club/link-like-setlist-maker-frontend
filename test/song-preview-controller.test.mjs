import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = new URL(
  "../src/features/setlist/hooks/useSongPreviewController.ts",
  import.meta.url,
);

function loadSongPreviewControllerModule() {
  const source = readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const exports = {};
  const context = vm.createContext({
    exports,
    module: { exports },
    require(specifier) {
      if (specifier === "react") {
        return {};
      }

      throw new Error(`Unexpected import: ${specifier}`);
    },
  });

  vm.runInContext(compiled.outputText, context);
  return context.module.exports;
}

test("active preview audio keeps playing when the same song is requested again", () => {
  const { shouldReuseActivePreviewAudio } = loadSongPreviewControllerModule();
  const audio = {
    ended: false,
    paused: false,
  };

  assert.equal(
    shouldReuseActivePreviewAudio(audio, "song-1", "song-1"),
    true,
  );
});

test("inactive preview audio is not reused for a repeated song request", () => {
  const { shouldReuseActivePreviewAudio } = loadSongPreviewControllerModule();
  const audio = {
    ended: false,
    paused: true,
  };

  assert.equal(
    shouldReuseActivePreviewAudio(audio, "song-1", "song-1"),
    false,
  );
});

test("media merge keeps an existing cover when the new response has none", () => {
  const { mergeCachedSongPreview } = loadSongPreviewControllerModule();

  assert.deepEqual(
    {
      ...mergeCachedSongPreview(
        {
          cachedAt: 100,
          coverUrl: "https://example.com/cover.jpg",
          previewUrl: "https://example.com/preview.mp3",
          status: "available",
          title: "Cached title",
        },
        {
          cachedAt: 200,
          coverUrl: null,
          previewUrl: null,
          status: "unavailable",
          title: "Refresh title",
        },
      ),
    },
    {
      cachedAt: 200,
      coverUrl: "https://example.com/cover.jpg",
      previewUrl: "https://example.com/preview.mp3",
      status: "available",
      title: "Refresh title",
    },
  );
});

test("media merge uses newer media URLs when present", () => {
  const { mergeCachedSongPreview } = loadSongPreviewControllerModule();

  assert.deepEqual(
    {
      ...mergeCachedSongPreview(
        {
          cachedAt: 100,
          coverUrl: "https://example.com/old-cover.jpg",
          previewUrl: "https://example.com/old-preview.mp3",
          status: "available",
          title: "Cached title",
        },
        {
          cachedAt: 200,
          coverUrl: "https://example.com/new-cover.jpg",
          previewUrl: "https://example.com/new-preview.mp3",
          status: "available",
          title: "Refresh title",
        },
      ),
    },
    {
      cachedAt: 200,
      coverUrl: "https://example.com/new-cover.jpg",
      previewUrl: "https://example.com/new-preview.mp3",
      status: "available",
      title: "Refresh title",
    },
  );
});

test("missing preview lookup can be limited to shared setlist songs", () => {
  const { getMissingPreviewSongIds } = loadSongPreviewControllerModule();

  assert.deepEqual(
    getMissingPreviewSongIds({
      cachedPreviewBySongId: {
        "song-1": {
          cachedAt: 100,
          coverUrl: "/api/song-media/song-1/cover",
          previewUrl: "/api/song-media/song-1/audio",
          status: "available",
          title: "Song 1",
        },
      },
      getFallbackPreviewBySongId: () => null,
      songIds: ["song-1", "song-2"],
    }),
    ["song-2"],
  );
});

test("external cached media URLs are treated as missing for display", () => {
  const { getMissingPreviewSongIds } = loadSongPreviewControllerModule();

  assert.deepEqual(
    getMissingPreviewSongIds({
      cachedPreviewBySongId: {
        "song-1": {
          cachedAt: 100,
          coverUrl: "https://example.com/cover.jpg",
          previewUrl: "https://example.com/preview.mp3",
          status: "available",
          title: "Song 1",
        },
      },
      getFallbackPreviewBySongId: () => null,
      songIds: ["song-1"],
    }),
    ["song-1"],
  );
});

test("unavailable media is not repeatedly prefetched", () => {
  const { getMissingPreviewSongIds } = loadSongPreviewControllerModule();

  assert.deepEqual(
    getMissingPreviewSongIds({
      cachedPreviewBySongId: {
        "song-1": {
          cachedAt: 100,
          coverUrl: null,
          previewUrl: null,
          status: "unavailable",
          title: "Song 1",
        },
      },
      getFallbackPreviewBySongId: () => null,
      songIds: ["song-1", "song-2"],
    }),
    ["song-2"],
  );
});

test("bootstrap media responses are converted to cached previews by song id", () => {
  const { createCachedPreviewsFromMediaBySongId } =
    loadSongPreviewControllerModule();

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        createCachedPreviewsFromMediaBySongId(
          {
            "song-1": {
              songId: "song-1",
              status: "available",
              media: {
                albumTitle: null,
                artistName: "Artist",
                coverUrl: "https://example.com/cover.jpg",
                deezerTrackId: 123,
                duration: 120,
                isrc: null,
                previewUrl: "https://example.com/preview.mp3",
                rank: null,
                title: "Batch title",
                trackLink: null,
              },
            },
            "song-2": {
              songId: "song-2",
              status: "unavailable",
              media: null,
            },
          },
          12345,
          (songId) => `Fallback ${songId}`,
        ),
      ),
    ),
    {
      "song-1": {
        cachedAt: 12345,
        coverUrl: "/api/song-media/song-1/cover",
        previewUrl: "/api/song-media/song-1/audio",
        status: "available",
        title: "Batch title",
      },
      "song-2": {
        cachedAt: 12345,
        coverUrl: null,
        previewUrl: null,
        status: "unavailable",
        title: "Fallback song-2",
      },
    },
  );
});
