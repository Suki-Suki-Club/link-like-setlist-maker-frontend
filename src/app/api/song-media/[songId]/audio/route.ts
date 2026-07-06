import { fetchSongMedia, fetchWithRetry, type SongMediaResponse } from "../../shared";

type CloudflareFetchInit = RequestInit & {
  cf?: {
    cacheEverything?: boolean;
    cacheTtl?: number;
  };
};

const audioCacheTtlSeconds = 7 * 24 * 60 * 60;

function pickHeader(headers: Headers, name: string) {
  const value = headers.get(name);
  return value === null ? undefined : value;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ songId: string }> },
) {
  const { songId } = await params;

  try {
    const mediaResponse = await fetchSongMedia(songId);
    const mediaPayload = (await mediaResponse.json()) as SongMediaResponse;
    const previewUrl = mediaPayload.media?.previewUrl;

    if (
      !mediaResponse.ok ||
      mediaPayload.status !== "available" ||
      !previewUrl
    ) {
      return Response.json(
        {
          code: "MEDIA_NOT_AVAILABLE",
          message: "Preview audio is unavailable",
        },
        { status: mediaResponse.ok ? 404 : mediaResponse.status },
      );
    }

    const audioRequestInit: CloudflareFetchInit = {
      headers: {
        ...(pickHeader(request.headers, "range")
          ? { range: pickHeader(request.headers, "range")! }
          : {}),
      },
      cf: {
        cacheEverything: true,
        cacheTtl: audioCacheTtlSeconds,
      },
    };
    const upstreamResponse = await fetchWithRetry(previewUrl, audioRequestInit);

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return Response.json(
        {
          code: "AUDIO_PROXY_FAILED",
          message: "Failed to proxy preview audio",
        },
        { status: 502 },
      );
    }

    const responseHeaders = new Headers({
      "accept-ranges":
        upstreamResponse.headers.get("accept-ranges") ?? "bytes",
      "cache-control": "no-store",
      "content-type":
        upstreamResponse.headers.get("content-type") ?? "audio/mpeg",
    });

    const contentLength = upstreamResponse.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("content-length", contentLength);
    }

    const contentRange = upstreamResponse.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("content-range", contentRange);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "Song media backend is unavailable",
      },
      { status: 503 },
    );
  }
}
