'use client'

import { useState } from 'react'
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
  ImageIcon,
  UserPlus,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import AlbumPostFeed from '@/components/AlbumPostFeed'
import { InviteModal } from '@/components/InviteModal'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { getCurrentUserRole, getUserPermissions } from '@/lib/permissions'
import { fetcher } from '@/lib/fetcher'
import { Album, AlbumPrivacyLevel } from '@/types'

interface AlbumViewProps {
  albumId: string
}

export default function AlbumView({ albumId }: AlbumViewProps) {
  const router = useRouter()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const { user } = useCurrentUser()

  const {
    data: album,
    error,
    isLoading,
    mutate,
  } = useSWR<Album>(`/api/albums/${albumId}`, fetcher)

  // Get user permissions for this album
  const userRole = user ? getCurrentUserRole(album!, user.id) : null
  const permissions = getUserPermissions(userRole)

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='container mx-auto px-4 py-8 max-w-4xl'>
          <div className='animate-pulse space-y-6'>
            <div className='h-8 bg-gray-200 rounded w-1/3' />
            <div className='h-32 bg-gray-200 rounded' />
            <div className='h-64 bg-gray-200 rounded' />
          </div>
        </div>
      </div>
    )
  }

  if (error || !album) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='container mx-auto px-4 py-8 max-w-4xl'>
          <div className='text-center py-12'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Album not found
            </h2>
            <p className='text-gray-600 mb-4'>
              The album you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to view it.
            </p>
            <Button onClick={() => router.push('/albums')}>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Albums
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8'>
          <div className='flex items-start gap-4'>
            <Button variant='ghost' onClick={() => router.push('/albums')}>
              <ArrowLeft className='w-4 h-4' />
            </Button>
            <div className='flex-1'>
              <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2'>
                <h1 className='text-2xl sm:text-3xl font-bold'>{album.name}</h1>
                {album.privacy_level === AlbumPrivacyLevel.PUBLIC ? (
                  <Badge variant='secondary' className='flex items-center gap-1 w-fit'>
                    <Globe className='w-3 h-3' />
                    Public
                  </Badge>
                ) : (
                  <Badge variant='outline' className='flex items-center gap-1 w-fit'>
                    <Lock className='w-3 h-3' />
                    Private
                  </Badge>
                )}
              </div>
              {album.description && (
                <p className='text-gray-600 mb-2'>{album.description}</p>
              )}
              <div className='flex flex-wrap gap-4 sm:gap-6 text-sm text-gray-500'>
                <div className='flex items-center gap-1'>
                  <Users className='w-4 h-4' />
                  <span>
                    {album.member_count}{' '}
                    {album.member_count === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  <ImageIcon className='w-4 h-4' />
                  <span>{album.post_count || 0} posts</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Calendar className='w-4 h-4' />
                  <span className='hidden sm:inline'>
                    Created{' '}
                    {formatDistanceToNow(new Date(album.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  <span className='sm:hidden'>
                    {formatDistanceToNow(new Date(album.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row gap-2'>
            {permissions.canCreatePosts && (
              <Button asChild className='w-full sm:w-auto'>
                <Link href={`/create?album=${albumId}`}>
                  <Plus className='w-4 h-4 mr-2' />
                  Add Post
                </Link>
              </Button>
            )}
            {permissions.canEditAlbum && (
              <Button variant='outline' asChild className='w-full sm:w-auto'>
                <Link href={`/albums/${albumId}/settings`}>
                  <Settings className='w-4 h-4 mr-1 sm:mr-0' />
                  <span className='sm:hidden ml-1'>Settings</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Album Info Card */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <span>Album Members</span>
              {permissions.canInviteMembers && (
                <Button size='sm' onClick={() => setInviteModalOpen(true)} className='w-full sm:w-auto'>
                  <UserPlus className='w-4 h-4 mr-2' />
                  Invite Members
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-3'>
              {album.members && album.members.length > 0 ? (
                <>
                  <div className='flex -space-x-2 overflow-x-auto max-w-full'>
                    {album.members.slice(0, 8).map((member) => (
                      <Avatar
                        key={member.id}
                        className='w-8 h-8 border-2 border-white flex-shrink-0'
                      >
                        <AvatarImage
                          src={member.user?.avatar_url || undefined}
                        />
                        <AvatarFallback className='text-xs'>
                          {member.user?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {album.members.length > 8 && (
                      <div className='w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center flex-shrink-0'>
                        <span className='text-xs text-gray-600'>
                          +{album.members.length - 8}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {album.members
                      .slice(0, 3)
                      .map((m) => m.user?.full_name || 'Unknown')
                      .join(', ')}
                    {album.members.length > 3 &&
                      ` and ${album.members.length - 3} others`}
                  </div>
                </>
              ) : (
                <p className='text-gray-500'>No members yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold flex items-center gap-2'>
            <ImageIcon className='w-5 h-5' />
            Album Posts
          </h2>
          <AlbumPostFeed albumId={albumId} />
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        albumId={albumId}
        albumName={album?.name || 'Album'}
        onInviteSuccess={() => mutate()}
      />
    </div>
  )
}
