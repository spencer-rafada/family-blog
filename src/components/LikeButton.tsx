'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { SWRKeys } from '@/lib/constants'
import { revalidateLikes } from '@/lib/swr'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  postId: string
}

interface LikeData {
  likeCount: number
  isLiked: boolean
}

export default function LikeButton({ postId }: LikeButtonProps) {
  const [isToggling, setIsToggling] = useState(false)
  
  const { data, error, isLoading } = useSWR<LikeData>(
    `${SWRKeys.LIKES}?postId=${postId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  const handleToggleLike = async () => {
    if (isToggling) return

    setIsToggling(true)
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      // Revalidate likes to show the updated count and state immediately
      revalidateLikes(postId)
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsToggling(false)
    }
  }

  if (error) {
    console.error('Error loading likes:', error)
    return null // Fail silently for likes
  }

  const likeCount = data?.likeCount || 0
  const isLiked = data?.isLiked || false

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={isToggling || isLoading}
      className={cn(
        "text-gray-600 hover:text-red-500 transition-colors",
        isLiked && "text-red-500"
      )}
    >
      <Heart 
        className={cn(
          "w-4 h-4 mr-1 transition-all",
          isLiked && "fill-current"
        )} 
      />
      {likeCount > 0 && (
        <span className="text-sm">
          {likeCount}
        </span>
      )}
      {likeCount === 0 && !isLoading && (
        <span className="text-sm">Like</span>
      )}
    </Button>
  )
}