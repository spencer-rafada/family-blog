'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from './useCurrentUser'
import { acceptAlbumInvite } from '@/lib/actions/albums'

export function useAutoAcceptInvite(token: string, enabled: boolean = false) {
  const { user, loading } = useCurrentUser()
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!enabled || loading || isAccepting || !user || !token) return

    const autoAccept = async () => {
      setIsAccepting(true)
      setError(null)

      try {
        const albumId = await acceptAlbumInvite(token)
        router.push(`/albums/${albumId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to accept invite')
        setIsAccepting(false)
      }
    }

    // Small delay to ensure everything is ready
    const timeoutId = setTimeout(autoAccept, 500)
    
    return () => clearTimeout(timeoutId)
  }, [user, loading, token, enabled, isAccepting, router])

  return { isAccepting, error }
}