import { NextResponse } from "next/server";
import { backendApiBaseUrl, createBackendHeaders } from "../backend";
import { toFrontendSong, type BackendSong } from "../series";

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

    const songs = (body as BackendSongsResponse).songs.map(toFrontendSong);

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
