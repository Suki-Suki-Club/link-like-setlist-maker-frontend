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
