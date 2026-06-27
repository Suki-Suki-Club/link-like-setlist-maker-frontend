"use client";

import { useSyncExternalStore } from "react";
import {
  getInitialSoundPreferenceSnapshot,
  readSoundPreferenceSnapshot,
  subscribeToSoundPreferenceChanges,
} from "../sound-preference";

export function useSoundPreferenceSnapshot() {
  return useSyncExternalStore(
    subscribeToSoundPreferenceChanges,
    readSoundPreferenceSnapshot,
    getInitialSoundPreferenceSnapshot,
  );
}
