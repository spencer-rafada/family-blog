'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAlbums } from '@/lib/hooks/useAlbums'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Settings, 
  Plus, 
  Calendar,
  Lock,
  Globe
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { AlbumRole } from '@/types'

interface AlbumListProps {
  onCreateAlbum?: () => void
}

export default function AlbumList({ onCreateAlbum }: AlbumListProps) {
  const { albums, isLoading, error } = useAlbums()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-red-600">Error loading albums: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!albums || albums.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="space-y-4">
            <Users className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No albums yet</h3>
              <p className="text-gray-600 mt-1">
                Create your first album to start sharing memories with family and friends.
              </p>
            </div>
            {onCreateAlbum && (
              <Button onClick={onCreateAlbum} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Album
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Albums</h2>
        {onCreateAlbum && (
          <Button onClick={onCreateAlbum}>
            <Plus className="w-4 h-4 mr-2" />
            New Album
          </Button>
        )}
      </div>

      {/* Albums grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {albums.map((album) => {
          return (
            <Card 
              key={album.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/albums/${album.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {album.is_default ? (
                        <Globe className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                      {album.name}
                    </CardTitle>
                    {album.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {album.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/albums/${album.id}/settings`)
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Members preview */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {album.member_count} {album.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>

                {/* Member avatars */}
                {album.members && album.members.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="flex -space-x-2">
                      {album.members.slice(0, 4).map((member) => (
                        <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                          <AvatarImage src={member.user?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.user?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {album.members.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                          <span className="text-xs text-gray-600">
                            +{album.members.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Album stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Created {formatDistanceToNow(new Date(album.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {album.post_count !== undefined && (
                    <span>{album.post_count} posts</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}