import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditPostDialog from '@/components/posts/EditPostDialog'
import { updatePost } from '@/lib/actions/posts'
import { revalidatePosts } from '@/lib/swr'
import type { Post } from '@/types'
import { MilestoneType } from '@/lib/constants'

// Mock dependencies
jest.mock('@/lib/actions/posts')
jest.mock('@/lib/swr')

const mockPost: Post = {
  id: 'post-123',
  title: 'Original Title',
  content: 'Original content',
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
  milestone_type: MilestoneType.FIRST_STEPS,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  post_images: [],
  album_id: 'album-123',
}

describe('EditPostDialog', () => {
  const user = userEvent.setup()
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(updatePost as jest.Mock).mockResolvedValue({ error: null })
  })

  describe('Rendering', () => {
    it('renders dialog with post data when open', () => {
      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Edit Post')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Original content')).toBeInTheDocument()
      // Check that the select has the correct value selected
      const milestoneSelect = screen.getByRole('combobox')
      expect(milestoneSelect).toHaveTextContent('First Steps')
    })

    it('does not render dialog when closed', () => {
      render(
        <EditPostDialog
          post={mockPost}
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Form Interaction', () => {
    it('allows editing title', async () => {
      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const titleInput = screen.getByDisplayValue('Original Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'New Title')

      expect(titleInput).toHaveValue('New Title')
    })

    it('allows editing content', async () => {
      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const contentTextarea = screen.getByDisplayValue('Original content')
      await user.clear(contentTextarea)
      await user.type(contentTextarea, 'New content')

      expect(contentTextarea).toHaveValue('New content')
    })

    // Note: Testing select component interactions is complex with radix-ui
    // The milestone type functionality is tested indirectly through form submission

    it('validates content is required', async () => {
      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const contentTextarea = screen.getByDisplayValue('Original content')
      await user.clear(contentTextarea)

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      expect(await screen.findByText('Content is required')).toBeInTheDocument()
      expect(updatePost).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('calls updatePost with correct data on save', async () => {
      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Edit fields
      const titleInput = screen.getByDisplayValue('Original Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      const contentTextarea = screen.getByDisplayValue('Original content')
      await user.clear(contentTextarea)
      await user.type(contentTextarea, 'Updated content')

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(updatePost).toHaveBeenCalledWith('post-123', {
          title: 'Updated Title',
          content: 'Updated content',
          milestone_type: MilestoneType.FIRST_STEPS,
        })
      })
    })

    it('revalidates posts after successful update', async () => {
      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(revalidatePosts).toHaveBeenCalledTimes(2)
        expect(revalidatePosts).toHaveBeenCalledWith()
      })
    })

    it('closes dialog after successful update', async () => {
      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('handles update errors gracefully', async () => {
      ;(updatePost as jest.Mock).mockRejectedValue(new Error('Update failed'))

      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(updatePost).toHaveBeenCalled()
        // Dialog should remain open on error
        expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)
      })
    })

    it('shows loading state during submission', async () => {
      ;(updatePost as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )

      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()
    })
  })

  describe('Cancel Functionality', () => {
    it('closes dialog when Cancel is clicked', async () => {
      render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      expect(updatePost).not.toHaveBeenCalled()
    })

    it('resets form when post changes', () => {
      const { rerender } = render(
        <EditPostDialog
          post={mockPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const newPost = { ...mockPost, title: 'Different Title', content: 'Different content' }
      
      rerender(
        <EditPostDialog
          post={newPost}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByDisplayValue('Different Title')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Different content')).toBeInTheDocument()
    })
  })
})