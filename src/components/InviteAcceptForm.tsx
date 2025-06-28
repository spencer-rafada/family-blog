'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptAlbumInvite } from '@/lib/actions/albums'
import { Button } from '@/components/ui/button'

interface InviteAcceptFormProps {
  token: string
}

export function InviteAcceptForm({ token }: InviteAcceptFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAccept = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const albumId = await acceptAlbumInvite(token)
      router.push(`/albums/${albumId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex space-x-4">
        <Button
          onClick={handleAccept}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Accepting...' : 'Accept Invitation'}
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => router.push('/')}
          disabled={isLoading}
          className="flex-1"
        >
          Decline
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        By accepting, you'll need to sign in or create an account with the invited email address.
      </p>
    </div>
  )
}