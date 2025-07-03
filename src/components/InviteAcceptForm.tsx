'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { acceptAlbumInvite } from '@/lib/actions/albums'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useAutoAcceptInvite } from '@/lib/hooks/useAutoAcceptInvite'
import { Button } from '@/components/ui/button'
import { AlbumInvite } from '@/types'
import { User } from '@supabase/supabase-js'

interface InviteAcceptFormProps {
  token: string
  invite: AlbumInvite
  initialUser: User | null
}

export function InviteAcceptForm({ token, invite, initialUser }: InviteAcceptFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useCurrentUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if user just returned from auth flow
  const wasRedirected = searchParams.get('redirected') === 'true'
  
  // Auto-accept invite if user just authenticated and was redirected back
  const { isAccepting: autoAccepting, error: autoAcceptError } = useAutoAcceptInvite(
    token, 
    wasRedirected && !!user
  )

  useEffect(() => {
    if (autoAcceptError) {
      setError(autoAcceptError)
    }
  }, [autoAcceptError])

  const currentUser = user || initialUser

  const handleAccept = async () => {
    if (!currentUser) {
      router.push(`/login?invite_token=${token}`)
      return
    }

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

  const handleSignUp = () => {
    router.push(`/signup?invite_token=${token}&email=${encodeURIComponent(invite.email)}`)
  }

  if (!currentUser) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            To accept this invitation, you need to sign in or create an account with{' '}
            <strong>{invite.email}</strong>
          </p>
        </div>

        <div className="flex space-x-4">
          <Button onClick={handleSignUp} className="flex-1">
            Sign Up
          </Button>
          
          <Button variant="outline" onClick={handleAccept} className="flex-1">
            Sign In
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="w-full"
        >
          Maybe Later
        </Button>

        <p className="text-xs text-gray-500 text-center">
          You&apos;ll be redirected back to complete the invitation after signing in.
        </p>
      </div>
    )
  }

  if (autoAccepting) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-800">
            Welcome back! Accepting your invitation...
          </p>
        </div>
        <div className="flex justify-center">
          <Button disabled className="flex-1">
            Accepting Invitation...
          </Button>
        </div>
      </div>
    )
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
        You&apos;re signed in as <strong>{currentUser.email}</strong>
      </p>
    </div>
  )
}