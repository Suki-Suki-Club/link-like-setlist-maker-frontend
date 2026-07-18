import type { LoveLiveSeries } from "@/features/setlist/types";

export type BackendUnit = {
  id: string;
  name: string;
  sortOrder: number;
  seriesId?: string;
  series?: {
    id: string;
    name: string;
    sortOrder: number;
  };
};

export type BackendSong = {
  id: string;
  title: string;
  titleJa: string | null;
  unitId: string;
  sortOrder: number;
  releaseDate: string | null;
  unit: BackendUnit;
};

const seriesIdToLoveLiveSeries: Record<string, LoveLiveSeries> = {
  muse: "μ's",
  aqours: "Aqours",
  nijigasaki: "虹ヶ咲",
  liella: "Liella!",
  hasunosora: "蓮ノ空",
};

// バックエンドが series を返さない間は従来どおり蓮ノ空として扱う
export function toLoveLiveSeries(unit: BackendUnit): LoveLiveSeries {
  const seriesId = unit.series?.id ?? unit.seriesId;

  if (!seriesId) {
    return "蓮ノ空";
  }

  return seriesIdToLoveLiveSeries[seriesId] ?? "その他";
}

export function toFrontendSong(song: BackendSong) {
  return {
    id: song.id,
    releaseDate: song.releaseDate,
    series: toLoveLiveSeries(song.unit),
    sortOrder: song.sortOrder,
    tags: [] as string[],
    title: song.titleJa?.trim() || song.title,
    titleJa: song.titleJa,
    unit: song.unit.name,
    unitId: song.unitId,
  };
}
