'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlbumInvite } from '@/types'
import { acceptAlbumInvite, declineAlbumInvite } from '@/lib/actions/invites'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Crown, Edit3, Eye } from 'lucide-react'

interface InviteCardProps {
  invite: AlbumInvite
  onAction: () => void
}

export function InviteCard({ invite, onAction }: InviteCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAccept = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const albumId = await acceptAlbumInvite(invite.token)
      onAction()
      router.push(`/albums/${albumId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await declineAlbumInvite(invite.token)
      onAction()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invite')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className='w-4 h-4 text-yellow-600' />
      case 'contributor':
        return <Edit3 className='w-4 h-4 text-blue-600' />
      case 'viewer':
        return <Eye className='w-4 h-4 text-gray-600' />
      default:
        return null
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Can manage the album and invite others'
      case 'contributor':
        return 'Can add posts and memories to this album'
      case 'viewer':
        return 'Can view content in this album'
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start space-x-3'>
            <Avatar className='h-10 w-10'>
              <AvatarImage
                src={invite.inviter?.avatar_url || ''}
                alt={invite.inviter?.full_name || 'Inviter'}
              />
              <AvatarFallback>
                {getInitials(invite.inviter?.full_name || 'Unknown')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className='text-lg'>{invite.album?.name}</CardTitle>
              <p className='text-sm text-gray-600 mt-1'>
                Invited by{' '}
                <strong>{invite.inviter?.full_name || 'Someone'}</strong>
              </p>
              <p className='text-xs text-gray-500 mt-1'>
                {formatDate(invite.created_at)}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            {getRoleIcon(invite.role)}
            <span className='text-sm font-medium capitalize text-gray-700'>
              {invite.role}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        {invite.album?.description && (
          <p className='text-sm text-gray-600 mb-4'>
            {invite.album.description}
          </p>
        )}

        <div className='bg-gray-50 rounded-lg p-3 mb-4'>
          <p className='text-xs text-gray-600'>
            {getRoleDescription(invite.role)}
          </p>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-md p-3 mb-4'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}

        <div className='flex space-x-3'>
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className='flex-1'
          >
            {isLoading ? 'Accepting...' : 'Accept'}
          </Button>

          <Button
            variant='outline'
            onClick={handleDecline}
            disabled={isLoading}
            className='flex-1'
          >
            {isLoading ? 'Declining...' : 'Decline'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
