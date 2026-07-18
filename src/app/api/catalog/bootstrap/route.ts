import { NextResponse } from "next/server";
import { backendApiBaseUrl, createBackendHeaders } from "../../backend";
import { matchEdgeCache, putEdgeCache } from "../../edge-cache";
import { toFrontendSong, type BackendSong } from "../../series";

type CloudflareFetchInit = RequestInit & {
  cf?: {
    cacheEverything?: boolean;
    cacheTtl?: number;
  };
};

const catalogBootstrapCacheTtlSeconds = 5 * 60;

type BackendCatalogBootstrapResponse = {
  mediaBySongId?: Record<
    string,
    {
      media: {
        albumTitle: string | null;
        artistName: string;
        coverUrl: string;
        deezerTrackId: number;
        duration: number | null;
        isrc: string | null;
        previewUrl: string;
        rank: number | null;
        title: string;
        trackLink: string | null;
      } | null;
      songId: string;
      status: "available" | "unavailable";
    }
  >;
  songs: BackendSong[];
};

function createJsonResponse(
  payload: unknown,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json(payload, {
    headers,
    status,
  });
}

export async function GET(request: Request) {
  const cachedResponse = await matchEdgeCache(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const requestInit: CloudflareFetchInit = {
      cf: {
        cacheEverything: true,
        cacheTtl: catalogBootstrapCacheTtlSeconds,
      },
      headers: createBackendHeaders(),
    };
    const response = await fetch(
      `${backendApiBaseUrl}/api/catalog/bootstrap`,
      requestInit,
    );
    const body = (await response.json()) as
      | BackendCatalogBootstrapResponse
      | unknown;

    if (!response.ok) {
      return createJsonResponse(body, response.status);
    }

    const payload = body as BackendCatalogBootstrapResponse;
    const nextResponse = createJsonResponse(
      {
        mediaBySongId: payload.mediaBySongId ?? {},
        songs: payload.songs.map(toFrontendSong),
      },
      200,
      { "cache-control": `public, max-age=${catalogBootstrapCacheTtlSeconds}` },
    );

    await putEdgeCache(request, nextResponse);

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "Catalog bootstrap backend is unavailable",
      },
      { status: 503 },
    );
  }
}
