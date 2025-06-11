'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send } from 'lucide-react'
import CommentItem from './CommentItem'
import type { Comment, Post, Profile } from '@/types'

interface CommentSectionProps {
  post: Post
  comments: Comment[]
  currentUser?: Profile | null
  onAddComment: (content: string) => Promise<void>
}

export default function CommentSection({ post, comments, currentUser, onAddComment }: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await onAddComment(newComment.trim())
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const commentCount = comments.length

  return (
    <div className="border-t pt-3">
      {/* Comment Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-3 text-gray-600 hover:text-gray-900"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {commentCount === 0 ? 'Add a comment' : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
      </Button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Add Comment Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  'Posting...'
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Comments List */}
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  postId={post.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}