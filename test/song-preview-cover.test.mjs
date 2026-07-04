import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = new URL(
  "../src/app/api/song-media/[songId]/cover/route.ts",
  import.meta.url,
);

function loadCoverRouteModule({ fetchSongMedia, fetch }) {
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
    fetch,
    Response,
    require(specifier) {
      if (specifier === "../../shared") {
        return { fetchSongMedia };
      }

      if (specifier === "../../../edge-cache") {
        return {
          matchEdgeCache: async () => undefined,
          putEdgeCache: async () => {},
        };
      }

      throw new Error(`Unexpected import: ${specifier}`);
    },
  });

  vm.runInContext(compiled.outputText, context);
  return context.module.exports;
}

test("song media cover route proxies the managed cover image", async () => {
  const requestedUrls = [];
  const { GET } = loadCoverRouteModule({
    fetchSongMedia: async () =>
      Response.json({
        songId: "song-1",
        status: "available",
        media: {
          coverUrl: "https://cdn.example.com/xl.jpg",
          previewUrl: "https://example.com/audio.mp3",
          title: "Dream Believers",
        },
      }),
    fetch: async (url) => {
      requestedUrls.push(String(url));

      return new Response("image-bytes", {
        headers: {
          "content-type": "image/jpeg",
        },
      });
    },
  });

  const response = await GET(new Request("https://example.test"), {
    params: Promise.resolve({ songId: "song-1" }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(
    response.headers.get("cache-control"),
    "public, max-age=2592000",
  );
  assert.equal(await response.text(), "image-bytes");
  assert.deepEqual(requestedUrls, ["https://cdn.example.com/xl.jpg"]);
});

test("song media cover route reports unavailable cover responses", async () => {
  const { GET } = loadCoverRouteModule({
    fetchSongMedia: async () =>
      Response.json(
        {
          songId: "song-404",
          status: "unavailable",
          media: null,
        },
        { status: 404 },
      ),
    fetch: async () => {
      throw new Error("cover fetch should not run");
    },
  });

  const response = await GET(new Request("https://example.test"), {
    params: Promise.resolve({ songId: "song-404" }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    code: "MEDIA_NOT_AVAILABLE",
    message: "Cover image is unavailable",
  });
});
