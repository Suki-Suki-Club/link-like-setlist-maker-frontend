import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const modulePaths = {
  "../src/features/setlist/setlist-image.ts": new URL(
    "../src/features/setlist/setlist-image.ts",
    import.meta.url,
  ),
  "./utils": new URL("../src/features/setlist/utils.ts", import.meta.url),
  "./constants": new URL("../src/features/setlist/constants.ts", import.meta.url),
  "./data": new URL("../src/features/setlist/data.ts", import.meta.url),
};

function loadSetlistImageModule() {
  const moduleCache = new Map();

  function loadModule(specifier) {
    const sourcePath = modulePaths[specifier];

    if (!sourcePath) {
      throw new Error(`Unexpected import: ${specifier}`);
    }

    if (moduleCache.has(specifier)) {
      return moduleCache.get(specifier);
    }

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
      require: loadModule,
    });

    moduleCache.set(specifier, context.module.exports);
    vm.runInContext(compiled.outputText, context);
    return context.module.exports;
  }

  return loadModule("../src/features/setlist/setlist-image.ts");
}

const songs = [
  {
    id: "song-1",
    title: "Dream Believers",
    artistName: "蓮ノ空女学院スクールアイドルクラブ",
    series: "蓮ノ空女学院スクールアイドルクラブ",
    unit: "スリーズブーケ",
  },
  {
    id: "song-2",
    title: "On your mark",
    artistName: "蓮ノ空女学院スクールアイドルクラブ",
    series: "蓮ノ空女学院スクールアイドルクラブ",
    unit: "DOLLCHESTRA",
  },
  {
    id: "song-3",
    title: "永遠のEuphoria",
    artistName: "蓮ノ空女学院スクールアイドルクラブ",
    series: "蓮ノ空女学院スクールアイドルクラブ",
    unit: "みらくらぱーく！",
  },
];

test("createSetlistImageModel orders songs and breaks for the export card", () => {
  const { createSetlistImageModel } = loadSetlistImageModule();

  const model = createSetlistImageModel({
    coverUrlBySongId: {
      "song-1": "/api/song-media/song-1/cover",
      "song-3": "/api/song-media/song-3/cover",
    },
    createdAt: new Date("2026-06-28T09:07:00+09:00"),
    selectedGroup: "蓮ノ空女学院スクールアイドルクラブ",
    setlistTitle: "夏のセットリスト",
    songs,
    visibleSetlistBreaks: [
      { after: 0, type: "mc" },
      { after: 1, type: "encore" },
    ],
  });

  assert.equal(model.width, 1080);
  assert.equal(model.filename, "setlist-20260628-0907.png");
  assert.equal(model.title, "夏のセットリスト");
  assert.equal(model.groupLabel, "蓮ノ空女学院スクールアイドルクラブ");
  assert.equal(model.songCount, 3);
  assert.deepEqual(
    JSON.parse(JSON.stringify(
    model.items.map((item) =>
      item.kind === "song" ? `${item.order}:${item.title}` : item.label,
    ),
    )),
    ["1:Dream Believers", "MC", "2:On your mark", "ENCORE", "3:永遠のEuphoria"],
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(
    model.items
      .filter((item) => item.kind === "song")
      .map((item) => item.cover),
    )),
    [
      { kind: "image", url: "/api/song-media/song-1/cover" },
      { kind: "placeholder" },
      { kind: "image", url: "/api/song-media/song-3/cover" },
    ],
  );
});

test("wrapCanvasText limits long titles with an ellipsis", () => {
  const { wrapCanvasText } = loadSetlistImageModule();
  const measure = (value) => value.length * 10;

  const lines = wrapCanvasText(
      "この曲名はかなり長いので画像カードでは二行までに収めたい",
      120,
      measure,
      2,
    );

  assert.equal(lines.length, 2);
  assert.equal(lines.at(-1)?.endsWith("..."), true);
  assert.ok(lines.every((line) => measure(line) <= 120));
});

test("cover artwork layout compensates for the heavier bottom border", () => {
  const { SETLIST_IMAGE_COVER_SIZE, getCenteredCoverY } =
    loadSetlistImageModule();
  const rowY = 300;
  const rowHeight = 128;

  const coverY = getCenteredCoverY(rowY, rowHeight, SETLIST_IMAGE_COVER_SIZE);
  const topMargin = coverY - rowY;
  const bottomMargin = rowY + rowHeight - (coverY + SETLIST_IMAGE_COVER_SIZE);

  assert.equal(SETLIST_IMAGE_COVER_SIZE, 96);
  assert.equal(topMargin, 22);
  assert.equal(bottomMargin, 10);
});
