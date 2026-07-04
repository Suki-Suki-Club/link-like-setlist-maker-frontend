import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { SetlistMaker } from '@/features/setlist/components/SetlistMaker'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry)
      }
      continue
    }

    if (typeof value === 'string') {
      params.set(key, value)
    }
  }

  const hasLegacySetlistQuery = [
    'songs',
    'encoreAfters',
    'encoreAfter',
    'eventId',
    'eventName',
    'shared',
  ].some((key) => params.has(key))

  if (hasLegacySetlistQuery) {
    redirect('/home')
  }

  const startFresh = params.get('fresh') === '1'

  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center text-zinc-600">
          読み込み中
        </main>
      }
    >
      <SetlistMaker startFresh={startFresh} />
    </Suspense>
  )
}
