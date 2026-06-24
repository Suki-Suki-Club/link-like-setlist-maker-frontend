import { Suspense } from 'react'
import { SetlistMaker } from '@/features/setlist/components/SetlistMaker'

export default async function SharedSetlistPage({
  params,
}: {
  params: Promise<{ setlistId: string }>
}) {
  const { setlistId } = await params

  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center text-zinc-600">
          読み込み中
        </main>
      }
    >
      <SetlistMaker readOnlyShareView sharedSetlistId={setlistId} />
    </Suspense>
  )
}
