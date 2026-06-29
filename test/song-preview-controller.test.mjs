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

      if (specifier === "../preview-cache") {
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

test("preview refresh keeps an existing cover when the new response has none", () => {
  const { mergeCachedSongPreview } = loadSongPreviewControllerModule();

  assert.deepEqual(
    {
      ...mergeCachedSongPreview(
        {
          cachedAt: 100,
          coverUrl: "https://example.com/cover.jpg",
          previewUrl: "https://example.com/preview.mp3",
          status: "found",
          title: "Cached title",
        },
        {
          cachedAt: 200,
          coverUrl: null,
          previewUrl: null,
          status: "not_found",
          title: "Refresh title",
        },
      ),
    },
    {
      cachedAt: 200,
      coverUrl: "https://example.com/cover.jpg",
      previewUrl: "https://example.com/preview.mp3",
      status: "found",
      title: "Refresh title",
    },
  );
});

test("preview refresh uses newer media URLs when present", () => {
  const { mergeCachedSongPreview } = loadSongPreviewControllerModule();

  assert.deepEqual(
    {
      ...mergeCachedSongPreview(
        {
          cachedAt: 100,
          coverUrl: "https://example.com/old-cover.jpg",
          previewUrl: "https://example.com/old-preview.mp3",
          status: "found",
          title: "Cached title",
        },
        {
          cachedAt: 200,
          coverUrl: "https://example.com/new-cover.jpg",
          previewUrl: "https://example.com/new-preview.mp3",
          status: "found",
          title: "Refresh title",
        },
      ),
    },
    {
      cachedAt: 200,
      coverUrl: "https://example.com/new-cover.jpg",
      previewUrl: "https://example.com/new-preview.mp3",
      status: "found",
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
          coverUrl: "https://example.com/cover.jpg",
          previewUrl: "https://example.com/preview.mp3",
          status: "found",
          title: "Song 1",
        },
      },
      getCachedPreviewBySongId: () => null,
      songIds: ["song-1", "song-2"],
    }),
    ["song-2"],
  );
});
