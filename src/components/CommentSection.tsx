'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Send } from 'lucide-react'
import type { Comment, Post } from '@/types'

interface CommentSectionProps {
  post: Post
  comments: Comment[]
  onAddComment: (content: string) => Promise<void>
}

export default function CommentSection({ post, comments, onAddComment }: CommentSectionProps) {
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
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={comment.author.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.author.full_name?.charAt(0) || comment.author.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.author.full_name || comment.author.email}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}