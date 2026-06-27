import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = new URL(
  "../src/features/setlist/sound-preference.ts",
  import.meta.url,
);

function loadSoundPreferenceModule() {
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
  });

  vm.runInContext(compiled.outputText, context);
  return context.module.exports;
}

test("parseSoundPreference accepts only stored sound choices", () => {
  const { parseSoundPreference } = loadSoundPreferenceModule();

  assert.equal(parseSoundPreference("enabled"), "enabled");
  assert.equal(parseSoundPreference("disabled"), "disabled");
  assert.equal(parseSoundPreference(""), null);
  assert.equal(parseSoundPreference("yes"), null);
  assert.equal(parseSoundPreference(null), null);
});

test("the prompt is shown only before a choice is saved", () => {
  const { shouldShowSoundPreferencePrompt } = loadSoundPreferenceModule();

  assert.equal(shouldShowSoundPreferencePrompt(null), true);
  assert.equal(shouldShowSoundPreferencePrompt("enabled"), false);
  assert.equal(shouldShowSoundPreferencePrompt("disabled"), false);
});

test("sound plays only when the user enabled it", () => {
  const { isSoundEnabled } = loadSoundPreferenceModule();

  assert.equal(isSoundEnabled("enabled"), true);
  assert.equal(isSoundEnabled("disabled"), false);
  assert.equal(isSoundEnabled(null), false);
});

test("stored sound preference uses the app storage key", () => {
  const {
    SOUND_PREFERENCE_STORAGE_KEY,
    readStoredSoundPreference,
    writeStoredSoundPreference,
  } = loadSoundPreferenceModule();
  const values = new Map();
  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };

  assert.equal(readStoredSoundPreference(storage), null);

  writeStoredSoundPreference("disabled", storage);

  assert.equal(
    values.get(SOUND_PREFERENCE_STORAGE_KEY),
    "disabled",
  );
  assert.equal(readStoredSoundPreference(storage), "disabled");
});

test("parseSoundVolume accepts stored volume values between 0 and 1", () => {
  const { parseSoundVolume } = loadSoundPreferenceModule();

  assert.equal(parseSoundVolume("0"), 0);
  assert.equal(parseSoundVolume("0.35"), 0.35);
  assert.equal(parseSoundVolume("1"), 1);
  assert.equal(parseSoundVolume("-0.1"), null);
  assert.equal(parseSoundVolume("1.1"), null);
  assert.equal(parseSoundVolume("loud"), null);
  assert.equal(parseSoundVolume(null), null);
});

test("stored sound volume falls back to the default and clamps writes", () => {
  const {
    DEFAULT_SOUND_VOLUME,
    SOUND_VOLUME_STORAGE_KEY,
    readStoredSoundVolume,
    writeStoredSoundVolume,
  } = loadSoundPreferenceModule();
  const values = new Map();
  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };

  assert.equal(readStoredSoundVolume(storage), DEFAULT_SOUND_VOLUME);

  writeStoredSoundVolume(0.42, storage);

  assert.equal(values.get(SOUND_VOLUME_STORAGE_KEY), "0.42");
  assert.equal(readStoredSoundVolume(storage), 0.42);

  writeStoredSoundVolume(2, storage);

  assert.equal(values.get(SOUND_VOLUME_STORAGE_KEY), "1");
  assert.equal(readStoredSoundVolume(storage), 1);
});

test("stepSoundVolume adjusts volume in 5 percent increments", () => {
  const { stepSoundVolume } = loadSoundPreferenceModule();

  assert.equal(stepSoundVolume(0.6, -1), 0.55);
  assert.equal(stepSoundVolume(0.6, 1), 0.65);
  assert.equal(stepSoundVolume(0.05, -1), 0);
  assert.equal(stepSoundVolume(0.95, 1), 1);
});
