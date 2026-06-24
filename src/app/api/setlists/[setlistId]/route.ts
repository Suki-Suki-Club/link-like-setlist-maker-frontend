import { NextResponse } from 'next/server'

const backendApiBaseUrl =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
  'http://127.0.0.1:3000'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ setlistId: string }> },
) {
  const { setlistId } = await params

  try {
    const response = await fetch(
      `${backendApiBaseUrl}/api/setlists/${encodeURIComponent(setlistId)}`,
      {
        cache: 'no-store',
      },
    )
    const payload = await response.json()

    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        code: 'BACKEND_UNAVAILABLE',
        message: 'Setlist backend is unavailable',
      },
      { status: 503 },
    )
  }
}
