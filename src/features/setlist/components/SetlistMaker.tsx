"use client";

import { useState } from "react";
import Image from "next/image";
import { GROUP_OPTIONS, GROUP_PREVIEW_SONG_IDS } from "../constants";
import { useSetlistEditor } from "../hooks/useSetlistEditor";
import {
  DEFAULT_SETLIST_TITLE,
  useShareSetlist,
} from "../hooks/useShareSetlist";
import { useSharedSetlistLoader } from "../hooks/useSharedSetlistLoader";
import { useSoundPreferenceSnapshot } from "../hooks/useSoundPreferenceSnapshot";
import { useSongPreviewController } from "../hooks/useSongPreviewController";
import { useSongsCatalog } from "../hooks/useSongsCatalog";
import {
  isSoundEnabled,
  shouldShowSoundPreferencePrompt,
  writeStoredSoundPreference,
  writeStoredSoundVolume,
  type SoundPreference,
} from "../sound-preference";
import { downloadSetlistImage } from "../setlist-image";
import type { LoveLiveSeries } from "../types";
import { isGroupSelectable } from "../utils";
import { GroupStepPanel } from "./GroupStepPanel";
import { ReviewStepPanel } from "./ReviewStepPanel";
import { SongSelectStepPanel } from "./SongSelectStepPanel";
import { SoundPreferencePrompt } from "./SoundPreferencePrompt";
import { SoundVolumeControl } from "./SoundVolumeControl";

type WizardStep = "group" | "songs" | "review";

export function SetlistMaker({
  readOnlyShareView = false,
  sharedSetlistId,
}: {
  readOnlyShareView?: boolean;
  sharedSetlistId?: string;
}) {
  const isReadOnlyShareView = readOnlyShareView;
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    isReadOnlyShareView ? "review" : "group",
  );
  const [imageSaveStatus, setImageSaveStatus] = useState("");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [setlistTitle, setSetlistTitle] = useState(DEFAULT_SETLIST_TITLE);
  const soundPreferenceSnapshot = useSoundPreferenceSnapshot();
  const { isSongsLoading, setSongsError, songMap, songs, songsError } =
    useSongsCatalog();
  const share = useShareSetlist();
  const editor = useSetlistEditor({
    enableDraftStorage: !isReadOnlyShareView,
    onDirty: share.resetShareState,
    onDraftRestored: () => setCurrentStep("songs"),
    songMap,
    songs,
  });
  const canPlaySound = isSoundEnabled(soundPreferenceSnapshot.preference);
  const soundVolume = soundPreferenceSnapshot.volume;
  const {
    audioRef,
    beginReadOnlySongPreview,
    beginSongPreviewConfirm,
    clearPreviewSelection,
    closeSongPreviewConfirm,
    isPreviewConfirmOpen,
    isSelectedPreviewLoading,
    openSongPreviewConfirm,
    playSongPreviewAudio,
    playSongHoverPreview,
    previewBySongId,
    resetPreviewInteraction,
    selectedPreview,
    selectedPreviewSong,
    selectedPreviewSongId,
    stopSongHoverPreview,
  } = useSongPreviewController({
    canPlaySound,
    prefetchPreviews: currentStep === "songs" || isReadOnlyShareView,
    prefetchSongIds: isReadOnlyShareView ? editor.songIds : undefined,
    songMap,
    soundVolume,
    songs,
  });
  const canSaveShareUrl = editor.selectedSongs.length > 0;
  const isSoundPreferencePromptOpen =
    soundPreferenceSnapshot.isLoaded &&
    shouldShowSoundPreferencePrompt(soundPreferenceSnapshot.preference);

  useSharedSetlistLoader({
    enabled: isReadOnlyShareView,
    onError: setSongsError,
    onLoaded: editor.applySharedSetlist,
    onTitleLoaded: setSetlistTitle,
    sharedSetlistId,
    songs,
  });

  function chooseSoundPreference(preference: SoundPreference) {
    writeStoredSoundPreference(preference);

    if (!isSoundEnabled(preference)) {
      resetPreviewInteraction();
    }
  }

  function changeSoundVolume(volume: number) {
    writeStoredSoundVolume(volume);
  }

  function changeSetlistTitle(value: string) {
    setSetlistTitle(value);
    share.resetShareState();
    setImageSaveStatus("");
  }

  async function saveSetlistImage() {
    if (editor.selectedSongs.length === 0 || isSavingImage) {
      return;
    }

    setIsSavingImage(true);
    setImageSaveStatus("画像を作成中...");

    try {
      await downloadSetlistImage({
        selectedGroup: editor.selectedGroup,
        setlistTitle,
        songs: editor.selectedSongs,
        visibleSetlistBreaks: editor.visibleSetlistBreaks,
      });
      setImageSaveStatus("画像を保存しました");
    } catch {
      setImageSaveStatus("画像を保存できませんでした");
    } finally {
      setIsSavingImage(false);
    }
  }

  async function playGroupPreview(group: LoveLiveSeries) {
    if (!canPlaySound) {
      return;
    }

    const songId = GROUP_PREVIEW_SONG_IDS[group];

    if (!songId) {
      return;
    }

    try {
      await playSongPreviewAudio(songId, { loop: true });
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        return;
      }
    }
  }

  function handleGroupSelect(group: LoveLiveSeries) {
    if (!isGroupSelectable(group)) {
      return;
    }

    editor.setPendingGroup(group);
    void playGroupPreview(group);
  }

  function confirmGroupSelection() {
    if (!editor.pendingGroup) {
      return;
    }

    editor.chooseGroup(editor.pendingGroup);
    clearPreviewSelection();
    setCurrentStep("songs");
  }

  function openGroupSelection() {
    editor.openGroupSelection();
    clearPreviewSelection();
    setCurrentStep("group");
  }

  function openSongPicker(slotIndex: number) {
    clearPreviewSelection();
    editor.openSongPicker(slotIndex);
  }

  function closeSongPicker() {
    resetPreviewInteraction();
    editor.closeSongPicker();
  }

  function confirmSelectedPreviewSong() {
    if (!selectedPreviewSongId) {
      return;
    }

    editor.assignSongToSlot(selectedPreviewSongId);
    resetPreviewInteraction();
  }

  function clearSetlist() {
    editor.clearSetlist();
    resetPreviewInteraction();
  }

  return (
    <main
      className={
        currentStep === "group"
          ? "mx-auto flex min-h-svh w-full max-w-5xl flex-col items-center justify-center px-4 py-8 text-center text-zinc-700 sm:px-6 lg:px-8"
          : "mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-5 px-4 py-5 text-left text-zinc-700 sm:px-6 lg:px-8"
      }
    >
      <header
        className={
          currentStep === "group" ? "w-full" : "border-b border-zinc-200 pb-5"
        }
      >
        <h1 className="flex justify-center">
          <Image
            src="/images/title.png"
            alt="LINK! LIKE! SETLIST MAKER!"
            width={1916}
            height={821}
            className="h-auto w-full max-w-[420px] sm:max-w-[520px]"
          />
        </h1>
      </header>

      <audio ref={audioRef} className="hidden" preload="none" loop />

      <SoundPreferencePrompt
        isOpen={isSoundPreferencePromptOpen}
        onDisableSound={() => chooseSoundPreference("disabled")}
        onEnableSound={() => chooseSoundPreference("enabled")}
      />

      <SoundVolumeControl
        isVisible={
          soundPreferenceSnapshot.isLoaded &&
          canPlaySound &&
          !isSoundPreferencePromptOpen
        }
        onVolumeChange={changeSoundVolume}
        volume={soundVolume}
      />

      {currentStep === "group" ? (
        <GroupStepPanel
          canConfirmGroupSelection={editor.canConfirmGroupSelection}
          groupOptions={GROUP_OPTIONS}
          onConfirm={confirmGroupSelection}
          onGroupSelect={handleGroupSelect}
          pendingGroup={editor.pendingGroup}
        />
      ) : null}

      {currentStep === "songs" ? (
        <SongSelectStepPanel
          activeSlotIndex={editor.activeSlotIndex}
          coverUrlBySongId={Object.fromEntries(
            Object.entries(previewBySongId).map(([songId, preview]) => [
              songId,
              preview.coverUrl,
            ]),
          )}
          errorMessage={songsError}
          filteredSongs={editor.filteredSongs}
          isPreviewConfirmOpen={isPreviewConfirmOpen}
          isSelectedPreviewLoading={isSelectedPreviewLoading}
          isSongPickerOpen={editor.isSongPickerOpen}
          isSongsLoading={isSongsLoading}
          keyword={editor.keyword}
          onBackToGroup={openGroupSelection}
          onBeginSongConfirm={beginSongPreviewConfirm}
          onClearSetlistBreak={editor.clearSetlistBreak}
          onClearSetlist={clearSetlist}
          onCloseSongPicker={closeSongPicker}
          onCloseSongPreviewConfirm={closeSongPreviewConfirm}
          onComplete={() => setCurrentStep("review")}
          onConfirmPreviewSong={confirmSelectedPreviewSong}
          onHoverSongEnd={stopSongHoverPreview}
          onHoverSongStart={playSongHoverPreview}
          onKeywordChange={editor.setKeyword}
          onMoveSong={editor.moveSong}
          onOpenSongConfirm={openSongPreviewConfirm}
          onOpenSongPicker={openSongPicker}
          onPlaceSetlistBreak={editor.placeSetlistBreakAfter}
          onRemoveSong={editor.removeSong}
          onReorderSong={editor.reorderSong}
          onUnitChange={editor.setSelectedUnit}
          previewCoverUrl={selectedPreview?.coverUrl ?? null}
          previewSong={selectedPreviewSong}
          previewTitle={
            selectedPreview?.title ?? selectedPreviewSong?.title ?? ""
          }
          selectedGroup={editor.selectedGroup}
          selectedSongsCount={editor.selectedSongs.length}
          selectedUnit={editor.selectedUnit}
          setlistSlots={editor.setlistSlots}
          songCount={editor.songIds.length}
          unitOptions={editor.unitOptions}
          visibleEncoreAfters={editor.visibleEncoreAfters}
          visibleSetlistBreaks={editor.visibleSetlistBreaks}
        />
      ) : null}

      {currentStep === "review" ? (
        <ReviewStepPanel
          canSaveShareUrl={canSaveShareUrl}
          coverUrlBySongId={Object.fromEntries(
            Object.entries(previewBySongId).map(([songId, preview]) => [
              songId,
              preview.coverUrl,
            ]),
          )}
          hasIssuedShareUrl={share.hasIssuedShareUrl}
          imageSaveStatus={imageSaveStatus}
          isSavingImage={isSavingImage}
          onBackToSongs={() => setCurrentStep("songs")}
          onBeginReadOnlyPreview={beginReadOnlySongPreview}
          onCopyShareUrl={share.copyIssuedShareUrl}
          onOpenPreview={openSongPreviewConfirm}
          onSaveImage={() => void saveSetlistImage()}
          onSetlistTitleChange={changeSetlistTitle}
          onSaveShareUrl={() =>
            void share.saveShareUrl(editor.prediction, setlistTitle)
          }
          readOnly={isReadOnlyShareView}
          selectedGroup={editor.selectedGroup}
          selectedSongs={editor.selectedSongs}
          setlistTitle={setlistTitle}
          shareStatus={share.shareStatus}
          shareUrl={share.shareUrl}
          visibleSetlistBreaks={editor.visibleSetlistBreaks}
        />
      ) : null}
    </main>
  );
}
