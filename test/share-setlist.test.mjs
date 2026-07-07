import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = new URL(
  "../src/features/setlist/hooks/useShareSetlist.ts",
  import.meta.url,
);

function loadShareSetlistModule() {
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
        return {
          useState: () => [null, () => undefined],
          useSyncExternalStore: () => "",
        };
      }

      if (specifier === "../utils") {
        return {
          createSharePath: (setlistId) => `/shared/${setlistId}`,
        };
      }

      throw new Error(`Unexpected import: ${specifier}`);
    },
  });

  vm.runInContext(compiled.outputText, context);
  return context.module.exports;
}

test("setlist save payload uses the editable title", () => {
  const { createSetlistSavePayload } = loadShareSetlistModule();

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        createSetlistSavePayload(
          {
            songIds: ["dream-believers", "on-your-mark"],
            encoreAfters: [0],
            breaks: [{ after: 0, type: "encore" }],
          },
          "  夏のセットリスト  ",
        ),
      ),
    ),
    {
      description: JSON.stringify({
        breaks: [{ after: 0, type: "encore" }],
        encoreAfters: [0],
      }),
      items: [
        {
          position: 1,
          songId: "dream-believers",
        },
        {
          position: 2,
          songId: "on-your-mark",
        },
      ],
      title: "夏のセットリスト",
    },
  );
});

test("setlist save payload falls back to the default title when blank", () => {
  const { DEFAULT_SETLIST_TITLE, createSetlistSavePayload } =
    loadShareSetlistModule();

  assert.equal(
    createSetlistSavePayload(
      { songIds: ["dream-believers"], encoreAfters: [], breaks: [] },
      " ",
    ).title,
    DEFAULT_SETLIST_TITLE,
  );
});

test("setlist save payload stores MC and interlude breaks", () => {
  const { createSetlistSavePayload } = loadShareSetlistModule();

  assert.deepEqual(
    JSON.parse(
      createSetlistSavePayload(
        {
          songIds: ["dream-believers", "on-your-mark", "reflection"],
          encoreAfters: [],
          breaks: [
            { after: 0, type: "mc" },
            { after: 1, type: "interlude" },
          ],
        },
        "breaks",
      ).description,
    ),
    {
      breaks: [
        { after: 0, type: "mc" },
        { after: 1, type: "interlude" },
      ],
      encoreAfters: [],
    },
  );
});

test("share URL save is allowed only before a URL has been issued", () => {
  const { canSaveShareUrlOnce } = loadShareSetlistModule();

  assert.equal(
    canSaveShareUrlOnce({
      hasIssuedShareUrl: false,
      prediction: { songIds: ["dream-believers"], encoreAfters: [], breaks: [] },
    }),
    true,
  );
  assert.equal(
    canSaveShareUrlOnce({
      hasIssuedShareUrl: true,
      prediction: { songIds: ["dream-believers"], encoreAfters: [], breaks: [] },
    }),
    false,
  );
  assert.equal(
    canSaveShareUrlOnce({
      hasIssuedShareUrl: false,
      prediction: { songIds: [], encoreAfters: [], breaks: [] },
    }),
    false,
  );
});

test("share URL save button reflects issued state", () => {
  const { getShareSaveButtonLabel } = loadShareSetlistModule();

  assert.equal(getShareSaveButtonLabel(false), "保存してURLをコピー");
  assert.equal(getShareSaveButtonLabel(true), "保存済み");
});

test("X share URL points to the tweet intent with the setlist URL", () => {
  const { createXShareUrl } = loadShareSetlistModule();

  assert.equal(createXShareUrl("", "My Setlist", "蓮ノ空"), "");

  const shareUrl = createXShareUrl(
    "https://example.com/shared/setlist-1",
    "My Setlist",
    "蓮ノ空",
  );
  const parsedUrl = new URL(shareUrl);

  assert.equal(parsedUrl.origin, "https://x.com");
  assert.equal(parsedUrl.pathname, "/intent/tweet");
  assert.equal(parsedUrl.searchParams.get("url"), null);
  assert.equal(
    parsedUrl.searchParams.get("text"),
    "My Setlist\nhttps://example.com/shared/setlist-1\n#Myセトリメーカー #蓮ノ空セトリメーカー",
  );
});

test("X share URL falls back to the My Setlist hashtag when no group is selected", () => {
  const { createXShareUrl } = loadShareSetlistModule();

  const shareUrl = createXShareUrl(
    "https://example.com/shared/setlist-1",
    "My Setlist",
    null,
  );
  const parsedUrl = new URL(shareUrl);

  assert.equal(
    parsedUrl.searchParams.get("text"),
    "My Setlist\nhttps://example.com/shared/setlist-1\n#Myセトリメーカー",
  );
});

test("shared setlist create action links to the maker entry", () => {
  const { getSharedSetlistFreshCreateAction } = loadShareSetlistModule();

  assert.deepEqual(
    JSON.parse(JSON.stringify(getSharedSetlistFreshCreateAction())),
    {
      href: "/home?fresh=1",
      label: "マイセトリを考える",
    },
  );
});
