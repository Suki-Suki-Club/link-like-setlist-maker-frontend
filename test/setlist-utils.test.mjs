import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const modulePaths = {
  "./constants": new URL("../src/features/setlist/constants.ts", import.meta.url),
  "./data": new URL("../src/features/setlist/data.ts", import.meta.url),
  "./utils": new URL("../src/features/setlist/utils.ts", import.meta.url),
};

function loadUtilsModule() {
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

  return loadModule("./utils");
}

test("reorderItems moves an item without mutating the source array", () => {
  const { reorderItems } = loadUtilsModule();
  const source = ["first", "second", "third", "fourth"];

  assert.deepEqual([...reorderItems(source, 1, 3)], [
    "first",
    "third",
    "fourth",
    "second",
  ]);
  assert.deepEqual(source, ["first", "second", "third", "fourth"]);
});

test("reorderItems ignores noop and out-of-range moves", () => {
  const { reorderItems } = loadUtilsModule();
  const source = ["first", "second", "third"];

  assert.equal(reorderItems(source, 1, 1), source);
  assert.equal(reorderItems(source, -1, 1), source);
  assert.equal(reorderItems(source, 1, 3), source);
});

test("getValidSetlistBreaks keeps one break per song gap and limits encores", () => {
  const { getValidSetlistBreaks } = loadUtilsModule();

  assert.deepEqual(
    [...getValidSetlistBreaks(
      [
        { after: 0, type: "mc" },
        { after: 1, type: "encore" },
        { after: 2, type: "interlude" },
        { after: 3, type: "encore" },
        { after: 4, type: "encore" },
        { after: 9, type: "mc" },
      ],
      6,
    )],
    [
      { after: 0, type: "mc" },
      { after: 1, type: "encore" },
      { after: 2, type: "interlude" },
      { after: 3, type: "encore" },
    ],
  );
});

test("parseStoredSetlistBreaks reads new breaks and old encoreAfters", () => {
  const { parseStoredSetlistBreaks } = loadUtilsModule();

  assert.deepEqual(
    JSON.parse(JSON.stringify(parseStoredSetlistBreaks(
      JSON.stringify({
        breaks: [
          { after: 0, type: "mc" },
          { after: 1, type: "interlude" },
        ],
      }),
    ))),
    [
      { after: 0, type: "mc" },
      { after: 1, type: "interlude" },
    ],
  );

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        parseStoredSetlistBreaks(JSON.stringify({ encoreAfters: [0, 1] })),
      ),
    ),
    [
      { after: 0, type: "encore" },
      { after: 1, type: "encore" },
    ],
  );
});
