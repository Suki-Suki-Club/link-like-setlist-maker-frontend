import { NextResponse } from 'next/server'
import { backendApiBaseUrl, createBackendHeaders } from '../../backend'

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
        headers: createBackendHeaders(),
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
