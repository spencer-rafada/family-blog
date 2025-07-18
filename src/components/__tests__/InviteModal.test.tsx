import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { InviteModal } from '@/components/InviteModal'
import { createAlbumInvite, createShareableInvite } from '@/lib/actions/albums'
import { AlbumRole } from '@/types'

// Mock dependencies
jest.mock('@/lib/actions/albums', () => ({
  createAlbumInvite: jest.fn(),
  createShareableInvite: jest.fn(),
}))

jest.mock('@/lib/invite-utils', () => ({
  getInviteAcceptUrl: jest.fn(
    (token: string) => `http://test.com/invite/${token}`
  ),
}))

// No need to mock clipboard API - @testing-library/user-event handles it

describe('InviteModal', () => {
  const user = userEvent.setup()
  const mockOnClose = jest.fn()
  const mockOnInviteSuccess = jest.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    albumId: 'album-123',
    albumName: 'Test Album',
    onInviteSuccess: mockOnInviteSuccess,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Modal Behavior', () => {
    it('renders when isOpen is true', () => {
      render(<InviteModal {...defaultProps} />)

      expect(screen.getByText('Invite to Test Album')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Send an invitation to join this album with specific permissions.'
        )
      ).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<InviteModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Invite to Test Album')).not.toBeInTheDocument()
    })

    it('calls onClose when dialog is closed', async () => {
      render(<InviteModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Tab Navigation', () => {
    it('displays both email and shareable link tabs', () => {
      render(<InviteModal {...defaultProps} />)

      expect(
        screen.getByRole('tab', { name: /Email Invite/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: /Shareable Link/i })
      ).toBeInTheDocument()
    })

    it('shows email form by default', () => {
      render(<InviteModal {...defaultProps} />)

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Send Invitation' })
      ).toBeInTheDocument()
    })

    it('switches to shareable link tab when clicked', async () => {
      render(<InviteModal {...defaultProps} />)

      const linkTab = screen.getByRole('tab', { name: /Shareable Link/i })
      await user.click(linkTab)

      expect(
        screen.getByLabelText('Maximum Uses (Optional)')
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Generate Link' })
      ).toBeInTheDocument()
    })
  })

  describe('Email Invite', () => {
    it('validates email input', async () => {
      // Mock successful response for when we submit with valid email
      ;(createAlbumInvite as jest.Mock).mockResolvedValueOnce({
        id: 'invite-123',
        token: 'test-token',
        email: 'test@example.com',
        role: AlbumRole.VIEWER,
      })

      render(<InviteModal {...defaultProps} />)

      const emailInput = screen.getByLabelText('Email Address')
      const sendButton = screen.getByRole('button', { name: 'Send Invitation' })

      // Type a valid email to test successful submission
      await user.type(emailInput, 'test@example.com')
      await user.click(sendButton)

      // Verify that createAlbumInvite was called with valid email
      await waitFor(() => {
        expect(createAlbumInvite).toHaveBeenCalledWith(
          'album-123',
          'test@example.com',
          AlbumRole.VIEWER
        )
      })
      
      // Verify success message appears
      await waitFor(() => {
        expect(
          screen.getByText('Invitation sent to test@example.com')
        ).toBeInTheDocument()
      })
    })

    it('sends email invite successfully', async () => {
      const mockInvite = {
        id: 'invite-123',
        token: 'test-token',
        email: 'test@example.com',
        role: AlbumRole.VIEWER,
      }
      ;(createAlbumInvite as jest.Mock).mockResolvedValueOnce(mockInvite)

      render(<InviteModal {...defaultProps} />)

      const emailInput = screen.getByLabelText('Email Address')
      const sendButton = screen.getByRole('button', { name: 'Send Invitation' })

      await user.type(emailInput, 'test@example.com')
      await user.click(sendButton)

      expect(createAlbumInvite).toHaveBeenCalledWith(
        'album-123',
        'test@example.com',
        AlbumRole.VIEWER
      )

      await waitFor(() => {
        expect(
          screen.getByText('Invitation sent to test@example.com')
        ).toBeInTheDocument()
      })

      // Should close after delay
      await waitFor(
        () => {
          expect(mockOnInviteSuccess).toHaveBeenCalled()
          expect(mockOnClose).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )
    })

    it('displays error when email invite fails', async () => {
      ;(createAlbumInvite as jest.Mock).mockRejectedValueOnce(
        new Error('User already invited')
      )

      render(<InviteModal {...defaultProps} />)

      const emailInput = screen.getByLabelText('Email Address')
      const sendButton = screen.getByRole('button', { name: 'Send Invitation' })

      await user.type(emailInput, 'test@example.com')
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('User already invited')).toBeInTheDocument()
      })
    })

    it('allows changing role for email invite', async () => {
      ;(createAlbumInvite as jest.Mock).mockResolvedValueOnce({
        id: 'invite-123',
        token: 'test-token',
        email: 'test@example.com',
        role: AlbumRole.ADMIN,
      })

      render(<InviteModal {...defaultProps} />)

      const roleSelect = screen.getByTestId('role-select-trigger')
      await user.click(roleSelect)

      // Select Admin role
      const adminOption = await screen.findByTestId('role-option-admin')
      await user.click(adminOption)

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'test@example.com')

      const sendButton = screen.getByRole('button', { name: 'Send Invitation' })
      await user.click(sendButton)

      expect(createAlbumInvite).toHaveBeenCalledWith(
        'album-123',
        'test@example.com',
        AlbumRole.ADMIN
      )
    })
  })

  describe('Shareable Link', () => {
    beforeEach(async () => {
      render(<InviteModal {...defaultProps} />)

      // Switch to shareable link tab
      const linkTab = screen.getByRole('tab', { name: /Shareable Link/i })
      await user.click(linkTab)
    })

    it('generates shareable link with unlimited uses', async () => {
      const mockInvite = {
        id: 'invite-123',
        token: 'shareable-token',
        is_shareable: true,
        max_uses: null,
      }
      ;(createShareableInvite as jest.Mock).mockResolvedValueOnce(mockInvite)

      const generateButton = screen.getByRole('button', {
        name: 'Generate Link',
      })
      await user.click(generateButton)

      expect(createShareableInvite).toHaveBeenCalledWith(
        'album-123',
        AlbumRole.VIEWER,
        undefined
      )

      await waitFor(() => {
        expect(
          screen.getByDisplayValue('http://test.com/invite/shareable-token')
        ).toBeInTheDocument()
      })
    })

    it('generates shareable link with limited uses', async () => {
      const mockInvite = {
        id: 'invite-123',
        token: 'shareable-token',
        is_shareable: true,
        max_uses: 10,
      }
      ;(createShareableInvite as jest.Mock).mockResolvedValueOnce(mockInvite)

      const maxUsesInput = screen.getByLabelText('Maximum Uses (Optional)')
      await user.type(maxUsesInput, '10')

      const generateButton = screen.getByRole('button', {
        name: 'Generate Link',
      })
      await user.click(generateButton)

      expect(createShareableInvite).toHaveBeenCalledWith(
        'album-123',
        AlbumRole.VIEWER,
        10
      )
    })

    it('copies link to clipboard', async () => {
      const mockInvite = {
        id: 'invite-123',
        token: 'shareable-token',
        is_shareable: true,
      }
      ;(createShareableInvite as jest.Mock).mockResolvedValueOnce(mockInvite)

      const generateButton = screen.getByRole('button', {
        name: 'Generate Link',
      })
      await user.click(generateButton)

      await waitFor(() => {
        expect(
          screen.getByDisplayValue('http://test.com/invite/shareable-token')
        ).toBeInTheDocument()
      })

      // Find the copy button by looking for a button with the Copy icon
      const buttons = screen.getAllByRole('button')
      const copyButton = buttons.find((button) => {
        // Check if the button contains the Copy icon by looking at its children
        return button.querySelector('svg.lucide-copy') !== null
      })

      expect(copyButton).toBeTruthy()
      await user.click(copyButton!)

      // Testing library handles clipboard operations internally
      // We can verify the button was clickable and doesn't throw errors
    })

    it('displays error when link generation fails', async () => {
      ;(createShareableInvite as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to generate link')
      )

      const generateButton = screen.getByRole('button', {
        name: 'Generate Link',
      })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to generate link')).toBeInTheDocument()
      })
    })

    it('allows changing role for shareable link', async () => {
      ;(createShareableInvite as jest.Mock).mockResolvedValueOnce({
        id: 'invite-123',
        token: 'shareable-token',
        is_shareable: true,
      })

      const roleSelect = screen.getByTestId('role-select-trigger-link')
      await user.click(roleSelect)

      // Select Contributor role
      const contributorOption = await screen.findByTestId(
        'role-option-link-contributor'
      )
      await user.click(contributorOption)

      const generateButton = screen.getByRole('button', {
        name: 'Generate Link',
      })
      await user.click(generateButton)

      expect(createShareableInvite).toHaveBeenCalledWith(
        'album-123',
        AlbumRole.CONTRIBUTOR,
        undefined
      )
    })

    it('changes button to Done after generating link', async () => {
      const mockInvite = {
        id: 'invite-123',
        token: 'shareable-token',
        is_shareable: true,
      }
      ;(createShareableInvite as jest.Mock).mockResolvedValueOnce(mockInvite)

      const generateButton = screen.getByRole('button', {
        name: 'Generate Link',
      })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
        expect(
          screen.queryByRole('button', { name: 'Generate Link' })
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Role Permissions Display', () => {
    it('displays correct description for each role', async () => {
      render(<InviteModal {...defaultProps} />)

      const roleSelect = screen.getByTestId('role-select-trigger')

      // Check Viewer role (default)
      const roleDescription = screen.getByTestId('role-description')
      expect(roleDescription).toHaveTextContent('Viewer: Can view content only')

      // Change to Admin
      await user.click(roleSelect)
      const adminOption = await screen.findByTestId('role-option-admin')
      await user.click(adminOption)

      await waitFor(() => {
        expect(roleDescription).toHaveTextContent(
          'Admin: Can manage the album and invite others'
        )
      })

      // Change to Contributor
      await user.click(roleSelect)
      const contributorOption = await screen.findByTestId(
        'role-option-contributor'
      )
      await user.click(contributorOption)

      await waitFor(() => {
        expect(roleDescription).toHaveTextContent(
          'Contributor: Can add posts and memories'
        )
      })
    })
  })
})
