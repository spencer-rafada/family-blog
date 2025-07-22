import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlbumPostFeed from '@/components/AlbumPostFeed'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import useSWR from 'swr'

// Mock dependencies
jest.mock('@/lib/hooks/useCurrentUser')
jest.mock('swr')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockedLink.displayName = 'Link'
  return MockedLink
})
jest.mock('@/components/PostSkeleton', () => {
  const MockedPostSkeleton = () => (
    <div>
      <div data-slot="skeleton" className="animate-pulse">Loading...</div>
    </div>
  )
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
    title: 'My Post',
    content: 'This is my post content',
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
    album_id: 'album-123',
  },
  {
    id: 'post-2',
    title: 'Other User Post',
    content: 'Post by another user',
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
    album_id: 'album-123',
  },
]

describe('AlbumPostFeed', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useCurrentUser as jest.Mock).mockReturnValue({ user: mockUser })
  })

  describe('Permission-based Dropdown Display', () => {
    beforeEach(() => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: mockPosts,
        error: null,
        isLoading: false,
      })
    })

    it('shows dropdown for own posts when user is not admin', async () => {
      render(<AlbumPostFeed albumId="album-123" userRole="contributor" />)

      // Should only see dropdown for user's own post
      expect(screen.getByTestId('post-dropdown-post-1')).toBeInTheDocument()

      // Should not see dropdown for other user's post
      expect(screen.queryByTestId('post-dropdown-post-2')).not.toBeInTheDocument()
    })

    it('shows dropdown for all posts when user is admin', async () => {
      render(<AlbumPostFeed albumId="album-123" userRole="admin" />)

      // Should see dropdown for both posts
      expect(screen.getByTestId('post-dropdown-post-1')).toBeInTheDocument()
      expect(screen.getByTestId('post-dropdown-post-2')).toBeInTheDocument()
    })

    it('shows only delete option for other users posts as admin', async () => {
      render(<AlbumPostFeed albumId="album-123" userRole="admin" />)

      // Click dropdown for other user's post
      const dropdownButton = screen.getByTestId('post-dropdown-post-2')
      await user.click(dropdownButton)

      // Should only see delete option, not edit
      expect(screen.getByText('Delete Post')).toBeInTheDocument()
      expect(screen.queryByText('Edit Post')).not.toBeInTheDocument()
    })

    it('shows both edit and delete for own posts as admin', async () => {
      render(<AlbumPostFeed albumId="album-123" userRole="admin" />)

      // Click dropdown for own post
      const dropdownButton = screen.getByTestId('post-dropdown-post-1')
      await user.click(dropdownButton)

      // Should see both options
      expect(screen.getByText('Edit Post')).toBeInTheDocument()
      expect(screen.getByText('Delete Post')).toBeInTheDocument()
    })

    it('shows no dropdown for viewer role', () => {
      render(<AlbumPostFeed albumId="album-123" userRole="viewer" />)

      // Should not see any dropdown buttons
      expect(screen.queryByTestId('post-dropdown-post-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('post-dropdown-post-2')).not.toBeInTheDocument()
    })

    it('shows no dropdown when userRole is not provided', () => {
      render(<AlbumPostFeed albumId="album-123" />)

      // Should only see dropdown for user's own post (default behavior)
      expect(screen.getByTestId('post-dropdown-post-1')).toBeInTheDocument()
      expect(screen.queryByTestId('post-dropdown-post-2')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('renders empty state with Add First Post button', () => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: [],
        error: null,
        isLoading: false,
      })

      render(<AlbumPostFeed albumId="album-123" />)

      expect(screen.getByText('No posts yet')).toBeInTheDocument()
      expect(screen.getByText('Be the first to share a memory in this album.')).toBeInTheDocument()
      
      const addPostLink = screen.getByText('Add First Post').closest('a')
      expect(addPostLink).toHaveAttribute('href', '/create?album=album-123')
    })
  })

  describe('Loading and Error States', () => {
    it('renders loading skeleton', () => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
      })

      const { container } = render(<AlbumPostFeed albumId="album-123" />)

      // Check for skeleton elements
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders error message', () => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: undefined,
        error: { message: 'Failed to load posts' },
        isLoading: false,
      })

      render(<AlbumPostFeed albumId="album-123" />)

      expect(screen.getByText(/Error loading posts/)).toBeInTheDocument()
    })
  })

  describe('Dialog Interactions', () => {
    beforeEach(() => {
      ;(useSWR as jest.Mock).mockReturnValue({
        data: mockPosts,
        error: null,
        isLoading: false,
      })
    })

    it('opens edit dialog when edit is clicked', async () => {
      render(<AlbumPostFeed albumId="album-123" userRole="contributor" />)

      // Open dropdown for own post
      const dropdownButton = screen.getByTestId('post-dropdown-post-1')
      await user.click(dropdownButton)

      // Click edit
      await user.click(screen.getByText('Edit Post'))

      // Check dialog is open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByDisplayValue('My Post')).toBeInTheDocument()
      })
    })

    it('opens delete dialog when delete is clicked', async () => {
      render(<AlbumPostFeed albumId="album-123" userRole="admin" />)

      // Open dropdown for other user's post
      const dropdownButton = screen.getByTestId('post-dropdown-post-2')
      await user.click(dropdownButton)

      // Click delete
      await user.click(screen.getByText('Delete Post'))

      // Check dialog is open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/Are you sure you want to delete this post/)).toBeInTheDocument()
      })
    })
  })
})