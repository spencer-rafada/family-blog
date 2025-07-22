import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostFeed from '@/components/PostFeed'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import useSWR from 'swr'
import { updatePost, deletePost } from '@/lib/actions/posts'

// Mock dependencies
jest.mock('@/lib/hooks/useCurrentUser')
jest.mock('swr')
jest.mock('@/lib/actions/posts')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/components/PostSkeleton', () => {
  const MockedPostSkeleton = () => <div>Loading...</div>
  MockedPostSkeleton.displayName = 'PostSkeleton'
  return MockedPostSkeleton
})

// Mock child components
jest.mock('@/components/PostComments', () => {
  const MockedPostComments = ({ postId }: { postId: string }) => (
    <div data-testid={`comments-${postId}`}>Comments</div>
  )
  MockedPostComments.displayName = 'PostComments'
  return MockedPostComments
})

jest.mock('@/components/LikeButton', () => {
  const MockedLikeButton = ({ postId }: { postId: string }) => (
    <button data-testid={`like-${postId}`}>Like</button>
  )
  MockedLikeButton.displayName = 'LikeButton'
  return MockedLikeButton
})

jest.mock('@/components/posts/PostImages', () => {
  const MockedPostImages = () => <div data-testid="post-images">Images</div>
  MockedPostImages.displayName = 'PostImages'
  return MockedPostImages
})

jest.mock('@/components/posts/ImageLightbox', () => {
  const MockedImageLightbox = () => null
  MockedImageLightbox.displayName = 'ImageLightbox'
  return MockedImageLightbox
})

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockPosts = [
  {
    id: 'post-1',
    title: 'Test Post 1',
    content: 'This is test content',
    author_id: 'user-123',
    author: {
      id: 'user-123',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
    },
    milestone_type: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    post_images: [],
    album_id: null,
  },
  {
    id: 'post-2',
    title: null,
    content: 'Another post by different user',
    author_id: 'user-456',
    author: {
      id: 'user-456',
      email: 'other@example.com',
      full_name: 'Other User',
      avatar_url: null,
    },
    milestone_type: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    post_images: [],
    album_id: null,
  },
]

describe('PostFeed', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useCurrentUser as jest.Mock).mockReturnValue({ user: mockUser })
    ;(updatePost as jest.Mock).mockResolvedValue({ error: null })
    ;(deletePost as jest.Mock).mockResolvedValue({ error: null })
  })

  describe('Rendering', () => {
    it('renders loading skeleton while fetching', () => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
      })

      render(<PostFeed />)

      const loadingElements = screen.getAllByText('Loading...')
      expect(loadingElements.length).toBeGreaterThan(0)
    })

    it('renders error message when fetch fails', () => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: undefined,
        error: { message: 'Failed to fetch' },
        isLoading: false,
      })

      render(<PostFeed />)

      expect(screen.getByText(/Error loading posts/)).toBeInTheDocument()
    })

    it('renders empty state when no posts', () => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: [],
        error: null,
        isLoading: false,
      })

      render(<PostFeed />)

      expect(screen.getByText(/No memories shared yet/)).toBeInTheDocument()
    })

    it('renders posts when data is available', () => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: mockPosts,
        error: null,
        isLoading: false,
      })

      render(<PostFeed />)

      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      expect(screen.getByText('This is test content')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  describe('Post Management Dropdown', () => {
    beforeEach(() => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: mockPosts,
        error: null,
        isLoading: false,
      })
    })

    it('shows dropdown menu only for own posts', async () => {
      render(<PostFeed />)

      // Find all dropdown triggers
      const dropdownTriggers = screen.getAllByRole('button').filter(
        button => button.querySelector('svg')
      )

      // Should only have one dropdown (for the user's own post)
      expect(dropdownTriggers).toHaveLength(1)
    })

    it('does not show dropdown for posts by other users', () => {
      render(<PostFeed />)

      // Get the second post card (by other user)
      const otherUserPost = screen.getByText('Another post by different user').closest('.overflow-hidden')
      
      // Should not have a dropdown button in this card
      const dropdownButton = within(otherUserPost as HTMLElement).queryByRole('button', { name: /more/i })
      expect(dropdownButton).not.toBeInTheDocument()
    })

    it('opens dropdown menu when clicked', async () => {
      render(<PostFeed />)

      // Find and click the dropdown trigger
      const dropdownTrigger = screen.getAllByRole('button').find(
        button => button.querySelector('svg')
      )
      await user.click(dropdownTrigger!)

      // Check menu items are visible
      expect(screen.getByText('Edit Post')).toBeInTheDocument()
      expect(screen.getByText('Delete Post')).toBeInTheDocument()
    })

    it('opens edit dialog when Edit Post is clicked', async () => {
      render(<PostFeed />)

      // Open dropdown
      const dropdownTrigger = screen.getAllByRole('button').find(
        button => button.querySelector('svg')
      )
      await user.click(dropdownTrigger!)

      // Click Edit Post
      await user.click(screen.getByText('Edit Post'))

      // Check edit dialog is open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Edit Post')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Test Post 1')).toBeInTheDocument()
      })
    })

    it('opens delete dialog when Delete Post is clicked', async () => {
      render(<PostFeed />)

      // Open dropdown
      const dropdownTrigger = screen.getAllByRole('button').find(
        button => button.querySelector('svg')
      )
      await user.click(dropdownTrigger!)

      // Click Delete Post
      await user.click(screen.getByText('Delete Post'))

      // Check delete dialog is open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/Are you sure you want to delete this post/)).toBeInTheDocument()
      })
    })
  })

  describe('No Authentication', () => {
    it('does not show dropdown menu when user is not authenticated', () => {
      ;(useCurrentUser as jest.Mock).mockReturnValue({ user: null })
      ;(useSWR as jest.Mock).mockReturnValue({
        data: mockPosts,
        error: null,
        isLoading: false,
      })

      render(<PostFeed />)

      // Should not find any dropdown triggers
      const dropdownTriggers = screen.queryAllByRole('button').filter(
        button => button.querySelector('svg')
      )
      expect(dropdownTriggers).toHaveLength(0)
    })
  })
})