'use client'

import useSWR from 'swr'
import CommentSection from './CommentSection'
import { fetcher } from '@/lib/fetcher'
import { SWRKeys } from '@/lib/constants'
import { revalidateComments } from '@/lib/swr'
import type { Comment, Profile, Post } from '@/types'

interface PostCommentsProps {
  postId: string
}

export default function PostComments({ postId }: PostCommentsProps) {
  const { data: comments = [], error } = useSWR<Comment[]>(
    `${SWRKeys.COMMENTS}?postId=${postId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  // Get current user profile for edit/delete permissions
  const { data: currentUser } = useSWR<Profile>(SWRKeys.PROFILE, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 1,
  })

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
      post={{ id: postId } as unknown as Post} // We only need the ID for the comment section
      comments={comments}
      currentUser={currentUser}
      onAddComment={handleAddComment}
    />
  )
}
