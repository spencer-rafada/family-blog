'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deletePost } from '@/lib/actions/posts'
import { revalidatePosts } from '@/lib/swr'
import { useRouter } from 'next/navigation'
import type { Post } from '@/types'
import { Loader2 } from 'lucide-react'

interface DeletePostDialogProps {
  post: Post
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectOnDelete?: boolean
}

export default function DeletePostDialog({
  post,
  open,
  onOpenChange,
  redirectOnDelete = false,
}: DeletePostDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePost(post.id)

      // Revalidate posts
      if (post.album_id) {
        revalidatePosts()
      }
      revalidatePosts()

      onOpenChange(false)

      // Redirect if needed (e.g., when deleting from a single post page)
      if (redirectOnDelete) {
        router.push(post.album_id ? `/albums/${post.album_id}` : '/')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Post</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this post? This action cannot be
            undone.
            {post.post_images?.length > 0 && (
              <span className='block mt-2'>
                This will also delete {post.post_images.length} image
                {post.post_images.length > 1 ? 's' : ''}.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
