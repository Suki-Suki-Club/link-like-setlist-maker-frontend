"use client";

import { useState } from "react";
import Image from "next/image";
import { GROUP_OPTIONS, GROUP_PREVIEW_SONG_IDS } from "../constants";
import { useSetlistEditor } from "../hooks/useSetlistEditor";
import { useShareSetlist } from "../hooks/useShareSetlist";
import { useSharedSetlistLoader } from "../hooks/useSharedSetlistLoader";
import { useSongPreviewController } from "../hooks/useSongPreviewController";
import { useSongsCatalog } from "../hooks/useSongsCatalog";
import type { LoveLiveSeries } from "../types";
import { isGroupSelectable } from "../utils";
import { GroupStepPanel } from "./GroupStepPanel";
import { ReviewStepPanel } from "./ReviewStepPanel";
import { SongSelectStepPanel } from "./SongSelectStepPanel";

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
  const { isSongsLoading, setSongsError, songMap, songs, songsError } =
    useSongsCatalog();
  const share = useShareSetlist();
  const editor = useSetlistEditor({
    onDirty: share.resetShareState,
    songMap,
    songs,
  });
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
    resetPreviewInteraction,
    selectedPreview,
    selectedPreviewSong,
    selectedPreviewSongId,
    stopSongHoverPreview,
  } = useSongPreviewController({
    songMap,
    songs,
  });
  const canSaveShareUrl = editor.selectedSongs.length > 0;

  useSharedSetlistLoader({
    enabled: isReadOnlyShareView,
    onError: setSongsError,
    onLoaded: editor.applySharedSetlist,
    sharedSetlistId,
    songs,
  });

  async function playGroupPreview(group: LoveLiveSeries) {
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

      {currentStep === "group" ? (
        <GroupStepPanel
          canConfirmGroupSelection={editor.canConfirmGroupSelection}
          groupOptions={GROUP_OPTIONS}
          onConfirm={confirmGroupSelection}
          onGroupSelect={handleGroupSelect}
          pendingGroup={editor.pendingGroup}
        />
      ) : null}

      <audio ref={audioRef} className="hidden" preload="none" loop />

      {currentStep === "songs" ? (
        <SongSelectStepPanel
          activeSlotIndex={editor.activeSlotIndex}
          errorMessage={songsError}
          filteredSongs={editor.filteredSongs}
          isPreviewConfirmOpen={isPreviewConfirmOpen}
          isSelectedPreviewLoading={isSelectedPreviewLoading}
          isSongPickerOpen={editor.isSongPickerOpen}
          isSongsLoading={isSongsLoading}
          keyword={editor.keyword}
          onBackToGroup={openGroupSelection}
          onBeginSongConfirm={beginSongPreviewConfirm}
          onClearEncore={editor.clearEncore}
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
          onPlaceEncore={editor.placeEncoreAfter}
          onRemoveSong={editor.removeSong}
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
        />
      ) : null}

      {currentStep === "review" ? (
        <ReviewStepPanel
          canSaveShareUrl={canSaveShareUrl}
          hasIssuedShareUrl={share.hasIssuedShareUrl}
          onBackToSongs={() => setCurrentStep("songs")}
          onBeginReadOnlyPreview={beginReadOnlySongPreview}
          onCopyShareUrl={share.copyIssuedShareUrl}
          onOpenPreview={openSongPreviewConfirm}
          onSaveShareUrl={() => void share.saveShareUrl(editor.prediction)}
          readOnly={isReadOnlyShareView}
          selectedGroup={editor.selectedGroup}
          selectedSongs={editor.selectedSongs}
          shareStatus={share.shareStatus}
          shareUrl={share.shareUrl}
          visibleEncoreAfters={editor.visibleEncoreAfters}
        />
      ) : null}
    </main>
  );
}
