import { Suspense } from 'react'
import AlbumView from '@/components/AlbumView'

interface AlbumPageProps {
  params: Promise<{ id: string }>
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<div>Loading album...</div>}>
      <AlbumView albumId={id} />
    </Suspense>
  )
}