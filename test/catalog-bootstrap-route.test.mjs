import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = new URL(
  "../src/app/api/catalog/bootstrap/route.ts",
  import.meta.url,
);
const seriesSourcePath = new URL("../src/app/api/series.ts", import.meta.url);

function loadSeriesModule() {
  const source = readFileSync(seriesSourcePath, "utf8");
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
  });

  vm.runInContext(compiled.outputText, context);
  return context.module.exports;
}

function loadCatalogBootstrapRouteModule({ fetch }) {
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
      if (specifier === "next/server") {
        return {
          NextResponse: {
            json: (body, init) => Response.json(body, init),
          },
        };
      }

      if (specifier === "../../backend") {
        return {
          backendApiBaseUrl: "https://backend.example.test",
          createBackendHeaders: () => ({}),
        };
      }

      if (specifier === "../../series") {
        return loadSeriesModule();
      }

      if (specifier === "../../edge-cache") {
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

test("catalog bootstrap route tolerates older backend responses without mediaBySongId", async () => {
  const { GET } = loadCatalogBootstrapRouteModule({
    fetch: async () =>
      Response.json({
        songs: [
          {
            id: "song-1",
            releaseDate: null,
            sortOrder: 1,
            title: "Dream Believers",
            titleJa: "Dream Believers",
            unitId: "hasunosora",
            unit: {
              id: "hasunosora",
              name: "蓮ノ空女学院スクールアイドルクラブ",
              sortOrder: 1,
            },
          },
        ],
      }),
  });

  const response = await GET();
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.mediaBySongId, {});
  assert.deepEqual(body.songs, [
    {
      id: "song-1",
      releaseDate: null,
      series: "蓮ノ空",
      sortOrder: 1,
      tags: [],
      title: "Dream Believers",
      titleJa: "Dream Believers",
      unit: "蓮ノ空女学院スクールアイドルクラブ",
      unitId: "hasunosora",
    },
  ]);
});
