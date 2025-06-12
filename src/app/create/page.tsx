import { Suspense } from 'react'
import CreatePostForm from '@/components/CreatePostForm'

interface CreatePageProps {
  searchParams: Promise<{ album?: string }>
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams
  const preselectedAlbumId = params.album

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePostForm preselectedAlbumId={preselectedAlbumId} />
    </Suspense>
  )
}