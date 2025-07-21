import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import DeletePostDialog from '@/components/posts/DeletePostDialog'
import { deletePost } from '@/lib/actions/posts'
import { revalidatePosts } from '@/lib/swr'
import type { Post } from '@/types'

// Mock dependencies
jest.mock('@/lib/actions/posts')
jest.mock('@/lib/swr')
jest.mock('next/navigation')

const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
}

const mockPost: Post = {
  id: 'post-123',
  title: 'Test Post',
  content: 'Test content',
  author_id: 'user-123',
  author: {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
    is_invited: false,
    invited_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  milestone_type: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  post_images: [
    {
      id: 'img-1',
      image_url: 'https://example.com/image1.jpg',
      caption: null,
      display_order: 0,
    },
    {
      id: 'img-2',
      image_url: 'https://example.com/image2.jpg',
      caption: null,
      display_order: 1,
    },
  ],
  album_id: 'album-123',
}

describe('DeletePostDialog', () => {
  const user = userEvent.setup()
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(deletePost as jest.Mock).mockResolvedValue({ error: null })
  })

  describe('Rendering', () => {
    it('renders dialog with confirmation message when open', () => {
      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Delete Post')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete this post/)).toBeInTheDocument()
    })

    it('shows image count warning when post has images', () => {
      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText(/This will also delete 2 images/)).toBeInTheDocument()
    })

    it('shows correct singular form for single image', () => {
      const postWithOneImage = {
        ...mockPost,
        post_images: [mockPost.post_images[0]],
      }

      render(
        <DeletePostDialog
          post={postWithOneImage}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText(/This will also delete 1 image/)).toBeInTheDocument()
    })

    it('does not show image warning when post has no images', () => {
      const postWithoutImages = {
        ...mockPost,
        post_images: [],
      }

      render(
        <DeletePostDialog
          post={postWithoutImages}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByText(/This will also delete/)).not.toBeInTheDocument()
    })

    it('does not render dialog when closed', () => {
      render(
        <DeletePostDialog
          post={mockPost}
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Delete Functionality', () => {
    it('calls deletePost when Delete is clicked', async () => {
      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(deletePost).toHaveBeenCalledWith('post-123')
      })
    })

    it('revalidates posts after successful deletion', async () => {
      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(revalidatePosts).toHaveBeenCalledWith('album-123')
        expect(revalidatePosts).toHaveBeenCalledWith()
      })
    })

    it('closes dialog after successful deletion', async () => {
      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('redirects when redirectOnDelete is true', async () => {
      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
          redirectOnDelete={true}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/albums/album-123')
      })
    })

    it('redirects to home when post has no album', async () => {
      const postWithoutAlbum = { ...mockPost, album_id: null }

      render(
        <DeletePostDialog
          post={postWithoutAlbum}
          open={true}
          onOpenChange={mockOnOpenChange}
          redirectOnDelete={true}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('handles deletion errors gracefully', async () => {
      ;(deletePost as jest.Mock).mockResolvedValue({ error: 'Delete failed' })

      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(deletePost).toHaveBeenCalled()
        // Dialog should remain open on error
        expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)
        expect(mockPush).not.toHaveBeenCalled()
      })
    })

    it('shows loading state during deletion', async () => {
      ;(deletePost as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )

      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      expect(screen.getByText('Deleting...')).toBeInTheDocument()
      expect(deleteButton).toBeDisabled()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    })
  })

  describe('Cancel Functionality', () => {
    it('closes dialog when Cancel is clicked', async () => {
      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      expect(deletePost).not.toHaveBeenCalled()
    })

    it('disables cancel button during deletion', async () => {
      ;(deletePost as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )

      render(
        <DeletePostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeDisabled()
    })
  })
})