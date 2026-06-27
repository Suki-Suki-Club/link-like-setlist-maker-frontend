import { NextResponse } from 'next/server'
import { backendApiBaseUrl, createBackendHeaders } from '../backend'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await fetch(`${backendApiBaseUrl}/api/setlists`, {
      body: JSON.stringify(body),
      cache: 'no-store',
      headers: createBackendHeaders({
        'content-type': 'application/json',
      }),
      method: 'POST',
    })
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
