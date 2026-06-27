export const SOUND_PREFERENCE_STORAGE_KEY =
  "link-like-setlist-maker:sound-preference";
export const SOUND_VOLUME_STORAGE_KEY =
  "link-like-setlist-maker:sound-volume";
export const DEFAULT_SOUND_VOLUME = 0.1;
export const SOUND_VOLUME_STEP = 0.05;

export type SoundPreference = "enabled" | "disabled";
export type SoundPreferenceSnapshot = {
  isLoaded: boolean;
  preference: SoundPreference | null;
  volume: number;
};

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;
type SoundPreferenceListener = () => void;

const initialSoundPreferenceSnapshot = {
  isLoaded: false,
  preference: null,
  volume: DEFAULT_SOUND_VOLUME,
} satisfies SoundPreferenceSnapshot;
const soundPreferenceListeners = new Set<SoundPreferenceListener>();

let hasFallbackSoundPreference = false;
let fallbackSoundPreference: SoundPreference | null = null;
let hasFallbackSoundVolume = false;
let fallbackSoundVolume = DEFAULT_SOUND_VOLUME;
let cachedLoadedSnapshot: SoundPreferenceSnapshot | null = null;

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function parseSoundPreference(
  value: string | null,
): SoundPreference | null {
  return value === "enabled" || value === "disabled" ? value : null;
}

export function clampSoundVolume(volume: number) {
  if (!Number.isFinite(volume)) {
    return DEFAULT_SOUND_VOLUME;
  }

  return Math.min(1, Math.max(0, volume));
}

export function stepSoundVolume(volume: number, direction: -1 | 1) {
  return clampSoundVolume(
    Number((volume + direction * SOUND_VOLUME_STEP).toFixed(2)),
  );
}

export function parseSoundVolume(value: string | null) {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsedVolume = Number(value);

  if (!Number.isFinite(parsedVolume) || parsedVolume < 0 || parsedVolume > 1) {
    return null;
  }

  return parsedVolume;
}

export function shouldShowSoundPreferencePrompt(
  preference: SoundPreference | null,
) {
  return preference === null;
}

export function isSoundEnabled(preference: SoundPreference | null) {
  return preference === "enabled";
}

function getFallbackSoundPreference() {
  return hasFallbackSoundPreference ? fallbackSoundPreference : null;
}

function getFallbackSoundVolume() {
  return hasFallbackSoundVolume ? fallbackSoundVolume : DEFAULT_SOUND_VOLUME;
}

export function readStoredSoundPreference(
  storage: ReadableStorage | null = getBrowserStorage(),
) {
  if (!storage) {
    return getFallbackSoundPreference();
  }

  try {
    const preference = parseSoundPreference(
      storage.getItem(SOUND_PREFERENCE_STORAGE_KEY),
    );
    return preference ?? getFallbackSoundPreference();
  } catch {
    return getFallbackSoundPreference();
  }
}

export function readStoredSoundVolume(
  storage: ReadableStorage | null = getBrowserStorage(),
) {
  if (!storage) {
    return getFallbackSoundVolume();
  }

  try {
    return (
      parseSoundVolume(storage.getItem(SOUND_VOLUME_STORAGE_KEY)) ??
      getFallbackSoundVolume()
    );
  } catch {
    return getFallbackSoundVolume();
  }
}

export function writeStoredSoundPreference(
  preference: SoundPreference,
  storage: WritableStorage | null = getBrowserStorage(),
) {
  hasFallbackSoundPreference = true;
  fallbackSoundPreference = preference;

  if (!storage) {
    notifySoundPreferenceListeners();
    return;
  }

  try {
    storage.setItem(SOUND_PREFERENCE_STORAGE_KEY, preference);
  } catch {
    // Browsers can reject localStorage in private or restricted contexts.
  }

  notifySoundPreferenceListeners();
}

export function writeStoredSoundVolume(
  volume: number,
  storage: WritableStorage | null = getBrowserStorage(),
) {
  const normalizedVolume = clampSoundVolume(volume);

  hasFallbackSoundVolume = true;
  fallbackSoundVolume = normalizedVolume;

  if (!storage) {
    notifySoundPreferenceListeners();
    return;
  }

  try {
    storage.setItem(SOUND_VOLUME_STORAGE_KEY, String(normalizedVolume));
  } catch {
    // Browsers can reject localStorage in private or restricted contexts.
  }

  notifySoundPreferenceListeners();
}

function notifySoundPreferenceListeners() {
  for (const listener of soundPreferenceListeners) {
    listener();
  }
}

export function getInitialSoundPreferenceSnapshot() {
  return initialSoundPreferenceSnapshot;
}

export function readSoundPreferenceSnapshot() {
  const preference = readStoredSoundPreference();
  const volume = readStoredSoundVolume();

  if (
    cachedLoadedSnapshot?.preference === preference &&
    cachedLoadedSnapshot.volume === volume
  ) {
    return cachedLoadedSnapshot;
  }

  cachedLoadedSnapshot = {
    isLoaded: true,
    preference,
    volume,
  };

  return cachedLoadedSnapshot;
}

export function subscribeToSoundPreferenceChanges(
  listener: SoundPreferenceListener,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (
      event.key === null ||
      event.key === SOUND_PREFERENCE_STORAGE_KEY ||
      event.key === SOUND_VOLUME_STORAGE_KEY
    ) {
      listener();
    }
  }

  soundPreferenceListeners.add(listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    soundPreferenceListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}
