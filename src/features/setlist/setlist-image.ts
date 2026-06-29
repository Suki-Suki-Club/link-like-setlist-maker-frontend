"use client";

import type { LoveLiveSeries, SetlistBreak, Song } from "./types";
import { getSetlistBreakLabel } from "./utils";

export const SETLIST_IMAGE_WIDTH = 1080;

const cardPadding = 72;
const headerHeight = 220;
const footerHeight = 92;
const songRowHeight = 152;
const breakRowHeight = 76;
export const SETLIST_IMAGE_COVER_SIZE = 96;
const coverSize = SETLIST_IMAGE_COVER_SIZE;

type SetlistImageSongItem = {
  cover: { kind: "image"; url: string } | { kind: "placeholder" };
  kind: "song";
  metaLabel: string;
  order: number;
  title: string;
  unitLabel: string;
};

type SetlistImageBreakItem = {
  kind: "break";
  label: string;
  type: SetlistBreak["type"];
};

export type SetlistImageItem = SetlistImageSongItem | SetlistImageBreakItem;

export type SetlistImageModel = {
  filename: string;
  groupLabel: string;
  height: number;
  items: SetlistImageItem[];
  songCount: number;
  title: string;
  width: number;
};

type CreateSetlistImageModelInput = {
  coverUrlBySongId: Record<string, string | null>;
  createdAt?: Date;
  selectedGroup: LoveLiveSeries | null;
  setlistTitle: string;
  songs: Song[];
  visibleSetlistBreaks: SetlistBreak[];
};

type DownloadSetlistImageInput = Omit<
  CreateSetlistImageModelInput,
  "coverUrlBySongId"
> & {
  coverUrlBySongId?: Record<string, string | null>;
};

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

export function createSetlistImageFilename(createdAt = new Date()) {
  const year = createdAt.getFullYear();
  const month = padNumber(createdAt.getMonth() + 1);
  const day = padNumber(createdAt.getDate());
  const hour = padNumber(createdAt.getHours());
  const minute = padNumber(createdAt.getMinutes());

  return `setlist-${year}${month}${day}-${hour}${minute}.png`;
}

export function createSetlistCoverProxyUrl(songId: string) {
  return `/api/song-previews/${encodeURIComponent(songId)}/cover`;
}

export function createSetlistImageModel({
  coverUrlBySongId,
  createdAt = new Date(),
  selectedGroup,
  setlistTitle,
  songs,
  visibleSetlistBreaks,
}: CreateSetlistImageModelInput): SetlistImageModel {
  const items: SetlistImageItem[] = [];

  songs.forEach((song, index) => {
    const coverUrl = coverUrlBySongId[song.id];

    items.push({
      cover: coverUrl ? { kind: "image", url: coverUrl } : { kind: "placeholder" },
      kind: "song",
      metaLabel: `${song.series} / ${song.unit}`,
      order: index + 1,
      title: song.title,
      unitLabel: song.unit ?? song.series,
    });

    const breakItem = visibleSetlistBreaks.find(
      (visibleBreak) => visibleBreak.after === index,
    );

    if (breakItem && index < songs.length - 1) {
      items.push({
        kind: "break",
        label: getSetlistBreakLabel(breakItem, visibleSetlistBreaks),
        type: breakItem.type,
      });
    }
  });

  const contentHeight = items.reduce(
    (total, item) =>
      total + (item.kind === "song" ? songRowHeight : breakRowHeight),
    0,
  );

  return {
    filename: createSetlistImageFilename(createdAt),
    groupLabel: selectedGroup ?? "-",
    height: cardPadding * 2 + headerHeight + contentHeight + footerHeight,
    items,
    songCount: songs.length,
    title: setlistTitle.trim() || "My Select Setlist",
    width: SETLIST_IMAGE_WIDTH,
  };
}

export function wrapCanvasText(
  text: string,
  maxWidth: number,
  measureText: (value: string) => number,
  maxLines: number,
) {
  if (maxLines <= 0) {
    return [];
  }

  const characters = Array.from(text);
  const lines: string[] = [];
  let line = "";

  for (const character of characters) {
    const nextLine = `${line}${character}`;

    if (line && measureText(nextLine) > maxWidth) {
      lines.push(line);
      line = character;

      if (lines.length === maxLines) {
        break;
      }
    } else {
      line = nextLine;
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line);
  }

  if (lines.length === maxLines && characters.join("") !== lines.join("")) {
    const ellipsis = "...";
    let lastLine = lines[maxLines - 1];

    while (lastLine && measureText(`${lastLine}${ellipsis}`) > maxWidth) {
      lastLine = lastLine.slice(0, -1);
    }

    lines[maxLines - 1] = `${lastLine}${ellipsis}`;
  }

  return lines;
}

export function getCenteredCoverY(
  rowY: number,
  rowHeight: number,
  imageSize: number,
) {
  return rowY + (rowHeight - imageSize) / 2 + 6;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

async function loadCanvasImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function loadCoverImages(model: SetlistImageModel) {
  const entries = await Promise.all(
    model.items.map(async (item) => {
      if (item.kind !== "song" || item.cover.kind !== "image") {
        return null;
      }

      return [item.cover.url, await loadCanvasImage(item.cover.url)] as const;
    }),
  );

  return new Map(
    entries.filter(
      (entry): entry is readonly [string, HTMLImageElement | null] =>
        entry !== null,
    ),
  );
}

function drawCoverPlaceholder(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
) {
  context.fillStyle = "#111111";
  context.fillRect(x, y, coverSize, coverSize);
  context.fillStyle = "#ffffff";
  context.font = "900 42px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("ラ", x + coverSize / 2, y + coverSize / 2);
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | null | undefined,
  x: number,
  y: number,
) {
  context.save();
  context.lineWidth = 4;
  context.strokeStyle = "#111111";
  context.strokeRect(x, y, coverSize, coverSize);

  if (!image) {
    drawCoverPlaceholder(context, x, y);
    context.restore();
    return;
  }

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    x,
    y,
    coverSize,
    coverSize,
  );
  context.strokeRect(x, y, coverSize, coverSize);
  context.restore();
}

function drawBreakItem(
  context: CanvasRenderingContext2D,
  item: SetlistImageBreakItem,
  y: number,
) {
  const tone =
    item.type === "mc"
      ? "#7dd3fc"
      : item.type === "interlude"
        ? "#c4b5fd"
        : "#fcd34d";
  const labelWidth = 260;
  const centerX = SETLIST_IMAGE_WIDTH / 2;
  const lineY = y + breakRowHeight / 2;

  context.strokeStyle = "#111111";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(cardPadding, lineY);
  context.lineTo(centerX - labelWidth / 2 - 24, lineY);
  context.moveTo(centerX + labelWidth / 2 + 24, lineY);
  context.lineTo(SETLIST_IMAGE_WIDTH - cardPadding, lineY);
  context.stroke();

  context.fillStyle = tone;
  context.strokeStyle = "#111111";
  context.lineWidth = 4;
  context.fillRect(centerX - labelWidth / 2, y + 16, labelWidth, 44);
  context.strokeRect(centerX - labelWidth / 2, y + 16, labelWidth, 44);
  context.fillStyle = "#111111";
  context.font = "900 24px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(item.label, centerX, lineY);
}

function drawSongItem(
  context: CanvasRenderingContext2D,
  item: SetlistImageSongItem,
  coverImages: Map<string, HTMLImageElement | null>,
  y: number,
) {
  const rowX = cardPadding;
  const rowWidth = SETLIST_IMAGE_WIDTH - cardPadding * 2;
  const rowY = y + 12;
  const rowHeight = songRowHeight - 24;

  context.save();
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#111111";
  context.lineWidth = 4;
  context.shadowColor = "#111111";
  context.shadowBlur = 0;
  context.shadowOffsetX = 8;
  context.shadowOffsetY = 8;
  drawRoundedRect(context, rowX, rowY, rowWidth, rowHeight, 8);
  context.fill();
  context.stroke();
  context.restore();

  const numberX = rowX + 20;
  const numberY = rowY + 20;
  context.fillStyle = "#111111";
  context.fillRect(numberX, numberY, 76, 76);
  context.fillStyle = "#ffffff";
  context.font = "900 28px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(item.order).padStart(2, "0"), numberX + 38, numberY + 38);

  const coverX = numberX + 102;
  const coverY = getCenteredCoverY(rowY, rowHeight, coverSize);
  const coverImage =
    item.cover.kind === "image" ? coverImages.get(item.cover.url) : null;
  drawCoverImage(context, coverImage, coverX, coverY);

  const textX = coverX + coverSize + 28;
  const titleMaxWidth = rowX + rowWidth - textX - 24;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = "#e11d48";
  context.font = "900 18px sans-serif";
  context.fillText(item.unitLabel.toUpperCase(), textX, rowY + 38);

  context.fillStyle = "#111111";
  context.font = "900 34px sans-serif";
  const titleLines = wrapCanvasText(
    item.title,
    titleMaxWidth,
    (value) => context.measureText(value).width,
    2,
  );
  titleLines.forEach((line, index) => {
    context.fillText(line, textX, rowY + 78 + index * 38);
  });

  context.fillStyle = "#71717a";
  context.font = "700 18px sans-serif";
  context.fillText(item.metaLabel, textX, rowY + rowHeight - 20);
}

async function renderSetlistImage(model: SetlistImageModel) {
  const canvas = document.createElement("canvas");
  canvas.width = model.width;
  canvas.height = model.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable");
  }

  const coverImages = await loadCoverImages(model);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, model.width, model.height);
  context.fillStyle = "#e11d48";
  context.fillRect(0, 0, model.width, 24);
  context.fillRect(0, model.height - 24, model.width, 24);

  context.fillStyle = "#111111";
  context.font = "900 52px sans-serif";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  const titleLines = wrapCanvasText(
    model.title,
    model.width - cardPadding * 2,
    (value) => context.measureText(value).width,
    2,
  );
  titleLines.forEach((line, index) => {
    context.fillText(line, cardPadding, cardPadding + 56 + index * 58);
  });

  context.fillStyle = "#e11d48";
  context.font = "900 22px sans-serif";
  context.fillText(
    `${model.groupLabel} / ${model.songCount} SONGS`,
    cardPadding,
    cardPadding + 178,
  );

  let y = cardPadding + headerHeight;
  for (const item of model.items) {
    if (item.kind === "song") {
      drawSongItem(context, item, coverImages, y);
      y += songRowHeight;
    } else {
      drawBreakItem(context, item, y);
      y += breakRowHeight;
    }
  }

  context.fillStyle = "#71717a";
  context.font = "900 18px sans-serif";
  context.textAlign = "right";
  context.fillText(
    "LINK! LIKE! SETLIST MAKER",
    model.width - cardPadding,
    model.height - cardPadding,
  );

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create image"));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export async function downloadSetlistImage(input: DownloadSetlistImageInput) {
  const coverUrlBySongId =
    input.coverUrlBySongId ??
    Object.fromEntries(
      input.songs.map((song) => [song.id, createSetlistCoverProxyUrl(song.id)]),
    );
  const model = createSetlistImageModel({
    ...input,
    coverUrlBySongId,
    createdAt: new Date(),
  });
  const canvas = await renderSetlistImage(model);
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = model.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
