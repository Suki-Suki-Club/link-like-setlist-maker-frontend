import { NextResponse } from "next/server";
import { matchEdgeCache, putEdgeCache } from "../../edge-cache";
import { fetchSongMedia } from "../shared";

const songMediaCacheTtlSeconds = 60 * 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ songId: string }> },
) {
  const { songId } = await params;
  const cachedResponse = await matchEdgeCache(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetchSongMedia(songId);
    const body = (await response.json()) as unknown;

    const nextResponse = NextResponse.json(body, {
      headers: response.ok
        ? { "cache-control": `public, max-age=${songMediaCacheTtlSeconds}` }
        : undefined,
      status: response.status,
    });

    if (response.ok) {
      await putEdgeCache(request, nextResponse);
    }

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "Song media backend is unavailable",
      },
      { status: 503 },
    );
  }
}
