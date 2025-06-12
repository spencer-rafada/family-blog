'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft, 
  Settings, 
  Globe, 
  Lock, 
  Users, 
  Plus,
  Calendar,
  ImageIcon
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import AlbumPostFeed from '@/components/AlbumPostFeed'
import { fetcher } from '@/lib/fetcher'
import { Album, AlbumPrivacyLevel } from '@/types'

interface AlbumViewProps {
  albumId: string
}

export default function AlbumView({ albumId }: AlbumViewProps) {
  const router = useRouter()
  
  const { data: album, error, isLoading } = useSWR<Album>(
    `/api/albums/${albumId}`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Album not found</h2>
            <p className="text-gray-600 mb-4">
              The album you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/albums')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Albums
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push('/albums')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{album.name}</h1>
              {album.privacy_level === AlbumPrivacyLevel.PUBLIC ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </Badge>
              )}
            </div>
            {album.description && (
              <p className="text-gray-600 mb-2">{album.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{album.member_count} {album.member_count === 1 ? 'member' : 'members'}</span>
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                <span>{album.post_count || 0} posts</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDistanceToNow(new Date(album.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/create?album=${albumId}`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Post
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/albums/${albumId}/settings`}>
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Album Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Album Members</span>
              <Button size="sm" disabled>
                Invite Members
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              {album.members && album.members.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {album.members.slice(0, 8).map((member) => (
                      <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
                        <AvatarImage src={member.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {member.user?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {album.members.length > 8 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-gray-600">
                          +{album.members.length - 8}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {album.members.slice(0, 3).map(m => m.user?.full_name || 'Unknown').join(', ')}
                    {album.members.length > 3 && ` and ${album.members.length - 3} others`}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No members yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Album Posts
          </h2>
          <AlbumPostFeed albumId={albumId} />
        </div>
      </div>
    </div>
  )
}