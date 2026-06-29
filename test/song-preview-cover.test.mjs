import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = new URL(
  "../src/app/api/song-previews/cover-response.ts",
  import.meta.url,
);

function loadCoverResponseModule() {
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
    process: {
      env: {},
    },
    Headers,
    Response,
    URLSearchParams,
    require(specifier) {
      if (specifier === "./shared") {
        return {
          fetchSongPreview() {
            throw new Error("fetchSongPreview should be injected by tests");
          },
        };
      }

      throw new Error(`Unexpected import: ${specifier}`);
    },
  });

  vm.runInContext(compiled.outputText, context);
  return context.module.exports;
}

test("createSongPreviewCoverResponse proxies the preferred Deezer cover image", async () => {
  const { createSongPreviewCoverResponse } = loadCoverResponseModule();
  const requestedUrls = [];
  const response = await createSongPreviewCoverResponse("song-1", {
    fetchSongPreview: async () =>
      Response.json({
        status: "found",
        preview: {
          deezerTrackId: 123,
          previewUrl: "https://example.com/audio.mp3",
          title: "Dream Believers",
        },
      }),
    fetch: async (url) => {
      requestedUrls.push(String(url));

      if (String(url).endsWith("/track/123")) {
        return Response.json({
          album: {
            cover_medium: "https://cdn.example.com/medium.jpg",
            cover_big: "https://cdn.example.com/big.jpg",
            cover_xl: "https://cdn.example.com/xl.jpg",
          },
        });
      }

      return new Response("image-bytes", {
        headers: {
          "content-type": "image/jpeg",
        },
      });
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(response.headers.get("cache-control"), "public, max-age=86400");
  assert.equal(await response.text(), "image-bytes");
  assert.deepEqual(requestedUrls, [
    "https://api.deezer.com/track/123",
    "https://cdn.example.com/xl.jpg",
  ]);
});

test("createSongPreviewCoverResponse reports unavailable cover responses", async () => {
  const { createSongPreviewCoverResponse } = loadCoverResponseModule();
  const response = await createSongPreviewCoverResponse("song-404", {
    fetchSongPreview: async () =>
      Response.json(
        {
          status: "not_found",
          preview: null,
        },
        { status: 404 },
      ),
    fetch: async () => {
      throw new Error("cover fetch should not run");
    },
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    code: "COVER_NOT_AVAILABLE",
    message: "Preview cover is unavailable",
  });
});
