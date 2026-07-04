"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { GROUP_OPTIONS, GROUP_PREVIEW_SONG_IDS } from "../constants";
import {
  useSetlistEditor,
  type SetlistSlotAction,
} from "../hooks/useSetlistEditor";
import {
  DEFAULT_SETLIST_TITLE,
  useShareSetlist,
} from "../hooks/useShareSetlist";
import { useSharedSetlistLoader } from "../hooks/useSharedSetlistLoader";
import { useSoundPreferenceSnapshot } from "../hooks/useSoundPreferenceSnapshot";
import { useSongPreviewController } from "../hooks/useSongPreviewController";
import { useSongsCatalog } from "../hooks/useSongsCatalog";
import { createSetlistImageFilename } from "../setlist-image";
import {
  isSoundEnabled,
  shouldShowSoundPreferencePrompt,
  writeStoredSoundPreference,
  writeStoredSoundVolume,
  type SoundPreference,
} from "../sound-preference";
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
  startFresh = false,
}: {
  readOnlyShareView?: boolean;
  sharedSetlistId?: string;
  startFresh?: boolean;
}) {
  const isReadOnlyShareView = readOnlyShareView;
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    isReadOnlyShareView ? "review" : "group",
  );
  const [setlistTitle, setSetlistTitle] = useState(DEFAULT_SETLIST_TITLE);
  const [imageSaveStatus, setImageSaveStatus] = useState("");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const imageCaptureRef = useRef<HTMLDivElement | null>(null);
  const soundPreferenceSnapshot = useSoundPreferenceSnapshot();
  const {
    bootstrapPreviewBySongId,
    isSongsLoading,
    loadSongsCatalog,
    setSongsError,
    songMap,
    songs,
    songsError,
  } = useSongsCatalog({ autoLoad: isReadOnlyShareView });
  const share = useShareSetlist();
  const editor = useSetlistEditor({
    enableDraftStorage: !isReadOnlyShareView,
    onDirty: share.resetShareState,
    onDraftRestored: () => setCurrentStep("songs"),
    resetStoredDraftOnLoad: startFresh,
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
    bootstrapPreviewBySongId,
    canPlaySound,
    prefetchPreviews: currentStep !== "group" || isReadOnlyShareView,
    prefetchSongIds:
      currentStep === "review" || isReadOnlyShareView
        ? editor.songIds
        : undefined,
    songMap,
    soundVolume,
    songs,
  });
  const canSaveShareUrl = editor.selectedSongs.length > 0;
  const isSoundPreferencePromptOpen =
    soundPreferenceSnapshot.isLoaded &&
    shouldShowSoundPreferencePrompt(soundPreferenceSnapshot.preference);
  const isCatalogBlocking =
    isSongsLoading ||
    (isReadOnlyShareView && Boolean(songsError && songs.length === 0));

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
    setImageSaveStatus("");
    share.resetShareState();
  }

  async function saveSetlistImage() {
    if (
      isSavingImage ||
      editor.selectedSongs.length === 0 ||
      !imageCaptureRef.current
    ) {
      return;
    }

    setIsSavingImage(true);
    setImageSaveStatus("画像を作成中...");

    try {
      const { toPng } = await import("html-to-image");

      await document.fonts?.ready;

      const dataUrl = await toPng(imageCaptureRef.current, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = createSetlistImageFilename();
      link.href = dataUrl;
      link.click();
      setImageSaveStatus("画像を保存しました");
    } catch (error) {
      console.error(error);
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

  async function confirmGroupSelection() {
    const group = editor.pendingGroup;

    if (!group) {
      return;
    }

    clearPreviewSelection();
    const didLoadSongs = await loadSongsCatalog(group);

    if (!didLoadSongs) {
      return;
    }

    editor.chooseGroup(group);
    setCurrentStep("songs");
  }

  function openGroupSelection() {
    editor.openGroupSelection();
    clearPreviewSelection();
    setCurrentStep("group");
  }

  function openSongPicker(
    slotIndex: number,
    action?: SetlistSlotAction,
  ) {
    clearPreviewSelection();
    editor.openSongPicker(slotIndex, action);
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

      {isCatalogBlocking ? (
        <section className="flex min-h-[320px] w-full flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm font-black tracking-[0.35em] text-rose-600">
            LOADING
          </p>
          <p className="text-2xl font-black text-zinc-950">
            {isSongsLoading ? "楽曲情報を取得中" : songsError}
          </p>
          {isSongsLoading ? (
            <p className="text-sm font-bold text-zinc-500">
              初回ロード時は時間がかかる場合があります
            </p>
          ) : null}
        </section>
      ) : null}

      {!isCatalogBlocking && currentStep === "group" ? (
        <>
          <GroupStepPanel
            canConfirmGroupSelection={editor.canConfirmGroupSelection}
            groupOptions={GROUP_OPTIONS}
            onConfirm={() => void confirmGroupSelection()}
            onGroupSelect={handleGroupSelect}
            pendingGroup={editor.pendingGroup}
          />
          {songsError ? (
            <p className="mt-4 text-center text-sm font-bold text-rose-600">
              {songsError}
            </p>
          ) : null}
        </>
      ) : null}

      {!isCatalogBlocking && currentStep === "songs" ? (
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

      {!isCatalogBlocking && currentStep === "review" ? (
        <ReviewStepPanel
          canSaveShareUrl={canSaveShareUrl}
          coverUrlBySongId={Object.fromEntries(
            Object.entries(previewBySongId).map(([songId, preview]) => [
              songId,
              preview.coverUrl,
            ]),
          )}
          hasIssuedShareUrl={share.hasIssuedShareUrl}
          imageCaptureRef={imageCaptureRef}
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
