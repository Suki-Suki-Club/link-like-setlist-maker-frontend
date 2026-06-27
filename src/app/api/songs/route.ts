import { NextResponse } from "next/server";
import { backendApiBaseUrl, createBackendHeaders } from "../backend";

type BackendSong = {
  id: string;
  title: string;
  titleJa: string | null;
  unitId: string;
  sortOrder: number;
  releaseDate: string | null;
  unit: {
    id: string;
    name: string;
    sortOrder: number;
  };
};

type BackendSongsResponse = {
  songs: BackendSong[];
};

export async function GET() {
  try {
    const response = await fetch(`${backendApiBaseUrl}/api/songs`, {
      cache: "no-store",
      headers: createBackendHeaders(),
    });

    const body = (await response.json()) as BackendSongsResponse | unknown;

    if (!response.ok) {
      return NextResponse.json(body, { status: response.status });
    }

    const songs = (body as BackendSongsResponse).songs.map((song) => ({
      id: song.id,
      releaseDate: song.releaseDate,
      series: "蓮ノ空" as const,
      sortOrder: song.sortOrder,
      tags: [],
      title: song.titleJa?.trim() || song.title,
      titleJa: song.titleJa,
      unit: song.unit.name,
      unitId: song.unitId,
    }));

    return NextResponse.json({ songs }, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "Songs backend is unavailable",
      },
      { status: 503 },
    );
  }
}
