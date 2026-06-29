import { createSongPreviewCoverResponse } from "../../cover-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ songId: string }> },
) {
  const { songId } = await params;
  return createSongPreviewCoverResponse(songId);
}
