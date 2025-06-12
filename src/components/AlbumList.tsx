'use client'

import { useRouter } from 'next/navigation'
import { useAlbums } from '@/lib/hooks/useAlbums'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Users } from 'lucide-react'
import AlbumCard from '@/components/AlbumCard'

export default function AlbumList() {
  const { albums, isLoading, error } = useAlbums()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <div className='h-6 bg-gray-200 rounded w-1/3' />
              <div className='h-4 bg-gray-200 rounded w-1/2' />
            </CardHeader>
            <CardContent>
              <div className='h-4 bg-gray-200 rounded w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className='text-center py-8'>
        <CardContent>
          <p className='text-red-600'>Error loading albums: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!albums || albums.length === 0) {
    return (
      <Card className='text-center py-12'>
        <CardContent>
          <div className='space-y-4'>
            <Users className='w-12 h-12 text-gray-400 mx-auto' />
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                No albums yet
              </h3>
              <p className='text-gray-600 mt-1'>
                Create your first album to start sharing memories with family
                and friends.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Albums grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            actions={{
              onSettings: () => router.push(`/albums/${album.id}/settings`),
            }}
          />
        ))}
      </div>
    </div>
  )
}
