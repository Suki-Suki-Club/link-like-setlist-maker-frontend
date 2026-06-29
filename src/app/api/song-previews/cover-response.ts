import { fetchSongPreview, type SongPreviewResponse } from "./shared";

const deezerApiBaseUrl =
  process.env.DEEZER_API_BASE_URL ?? "https://api.deezer.com";

type DeezerTrackDetails = {
  album?: {
    cover_big?: string | null;
    cover_medium?: string | null;
    cover_xl?: string | null;
  } | null;
};

type CoverResponseDependencies = {
  fetch?: typeof fetch;
  fetchSongPreview?: typeof fetchSongPreview;
};

function createJsonResponse(
  body: { code: string; message: string },
  status: number,
) {
  return Response.json(body, { status });
}

function pickCoverUrl(trackDetails: DeezerTrackDetails) {
  return (
    trackDetails.album?.cover_xl ??
    trackDetails.album?.cover_big ??
    trackDetails.album?.cover_medium ??
    null
  );
}

export async function createSongPreviewCoverResponse(
  songId: string,
  dependencies: CoverResponseDependencies = {},
) {
  const fetchImpl = dependencies.fetch ?? fetch;
  const fetchSongPreviewImpl = dependencies.fetchSongPreview ?? fetchSongPreview;

  try {
    const previewResponse = await fetchSongPreviewImpl(songId, false);
    const previewPayload =
      (await previewResponse.json()) as SongPreviewResponse;
    const deezerTrackId = previewPayload.preview?.deezerTrackId;

    if (
      !previewResponse.ok ||
      previewPayload.status !== "found" ||
      typeof deezerTrackId !== "number"
    ) {
      return createJsonResponse(
        {
          code: "COVER_NOT_AVAILABLE",
          message: "Preview cover is unavailable",
        },
        previewResponse.status || 404,
      );
    }

    const deezerResponse = await fetchImpl(
      `${deezerApiBaseUrl}/track/${deezerTrackId}`,
      { cache: "no-store" },
    );

    if (!deezerResponse.ok) {
      return createJsonResponse(
        {
          code: "COVER_PROXY_FAILED",
          message: "Failed to fetch preview cover",
        },
        502,
      );
    }

    const deezerBody = (await deezerResponse.json()) as DeezerTrackDetails;
    const coverUrl = pickCoverUrl(deezerBody);

    if (!coverUrl) {
      return createJsonResponse(
        {
          code: "COVER_NOT_AVAILABLE",
          message: "Preview cover is unavailable",
        },
        404,
      );
    }

    const coverResponse = await fetchImpl(coverUrl, { cache: "no-store" });

    if (!coverResponse.ok || !coverResponse.body) {
      return createJsonResponse(
        {
          code: "COVER_PROXY_FAILED",
          message: "Failed to fetch preview cover",
        },
        502,
      );
    }

    return new Response(coverResponse.body, {
      headers: {
        "cache-control": "public, max-age=86400",
        "content-type":
          coverResponse.headers.get("content-type") ?? "image/jpeg",
      },
      status: 200,
    });
  } catch {
    return createJsonResponse(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "Preview cover backend is unavailable",
      },
      503,
    );
  }
}
