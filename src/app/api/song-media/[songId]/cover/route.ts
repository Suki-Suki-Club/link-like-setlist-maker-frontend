import { matchEdgeCache, putEdgeCache } from "../../../edge-cache";
import { fetchSongMedia, fetchWithRetry, type SongMediaResponse } from "../../shared";

type CloudflareFetchInit = RequestInit & {
  cf?: {
    cacheEverything?: boolean;
    cacheTtl?: number;
  };
};

const coverCacheTtlSeconds = 30 * 24 * 60 * 60;

function createJsonResponse(
  body: { code: string; message: string },
  status: number,
) {
  return Response.json(body, { status });
}

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
    const mediaResponse = await fetchSongMedia(songId);
    const mediaPayload = (await mediaResponse.json()) as SongMediaResponse;
    const coverUrl = mediaPayload.media?.coverUrl;

    if (
      !mediaResponse.ok ||
      mediaPayload.status !== "available" ||
      !coverUrl
    ) {
      return createJsonResponse(
        {
          code: "MEDIA_NOT_AVAILABLE",
          message: "Cover image is unavailable",
        },
        mediaResponse.ok ? 404 : mediaResponse.status,
      );
    }

    const coverRequestInit: CloudflareFetchInit = {
      cf: {
        cacheEverything: true,
        cacheTtl: coverCacheTtlSeconds,
      },
    };
    const coverResponse = await fetchWithRetry(coverUrl, coverRequestInit);

    if (!coverResponse.ok || !coverResponse.body) {
      return createJsonResponse(
        {
          code: "COVER_PROXY_FAILED",
          message: "Failed to proxy cover image",
        },
        502,
      );
    }

    const nextResponse = new Response(coverResponse.body, {
      headers: {
        "cache-control": `public, max-age=${coverCacheTtlSeconds}`,
        "content-type":
          coverResponse.headers.get("content-type") ?? "image/jpeg",
      },
      status: 200,
    });

    await putEdgeCache(request, nextResponse);

    return nextResponse;
  } catch {
    return createJsonResponse(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "Song media backend is unavailable",
      },
      503,
    );
  }
}
