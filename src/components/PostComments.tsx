'use client'

import useSWR from 'swr'
import CommentSection from './CommentSection'
import { fetcher } from '@/lib/fetcher'
import { SWRKeys } from '@/lib/constants'
import { revalidateComments } from '@/lib/swr'
import type { Comment } from '@/types'

interface PostCommentsProps {
  postId: string
}

export default function PostComments({ postId }: PostCommentsProps) {
  const { data: comments = [], error, isLoading } = useSWR<Comment[]>(
    `${SWRKeys.COMMENTS}?postId=${postId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  const handleAddComment = async (content: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      // Revalidate comments to show the new comment immediately
      revalidateComments(postId)
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  }

  if (error) {
    console.error('Error loading comments:', error)
    return null // Fail silently for comments
  }

  return (
    <CommentSection
      post={{ id: postId } as any} // We only need the ID for the comment section
      comments={comments}
      onAddComment={handleAddComment}
    />
  )
}