import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const modulePaths = {
  "./constants": new URL("../src/features/setlist/constants.ts", import.meta.url),
  "./data": new URL("../src/features/setlist/data.ts", import.meta.url),
  "./setlist-draft": new URL(
    "../src/features/setlist/setlist-draft.ts",
    import.meta.url,
  ),
  "./utils": new URL("../src/features/setlist/utils.ts", import.meta.url),
};

function createStorage() {
  const values = new Map();

  return {
    values,
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function loadSetlistDraftModule() {
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

  return loadModule("./setlist-draft");
}

test("stored setlist draft preserves group, songs, and valid encore positions", () => {
  const {
    SETLIST_DRAFT_STORAGE_KEY,
    readStoredSetlistDraft,
    writeStoredSetlistDraft,
  } = loadSetlistDraftModule();
  const storage = createStorage();

  writeStoredSetlistDraft(
    {
      selectedGroup: "蓮ノ空",
      songIds: ["dream-believers", "on-your-mark", "reflection"],
      encoreAfters: [1, 0, 99],
    },
    storage,
  );

  assert.equal(typeof storage.values.get(SETLIST_DRAFT_STORAGE_KEY), "string");

  const draft = readStoredSetlistDraft(storage);

  assert.equal(draft.selectedGroup, "蓮ノ空");
  assert.deepEqual([...draft.songIds], [
    "dream-believers",
    "on-your-mark",
    "reflection",
  ]);
  assert.deepEqual([...draft.encoreAfters], [0, 1]);
  assert.equal(typeof draft.savedAt, "number");
});

test("invalid setlist draft payloads are ignored", () => {
  const { SETLIST_DRAFT_STORAGE_KEY, readStoredSetlistDraft } =
    loadSetlistDraftModule();
  const storage = createStorage();

  storage.setItem(SETLIST_DRAFT_STORAGE_KEY, "{");
  assert.equal(readStoredSetlistDraft(storage), null);

  storage.setItem(
    SETLIST_DRAFT_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      selectedGroup: "invalid",
      songIds: ["dream-believers"],
      encoreAfters: [],
      savedAt: Date.now(),
    }),
  );
  assert.equal(readStoredSetlistDraft(storage), null);

  storage.setItem(
    SETLIST_DRAFT_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      selectedGroup: "蓮ノ空",
      songIds: ["dream-believers", 123],
      encoreAfters: [],
      savedAt: Date.now(),
    }),
  );
  assert.equal(readStoredSetlistDraft(storage), null);
});

test("stored setlist draft can be removed", () => {
  const {
    SETLIST_DRAFT_STORAGE_KEY,
    removeStoredSetlistDraft,
    writeStoredSetlistDraft,
  } = loadSetlistDraftModule();
  const storage = createStorage();

  writeStoredSetlistDraft(
    {
      selectedGroup: "蓮ノ空",
      songIds: ["dream-believers"],
      encoreAfters: [],
    },
    storage,
  );
  removeStoredSetlistDraft(storage);

  assert.equal(storage.values.has(SETLIST_DRAFT_STORAGE_KEY), false);
});

test("restorable setlist draft keeps only songs that still exist", () => {
  const { getRestorableSetlistDraft } = loadSetlistDraftModule();

  const draft = getRestorableSetlistDraft(
    {
      selectedGroup: "蓮ノ空",
      songIds: ["dream-believers", "missing-song", "reflection"],
      encoreAfters: [0, 1],
      savedAt: Date.now(),
    },
    new Set(["dream-believers", "reflection"]),
  );

  assert.deepEqual([...draft.songIds], ["dream-believers", "reflection"]);
  assert.deepEqual([...draft.encoreAfters], [0]);
});
