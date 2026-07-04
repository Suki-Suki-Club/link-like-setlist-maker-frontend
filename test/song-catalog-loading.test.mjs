import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = new URL(
  "../src/features/setlist/song-catalog-loading.ts",
  import.meta.url,
);

function loadSongCatalogLoadingModule() {
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
      throw new Error(`Unexpected import: ${specifier}`);
    },
  });

  vm.runInContext(compiled.outputText, context);
  return context.module.exports;
}

test("getCoverUrlsForGroup returns unique jacket URLs for the selected group", () => {
  const { getCoverUrlsForGroup } = loadSongCatalogLoadingModule();

  assert.deepEqual(
    JSON.parse(JSON.stringify(getCoverUrlsForGroup({
      previewBySongId: {
        "song-1": {
          coverUrl: "/api/song-media/song-1/cover",
          previewUrl: "/api/song-media/song-1/audio",
          status: "available",
          title: "Song 1",
          cachedAt: 1,
        },
        "song-2": {
          coverUrl: "/api/song-media/song-2/cover",
          previewUrl: "/api/song-media/song-2/audio",
          status: "available",
          title: "Song 2",
          cachedAt: 1,
        },
        "song-3": {
          coverUrl: "/api/song-media/song-1/cover",
          previewUrl: "/api/song-media/song-3/audio",
          status: "available",
          title: "Song 3",
          cachedAt: 1,
        },
      },
      selectedGroup: "蓮ノ空",
      songs: [
        { id: "song-1", series: "蓮ノ空", title: "Song 1", unit: "A", tags: [] },
        { id: "song-2", series: "Aqours", title: "Song 2", unit: "B", tags: [] },
        { id: "song-3", series: "蓮ノ空", title: "Song 3", unit: "C", tags: [] },
      ],
    }))),
    ["/api/song-media/song-1/cover"],
  );
});

test("preloadImageUrls resolves after every jacket image succeeds or fails", async () => {
  const { preloadImageUrls } = loadSongCatalogLoadingModule();
  const assignedUrls = [];
  const pending = new Map();

  function createImage() {
    return {
      onload: null,
      onerror: null,
      set src(value) {
        assignedUrls.push(value);
        pending.set(value, this);
      },
    };
  }

  const promise = preloadImageUrls(["/cover/1.jpg", "/cover/2.jpg"], createImage);

  pending.get("/cover/2.jpg").onerror();
  pending.get("/cover/1.jpg").onload();

  await promise;
  assert.deepEqual(assignedUrls, ["/cover/1.jpg", "/cover/2.jpg"]);
});
