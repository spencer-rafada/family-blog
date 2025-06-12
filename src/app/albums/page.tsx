'use client'

import { useRouter } from 'next/navigation'
import AlbumList from '@/components/AlbumList'
import CreateAlbumForm from '@/components/CreateAlbumForm'

export default function AlbumsPage() {
  const router = useRouter()

  const handleAlbumCreated = (albumId: string) => {
    router.push(`/albums/${albumId}`)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Albums</h1>
        <CreateAlbumForm onSuccess={handleAlbumCreated} />
      </div>
      
      <AlbumList />
    </div>
  )
}